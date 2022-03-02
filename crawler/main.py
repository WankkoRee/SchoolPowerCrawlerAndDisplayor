from requests import Session
import pymysql

from util import AES_ECB_PKCS7


def main():
    host = "https://dk.nynu.edu.cn"  # 按需更改
    schoolId = 4  # 按需更改
    aesEcbPkcs7 = AES_ECB_PKCS7(bytes.fromhex("31323334353637383930414243444546"))  # 按需更改

    username = ""  # 肯定要改
    password = ""  # 肯定要改
    conn = pymysql.connect(host='', user='', passwd="", db='')  # 肯定要改
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
                cur.execute("select id from se_room where area = %s and building = %s and room = %s", (areaName, buildingName, roomName))
                roomData = cur.fetchall()
                if len(roomData) == 0:
                    cur.execute("insert into se_room(area, building, room, create_time) values(%s, %s, %s, CURRENT_TIMESTAMP)", (areaName, buildingName, roomName))
                    cur.execute("select id from se_room where area = %s and building = %s and room = %s", (areaName, buildingName, roomName))
                    roomData = cur.fetchall()
                dbId, = roomData
                cur.execute("update se_room set power = %s, update_time = CURRENT_TIMESTAMP where id = %s", (power, dbId))
                cur.execute("insert into se_log(room, power, log_time) values(%s, %s, CURRENT_TIMESTAMP)", (dbId, power))
    ####
    conn.commit()
    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
