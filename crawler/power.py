import logging
import time
from typing import Iterator
from decimal import Decimal

import redis
import taos
import tenacity
import timeout_decorator

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
            self.__sp_mongo_host,
            self.__sp_mongo_port,
            self.__sp_mongo_user,
            self.__sp_mongo_pass,
            self.__sp_mongo_name,
            self.__sp_redis_host,
            self.__sp_redis_port,
            self.__sp_redis_db,
            self.__sp_debug
        ) = self.__sp_env = prepare()
        self.__logger = logging.getLogger("电量")

        self.__logger.debug("初始化")

        self.__session = session
        self.__cache_last_powers = {}
        self.__tdengine: taos.TaosConnection | None = None
        self.__redis: redis.StrictRedis | None = None

    def __del__(self):
        if self.__tdengine is not None:
            try:
                self.__tdengine.close()
            except:
                pass

        self.__logger.debug("销毁")

    @timeout_decorator.timeout(60 * 60, use_signals=False)
    def run(self):
        self.__logger.info("任务开始")

        self.__logger.info("尝试登录")
        self.__session.login()
        self.__logger.info("登录成功")
        if self.__sp_debug:
            for area_name, building_name, room_name, room_power, room_ts in self.__crawler():
                self.__logger.debug(msg=(area_name, building_name, room_name, room_power, room_ts))
        else:
            self.__tdengine = taos.connect(
                host=self.__sp_db_host,
                port=self.__sp_db_port,
                user=self.__sp_db_user,
                passwd=self.__sp_db_pass,
                database=self.__sp_db_name,
                timezone="Asia/Shanghai",
            )
            self.__redis = redis.StrictRedis(
                host=self.__sp_redis_host,
                port=self.__sp_redis_port,
                db=self.__sp_redis_db,
            )
            try:
                self.__saver(self.__crawler())
                self.__redis.publish('power_task', int(time.time() * 1000))
            finally:
                self.__tdengine.close()
                self.__redis.close()
                self.__tdengine = None
                self.__redis = None
        self.__logger.info("任务结束")

    def __crawler(self) -> Iterator[tuple[str, str, str, int, float]]:
        self.__logger.info("数据爬取")
        sums = 0
        for area_id, area_name in self.__areas():
            for building_id, building_name, building_comp in self.__buildings(area_id):
                for room_id, room_name, room_power, room_ts in self.__rooms(area_id, building_id, building_comp):
                    yield area_name, building_name, room_name, room_power, room_ts
                    sums += 1
        self.__logger.info(f"爬取了 {sums} 条数据")

    def __saver(self, data: Iterator[tuple[str, str, str, int, float]]):
        self.__logger.info("数据落地")
        if len(self.__cache_last_powers) == 0:
            for table_name, ts, power, spending in self.__tdengine.query(f"select tbname, last_row(ts, power, spending) from powers partition by tbname").fetch_all():
                self.__cache_last_powers[table_name] = ts.timestamp(), power, spending

        stmt = self.__tdengine.statement("insert into ? (ts, power, spending) using `powers` tags (?, ?, ?, ?, ?, ?) values (?, ?, ?)")

        for area_name, building_name, room_name, room_power, room_ts in data:
            table_name = f"{area_name}{building_name}{room_name}"

            table_exist = True
            if table_name not in self.__cache_last_powers.keys():
                try:
                    ts, power, spending = self.__tdengine.query(f"select last_row(ts, power, spending) from `{table_name}`").fetch_all()[0]
                    self.__cache_last_powers[table_name] = ts.timestamp(), power, spending
                except taos.ProgrammingError as e:
                    if e.errno == 0x80002662 - 0x100000000 or e.msg == 'Fail to get table info, error: Table does not exist':
                        table_exist = False
                        self.__logger.warning(f"新寝室: {table_name}")
                    else:
                        raise e

            room_spending = (self.__cache_last_powers[table_name][1] - room_power) if table_exist else None  # 反向减，算用电情况

            tags = taos.new_bind_params(6)
            tags[0].nchar(area_name)
            tags[1].nchar(building_name)
            tags[2].nchar(room_name)
            tags[3].timestamp(room_ts)
            tags[4].bool(True)
            tags[5].tinyint_unsigned(0)
            stmt.set_tbname_tags(f"`{table_name}`", tags)

            values = taos.new_bind_params(3)
            values[0].timestamp(room_ts)
            values[1].int(room_power)
            values[2].int(None)
            stmt.bind_param(values)

            if table_exist:  # 更新上一次的 spending
                values = taos.new_bind_params(3)
                values[0].timestamp(self.__cache_last_powers[table_name][0])
                values[1].int(self.__cache_last_powers[table_name][1])
                values[2].int(room_spending)
                stmt.bind_param(values)

            self.__cache_last_powers[table_name] = (room_ts, room_power, None)  # 缓存这一次的 power

        stmt.execute()
        stmt.close()

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __areas(self) -> list[tuple[int, str]]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("尝试获取校区")

        resp = self.__session.post(
            url=f"{self.__sp_host}/member/power/selectArea",
        )
        assert resp.status_code == 200, f"无法获取校区，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.json()
        assert ret['code'] == 1, f"无法获取校区\n\n" \
                                 f"args: \n{argv}\n\n" \
                                 f"resp: \n{ret}"

        areas = []
        for area in ret['data']:
            areas.append((area['areaID'], area['areaName']))
        return areas

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __buildings(self, area_id: int) -> list[tuple[int, str, int]]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug(f"尝试获取宿舍楼 {area_id}")

        resp = self.__session.post(
            url=f"{self.__sp_host}/member/power/buildings",
            data={
                "schoolId": self.__sp_school_id,
                "areaId": area_id,
            },
        )
        assert resp.status_code == 200, f"无法获取宿舍楼，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.json()
        assert ret['code'] == 1, f"无法获取宿舍楼\n\n" \
                                 f"args: \n{argv}\n\n" \
                                 f"resp: \n{ret}"

        buildings = []
        for building in ret['data']:
            building_id, _, building_comp = building['value'].partition(",")
            buildings.append((int(building_id), building['title'], int(building_comp)))
        return buildings

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __rooms(self, area_id: int, building_id: int, building_comp: int) -> Iterator[tuple[int, str, int, float]]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug(f"尝试获取寝室 {area_id} {building_id},{building_comp}")

        resp = self.__session.post(
            url=f"{self.__sp_host}/member/power/rooms",
            data={
                "schoolId": self.__sp_school_id,
                "areaId": area_id,
                "buildId": building_id,
                "compCode": building_comp,
            },
        )
        assert resp.status_code == 200, f"无法获取寝室，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.json()
        assert ret['code'] == 1, f"无法获取寝室\n\n" \
                                 f"args: \n{argv}\n\n" \
                                 f"resp: \n{ret}"

        rooms = []
        room_ts = time.time()
        for room in ret['data']:
            room_id, _, room_power = room['value'].partition(",")
            rooms.append((int(room_id), room['title'], int(Decimal(room_power) * 100), room_ts))
        return rooms
