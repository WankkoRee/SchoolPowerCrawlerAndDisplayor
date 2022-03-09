import time

import schedule
from requests import Session
import pymysql

from config import host, schoolId, aesEcbPkcs7, username, password, db_host, db_username, db_password, db_name


def main():
    print(time.strftime("%Y/%m/%d %H:%M:%S", time.localtime()), "定时任务开始")

    conn = pymysql.connect(host=db_host, user=db_username, passwd=db_password, db=db_name)
    cur = conn.cursor()
    ss = Session()
    data = {}
    ####
    try:
        ret = ss.post(url=f"{host}/login", data={
            "zhToken": aesEcbPkcs7.encrypt(f'userNo={username}&password={password}', "hex")
        })
        assert ret.status_code == 200 and ret.json()['code'] == 1
    except AssertionError:
        print("登录异常", ret.status_code, ret.text)
        return
    except Exception as e:
        print("登录异常", e)
        raise e
    ####
    try:
        ret = ss.post(url=f"{host}/member/power/selectArea")
        assert ret.status_code == 200 and ret.json()['code'] == 1
    except AssertionError:
        print("获取area异常", ret.status_code, ret.text)
        return
    except Exception as e:
        print("获取area异常", e)
        raise e

    ret = ret.json()
    areas = ret['data']
    ####
    for area in areas:
        areaName = area['areaName']
        areaId = area['areaID']
        data[areaName] = {}
        ####
        try:
            ret = ss.post(url=f"{host}/member/power/buildings", data={
                "schoolId": schoolId,
                "areaId": areaId
            })
            assert ret.status_code == 200 and ret.json()['code'] == 1
        except AssertionError:
            print("获取building异常", ret.status_code, ret.text)
            return
        except Exception as e:
            print("获取building异常", e)
            raise e
        ret = ret.json()
        ####
        for buildingIdAndcompCode in ret['data']:
            buildingName = buildingIdAndcompCode['title']
            buildingId, _, compCode = buildingIdAndcompCode['value'].partition(",")
            data[areaName][buildingName] = {}
            ####
            try:
                ret = ss.post(url=f"{host}/member/power/rooms", data={
                    "schoolId": schoolId,
                    "areaId": areaId,
                    "buildId": buildingId,
                    "compCode": compCode
                })
                assert ret.status_code == 200 and ret.json()['code'] == 1
            except AssertionError:
                print("获取room异常", ret.status_code, ret.text)
                return
            except Exception as e:
                print("获取room异常", e)
                raise e
            ret = ret.json()
            ####
            for roomIdAndPower in ret['data']:
                roomName = roomIdAndPower['title']
                roomId, _, power = roomIdAndPower['value'].partition(",")
                data[areaName][buildingName][roomName] = power
                print(areaName, buildingName, roomName, power)
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

    print(time.strftime("%Y/%m/%d %H:%M:%S", time.localtime()), "定时任务结束")


def task():
    print(time.strftime("%Y/%m/%d %H:%M:%S", time.localtime()), "定时任务创建")
    schedule.every().hour.at(":00").do(main)
    while True:
        schedule.run_pending()
        time.sleep(0.1)


if __name__ == '__main__':
    task()
