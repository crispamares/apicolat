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



class CD(object):
    ''' ConfigDefaults '''
    ZMQSERVER = False
    ZMQPORT = 18000
    WSSERVER = False
    WSPORT = 18081
    WEBSERVER = False
    WEBPORT = 18080

    PORTMAXTRIES = 100    

    USERANDOMPORTS = False
    LOWERPORT = 10000
    UPPERPORT = 20000
    

class MetaApp(object):
    def __init__(self):
        self.kernel = Kernel()

    def config_services(self, config):
        '''
        This method creates and adds to the kernel que services
        indicated in the configuration.

        Also configures the ports that those servers are going to
        use.

        :param config: Is a dict with the kernel configuration
        '''
        if config.get('zmq_server', CD.ZMQSERVER) == True:       
            zmq_port = self._guess_port('zmq_port', config, CD.ZMQPORT)

            zmq_server = ZMQServer(port=zmq_port)
            self.kernel.add_server(zmq_server)

            print "* ZMQ Server listening on port: {0}".format(zmq_port)

        if config.get('ws_server', CD.WSSERVER) == True:
            ws_port = self._guess_port('ws_port', config,  CD.WSPORT)

            ws_server = WSServer(port=ws_port)
            self.kernel.add_server(ws_server)      

            print "* WebSocket Server listening on port: {0}".format(ws_port)

    def _guess_port(self, port_name, config, default=None):
        if port_name in config:
            port = config[port_name]
        elif config.get('use_random_port') == True:
            port_range = (config.get('lower_port', CD.LOWERPORT),
                          config.get('upper_port', CD.UPPERPORT))
            max_tries = config.get('port_max_tries', CD.PORTMAXTRIES)
            port = get_random_port(port_range=port_range, max_tries=max_tries)
        elif default is not None:
            port = default
        else:
            raise Exception("Is impossible to get a free port for '{0}'".format(port_name))

        return port

    def run(self):
        self.kernel.run_forever()
    

class App(MetaApp):
    def __init__(self, zmq_port=8085, ws_port=8080):
        MetaApp.__init__(self)

        config = {'zmq_server': True,# 'zmq_port': zmq_port, 
                  'ws_server': True}#, 'ws_port': ws_port}
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

    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--zmqport", type=int, default=8085,
                        help="The port number of the ZMQ server (8085)")
    parser.add_argument("--wsport", type=int, default=8080,
                        help="The port number of the WebSocket server (8080)")

    args = parser.parse_args()
    App(args.zmqport, args.wsport).run()

if __name__ == '__main__':
    main()
