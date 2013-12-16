# -*- coding: utf-8 -*-
'''
Created on 13/12/2013

@author: jmorales
'''

import json
import os

from __init__ import ROOT
from indyva.dataset.table import Table
from indyva.dataset.schemas import TableSchema, AttributeSchema

def create_synapses_schema():
    schema = TableSchema({},index='synapse_id')
    schema.add_attribute('synapse_id', 
                         dict(attribute_type= 'CATEGORICAL',
                              key=True))
    schema.add_attribute('dendrite_type','CATEGORICAL')
    schema.add_attribute('cell','CATEGORICAL')
    schema.add_attribute('section', 'ORDINAL')
    schema.add_attribute('section10um', 'CATEGORICAL')
    schema.add_attribute('source','CATEGORICAL')
    schema.add_attribute('area', 'QUANTITATIVE')
    schema.add_attribute('volume', 'QUANTITATIVE')
    schema.add_attribute('feret', 'QUANTITATIVE')
    schema.add_attribute('dist_section', 'QUANTITATIVE')
    VECTOR3D = AttributeSchema('QUANTITATIVE', shape = (3,) )
    schema.add_attribute('centroid', VECTOR3D)

    return schema

def init_synapses_table():
    with open(os.path.join(os.path.dirname(ROOT), 'data', 'synapses.json')) as f:
        rows = json.load(f)
    table = Table(name='synapses', schema=create_synapses_schema())
    for d in rows:
        table.insert(d)
    return table


if __name__ == '__main__':
    import time
    
    t0 = time.clock()
    table = init_synapses_table()
    t1 = time.clock()
    print table.row_count(), 'rows'
    print 'Done in ', t1-t0, 'seconds'
