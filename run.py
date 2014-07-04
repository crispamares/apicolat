# -*- coding: utf-8 -*-
from __future__ import print_function

import os, sys
from circus import get_arbiter
from circus.client import CircusClient

from apicolat.utils import get_random_port

ROOT = os.path.dirname(os.path.realpath(__file__))
APICOLATDIR = os.path.join(ROOT, 'apicolat')
WEBDIR = os.path.join(ROOT, 'apicolat', 'web')
STATSDIR = os.path.join(ROOT, 'lib', 'indyva-r')

web_port = get_random_port((10000, 20000), 100)#8001
zmq_port = get_random_port((10000, 20000), 100)
starts_port = get_random_port((10000, 20000), 100)

apicolat = {
    "cmd":  "python "+APICOLATDIR,
    "name": "apicolat-{0}".format(web_port),
    "args":  "--zmq_server --zmq_port {0} --ws_server --ws_port {1} --web_dir {2}".format(zmq_port, web_port, WEBDIR), 
    "options": {
        "numprocesses": 1,
        "working_dir": ROOT,
        "copy_env": True
        }
    }

statistics = {
    "cmd":  "R ",
    "name": "apicolat-statistics-{0}".format(web_port),
    "args":  "-f statistics.r --args {0} {1}".format(starts_port, zmq_port),
    "options": {
        "numprocesses": 1,
        "working_dir": STATSDIR
        }
    }

print('Starting in '+ STATSDIR, statistics['cmd'] + statistics['args'])

def add_watcher(properties):
    properties['start'] = True
    return {'command': 'add', 'properties': properties}

cc = CircusClient()
out = cc.call(add_watcher(apicolat))
out_stats = cc.call(add_watcher(statistics))

print(out)

error_output = ''
if out['status'] == 'error':
    error_output += out['reason']
if out_stats['status'] == 'error':
    error_output += out_stats['reason']

if error_output:
    print(error_output, file=sys.stderr)

print ("_*_ redirect: http://localhost:{0}".format(web_port))

#arbiter = get_arbiter([apicolat, web])
#try:
#    print ("to start", arbiter)
#    arbiter.start()
#    print ("started")
#except e:
#    print (e)
#finally:
#    arbiter.stop()
