import base64
import os
import re
import time
import traceback
import urllib.parse

import ddddocr
from Crypto.Cipher import AES
from dotenv import load_dotenv
import schedule
from requests import Session
import pymysql

import util
from util import log, aes_random_generate, pkcs7padding, vpn_host_parse


def vpn_host_encode(host: str) -> str:
    protocol, hostname = vpn_host_parse(host)
    key = bytes.fromhex(os.getenv('SP_VPN_KEY'))
    iv = bytes.fromhex(os.getenv('SP_VPN_IV'))
    cipher = AES.new(key=key, iv=iv, mode=AES.MODE_CFB, segment_size=128)

    encrypted = cipher.encrypt(hostname.encode()).hex()

    return f"{protocol}/{iv.hex()}{encrypted}"


def password_encode(password: str, pwdEncryptSalt: str) -> str:
    cipher = AES.new(
        key=pwdEncryptSalt.encode(),
        iv=aes_random_generate(16).encode(),
        mode=AES.MODE_CBC,
    )
    return base64.b64encode(cipher.encrypt(pkcs7padding(aes_random_generate(64)+password).encode())).decode()


def login(ss: Session):
    ret = ss.get(
        f"{os.getenv('SP_VPN_HOST')}/{vpn_host_encode(os.getenv('SP_SSO_HOST'))}/authserver/login",
        params={
            "service": f"{os.getenv('SP_VPN_HOST')}/login?cas_login=true"
        },
    )
    assert ret.status_code == 200, f"无法找到登录页, HTTP {ret.status_code}"
    pwdEncryptSalt = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="pwdEncryptSalt" value="([A-Za-z0-9]+)" />', ret.text).group(1)
    execution = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="execution" name="execution" value="([A-Za-z0-9-_/+=]+)" />', ret.text).group(1)

    ret = ss.get(
        f"{os.getenv('SP_VPN_HOST')}/{vpn_host_encode(os.getenv('SP_SSO_HOST'))}/authserver/checkNeedCaptcha.htl",
        params={
            "username": os.getenv('SP_SSO_USERNAME'),
            "_": int(time.time()*1000),
        }
    )
    assert ret.status_code == 200, f"无法得知是否需要验证码, HTTP {ret.status_code}"
    if ret.json()["isNeed"]:
        ret = ss.get(
            f"{os.getenv('SP_VPN_HOST')}/{vpn_host_encode(os.getenv('SP_SSO_HOST'))}/authserver/getCaptcha.htl",
            params=str(int(time.time()*1000)),
        )
        assert ret.status_code == 200, f"无法获取验证码, HTTP {ret.status_code}"

        ocr = ddddocr.DdddOcr(show_ad=False)
        captcha = ocr.classification(ret.content)
    else:
        captcha = ""

    ret = ss.post(
        f"{os.getenv('SP_VPN_HOST')}/{vpn_host_encode(os.getenv('SP_SSO_HOST'))}/authserver/login",
        params={
            "service": f"{os.getenv('SP_VPN_HOST')}/login?cas_login=true"
        },
        data={
            "username": os.getenv('SP_SSO_USERNAME'),
            "password": password_encode(os.getenv('SP_SSO_PASSWORD'), pwdEncryptSalt),
            "captcha": captcha,
            "_eventId": "submit",
            "cllt": "userNameLogin",
            "dllt": "generalLogin",
            "lt": "",
            "execution": execution,
        },
    )
    assert ret.status_code == 200, "登录失败, "+re.search(r'<span id="showErrorTip" class="form-error"><span>(.+)</span></span>', ret.text).group(1)

    ret = ss.get(
        f"{os.getenv('SP_VPN_HOST')}/{vpn_host_encode(os.getenv('SP_SSO_HOST'))}/authserver/login",
        params={
            "service": f"{os.getenv('SP_HOST')}/outIndex/power"
        },
    )
    assert ret.status_code == 200, "登录失败, 无法通过SSO登录"

    if "电费充值" in ret.text:
        # 通过vpn访问
        ret = ss.post(
            f"{os.getenv('SP_VPN_HOST')}/wengine-vpn/cookie",
            params={
                "method": "get",
                "host": vpn_host_parse(os.getenv('SP_HOST'))[1],
                "scheme": vpn_host_parse(os.getenv('SP_HOST'))[0],
                "path": "/member/power",
                "vpn_timestamp": int(time.time()*1000),
            },
        )
        assert ret.status_code == 200 and len(ret.text) > 0, "登录失败, 获取通过SSO登录后的SP Cookie失败"

        for cookie_str in ret.text.split('; '):
            cookie = re.search(r'(.+?)=(.*)', cookie_str).groups()
            ss.cookies.set(cookie[0], cookie[1], domain=urllib.parse.urlparse(os.getenv('SP_HOST')).hostname)
    elif "访问出错" in ret.text:
        # 通过公网访问
        ret = ss.post(
            f"{os.getenv('SP_VPN_HOST')}/wengine-vpn/cookie",
            params={
                "method": "get",
                "host": vpn_host_parse(os.getenv('SP_SSO_HOST'))[1],
                "scheme": vpn_host_parse(os.getenv('SP_SSO_HOST'))[0],
                "path": "/authserver/login",
                "vpn_timestamp": int(time.time() * 1000),
            },
        )
        assert ret.status_code == 200 and len(ret.text) > 0, "登录失败, 获取通过SSO登录后的SSO Cookie失败"

        for cookie_str in ret.text.split('; '):
            cookie = re.search(r'(.+?)=(.*)', cookie_str).groups()
            ss.cookies.set(cookie[0], cookie[1], domain=urllib.parse.urlparse(os.getenv('SP_SSO_HOST')).hostname)

        ret = ss.get(
            f"{os.getenv('SP_HOST')}/outIndex/power"
        )
        assert ret.status_code == 200 and "电费充值" in ret.text, "登录失败, 无法通过SSO登录后从外网跳转"
        ...
    else:
        assert False, "登录失败，未知情况"


