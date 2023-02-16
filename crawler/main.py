import os
import re
import time
import traceback
import urllib.parse

import ddddocr
from decimal import Decimal
from dotenv import load_dotenv
import schedule
from requests import Session
import taos
from taos.error import ProgrammingError

import util
from util import log, vpn_host_parse, vpn_host_encode, password_encode


def login(ss: Session, sp_env: tuple[str, int, str, bytes, bytes, str, str, str, str, int, str, str, str, bool]):
    """自适应登录"""

    sp_host, sp_school_id, sp_vpn_host, sp_vpn_key, sp_vpn_iv, sp_sso_host, sp_sso_username, sp_sso_password, sp_db_host, sp_db_port, sp_db_user, sp_db_pass, sp_db_name, sp_debug = sp_env

    # 通过 VPN 登录 SSO，解析登录页面
    ret = ss.get(
        url=f"{sp_vpn_host}/{vpn_host_encode(sp_sso_host, sp_vpn_key, sp_vpn_iv)}/authserver/login",
        params={
            "service": f"{sp_vpn_host}/login?cas_login=true",
        },
    )
    assert ret.status_code == 200, f"无法找到登录页, HTTP {ret.status_code}"
    salt = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="pwdEncryptSalt" value="([A-Za-z0-9]+)" />', ret.text).group(1)
    execution = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="execution" name="execution" value="([A-Za-z0-9-_/+=]+)" />', ret.text).group(1)

    # 通过 VPN 登录 SSO，判断是否需要验证码
    ret = ss.get(
        url=f"{sp_vpn_host}/{vpn_host_encode(sp_sso_host, sp_vpn_key, sp_vpn_iv)}/authserver/checkNeedCaptcha.htl",
        params={
            "username": sp_sso_username,
            "_": int(time.time()*1000),
        },
    )
    assert ret.status_code == 200, f"无法得知是否需要验证码, HTTP {ret.status_code}"
    if ret.json()["isNeed"]:
        # 通过 VPN 登录 SSO，识别验证码
        ret = ss.get(
            url=f"{sp_vpn_host}/{vpn_host_encode(sp_sso_host, sp_vpn_key, sp_vpn_iv)}/authserver/getCaptcha.htl",
            params=str(int(time.time()*1000)),
        )
        assert ret.status_code == 200, f"无法获取验证码, HTTP {ret.status_code}"

        ocr = ddddocr.DdddOcr(show_ad=False)
        captcha = ocr.classification(ret.content)
    else:
        captcha = ""

    # 通过 VPN 登录 SSO，发起登录
    ret = ss.post(
        url=f"{sp_vpn_host}/{vpn_host_encode(sp_sso_host, sp_vpn_key, sp_vpn_iv)}/authserver/login",
        params={
            "service": f"{sp_vpn_host}/login?cas_login=true",
        },
        data={
            "username": sp_sso_username,
            "password": password_encode(sp_sso_password, salt),
            "captcha": captcha,
            "_eventId": "submit",
            "cllt": "userNameLogin",
            "dllt": "generalLogin",
            "lt": "",
            "execution": execution,
        },
    )
    assert ret.status_code == 200, "登录失败, "+re.search(r'<span id="showErrorTip" class="form-error"><span>(.+)</span></span>', ret.text).group(1)

    # 通过 SSO 登录随行校园
    ret = ss.get(
        url=f"{sp_vpn_host}/{vpn_host_encode(sp_sso_host, sp_vpn_key, sp_vpn_iv)}/authserver/login",
        params={
            "service": f"{sp_host}/outIndex/power",
        },
    )
    assert ret.status_code == 200, "登录失败, 无法通过SSO登录"

    if "电费充值" in ret.text:
        # 通过 VPN 访问的方式，手动获取随行校园的 Cookies

        # 获取随行校园的 Cookies
        ret = ss.post(
            url=f"{sp_vpn_host}/wengine-vpn/cookie",
            params={
                "method": "get",
                "host": vpn_host_parse(sp_host)[1],
                "scheme": vpn_host_parse(sp_host)[0],
                "path": "/member/power",
                "vpn_timestamp": int(time.time()*1000),
            },
        )
        assert ret.status_code == 200 and len(ret.text) > 0, "登录失败, 获取通过SSO登录后的随行校园Cookies失败"

        # 解析随行校园的 Cookies 并应用
        for cookie_str in ret.text.split('; '):
            cookie = re.search(r'(.+?)=(.*)', cookie_str).groups()
            ss.cookies.set(cookie[0], cookie[1], domain=urllib.parse.urlparse(sp_host).hostname)
    elif "访问出错" in ret.text:
        # 通过 SSO 访问的方式，自动获取随行校园的 Cookies

        # 获取 SSO 的 Cookies
        ret = ss.post(
            url=f"{sp_vpn_host}/wengine-vpn/cookie",
            params={
                "method": "get",
                "host": vpn_host_parse(sp_sso_host)[1],
                "scheme": vpn_host_parse(sp_sso_host)[0],
                "path": "/authserver/login",
                "vpn_timestamp": int(time.time() * 1000),
            },
        )
        assert ret.status_code == 200 and len(ret.text) > 0, "登录失败, 获取通过SSO登录后的SSO Cookie失败"

        # 解析 SSO 的 Cookies 并应用
        for cookie_str in ret.text.split('; '):
            cookie = re.search(r'(.+?)=(.*)', cookie_str).groups()
            ss.cookies.set(cookie[0], cookie[1], domain=urllib.parse.urlparse(sp_sso_host).hostname)

        # 访问外网随行校园，将跳转 SSO 获取登录状态并跳转回随行校园，此时随行校园 Cookies 已自动应用
        ret = ss.get(
            url=f"{sp_host}/outIndex/power",
        )
        assert ret.status_code == 200 and "电费充值" in ret.text, "登录失败, 无法通过SSO登录后从外网跳转"
    else:
        assert False, "登录失败，未知情况"


