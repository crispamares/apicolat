# -*- coding: utf-8 -*-
'''
Created on 11/12/2013

@author: jmorales
'''

import indyva
from indyva.dataset.table import Table 
from indyva.kernel import Kernel
from indyva.facade.server import WSServer 

def main():
    print 'Running apicolat'
    kernel = Kernel()
    ws_server = WSServer(port=8080)
    kernel.add_server(ws_server)   
    
    
    
    kernel.run_forever()
    
if __name__ == '__main__':
    main()