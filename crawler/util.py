from Crypto.Cipher import AES
import base64

reTryJob = None

class AES_ECB_PKCS7:
    def __init__(self, key):
        self.key = key  # 初始化密钥
        self.length = AES.block_size  # 初始化数据块大小
        self.aes = AES.new(self.key, AES.MODE_ECB)  # 初始化AES,ECB模式的实例
        # 截断函数，去除填充的字符
        self.unpad = lambda date: date[0:-ord(date[-1])]

    def pad(self, text):
        """
        #填充函数，使被加密数据的字节码长度是block_size的整数倍
        """
        count = len(text.encode('utf-8'))
        add = self.length - (count % self.length)
        entext = text + (chr(add) * add)
        return entext

    def encrypt(self, encrData: str, encoding: str = "base64") -> str:  # 加密函数
        res = self.aes.encrypt(self.pad(encrData).encode("utf8"))
        if encoding == "base64":
            msg = base64.b64encode(res).decode("utf8")
        elif encoding == "hex":
            msg = res.hex()
        else:
            msg = base64.b64encode(res).decode("utf8")
        return msg

    def decrypt(self, decrData: str, encoding: str = "base64") -> str:  # 解密函数
        if encoding == "base64":
            res = base64.b64decode(decrData)
        elif encoding == "hex":
            res = bytes.fromhex(decrData)
        else:
            res = base64.b64decode(decrData)
        msg = self.aes.decrypt(res).decode("utf8")
        return self.unpad(msg)