def main():
    needReTry = True

    log("定时任务开始")
    try:
        if os.getenv('SP_DEBUG') == "0":
            conn = pymysql.connect(host=os.getenv('SP_DB_HOST'), port=int(os.getenv('SP_DB_PORT')), user=os.getenv('SP_DB_USER'), passwd=os.getenv('SP_DB_PASS'), db=os.getenv('SP_DB_NAME'))
            cur = conn.cursor()
        ss = Session()
        data = {}
        ####
        try:
            login(ss)
        except Exception as e:
            log("登录异常", e)
            log(*traceback.format_tb(e.__traceback__))
            return
        ####
        try:
            ret = ss.post(url=f"{os.getenv('SP_HOST')}/member/power/selectArea")
            assert ret.status_code == 200 and ret.json()['code'] == 1
        except AssertionError:
            log("获取area异常", ret.status_code, ret.text)
            return
        except Exception as e:
            log("获取area异常", e)
            log(*traceback.format_tb(e.__traceback__))
            return

        ret = ret.json()
        areas = ret['data']
        ####
        for area in areas:
            areaName = area['areaName']
            areaId = area['areaID']
            data[areaName] = {}
            ####
            try:
                ret = ss.post(url=f"{os.getenv('SP_HOST')}/member/power/buildings", data={
                    "schoolId": int(os.getenv('SP_SCHOOL_ID')),
                    "areaId": areaId
                })
                assert ret.status_code == 200 and ret.json()['code'] == 1
            except AssertionError:
                log("获取building异常", ret.status_code, ret.text)
                return
            except Exception as e:
                log("获取building异常", e)
                log(*traceback.format_tb(e.__traceback__))
                return
            ret = ret.json()
            ####
            for buildingIdAndcompCode in ret['data']:
                buildingName = buildingIdAndcompCode['title']
                buildingId, _, compCode = buildingIdAndcompCode['value'].partition(",")
                data[areaName][buildingName] = {}
                ####
                try:
                    ret = ss.post(url=f"{os.getenv('SP_HOST')}/member/power/rooms", data={
                        "schoolId": int(os.getenv('SP_SCHOOL_ID')),
                        "areaId": areaId,
                        "buildId": buildingId,
                        "compCode": compCode
                    })
                    assert ret.status_code == 200 and ret.json()['code'] == 1
                except AssertionError:
                    log("获取room异常", ret.status_code, ret.text)
                    return
                except Exception as e:
                    log("获取room异常", e)
                    log(*traceback.format_tb(e.__traceback__))
                    return
                ret = ret.json()
                ####
                for roomIdAndPower in ret['data']:
                    roomName = roomIdAndPower['title']
                    roomId, _, power = roomIdAndPower['value'].partition(",")
                    data[areaName][buildingName][roomName] = power
                    log(areaName, buildingName, roomName, power)
                    ####
                    if os.getenv('SP_DEBUG') == "0":
                        cur.execute("select id from sp_room where area = %s and building = %s and room = %s", (areaName, buildingName, roomName))
                        roomData = cur.fetchall()
                        if len(roomData) == 0:
                            cur.execute("insert into sp_room(area, building, room, create_time) values(%s, %s, %s, CURRENT_TIMESTAMP)", (areaName, buildingName, roomName))
                            cur.execute("select id from sp_room where area = %s and building = %s and room = %s", (areaName, buildingName, roomName))
                            roomData = cur.fetchall()
                        dbId, = roomData
                        cur.execute("update sp_room set power = %s, update_time = CURRENT_TIMESTAMP where id = %s", (power, dbId))
                        cur.execute("insert into sp_log(room, power, log_time) values(%s, %s, CURRENT_TIMESTAMP)", (dbId, power))
        ####
        if os.getenv('SP_DEBUG') == "0":
            conn.commit()
            cur.close()
            conn.close()

        needReTry = False
        if util.reTryJob is not None:
            log("本次定时任务成功，取消了定时重试任务")
            schedule.cancel_job(util.reTryJob)
            util.reTryJob = None
    except Exception as e:
        log("main中发现未知异常", e)
        log(*traceback.format_tb(e.__traceback__))
        return
    finally:
        if needReTry and util.reTryJob is None:
            log("添加一个定时重试任务")
            util.reTryJob = schedule.every().minute.at(":00").do(main)  # 执行失败后每分钟重试一次直到成功
        log("定时任务结束")


def task():
    main()
    log("定时任务创建")
    schedule.every().hour.at(":00").do(main)
    while True:
        schedule.run_pending()
        time.sleep(0.1)


if __name__ == '__main__':
    load_dotenv('.env.local')
    load_dotenv('.env')
    task()
