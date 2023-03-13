import logging
import re
import time
from typing import Iterator
from urllib.parse import quote_plus

import pypinyin
import taos
import pymongo
import pymongo.database
import tenacity

from session import Session
from util import prepare


class Student:
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
        self.__logger = logging.getLogger("学生")

        self.__logger.debug("初始化")

        self.__session = session
        self.__regex_dept = re.compile(
            r'<td align="center">'
            r'\s*<a style="text-decoration:underline;" href="/member/dormitoryManage/getDeptList\?deptCode=(\d+?)(?:&deptName=.+?&status=1)?">'
            r'\s*(.+?)'
            r'\s*</a>'
            r'\s*</td>'
            r'\s*<td align="center">(\d+?)</td>'
            r'\s*<td align="center">(\d+?)</td>'
        )
        self.__regex_class = re.compile(
            r'<td align="center">'
            r'\s*<a style="text-decoration:underline;" href="/member/dormitoryManage/getStudentInfo\?keyword=([\dA-F]+?)">'
            r'\s*(.+?)'
            r'\s*</a>'
            r'\s*</td>'
        )
        self.__regex_info = re.compile(
            r'<h1>'
            r'\s*(照片|房间|床位|学号|姓名|电话|年级|学院|专业|班级|学历)'
            r'\s*</h1>'
            r'\s*<h\d>'
            r'\s*(.*?)'
            r'\s*</h\d>'
        )
        self.__regex_img = re.compile(r'<img src="(.*?)">')
        self.__cache_rooms: dict[str, dict[str, dict[str, set[int]]]] = {}
        self.__tdengine: taos.TaosConnection | None = None
        self.__mongodb_: pymongo.MongoClient | None = None
        self.__mongodb: pymongo.database.Database | None = None

    def __del__(self):
        if self.__tdengine is not None:
            try:
                self.__tdengine.close()
            except:
                pass
        if self.__mongodb is not None:
            try:
                self.__mongodb.close()
            except:
                pass

        self.__logger.debug("销毁")

    def run(self):
        self.__logger.info("任务开始")

        self.__logger.info("尝试登录")
        self.__session.login()
        self.__logger.info("登录成功")
        if self.__sp_debug:
            for student_id, student_number, student_name, student_faculty, student_grade, student_class, student_major, student_qualification, student_phone, student_picture, student_building, student_room, student_bed, student_ts in self.__crawler():
                self.__logger.debug(msg=(student_id, student_number, student_name, student_faculty, student_grade, student_class, student_major, student_qualification, student_phone, student_picture, student_building, student_room, student_bed, student_ts))
        else:
            self.__tdengine = taos.connect(
                host=self.__sp_db_host,
                port=self.__sp_db_port,
                user=self.__sp_db_user,
                passwd=self.__sp_db_pass,
                database=self.__sp_db_name,
                timezone="Asia/Shanghai",
            )
            self.__mongodb_ = pymongo.MongoClient(f"mongodb://{quote_plus(self.__sp_mongo_user)}:{quote_plus(self.__sp_mongo_pass)}@{self.__sp_mongo_host}:{self.__sp_mongo_port}")
            self.__mongodb = self.__mongodb_[self.__sp_mongo_name]
            self.__saver(self.__crawler())
            self.__tdengine.close()
            self.__tdengine = None
            self.__mongodb_.close()
            self.__mongodb = None
        self.__logger.info("任务结束")

    def __crawler(self) -> Iterator[tuple[str, str, str, str, str, str, str, str | None, str | None, str, str | None, str | None, int | None, float]]:
        self.__logger.info("数据爬取")
        sums = 0
        for faculty_id, faculty_name, faculty_dept_number, faculty_stu_number in self.__get_dept_list("00", "学校"):
            if faculty_name == "教职工":
                continue
            if faculty_dept_number == 0 or faculty_stu_number == 0:
                self.__logger.warning(f"数据可能为空，直接跳过，{faculty_id=}, {faculty_name=}, {faculty_dept_number=}, {faculty_stu_number=}")
                continue
            for major_id, major_name, major_dept_number, major_stu_number in self.__get_dept_list(faculty_id, faculty_name):
                if major_dept_number == 0 or major_stu_number == 0:
                    self.__logger.warning(f"数据可能为空，直接跳过，{major_id=}, {major_name=}, {major_dept_number=}, {major_stu_number=}")
                    continue
                for grade_id, grade_name, grade_dept_number, grade_stu_number in self.__get_dept_list(major_id, major_name):
                    if grade_dept_number == 0 or grade_stu_number == 0:
                        self.__logger.warning(f"数据可能为空，直接跳过，{grade_id=}, {grade_name=}, {grade_dept_number=}, {grade_stu_number=}")
                        continue
                    for class_id, class_name, class_dept_number, class_stu_number in self.__get_dept_list(grade_id, grade_name):
                        if class_dept_number != 0:
                            self.__logger.warning(f"数据不合预期，直接跳过，{class_id=}, {class_name=}, {class_dept_number=}")
                            continue
                        if class_stu_number == 0:
                            self.__logger.warning(f"数据可能为空，直接跳过，{class_id=}, {class_name=}, {class_stu_number=}")
                            continue
                        for student_id in self.__get_stu_list(class_id, class_name):
                            yield student_id, *self.__get_stu_info(student_id)
                            sums += 1
        self.__logger.info(f"爬取了 {sums} 条数据")

    def __saver(self, data: Iterator[tuple[str, str, str, str, str, str, str, str | None, str | None, str, str | None, str | None, int | None, float]]):
        self.__logger.info("数据落地")
        if len(self.__cache_rooms) == 0:
            for table_name, area, building, room in self.__tdengine.query(f"select distinct tbname, area, building, room from powers").fetch_all():
                if building not in self.__cache_rooms.keys():
                    self.__cache_rooms[building] = {}
                if room not in self.__cache_rooms[building].keys():
                    self.__cache_rooms[building][room] = {}
                if area not in self.__cache_rooms[building][room].keys():
                    self.__cache_rooms[building][room][area] = set()

        for building in self.__cache_rooms.keys():
            for room in self.__cache_rooms[building].keys():
                for area in self.__cache_rooms[building][room].keys():
                    self.__cache_rooms[building][room][area] = set()

        for student_id, student_number, student_name, student_faculty, student_grade, student_class, student_major, student_qualification, student_phone, student_picture, student_building, student_room, student_bed, student_ts in data:
            no_room = student_building is None or student_room is None
            custom_room = False  # 可自选

            if not no_room:
                if student_building not in self.__cache_rooms.keys():
                    for table_name, area, building, room in self.__tdengine.query(f"select distinct tbname, area, building, room from powers where building='{student_building}'").fetch_all():
                        if building not in self.__cache_rooms.keys():
                            self.__cache_rooms[building] = {}
                        if room not in self.__cache_rooms[building].keys():
                            self.__cache_rooms[building][room] = {}
                        if area not in self.__cache_rooms[building][room].keys():
                            self.__cache_rooms[building][room][area] = set()
                if student_building not in self.__cache_rooms.keys():
                    self.__logger.warning(f"所需的 building {student_building} 无法在 TDengine 中找到")
                    no_room = True
                    custom_room = True

                if not no_room:
                    if student_room not in self.__cache_rooms[student_building].keys():
                        for table_name, area, building, room in self.__tdengine.query(f"select distinct tbname, area, building, room from powers where building='{student_building}' and room='{student_room}'").fetch_all():
                            if building not in self.__cache_rooms.keys():
                                self.__cache_rooms[building] = {}
                            if room not in self.__cache_rooms[building].keys():
                                self.__cache_rooms[building][room] = {}
                            if area not in self.__cache_rooms[building][room].keys():
                                self.__cache_rooms[building][room][area] = set()
                    if student_room not in self.__cache_rooms[student_building].keys():
                        self.__logger.warning(f"所需的 room {student_room} 无法在 TDengine 中找到")
                        no_room = True
                        custom_room = True

            if no_room:
                student_area = None
            else:
                student_rooms = list(filter(lambda x: x == student_room or x.startswith(student_room+"-"), self.__cache_rooms[student_building].keys()))
                assert len(student_rooms) > 0
                if len(student_rooms) > 1:
                    custom_room = True
                student_area = list(self.__cache_rooms[student_building][student_room].keys())[0]

            mongo_result = self.__mongodb['student'].find_one_and_update(filter={'_id': student_id}, update={
                '$set': {
                    'info.number': student_number,
                    'info.name': student_name,
                    'info.faculty': student_faculty,
                    'info.grade': student_grade,
                    'info.class': student_class,
                    'info.major': student_major,
                    'info.qualification': student_qualification,
                    'info.phone': student_phone,
                    'info.picture': student_picture,
                    'position.area': student_area,
                    'position.building': student_building,
                    'position.room': student_room,
                    'position.bed': student_bed,
                    'position.custom.state': custom_room,
                    'update_time': student_ts,
                },
                '$setOnInsert': {
                    'position.custom.area': None,
                    'position.custom.building': None,
                    'position.custom.room': None,
                    'app.password': student_phone[-6:] if student_phone is not None and len(student_phone) >= 6 else "".join(pypinyin.lazy_pinyin(student_name, pypinyin.Style.NORMAL)),
                    'app.qq': None,
                    'app.dingtalk': None,
                },
            }, projection={
                'position.custom.state': 1,
                'position.area': 1,
                'position.building': 1,
                'position.room': 1,
                'position.bed': 1,
                'position.custom.area': 1,
                'position.custom.building': 1,
                'position.custom.room': 1,
            }, upsert=True, return_document=pymongo.ReturnDocument.AFTER)
            if mongo_result['position']['custom']['state']:
                mongo_result_area = mongo_result['position']['custom']['area']
                mongo_result_building = mongo_result['position']['custom']['building']
                mongo_result_room = mongo_result['position']['custom']['room']
            else:
                mongo_result_area = mongo_result['position']['area']
                mongo_result_building = mongo_result['position']['building']
                mongo_result_room = mongo_result['position']['room']
            mongo_result_bed = mongo_result['position']['bed']
            if mongo_result_building in self.__cache_rooms.keys():
                if mongo_result_room in self.__cache_rooms[mongo_result_building].keys():
                    if mongo_result_area in self.__cache_rooms[mongo_result_building][mongo_result_room].keys():
                        if mongo_result_bed in self.__cache_rooms[student_building][student_room][student_area]:
                            self.__logger.warning(f"寝室床位异常，{student_area} / {student_building} / {student_room} 中已存在 {mongo_result_bed}，{student_id} 或其他人可能不属于此寝室")
                        else:
                            self.__cache_rooms[student_building][student_room][student_area].add(mongo_result_bed)

        for building in self.__cache_rooms.keys():
            for room in self.__cache_rooms[building].keys():
                for area in self.__cache_rooms[building][room].keys():
                    self.__tdengine.execute(f"ALTER TABLE `{area}{building}{room}` SET TAG nums={len(self.__cache_rooms[building][room][area])}")

    @tenacity.retry(
        wait=tenacity.wait_fixed(10),
        stop=tenacity.stop_after_attempt(5),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 10s 重试，最多 5 次
    def __get_dept_list(self, dept_id: str, dept_name: str) -> list[tuple[str, str, int, int]]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug(f"尝试获取部门 {dept_id} {dept_name}")

        resp = self.__session.get(
            url=f"{self.__sp_host}/member/dormitoryManage/getDeptList",
            params={
                "deptCode": dept_id,
            },
        )
        assert resp.status_code == 200, f"无法获取部门，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        assert "随行校园-部门" in ret, f"无法获取部门\n\n" \
                                 f"args: \n{argv}\n\n" \
                                 f"resp: \n{ret}"

        departments = []
        for department_id, department_name, department_dept_number, department_stu_number in self.__regex_dept.findall(ret):
            departments.append((department_id, department_name, int(department_dept_number), int(department_stu_number)))
        assert len(departments) > 0, f"无法获取部门，内容为空\n\n" \
                                     f"args: \n{argv}\n\n" \
                                     f"resp: \n{ret}"
        return departments

    @tenacity.retry(
        wait=tenacity.wait_fixed(10),
        stop=tenacity.stop_after_attempt(5),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 10s 重试，最多 5 次
    def __get_stu_list(self, class_id: str, class_name: str) -> list[str]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug(f"尝试获取班级 {class_id} {class_name}")

        resp = self.__session.get(
            url=f"{self.__sp_host}/member/dormitoryManage/getDeptList",
            params={
                "deptCode": class_id,
                "status": 1,
            },
        )
        assert resp.status_code == 200, f"无法获取班级，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        assert "随行校园-班级" in ret, f"无法获取班级\n\n" \
                                 f"args: \n{argv}\n\n" \
                                 f"resp: \n{ret}"

        students = []
        for student_id, student_name in self.__regex_class.findall(ret):
            students.append(student_id)
        assert len(students) > 0, f"无法获取班级，内容为空\n\n" \
                                  f"args: \n{argv}\n\n" \
                                  f"resp: \n{ret}"
        return students

    @tenacity.retry(
        wait=tenacity.wait_fixed(10),
        stop=tenacity.stop_after_attempt(5),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 10s 重试，最多 5 次
    def __get_stu_info(self, student_id: str) -> tuple[str, str, str, str, str, str, str | None, str | None, str, str | None, str | None, int | None, float]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug(f"尝试获取学生 {student_id}")

        resp = self.__session.get(
            url=f"{self.__sp_host}/member/dormitoryManage/getStudentInfo",
            params={
                "keyword": student_id,
            },
        )
        assert resp.status_code == 200, f"无法获取学生，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        assert "随行校园-人员信息" in ret, f"无法获取学生\n\n" \
                                   f"args: \n{argv}\n\n" \
                                   f"resp: \n{ret}"

        info = {info_name: info_value for info_name, info_value in self.__regex_info.findall(ret)}
        building, _, room = info['房间'].partition(' ') if info['房间'] != '' else (None, '', None)
        return (
            info['学号'],
            info['姓名'],
            info['学院'],
            info['年级'],
            info['班级'],
            info['专业'],
            info['学历'] if info['学历'] != '' else None,
            info['电话'] if info['电话'] != '' else None,
            self.__regex_img.fullmatch(info['照片']).group(1),
            building,
            room,
            int(info['床位']) if info['床位'] != '' else None,
            time.time()
        )
