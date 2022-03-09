from util import AES_ECB_PKCS7

host = "https://dk.nynu.edu.cn"  # 按需更改
schoolId = 4  # 按需更改
aesEcbPkcs7 = AES_ECB_PKCS7(bytes.fromhex("31323334353637383930414243444546"))  # 按需更改

username = ""  # 肯定要改
password = ""  # 肯定要改

db_host = 'school_power_db'  # 按需更改
db_username = 'root'  # 按需更改
db_password = "123456"  # 按需更改
db_name = 'school_power'  # 按需更改
