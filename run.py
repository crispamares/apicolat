# -*- coding: utf-8 -*-

import os
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
    "args":  "--zmqport {0} --wsport {1}".format(zmq_port, ws_port), 
    "options": {
        "numprocesses": 1,
        "working_dir": ROOT
        }
    }

web = {
    "cmd":  "python -m SimpleHTTPServer {0}".format(web_port),
    "name": "web",
    "options": {
        "numprocesses": 1,
        "working_dir": WEBDIR
        }
    }



def add_watcher(properties):
    properties['start'] = True
    return {'command': 'add', 'properties': properties}

cc = CircusClient()
cc.call(add_watcher(apicolat))
cc.call(add_watcher(web))

print ("DONE")

#arbiter = get_arbiter([apicolat, web])
#try:
#    print ("to start", arbiter)
#    arbiter.start()
#    print ("started")
#except e:
#    print (e)
#finally:
#    arbiter.stop()
