import base64
import datetime
import random
import urllib.parse

from Crypto.Cipher import AES


retry_task = None
last_powers = {}


def log(*values: object):
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), *values)


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