def prepare() -> tuple[str, int, str, bytes, bytes, str, str, str, str, int, str, str, str, bool]:
    """一次性读取所有需要的环境变量"""
    return (
        os.getenv('SP_HOST'),
        int(os.getenv('SP_SCHOOL_ID')),

        os.getenv('SP_VPN_HOST'),
        bytes.fromhex(os.getenv('SP_VPN_KEY')),
        bytes.fromhex(os.getenv('SP_VPN_IV')),

        os.getenv('SP_SSO_HOST'),
        os.getenv('SP_SSO_USERNAME'),
        os.getenv('SP_SSO_PASSWORD'),

        os.getenv('SP_DB_HOST'),
        int(os.getenv('SP_DB_PORT')),
        os.getenv('SP_DB_USER'),
        os.getenv('SP_DB_PASS'),
        os.getenv('SP_DB_NAME'),

        os.getenv('SP_DEBUG') == "1",
    )


def task():
    """爬虫任务"""

    need_retry = True  # 重试标记，默认开启表示需要重试，成功则取消标记

    log("定时任务开始")

    try:
        sp_host, sp_school_id, sp_vpn_host, sp_vpn_key, sp_vpn_iv, sp_sso_host, sp_sso_username, sp_sso_password, sp_db_host, sp_db_port, sp_db_user, sp_db_pass, sp_db_name, sp_debug = sp_env = prepare()
        ss = Session()
        data: dict[dict[dict[tuple[float, str]]]] = {}
        ret = None

        # 尝试登录
        try:
            login(ss, sp_env)
        except Exception as e:
            log("登录异常", e)
            log(*traceback.format_tb(e.__traceback__))
            return  # 前往 finally

        # 尝试获取校区
        try:
            ret = ss.post(
                url=f"{sp_host}/member/power/selectArea",
            )
            assert ret.status_code == 200 and ret.json()['code'] == 1
        except AssertionError:
            log("获取 校区[area] 异常", ret.status_code, ret.text)
            return  # 前往 finally
        except Exception as e:
            log("获取 校区[area] 异常", e)
            log(*traceback.format_tb(e.__traceback__))
            return  # 前往 finally
        ret = ret.json()
        areas = ret['data']

        # 尝试解析每个校区
        for area in areas:
            area_name = area['areaName']
            area_id = area['areaID']
            data[area_name] = {}

            # 尝试获取宿舍楼
            try:
                ret = ss.post(
                    url=f"{sp_host}/member/power/buildings",
                    data={
                        "schoolId": sp_school_id,
                        "areaId": area_id,
                    },
                )
                assert ret.status_code == 200 and ret.json()['code'] == 1
            except AssertionError:
                log("获取 宿舍楼[building] 异常", ret.status_code, ret.text)
                return  # 前往 finally
            except Exception as e:
                log("获取 宿舍楼[building] 异常", e)
                log(*traceback.format_tb(e.__traceback__))
                return  # 前往 finally
            ret = ret.json()
            buildings = ret['data']

            # 尝试解析每个宿舍楼
            for building in buildings:
                building_name = building['title']
                building_id, _, comp_code = building['value'].partition(",")
                data[area_name][building_name] = {}

                # 尝试获取寝室
                try:
                    ret = ss.post(
                        url=f"{sp_host}/member/power/rooms",
                        data={
                            "schoolId": sp_school_id,
                            "areaId": area_id,
                            "buildId": building_id,
                            "compCode": comp_code,
                        },
                    )
                    assert ret.status_code == 200 and ret.json()['code'] == 1
                except AssertionError:
                    log("获取 寝室[room] 异常", ret.status_code, ret.text)
                    return  # 前往 finally
                except Exception as e:
                    log("获取 寝室[room] 异常", e)
                    log(*traceback.format_tb(e.__traceback__))
                    return  # 前往 finally
                ret = ret.json()
                rooms = ret['data']
                ts = time.time()

                # 尝试解析每个寝室
                for room in rooms:
                    room_name = room['title']
                    room_id, _, power = room['value'].partition(",")
                    data[area_name][building_name][room_name] = ts, power

                    # 调试模式则将数据打印
                    if sp_debug:
                        log(area_name, building_name, room_name, power)

        # 非调试模式则将数据入库
        if not sp_debug:
            conn = taos.connect(
                host=sp_db_host,
                port=sp_db_port,
                user=sp_db_user,
                passwd=sp_db_pass,
                database=sp_db_name,
                timezone="Asia/Shanghai",
            )
            stmt = conn.statement("insert into ? (ts, power, spending) using `powers` tags (?, ?, ?, ?, ?) values (?, ?, ?)")

            if len(util.last_powers) == 0:
                for table_name, ts, power, spending in conn.query(f"select tbname, last_row(ts, power, spending) from powers partition by tbname").fetch_all():
                    util.last_powers[table_name] = ts.timestamp(), power, spending

            for area_name in data:
                for building_name in data[area_name]:
                    for room_name in data[area_name][building_name]:
                        table_name = f"{area_name}{building_name}{room_name}"
                        table_exist = True
                        if table_name not in util.last_powers.keys():
                            try:
                                ts, power, spending = conn.query(f"select last_row(ts, power, spending) from `{table_name}`").fetch_all()[0]
                                util.last_powers[table_name] = ts.timestamp(), power, spending
                            except ProgrammingError as e:
                                if e.errno == 0x80002662 - 0x100000000 or e.msg == 'Fail to get table info, error: Table does not exist':
                                    table_exist = False
                                    log(f"新寝室: {table_name}")
                                else:
                                    raise e

                        ts, power = data[area_name][building_name][room_name]
                        power = int(Decimal(power)*100)
                        spending = (util.last_powers[table_name][1] - power) if table_exist else None  # 反向减，算用电情况

                        tags = taos.new_bind_params(5)
                        tags[0].nchar(area_name)
                        tags[1].nchar(building_name)
                        tags[2].nchar(room_name)
                        tags[3].timestamp(ts)
                        tags[4].bool(True)
                        stmt.set_tbname_tags(f"`{table_name}`", tags)

                        values = taos.new_bind_params(3)
                        values[0].timestamp(ts)
                        values[1].int(power)
                        values[2].int(None)
                        stmt.bind_param(values)

                        if table_exist:  # 更新上一次的 spending
                            values = taos.new_bind_params(3)
                            values[0].timestamp(util.last_powers[table_name][0])
                            values[1].int(util.last_powers[table_name][1])
                            values[2].int(spending)
                            stmt.bind_param(values)

                        util.last_powers[table_name] = (ts, power, None)  # 缓存这一次的 power

            stmt.execute()
            stmt.close()
            conn.close()

        need_retry = False
        if util.retry_task is not None:  # 本次是定时重试任务，而非常规定时任务
            log("本次定时任务成功，取消了定时重试任务")
            schedule.cancel_job(util.retry_task)
            util.retry_task = None
    except Exception as e:
        log("task中发现未知异常", e)
        log(*traceback.format_tb(e.__traceback__))
        return  # 前往 finally
    finally:
        if need_retry and util.retry_task is None:  # 本次是常规定时任务，但是执行失败了
            log("添加一个定时重试任务")
            util.retry_task = schedule.every().minute.at(":00").do(task)  # 每分钟00秒跑一次任务直到成功
        log("定时任务结束")


def main():
    """爬虫主函数"""
    task()  # 脚本刚开始运行时先跑一次任务

    log("定时任务创建")
    schedule.every().hour.at(":00").do(task)  # 每小时00分跑一次任务

    # 循环查询是否有定时任务需要执行
    while True:
        schedule.run_pending()
        time.sleep(0.1)


if __name__ == '__main__':
    load_dotenv('.env', override=True)
    load_dotenv('.env.local', override=True)
    main()
