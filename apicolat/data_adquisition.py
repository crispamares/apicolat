# -*- coding: utf-8 -*-
'''
Created on 13/12/2013

@author: jmorales
'''

import json
import os
import pymongo

from __init__ import ROOT
from indyva.dataset.table import Table
from indyva.dataset.schemas import TableSchema, AttributeSchema


def create_spines_schema():
    # TODO: MultiKey is not yet implemented
    #schema = TableSchema({},index=['spine_id', 'dendrite_id'])
    schema = TableSchema({},index='spine_id')
    schema.add_attribute('spine_id',
                         dict(attribute_type= 'CATEGORICAL',
                              key=True))
    schema.add_attribute('spine_name','CATEGORICAL')
    schema.add_attribute('dendrite_id','CATEGORICAL')
    schema.add_attribute('dendrite_type','CATEGORICAL')
    schema.add_attribute('size', 'QUANTITATIVE')
    schema.add_attribute('length', 'QUANTITATIVE')
    schema.add_attribute('angle', 'QUANTITATIVE')
    schema.add_attribute('radious', 'QUANTITATIVE')
    VECTOR3D = AttributeSchema('QUANTITATIVE', shape = (3,) )
    schema.add_attribute('raw_pos', VECTOR3D)
    schema.add_attribute('straight_pos', VECTOR3D)
    schema.add_attribute('unroll_pos', VECTOR3D)
    schema.add_attribute('joint_raw_pos', VECTOR3D)
    schema.add_attribute('joint_straight_pos', VECTOR3D)
    schema.add_attribute('joint_unroll_pos', VECTOR3D)
    schema.add_attribute('section', 'CATEGORICAL')

    return schema


def create_spines_table():
    client = pymongo.MongoClient()
    db = client['spinesIP']
    table = Table(name='spines', schema=create_spines_schema())
    for d in db['spines'].find({},{'_id':False}):
        table.insert(d)
    return table


def init_table(dataset, schema_desc):
    with open(os.path.join(os.path.dirname(ROOT), 'data', dataset + '.json')) as f:
        rows = json.load(f)
    with open(os.path.join(os.path.dirname(ROOT), 'data', schema_desc + '.json')) as f:
        schema = json.load(f)

    table = Table(name=dataset, schema=schema)
    for d in rows:
        d.pop("_id", None)
        table.insert(d)
    return table


if __name__ == '__main__':
    import time

    t0 = time.clock()
    table = init_synapses_table()
    t1 = time.clock()
    print table.row_count(), 'rows'
    print 'Done in ', t1-t0, 'seconds'
