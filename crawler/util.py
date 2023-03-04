import base64
import os
import random
import urllib.parse

from Crypto.Cipher import AES


def aes_random_generate(length: int) -> str:
    base = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"
    return "".join(random.choices(base, k=length))


def pkcs7padding(text: str) -> str:
    bs = 16
    length = len(text)
    bytes_length = len(text.encode('utf-8'))
    padding_size = length if (bytes_length == length) else bytes_length
    padding = bs - padding_size % bs
    padding_text = chr(padding) * padding
    return text + padding_text


def vpn_host_parse(host: str) -> tuple[str, str]:
    host_p = urllib.parse.urlparse(host)
    protocol = host_p.scheme
    if host_p.port:
        protocol += f"-{host_p.port}"
    return protocol, host_p.hostname


def vpn_host_encode(host: str, key: bytes, iv: bytes) -> str:
    protocol, hostname = vpn_host_parse(host)
    cipher = AES.new(key=key, iv=iv, mode=AES.MODE_CFB, segment_size=128)

    encrypted = cipher.encrypt(hostname.encode()).hex()

    return f"{protocol}/{iv.hex()}{encrypted}"


def password_encode(password: str, salt: str) -> str:
    cipher = AES.new(
        key=salt.encode(),
        iv=aes_random_generate(16).encode(),
        mode=AES.MODE_CBC,
    )
    return base64.b64encode(cipher.encrypt(pkcs7padding(aes_random_generate(64)+password).encode())).decode()


def prepare() -> tuple[str, int, str, bytes, bytes, str, str, str, str, int, str, str, str, str, int, str, str, str, bool]:
    """一次性读取所有需要的环境变量"""
    return (
        os.getenv('SP_HOST'),
        int(os.getenv('SP_SCHOOL_ID')),

        os.getenv('SP_VPN_HOST'),
        bytes.fromhex(os.getenv('SP_VPN_KEY')),
        bytes.fromhex(os.getenv('SP_VPN_IV')),

        os.getenv('SP_SSO_HOST'),
        os.getenv('SP_SSO_USERNAME'),
        os.getenv('SP_SSO_PASSWORD'),

        os.getenv('SP_DB_HOST'),
        int(os.getenv('SP_DB_PORT')),
        os.getenv('SP_DB_USER'),
        os.getenv('SP_DB_PASS'),
        os.getenv('SP_DB_NAME'),

        os.getenv('SP_MONGO_HOST'),
        int(os.getenv('SP_MONGO_PORT')),
        os.getenv('SP_MONGO_USER'),
        os.getenv('SP_MONGO_PASS'),
        os.getenv('SP_MONGO_NAME'),

        os.getenv('SP_DEBUG') == "1",
    )
