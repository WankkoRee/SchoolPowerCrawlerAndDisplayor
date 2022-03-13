# School Power Crawler & Displayor [校园电费爬]

一个学校电费的爬虫项目，用于爬取并展示本学校各个宿舍各个时间的电费情况，了解用电规律。

demo: [校园电费爬 - 南阳师范学院](https://school.power.daixia.hu/)

## 运行

### Docker 容器化启动

1. 为本项目点亮`star`并`clone`本项目到服务器
   ```shell
   git clone https://github.com/WankkoRee/SchoolPowerCrawlerAndDisplayor.git
   ```
2. 修改`docker-compose`配置文件`docker-compose.yml`
   ```yaml
   # 本处只列出十分建议更改的选项，其他选项请根据自身需求更改
   services:
     school_power_crawler:
       environment:
         SP_HOST: "https://dk.nynu.edu.cn" # 随行校园地址，按需更改
         SP_SCHOOL_ID: 4 # 随行校园中的学校id，按需更改
         SP_AES_KEY: "31323334353637383930414243444546" # 随行校园api的aes加密用的key的hex化字符串，按需更改
         SP_USERNAME: "" # 随行校园账号
         SP_PASSWORD: "" # 随行校园密码
   ```
3. 使用`docker-compose`启动本项目
   ```shell
   docker-compose up -d
   ```
4. 进入`school_power_mirai`配置QQ机器人并重启
   ```shell
   docker exec -it school_power_mirai ./client
   login 账号 密码 ANDROID_PHONE
   # 跟随指引直到出现 `昵称 (账号) Login successful` 字样
   autoLogin add 账号 密码
   autoLogin setConfig 账号 protocol ANDROID_PHONE
   ^C
   docker restart school_power_mirai
   ```
5. 修改前端`web`配置文件`.env`
   ```text
   SP_VUE_APP_TITLE=校园电费爬 - 南阳师范学院
   ```
6. 编译前端`web`为静态网页
   ```shell
   cd web
   sudo npm install -g yarn
   yarn
   yarn run build
   ```
7. 在`Nginx`中配置网站目录为`web/dist`
8. 查看`school_power_api`的容器`ip`
   ```shell
   docker exec -it school_power_api bash
   hostname -I
   > 172.17.0.3
   ```
9. 在`Nginx`中配置网站反向代理，将`/api`指向`http://school_power_api的ip:3000/api`
   ```text
   #PROXY-START/api
   
   location ^~ /api
   {
       proxy_pass http://172.17.0.3:3000/api;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header REMOTE-HOST $remote_addr;
   }
   
   #PROXY-END/api
   ```
10. 访问网站检查是否正常

## 用到的技术

- 爬虫
  - 纯`requests`**爬虫**
  - `MariaDB`**数据落地**
  - `schedule`**定时任务**和错误处理任务
- 前端
  - `Vue 3`**单页面**实现
  - `Naive UI`作为**界面库**
  - `ECharts`作为**图表库**
- 后端
  - `Fastify`作为**api快速构建**工具
  - `knex`作为**数据库查询**语句自动生成工具
- 机器人
  - `Mirai`提供**机器人核心**
  - `mirai-api-http`作为`websocket`中间层连接**机器人核心**与**机器人功能实现**
  - `Python`作为**机器人功能实现**与`websocket`中间层交互
  - 自研项目`WatchDoger`作为**可交互`bash`**传递工具

## 项目性质

本项目为`Python`爬虫、`Vue`前端、`Fastify`后端、`Mirai`机器人的综合性练手项目，可在不违反法律和开源许可证的前提下进行任意的二次开发。
