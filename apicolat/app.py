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

class App(object):
    def __init__(self):
        self.kernel = Kernel()
        ws_server = WSServer(port=8080)
        zmq_server = ZMQServer(port=8085)
        self.kernel.add_server(ws_server)   
        self.kernel.add_server(zmq_server)   

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
        

    def run(self):
        print 'Running apicolat'
        self.kernel.run_forever()

def main():
    App().run()

if __name__ == '__main__':
    main()
