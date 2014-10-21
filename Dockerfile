FROM ubuntu:14.04
MAINTAINER Juan Morales <juan.morales@upm.es>

RUN apt-get update && apt-get install -y \
    mongodb \ 
    python-pip \
    python-dev \
    libzmq3-dev \ 
    r-base \
    libblas-dev \
    liblapack-dev \
    gfortran \
    libpng12-dev \
    libfreetype6-dev \
    libx11-dev 
    

RUN pip install gevent pymongo pyzmq pandas Werkzeug \
    gevent-websocket circus Logbook xlrd XlsxWriter \
    scipy matplotlib seaborn

RUN rm -rf /var/lib/apt/lists/*

RUN echo 'install.packages(c("rzmq","fitdistrplus","rjson"), repos="http://cran.us.r-project.org");q("no");' | R --vanilla

COPY apicolat/ /app/apicolat/
COPY data/ /app/data/
COPY lib/ /app/lib/
COPY apicolat.ini /app/apicolat.ini

EXPOSE 18000 18001 19000 19001 8888

WORKDIR /app
CMD circusd apicolat.ini

