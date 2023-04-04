FROM node:12.22.12-bullseye-slim
RUN echo "Asia/Shanghai" > /etc/timezone && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN sed -i "s@\(deb\|security\).debian.org@mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list && \
    rm -Rf /var/lib/apt/lists/* && \
    apt-get update && \
    apt-get install -y make build-essential python-all wget
ENV TDENGINE_VERSION=3.0.2.5
RUN wget -c https://www.tdengine.com/assets-download/3.0/TDengine-client-${TDENGINE_VERSION}-Linux-x64.tar.gz && \
    tar xvf TDengine-client-${TDENGINE_VERSION}-Linux-x64.tar.gz && \
    cd TDengine-client-${TDENGINE_VERSION} && \
    ./install_client.sh && \
    cd ../ && \
    rm -rf TDengine-client-${TDENGINE_VERSION}-Linux-x64.tar.gz TDengine-client-${TDENGINE_VERSION}

RUN mkdir /home/school_power_api/
WORKDIR /home/school_power_api/

RUN npm config set registry https://registry.npmmirror.com && \
    yarn config set registry https://registry.npmmirror.com
CMD yarn && yarn run start
