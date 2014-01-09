# -*- coding: utf-8 -*-
'''
Created on 11/12/2013

@author: jmorales
'''

import os
import sys

ROOT = os.path.dirname(os.path.realpath(__file__))

#===============================================================================
#     import indyva
#===============================================================================
try:
    import indyva
except ImportError:
    sys.path.append(os.path.join(ROOT, '..' ,'lib', 'indyva'))
    import indyva


from indyva.dataset.table import Table 
from indyva.kernel import Kernel
from indyva.facade.server import WSServer 
from indyva.facade.server import ZMQServer  
from data_adquisition import init_synapses_table
from indyva.facade.front import Front
from indyva.dynamics.dselect import DynSelect
from indyva.dynamics.dfilter import DynFilter

def main():
    print 'Running apicolat'
    kernel = Kernel()
    ws_server = WSServer(port=8080)
    zmq_server = ZMQServer(8882)

    kernel.add_server(zmq_server)
    kernel.add_server(ws_server)  
    
    synapses_table = init_synapses_table()
    definition_dselect = DynSelect('definition_dselect', synapses_table, setop='AND')
    definition_dfilter = DynFilter('definition_dfilter', synapses_table)
    Front.instance().get_method('TableSrv.expose_table')(synapses_table)
    Front.instance().get_method('DynSelectSrv.expose_dselect')(definition_dselect)
    Front.instance().get_method('DynFilterSrv.expose_dfilter')(definition_dfilter)
    
    kernel.run_forever()
    
if __name__ == '__main__':
    main()