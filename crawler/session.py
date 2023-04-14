import enum
import logging
import re
import threading
import time
import urllib.parse
from http import cookiejar

import ddddocr
import requests
import tenacity
from requests.cookies import create_cookie

from util import prepare, vpn_host_encode, password_encode, vpn_host_parse


class CookieJar(cookiejar.MozillaCookieJar):
    def __init__(self, filename: str, logger: logging.Logger):
        super().__init__(filename=filename)
        self.__logger = logger

    def save(self, filename: str | None = None, ignore_discard: bool = True, ignore_expires: bool = True):
        self.__logger.debug("存储 Cookies")
        return super().save(filename, ignore_discard, ignore_expires)

    def load(self, filename: str | None = None, ignore_discard: bool = True, ignore_expires: bool = True):
        self.__logger.debug("加载 Cookies")
        return super().load(filename, ignore_discard, ignore_expires)


class LoginType(enum.Enum):
    VPN = 1
    SSO = 2


class Session(requests.Session):
    def __init__(self):
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
        self.__logger = logging.getLogger("会话")

        self.__logger.debug("初始化")

        self.__lock = threading.RLock()
        self.__lock_login = threading.RLock()
        self.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.39'})
        self.cookies: CookieJar = CookieJar(filename="data/cookies.mzl", logger=self.__logger)
        try:
            self.cookies.load()
        except:
            self.__logger.warning("本地无 Cookies，初始化本地 Cookies")
            self.cookies.save()

    def __del__(self):
        self.cookies.save()

        self.__logger.debug("销毁")

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def get(self, check_login_state=True, *args, **kwargs):
        with self.__lock:
            ret = super().get(*args, **kwargs)
            if check_login_state and ("请在微信客户端打开链接" in ret.text or "pwdEncryptSalt" in ret.text):
                self.__logger.warning("登录状态失效，尝试重新登录并重试")
                self.login()
                raise Exception("重新登录后需要重试")
            return ret

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def post(self, check_login_state=True, *args, **kwargs):
        with self.__lock:
            ret = super().post(*args, **kwargs)
            if check_login_state and ("请在微信客户端打开链接" in ret.text or "pwdEncryptSalt" in ret.text):
                self.__logger.warning("登录状态失效，尝试重新登录并重试")
                self.login()
                raise Exception("重新登录后需要重试")
            return ret

    def login(self):
        """自适应登录"""
        with self.__lock_login:
            if not self.__check_sp_login_state():
                if not self.__check_sso_login_state_by_vpn():
                    salt, execution = self.__get_sso_login_page_by_vpn()
                    captcha = self.__get_sso_captcha_by_vpn() if self.__get_sso_captcha_state_by_vpn() else ""
                    self.__login_sso_by_vpn(salt, execution, captcha)
                    self.cookies.save()
                login_type = self.__login_sp_by_sso_by_vpn()
                if login_type is LoginType.VPN:
                    self.__logger.debug("通过 VPN 访问的方式，手动获取 SP 的 Cookies")
                    self.__set_cookies_by_vpn(self.__sp_host, "/member/power")
                elif login_type is LoginType.SSO:
                    self.__logger.debug("通过 SSO 访问的方式，自动获取 SP 的 Cookies")
                    self.__set_cookies_by_vpn(self.__sp_sso_host, "/authserver/login")
                    self.__login_sp_by_sso()
                self.cookies.save()

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __get_sso_login_page_by_vpn(self) -> tuple[str, str]:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("通过 VPN 登录 SSO，解析登录页面")

        resp = self.get(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/login",
            params={
                "service": f"{self.__sp_vpn_host}/login?cas_login=true",
            },
        )
        assert resp.status_code == 200, f"无法找到登录页，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        salt = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="pwdEncryptSalt" value="([A-Za-z0-9]+)" />', ret).group(1)
        execution = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="execution" name="execution" value="([A-Za-z0-9-_/+=]+)" />', ret).group(1)
        return salt, execution

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __get_sso_captcha_state_by_vpn(self) -> bool:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("通过 VPN 登录 SSO，判断是否需要验证码")

        resp = self.get(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/checkNeedCaptcha.htl",
            params={
                "username": self.__sp_sso_username,
                "_": int(time.time()*1000),
            },
        )
        assert resp.status_code == 200, f"无法得知是否需要验证码，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.json()
        return ret["isNeed"] == True

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __get_sso_captcha_by_vpn(self) -> str:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("通过 VPN 登录 SSO，识别验证码")

        resp = self.get(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/getCaptcha.htl",
            params=str(int(time.time() * 1000)),
        )
        assert resp.status_code == 200, f"无法获取验证码，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ocr = ddddocr.DdddOcr(show_ad=False)
        ret = resp.content
        return ocr.classification(ret)

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __login_sso_by_vpn(self, salt: str, execution: str, captcha: str):
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("通过 VPN 登录 SSO，发起登录")

        resp = self.post(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/login",
            params={
                "service": f"{self.__sp_vpn_host}/login?cas_login=true",
            },
            data={
                "username": self.__sp_sso_username,
                "password": password_encode(self.__sp_sso_password, salt),
                "captcha": captcha,
                "_eventId": "submit",
                "cllt": "userNameLogin",
                "dllt": "generalLogin",
                "lt": "",
                "execution": execution,
            },
        )
        assert resp.status_code == 200, f"无法登录 SSO，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __check_sso_login_state_by_vpn(self) -> bool:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("检查 SSO/VPN 登录状态")

        resp = self.post(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/personalInfo/common/getUserConf",
        )
        assert resp.status_code == 200, f"无法获取登录状态，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        return self.__sp_sso_username in ret

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __login_sp_by_sso_by_vpn(self) -> LoginType:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("通过 VPN-SSO 登录 SP")

        resp = self.get(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/login",
            params={
                "service": f"{self.__sp_host}/outIndex/power",
            },
        )
        assert resp.status_code == 200, f"无法通过 VPN-SSO 登录 SP，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        if "电费充值" in ret:
            return LoginType.VPN
        elif "访问出错" in ret:
            return LoginType.SSO
        else:
            assert False, f"未知情况\n\n" \
                          f"args: \n{argv}\n\n" \
                          f"resp: \n{ret}"

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __login_sp_by_sso(self):
        """访问外网随行校园，将跳转 SSO 获取登录状态并跳转回随行校园，此时随行校园 Cookies 已自动应用"""
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("通过 SSO 登录 SP")

        resp = self.get(
            check_login_state=False,
            url=f"{self.__sp_host}/outIndex/power",
        )
        assert resp.status_code == 200, f"无法通过 SSO 登录 SP，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        assert "电费充值" in ret, f"无法通过 SSO 登录 SP\n\n" \
                              f"args: \n{argv}\n\n" \
                              f"resp: \n{ret}"

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __check_sp_login_state(self) -> bool:
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("检查 SP 登录状态")

        resp = self.get(
            check_login_state=False,
            url=f"{self.__sp_host}/member/power/selectArea",
        )
        assert resp.status_code == 200, f"无法获取登录状态，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        return "areaName" in ret

    @tenacity.retry(
        wait=tenacity.wait_fixed(5),
        stop=tenacity.stop_after_attempt(3),
        before_sleep=tenacity.before_sleep_log(logging.getLogger("重试"), logging.WARNING),
        reraise=True,
    )  # 每 5s 重试，最多 3 次
    def __set_cookies_by_vpn(self, host: str, path: str):
        argv = locals().copy()
        argv.pop('self')
        self.__logger.debug("获取 Cookies")

        resp = self.post(
            check_login_state=False,
            url=f"{self.__sp_vpn_host}/wengine-vpn/cookie",
            params={
                "method": "get",
                "host": vpn_host_parse(host)[1],
                "scheme": vpn_host_parse(host)[0],
                "path": path,
                "vpn_timestamp": int(time.time() * 1000),
            },
        )
        assert resp.status_code == 200, f"获取 Cookies 失败，HTTP {resp.status_code}\n\n" \
                                        f"args: \n{argv}\n\n" \
                                        f"resp: \n{resp.content}"

        ret = resp.text
        assert len(ret) > 0, f"获取 Cookies 失败\n\n" \
                             f"args: \n{argv}\n\n" \
                             f"resp: \n{ret}"

        self.__logger.debug("解析 Cookies 并应用")
        for cookie_str in ret.split('; '):
            cookie = re.search(r'(.+?)=(.*)', cookie_str).groups()
            self.cookies.set_cookie(create_cookie(cookie[0], cookie[1], domain=urllib.parse.urlparse(host).hostname))
