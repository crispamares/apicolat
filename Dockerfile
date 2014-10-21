FROM ubuntu:14.04
MAINTAINER Juan Morales <juan.morales@upm.es>

RUN apt-get update && apt-get install -y \
    mongodb \ 
    python-pip \
    python-dev \
    libzmq3-dev \ 
    r-base \
    python-pandas \
    python-scipy \
    python-matplotlib
    

RUN pip install gevent pymongo pyzmq Werkzeug \
    gevent-websocket circus Logbook xlrd XlsxWriter \
    seaborn

RUN rm -rf /var/lib/apt/lists/*

RUN echo 'install.packages(c("rzmq","fitdistrplus","rjson"), repos="http://cran.us.r-project.org");q("no");' | R --vanilla

COPY apicolat/ /app/apicolat/
COPY data/ /app/data/
COPY lib/ /app/lib/
COPY apicolat.ini /app/apicolat.ini

EXPOSE 18000 18001 19000 19001 8888

WORKDIR /app
CMD circusd apicolat.ini

