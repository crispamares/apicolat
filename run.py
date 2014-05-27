# -*- coding: utf-8 -*-
from __future__ import print_function

import os, sys
from circus import get_arbiter
from circus.client import CircusClient

ROOT = os.path.dirname(os.path.realpath(__file__))
APICOLATDIR = os.path.join(ROOT, 'apicolat')
WEBDIR = os.path.join(ROOT, 'apicolat', 'web')

#
#  1.- Identify unused ports to be used by our commands
#  
#  2.- Spawn the processes
#       If circusd is present:
#           With ZMQ add new processes
#       else:
#           spawn the processes with subprocess module
#

zmq_port = 8085 
ws_port = 8080
web_port = 8001

apicolat = {
    "cmd":  "python "+APICOLATDIR,
    "name": "apicolat",
    "args":  "--zmq_server --zmq_port {0} --ws_server --ws_port {1}".format(zmq_port, ws_port), 
    "options": {
        "numprocesses": 1,
        "working_dir": ROOT,
        "copy_env": True
        }
    }

web = {
    "cmd":  "python -m SimpleHTTPServer {0}".format(web_port),
    "name": "web",
    "options": {
        "numprocesses": 1,
        "working_dir": WEBDIR,
        "copy_env": True
        }
    }



def add_watcher(properties):
    properties['start'] = True
    return {'command': 'add', 'properties': properties}

cc = CircusClient()
o1 = cc.call(add_watcher(apicolat))
o2 = cc.call(add_watcher(web))

error_output = ''
if o1['status'] == 'error':
    error_output += o1['reason']
if o2['status'] == 'error':
    error_output += o2['reason']

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
