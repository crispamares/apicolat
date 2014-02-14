# -*- coding: utf-8 -*-
'''
Created on 13/02/2014

@author: jmorales
'''

from indyva.facade.front import Front
from indyva.facade.showcase import Showcase
import pandas as pd
import os
from __init__ import ROOT

ASSETSPATH = os.path.join(ROOT, 'web', 'assets')

def export_dselect(dselect_name, dataset_name, name):
    dselect = Showcase.instance().get(dselect_name)
    dataset = Showcase.instance().get(dataset_name)
    
    download_name =  name.replace(" ", "_")+'.xlsx'

    project = dselect.projection
    project['centroid'] = False

    data = dataset.find(dselect.query, project).get_data('rows')
    df = pd.DataFrame(data)
    df.to_excel(os.path.join( ASSETSPATH, download_name))
    
    return os.path.join('assets', download_name)

def expose_methods():
    Front.instance().add_method(export_dselect)
