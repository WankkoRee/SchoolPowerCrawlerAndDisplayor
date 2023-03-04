import logging
import re
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
        self.__cache_rooms: dict[str, dict[str, dict[str, int]]] = {}
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
            for student_id, student_number, student_name, student_faculty, student_grade, student_class, student_major, student_qualification, student_phone, student_picture, student_building, student_room, student_bed in self.__crawler():
                self.__logger.debug(msg=(student_id, student_number, student_name, student_faculty, student_grade, student_class, student_major, student_qualification, student_phone, student_picture, student_building, student_room, student_bed))
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

    def __crawler(self) -> Iterator[tuple[str, str, str, str, str, str, str, str | None, str | None, str, str | None, str | None, int | None]]:
        self.__logger.info("数据爬取")
        sums = 0
        for faculty_id, faculty_name, faculty_dept_number, faculty_stu_number in self.__get_dept_list("00", "学校"):
            if faculty_name == "教职工":
                continue
            for major_id, major_name, major_dept_number, major_stu_number in self.__get_dept_list(faculty_id, faculty_name):
                for grade_id, grade_name, grade_dept_number, grade_stu_number in self.__get_dept_list(major_id, major_name):
                    for class_id, class_name, class_dept_number, class_stu_number in self.__get_dept_list(grade_id, grade_name):
                        for student_id in self.__get_stu_list(class_id, class_name):
                            yield student_id, *self.__get_stu_info(student_id)
                            sums += 1
        self.__logger.info(f"爬取了 {sums} 条数据")

    def __saver(self, data: Iterator[tuple[str, str, str, str, str, str, str, str | None, str | None, str, str | None, str | None, int | None]]):
        self.__logger.info("数据落地")
        if len(self.__cache_rooms) == 0:
            for table_name, area, building, room in self.__tdengine.query(f"select distinct tbname, area, building, room from powers").fetch_all():
                if building not in self.__cache_rooms.keys():
                    self.__cache_rooms[building] = {}
                if room not in self.__cache_rooms[building].keys():
                    self.__cache_rooms[building][room] = {}
                if area not in self.__cache_rooms[building][room].keys():
                    self.__cache_rooms[building][room][area] = 0

        for building in self.__cache_rooms.keys():
            for room in self.__cache_rooms[building].keys():
                for area in self.__cache_rooms[building][room].keys():
                    self.__cache_rooms[building][room][area] = 0

        for student_id, student_number, student_name, student_faculty, student_grade, student_class, student_major, student_qualification, student_phone, student_picture, student_building, student_room, student_bed in data:
            no_room = student_building is None or student_room is None

            if not no_room:
                if student_building not in self.__cache_rooms.keys():
                    for table_name, area, building, room in self.__tdengine.query(f"select distinct tbname, area, building, room from powers where building='{student_building}'").fetch_all():
                        if building not in self.__cache_rooms.keys():
                            self.__cache_rooms[building] = {}
                        if room not in self.__cache_rooms[building].keys():
                            self.__cache_rooms[building][room] = {}
                        if area not in self.__cache_rooms[building][room].keys():
                            self.__cache_rooms[building][room][area] = 0
                if student_building not in self.__cache_rooms.keys():
                    self.__logger.warning(f"所需的 building {student_building} 无法在 TDengine 中找到")
                    no_room = True

                if not no_room:
                    if student_room not in self.__cache_rooms[student_building].keys():
                        for table_name, area, building, room in self.__tdengine.query(f"select distinct tbname, area, building, room from powers where building='{student_building}' and room='{student_room}'").fetch_all():
                            if building not in self.__cache_rooms.keys():
                                self.__cache_rooms[building] = {}
                            if room not in self.__cache_rooms[building].keys():
                                self.__cache_rooms[building][room] = {}
                            if area not in self.__cache_rooms[building][room].keys():
                                self.__cache_rooms[building][room][area] = 0
                    if student_room not in self.__cache_rooms[student_building].keys():
                        self.__logger.warning(f"所需的 room {student_room} 无法在 TDengine 中找到")
                        no_room = True

            if no_room:
                self.__mongodb['student'].update_one(filter={'_id': student_id}, update={
                    '$set': {
                        'info': {
                            'number': student_number,
                            'name': student_name,
                            'faculty': student_faculty,
                            'grade': student_grade,
                            'class': student_class,
                            'major': student_major,
                            'qualification': student_qualification,
                            'phone': student_phone,
                            'picture': student_picture,
                        },
                        'position': {
                            'area': None,
                            'building': None,
                            'room': None,
                            'bed': None,
                        },
                    },
                    '$setOnInsert': {
                        'app': {
                            'password': student_phone[-6:] if student_phone is not None and len(student_phone) >= 6 else "".join(pypinyin.lazy_pinyin(student_name, pypinyin.Style.NORMAL)),
                            'qq': None,
                            'dingtalk': None,
                        }
                    },
                }, upsert=True)
            else:
                student_area = list(self.__cache_rooms[student_building][student_room].keys())[0]
                self.__cache_rooms[student_building][student_room][student_area] += 1
                self.__mongodb['student'].update_one(filter={'_id': student_id}, update={
                    '$set': {
                        'info': {
                            'number': student_number,
                            'name': student_name,
                            'faculty': student_faculty,
                            'grade': student_grade,
                            'class': student_class,
                            'major': student_major,
                            'qualification': student_qualification,
                            'phone': student_phone,
                            'picture': student_picture,
                        },
                        'position': {
                            'area': student_area,
                            'building': student_building,
                            'room': student_room,
                            'bed': student_bed,
                        },
                    },
                    '$setOnInsert': {
                        'app': {
                            'password': student_phone[-6:] if student_phone is not None and len(student_phone) >= 6 else "".join(pypinyin.lazy_pinyin(student_name, pypinyin.Style.NORMAL)),
                            'qq': None,
                            'dingtalk': None,
                        }
                    },
                }, upsert=True)

        for building in self.__cache_rooms.keys():
            for room in self.__cache_rooms[building].keys():
                for area in self.__cache_rooms[building][room].keys():
                    self.__tdengine.execute(f"ALTER TABLE `{area}{building}{room}` SET TAG nums={self.__cache_rooms[building][room][area]}")

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
        return students

    @tenacity.retry(
        wait=tenacity.wait_fixed(10),
        stop=tenacity.stop_after_attempt(5),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 10s 重试，最多 5 次
    def __get_stu_info(self, student_id: str) -> tuple[str, str, str, str, str, str, str | None, str | None, str, str | None, str | None, int | None]:
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
        )
