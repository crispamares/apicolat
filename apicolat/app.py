# -*- coding: utf-8 -*-
'''
Created on 11/12/2013

@author: jmorales
'''

import indyva
from indyva.dataset.table import Table 
from indyva.kernel import Kernel
from indyva.facade.server import WSServer 
from data_adquisition import init_synapses_table
from indyva.facade.front import Front
from indyva.dynamics.dselect import DynSelect
from indyva.dynamics.dfilter import DynFilter

def main():
    print 'Running apicolat'
    kernel = Kernel()
    ws_server = WSServer(port=8080)
    kernel.add_server(ws_server)   
    
    synapses_table = init_synapses_table()
    definition_dselect = DynSelect('definition_dselect', synapses_table)
    definition_dfilter = DynFilter('definition_dfilter', synapses_table)
    Front.instance().get_method('TableSrv.expose_table')(synapses_table)
    Front.instance().get_method('DynSelectSrv.expose_dselect')(definition_dselect)
    Front.instance().get_method('DynFilterSrv.expose_dfilter')(definition_dfilter)
    
    kernel.run_forever()
    
if __name__ == '__main__':
    main()