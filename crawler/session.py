import enum
import logging
import re
import threading
import time
import urllib.parse
from http import cookiejar

import ddddocr
import requests
from requests.cookies import create_cookie

from util import prepare, vpn_host_encode, password_encode, vpn_host_parse


class CookieJar(cookiejar.MozillaCookieJar):
    def __init__(self, filename: str, logger: logging.Logger):
        super().__init__(filename=filename)
        self.__logger = logger

    def save(self, filename: str | None = None, ignore_discard: bool = True, ignore_expires: bool = True):
        self.__logger.info("存储 Cookies")
        return super().save(filename, ignore_discard, ignore_expires)

    def load(self, filename: str | None = None, ignore_discard: bool = True, ignore_expires: bool = True):
        self.__logger.info("加载 Cookies")
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
            self.__sp_debug
        ) = self.__sp_env = prepare()
        self.__logger = logging.getLogger("会话")

        self.__logger.info("初始化")

        self.__lock = threading.Lock()
        self.cookies: CookieJar = CookieJar(filename="cookies.mzl", logger=self.__logger)
        try:
            self.cookies.load()
        except:
            self.__logger.info("本地无 Cookies，初始化本地 Cookies")
            self.cookies.save()

    def __del__(self):
        self.cookies.save()

        self.__logger.info("销毁")

    def get(self, *args, **kwargs):
        with self.__lock:
            return super().get(*args, **kwargs)

    def post(self, *args, **kwargs):
        with self.__lock:
            return super().post(*args, **kwargs)

    def login(self):
        """自适应登录"""
        if not self.__check_sp_login_state():
            if not self.__check_sso_login_state_by_vpn():
                salt, execution = self.__get_sso_login_page_by_vpn()
                captcha = self.__get_sso_captcha_by_vpn() if self.__get_sso_captcha_state_by_vpn() else ""
                self.__login_sso_by_vpn(salt, execution, captcha)
                self.cookies.save()
            login_type = self.__login_sp_by_sso_by_vpn()
            if login_type is LoginType.VPN:
                self.__logger.info("通过 VPN 访问的方式，手动获取 SP 的 Cookies")
                self.__set_cookies_by_vpn(self.__sp_host, "/member/power")
            elif login_type is LoginType.SSO:
                self.__logger.info("通过 SSO 访问的方式，自动获取 SP 的 Cookies")
                self.__set_cookies_by_vpn(self.__sp_sso_host, "/authserver/login")
                self.__login_sp_by_sso()
            self.cookies.save()

    def __get_sso_login_page_by_vpn(self) -> tuple[str, str]:
        self.__logger.info("通过 VPN 登录 SSO，解析登录页面")
        resp = self.get(
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/login",
            params={
                "service": f"{self.__sp_vpn_host}/login?cas_login=true",
            },
        )
        assert resp.status_code == 200, f"无法找到登录页，HTTP {resp.status_code}"
        ret = resp.text
        salt = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="pwdEncryptSalt" value="([A-Za-z0-9]+)" />', ret).group(1)
        execution = re.search(r'<div id="pwdLoginDiv" style="display: none">[\s\S]*?<input type="hidden" id="execution" name="execution" value="([A-Za-z0-9-_/+=]+)" />', ret).group(1)
        return salt, execution

    def __get_sso_captcha_state_by_vpn(self) -> bool:
        self.__logger.info("通过 VPN 登录 SSO，判断是否需要验证码")
        resp = self.get(
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/checkNeedCaptcha.htl",
            params={
                "username": self.__sp_sso_username,
                "_": int(time.time()*1000),
            },
        )
        assert resp.status_code == 200, f"无法得知是否需要验证码，HTTP {resp.status_code}"
        ret = resp.json()
        return ret["isNeed"] == True

    def __get_sso_captcha_by_vpn(self) -> str:
        self.__logger.info("通过 VPN 登录 SSO，识别验证码")
        resp = self.get(
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/getCaptcha.htl",
            params=str(int(time.time() * 1000)),
        )
        assert resp.status_code == 200, f"无法获取验证码，HTTP {resp.status_code}"
        ocr = ddddocr.DdddOcr(show_ad=False)
        ret = resp.content
        return ocr.classification(ret)

    def __login_sso_by_vpn(self, salt: str, execution: str, captcha: str):
        self.__logger.info("通过 VPN 登录 SSO，发起登录")
        resp = self.post(
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
        assert resp.status_code == 200, "无法登录 SSO，" + re.search(r'<span id="showErrorTip" class="form-error"><span>(.+)</span></span>', resp.text).group(1)

    def __check_sso_login_state_by_vpn(self) -> bool:
        self.__logger.info("检查 SSO/VPN 登录状态")
        resp = self.get(
            url=f"{self.__sp_vpn_host}/user/info",
        )
        assert resp.status_code == 200, f"无法获取登录状态，HTTP {resp.status_code}"
        ret = resp.text
        return ret.find(self.__sp_sso_username) != -1

    def __login_sp_by_sso_by_vpn(self) -> LoginType:
        self.__logger.info("通过 VPN-SSO 登录 SP")
        resp = self.get(
            url=f"{self.__sp_vpn_host}/{vpn_host_encode(self.__sp_sso_host, self.__sp_vpn_key, self.__sp_vpn_iv)}/authserver/login",
            params={
                "service": f"{self.__sp_host}/outIndex/power",
            },
        )
        assert resp.status_code == 200, "无法通过 VPN-SSO 登录 SP"
        ret = resp.text
        if "电费充值" in ret:
            return LoginType.VPN
        elif "访问出错" in ret:
            return LoginType.SSO
        else:
            assert False, f"未知情况\n{ret}"

    def __login_sp_by_sso(self):
        """访问外网随行校园，将跳转 SSO 获取登录状态并跳转回随行校园，此时随行校园 Cookies 已自动应用"""
        self.__logger.info("通过 SSO 登录 SP")
        resp = self.get(
            url=f"{self.__sp_host}/outIndex/power",
        )
        assert resp.status_code == 200 and "电费充值" in resp.text, "无法通过 SSO 登录 SP"

    def __check_sp_login_state(self) -> bool:
        self.__logger.info("检查 SP 登录状态")
        resp = self.get(
            url=f"{self.__sp_host}/member/power/selectArea",
        )
        assert resp.status_code == 200, f"无法获取登录状态，HTTP {resp.status_code}"
        ret = resp.text
        return ret.find("areaName") != -1

    def __set_cookies_by_vpn(self, host: str, path: str):
        self.__logger.info("获取 Cookies")
        resp = self.post(
            url=f"{self.__sp_vpn_host}/wengine-vpn/cookie",
            params={
                "method": "get",
                "host": vpn_host_parse(host)[1],
                "scheme": vpn_host_parse(host)[0],
                "path": path,
                "vpn_timestamp": int(time.time() * 1000),
            },
        )
        assert resp.status_code == 200 and len(resp.text) > 0, "获取 Cookies 失败"
        ret = resp.text
        self.__logger.info("解析 Cookies 并应用")
        for cookie_str in ret.split('; '):
            cookie = re.search(r'(.+?)=(.*)', cookie_str).groups()
            self.cookies.set_cookie(create_cookie(cookie[0], cookie[1], domain=urllib.parse.urlparse(host).hostname))
