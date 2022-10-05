import datetime
import random
import urllib.parse

reTryJob = None


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
