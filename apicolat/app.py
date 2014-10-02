# -*- coding: utf-8 -*-
'''
Created on 11/12/2013

@author: jmorales
'''


from indyva.app import App as MetaApp
from data_adquisition import init_synapses_table
from indyva.facade.front import Front
from indyva.dynamics.dselect import DynSelect
from indyva.dynamics.dfilter import DynFilter
import xlsx_exporter


class App(MetaApp):
    def __init__(self):
        MetaApp.__init__(self)

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
