# -*- coding: utf-8 -*-
'''
Created on 11/12/2013

@author: jmorales
'''

import indyva
from indyva.dataset.table import Table 
from indyva.kernel import Kernel
from indyva.facade.server import WSServer, ZMQServer
from data_adquisition import init_synapses_table
from indyva.facade.front import Front
from indyva.dynamics.dselect import DynSelect
from indyva.dynamics.dfilter import DynFilter
import xlsx_exporter 

from configuration import parseArgsAndConfig
import random
import socket

class MetaApp(object):
    def __init__(self):
        self.kernel = Kernel()

    def config_services(self, config):
        '''
        This method creates and adds to the kernel que services
        indicated in the configuration.

        Also configures the ports that those servers are going to
        use.

        :param config: Is an Namespace (object) with the kernel configuration
        '''
        if config.zmq_server:
            zmq_port = self._guess_port(config, config.zmq_port)
            zmq_server = ZMQServer(port=zmq_port)
            self.kernel.add_server(zmq_server)

            print "* ZMQ Server listening on port: {0}".format(zmq_port)

        if config.ws_server:
            ws_port = self._guess_port(config, config.ws_port)
            ws_server = WSServer(port=ws_port)
            self.kernel.add_server(ws_server)      

            print "* WebSocket Server listening on port: {0}".format(ws_port)

    def _guess_port(self, config, default=None):
        if config.use_random_port:
            port_range = (config.min_port, config.max_port)
            max_tries = config.port_max_tries
            port = self._get_random_port(port_range=port_range, max_tries=max_tries)
        elif default is not None:
            port = default
        else:
            raise Exception("Is impossible to get a free port for '{0}'".format(port_name))

        return port

    def _get_random_port(self, port_range, max_tries):
        '''
        Return a free port in a range

        :param port_range: (int,int) The min and max port numbers
        :param max_tries: The maximum number of bind attempts to make
        :return port: int, the port ready to use
        '''
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        for i in range(max_tries):
            try:
                port = random.randrange(port_range[0], port_range[1])
                s.bind(('127.0.0.1',port))
            except socket.error as e:
                if not e.errno == socket.errno.EADDRINUSE:
                    raise
            else:
                s.close()
                return port
        raise Exception("Could not find a free random port.")
    

    def run(self):
        self.kernel.run_forever()
    

class App(MetaApp):
    def __init__(self):
        MetaApp.__init__(self)

        config = parseArgsAndConfig()
        self.config_services(config)

        self.synapses_table = init_synapses_table()
        self.definition_dselect = DynSelect('definition_dselect', self.synapses_table, setop='AND')
        self.definition_dfilter = DynFilter('definition_dfilter', self.synapses_table)
        Front.instance().get_method('TableSrv.expose_table')(self.synapses_table)
        Front.instance().get_method('DynSelectSrv.expose_dselect')(self.definition_dselect)
        Front.instance().get_method('DynFilterSrv.expose_dfilter')(self.definition_dfilter)
                
        xlsx_exporter.expose_methods()
        Front.instance().add_method(self.restart)

    def restart(self):
        '''
        This method cleans dynamics and conditions
        '''
        self.definition_dfilter.clear()
        self.definition_dselect.clear()
        Front.instance().get_method('DynSelectSrv.clear')()
        Front.instance().get_method('DynFilterSrv.clear')()
        Front.instance().get_method('DynSelectSrv.expose_dselect')(self.definition_dselect)
        Front.instance().get_method('DynFilterSrv.expose_dfilter')(self.definition_dfilter)
        

def main():
    App().run()

if __name__ == '__main__':
    main()
