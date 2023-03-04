FROM python:3.10.10-slim-bullseye
RUN echo "Asia/Shanghai" > /etc/timezone && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN sed -i "s@\(deb\|security\).debian.org@mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list && \
    rm -Rf /var/lib/apt/lists/* && \
    apt-get update && \
    apt-get install -y wget
ENV TDENGINE_VERSION=3.0.2.5
RUN wget -c https://www.tdengine.com/assets-download/3.0/TDengine-client-${TDENGINE_VERSION}-Linux-x64.tar.gz && \
    tar xvf TDengine-client-${TDENGINE_VERSION}-Linux-x64.tar.gz && \
    cd TDengine-client-${TDENGINE_VERSION} && \
    ./install_client.sh && \
    cd ../ && \
    rm -rf TDengine-client-${TDENGINE_VERSION}-Linux-x64.tar.gz TDengine-client-${TDENGINE_VERSION}

COPY ./ /home/school_power_crawler/
WORKDIR /home/school_power_crawler/

RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
    pip install --no-cache-dir -r requirements.txt
CMD python -u main.py
