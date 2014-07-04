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
from utils import get_random_port

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
            ws_server = WSServer(port=ws_port, web_dir=config.web_dir)
            self.kernel.add_server(ws_server)      

            print "* WebSocket Server listening on port: {0}".format(ws_port)
            print "* Serving web from: {0}".format(config.web_dir)

    def _guess_port(self, config, default=None):
        if config.use_random_port:
            port_range = (config.min_port, config.max_port)
            max_tries = config.port_max_tries
            port = get_random_port(port_range=port_range, max_tries=max_tries)
        elif default is not None:
            port = default
        else:
            raise Exception("Is impossible to get a free port")

        return port    

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
