import logging
import time
from typing import Iterator
from decimal import Decimal

import taos
from taos import ProgrammingError, TaosConnection

from session import Session
from util import prepare


class Power:
    def __init__(self, session: Session):
        super().__init__()
        (
            self.__sp_host,
            self.__sp_school_id,
            self.__sp_vpn_host,
            self.__sp_vpn_key,
            self.__sp_vpn_iv,
            self.__sp_sso_host,
            self.__sp_sso_username,
            self.__sp_sso_password,
            self.__sp_db_host,
            self.__sp_db_port,
            self.__sp_db_user,
            self.__sp_db_pass,
            self.__sp_db_name,
            self.__sp_debug
        ) = self.__sp_env = prepare()
        self.__logger = logging.getLogger("电量")

        self.__logger.info("初始化")

        self.__last_powers = {}
        self.__session = session
        self.__tdengine: TaosConnection = None

    def __del__(self):
        pass

        self.__logger.info("销毁")

    def run(self):
        self.__logger.info("任务开始")

        self.__logger.info("尝试登录")
        self.__session.login()
        self.__logger.info("登录成功")
        if self.__sp_debug:
            for area_name, building_name, room_name, room_power, room_ts in self.__crawler():
                self.__logger.info(area_name, building_name, room_name, room_power, room_ts)
        else:
            self.__tdengine = taos.connect(
                host=self.__sp_db_host,
                port=self.__sp_db_port,
                user=self.__sp_db_user,
                passwd=self.__sp_db_pass,
                database=self.__sp_db_name,
                timezone="Asia/Shanghai",
            )
            self.__saver(self.__crawler())
            self.__tdengine.close()
        self.__logger.info("任务结束")

    def __crawler(self) -> Iterator[tuple[str, str, str, int, float]]:
        self.__logger.info("数据爬取")
        for area_id, area_name in self.__areas():
            for building_id, building_name, building_comp in self.__buildings(area_id):
                for room_id, room_name, room_power, room_ts in self.__rooms(area_id, building_id, building_comp):
                    yield area_name, building_name, room_name, room_power, room_ts

    def __saver(self, data: Iterator[tuple[str, str, str, int, float]]):
        self.__logger.info("数据落地")
        if len(self.__last_powers) == 0:
            for table_name, ts, power, spending in self.__tdengine.query(f"select tbname, last_row(ts, power, spending) from powers partition by tbname").fetch_all():
                self.__last_powers[table_name] = ts.timestamp(), power, spending

        stmt = self.__tdengine.statement("insert into ? (ts, power, spending) using `powers` tags (?, ?, ?, ?, ?) values (?, ?, ?)")

        for area_name, building_name, room_name, room_power, room_ts in data:
            table_name = f"{area_name}{building_name}{room_name}"

            table_exist = True
            if table_name not in self.__last_powers.keys():
                try:
                    ts, power, spending = self.__tdengine.query(f"select last_row(ts, power, spending) from `{table_name}`").fetch_all()[0]
                    self.__last_powers[table_name] = ts.timestamp(), power, spending
                except ProgrammingError as e:
                    if e.errno == 0x80002662 - 0x100000000 or e.msg == 'Fail to get table info, error: Table does not exist':
                        table_exist = False
                        self.__logger.info(f"新寝室: {table_name}")
                    else:
                        raise e

            room_spending = (self.__last_powers[table_name][1] - room_power) if table_exist else None  # 反向减，算用电情况

            tags = taos.new_bind_params(5)
            tags[0].nchar(area_name)
            tags[1].nchar(building_name)
            tags[2].nchar(room_name)
            tags[3].timestamp(room_ts)
            tags[4].bool(True)
            stmt.set_tbname_tags(f"`{table_name}`", tags)

            values = taos.new_bind_params(3)
            values[0].timestamp(room_ts)
            values[1].int(room_power)
            values[2].int(None)
            stmt.bind_param(values)

            if table_exist:  # 更新上一次的 spending
                values = taos.new_bind_params(3)
                values[0].timestamp(self.__last_powers[table_name][0])
                values[1].int(self.__last_powers[table_name][1])
                values[2].int(room_spending)
                stmt.bind_param(values)

            self.__last_powers[table_name] = (room_ts, room_power, None)  # 缓存这一次的 power

        stmt.execute()
        stmt.close()

    def __areas(self) -> Iterator[tuple[int, str]]:
        self.__logger.info("尝试获取校区")
        resp = self.__session.post(
            url=f"{self.__sp_host}/member/power/selectArea",
        )
        assert resp.status_code == 200
        ret = resp.json()
        assert ret['code'] == 1
        for area in ret['data']:
            yield area['areaID'], area['areaName']

    def __buildings(self, area_id: int) -> Iterator[tuple[int, str, int]]:
        self.__logger.info("尝试获取宿舍楼")
        resp = self.__session.post(
            url=f"{self.__sp_host}/member/power/buildings",
            data={
                "schoolId": self.__sp_school_id,
                "areaId": area_id,
            },
        )
        assert resp.status_code == 200
        ret = resp.json()
        assert ret['code'] == 1
        for building in ret['data']:
            building_id, _, building_comp = building['value'].partition(",")
            yield int(building_id), building['title'], int(building_comp)

    def __rooms(self, area_id: int, building_id: int, building_comp: int) -> Iterator[tuple[int, str, int, float]]:
        self.__logger.info("尝试获取寝室")
        resp = self.__session.post(
            url=f"{self.__sp_host}/member/power/rooms",
            data={
                "schoolId": self.__sp_school_id,
                "areaId": area_id,
                "buildId": building_id,
                "compCode": building_comp,
            },
        )
        assert resp.status_code == 200
        ret = resp.json()
        assert ret['code'] == 1
        room_ts = time.time()
        for room in ret['data']:
            room_id, _, room_power = room['value'].partition(",")
            yield int(room_id), room['title'], int(Decimal(room_power) * 100), room_ts
