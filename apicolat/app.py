# -*- coding: utf-8 -*-
'''
Created on 11/12/2013

@author: jmorales
'''


from indyva.app import App as MetaApp
from data_adquisition import init_table
from indyva.facade.front import ContextFreeFront, Front
from indyva.dynamics.dselect import DynSelect
import xlsx_exporter
import dist_vis
import logbook
logbook.default_handler.level = logbook.DEBUG


class App(MetaApp):
    def __init__(self):
        MetaApp.__init__(self)

        ContextFreeFront.instance().add_method(self.init)

    def init(self):
        '''
        This method loads the data in a table
        '''
        table_name = 'spines'
        table = init_table(table_name, 'schema')
        definition_dselect = DynSelect('definition_dselect', table, setop='AND')
        Front.instance().get_method('TableSrv.expose_table')(table)
        Front.instance().get_method('DynSelectSrv.expose_dselect')(definition_dselect)

        xlsx_exporter.expose_methods()
        dist_vis.expose_methods()

        return {'table': table_name}


def main():
    App().run()

if __name__ == '__main__':
    main()
