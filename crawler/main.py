import os
import time
import datetime

from dotenv import load_dotenv
import schedule
from requests import Session
import pymysql

import util


def log(*values: object):
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), *values)


def main():
    needReTry = True

    log("定时任务开始")
    try:
        conn = pymysql.connect(host=os.getenv('SP_DB_HOST'), port=int(os.getenv('SP_DB_PORT')), user=os.getenv('SP_DB_USER'), passwd=os.getenv('SP_DB_PASS'), db=os.getenv('SP_DB_NAME'))
        cur = conn.cursor()
        ss = Session()
        data = {}
        aesEcbPkcs7 = util.AES_ECB_PKCS7(bytes.fromhex(os.getenv('SP_AES_KEY')))
        ####
        try:
            ret = ss.post(url=f"{os.getenv('SP_HOST')}/login", data={
                "zhToken": aesEcbPkcs7.encrypt(f"userNo={os.getenv('SP_USERNAME')}&password={os.getenv('SP_PASSWORD')}", "hex")
            })
            assert ret.status_code == 200 and ret.json()['code'] == 1
        except AssertionError:
            log("登录异常", ret.status_code, ret.text)
            return
        except Exception as e:
            log("登录异常", e)
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
                    return
                ret = ret.json()
                ####
                for roomIdAndPower in ret['data']:
                    roomName = roomIdAndPower['title']
                    roomId, _, power = roomIdAndPower['value'].partition(",")
                    data[areaName][buildingName][roomName] = power
                    log(areaName, buildingName, roomName, power)
                    ####
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
        conn.commit()
        cur.close()
        conn.close()

        needReTry = False
        if util.reTryJob is not None:
            log("本次定时任务成功，取消了定时重试任务")
            schedule.cancel_job(util.reTryJob)
    except Exception as e:
        log("main中发现未知异常", e)
        return
    finally:
        if needReTry and util.reTryJob is None:
            log("添加一个定时重试任务")
            util.reTryJob = schedule.every().minute.at(":00").do(main)  # 执行失败后每分钟重试一次直到成功
        log("定时任务结束")


def task():
    log("定时任务创建")
    schedule.every().hour.at(":00").do(main)
    while True:
        schedule.run_pending()
        time.sleep(0.1)


if __name__ == '__main__':
    load_dotenv('.env.local')
    load_dotenv('.env')
    task()
