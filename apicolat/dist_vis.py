from indyva.facade.front import Front
from indyva.facade.showcase import Showcase
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import StringIO
import numpy as np
import base64
import pandas as pd


sns.set_palette("deep", desat=.6)
sns.set_context(rc={"figure.figsize": (8, 4)})


def get_range(dataset, attr):
    data = np.array(dataset.find({}, {attr: True}).get_data("c_list")[attr])
    return [data.min(), data.max()]


def encode_figure(figure):
    imgdata = StringIO.StringIO()
    figure.savefig(imgdata, format='png')
    imgdata.seek(0)  # rewind the data
    png = imgdata.read()

    plt.close(figure)

    return base64.b64encode(png)


def box_plot(dataset_name, attr, dselect_names, subset_names):
    showcase = Showcase.instance()
    dataset = showcase.get(dataset_name)

    dselects = [showcase.get(s) for s in dselect_names]

    datasets = [dataset.find(s.query, {attr: True}).get_data("c_list")[attr]
                for s in dselects]

    data = np.array(datasets)

    figure, ax = plt.subplots()
    sns.boxplot(data, names=subset_names, widths=.2, saturation=0.6, alpha=0.8)
    sns.despine(left=True)

    return encode_figure(figure)


def aggregated_dist_plot(dataset_name, attr, dselect_names, subset_names):
    showcase = Showcase.instance()
    dataset = showcase.get(dataset_name)
    x_range = get_range(dataset, attr)

    dselects = [showcase.get(s) for s in dselect_names]

    datasets = [dataset.find(s.query, {attr: True}).get_data("c_list")[attr]
                for s in dselects]

    figure = plt.figure()
    for i, data in enumerate(datasets):
        sns.kdeplot(np.array(data), label=subset_names[i])

    plt.setp(figure.axes, yticks=[])
    plt.xlim(x_range)

    return encode_figure(figure)



def dist_plot(dataset_name, attr, dselect_name):
    dselect = Showcase.instance().get(dselect_name)
    dataset = Showcase.instance().get(dataset_name)

    x_range = get_range(dataset, attr)

    plt.figure(figsize=(6, 3))

    data = np.array(dataset.find(dselect.query, {attr: True}).get_data("c_list")[attr])
    figure = sns.distplot(data, kde=True, rug=False, hist=True, bins=20).figure

    plt.setp(figure.axes, yticks=[])
    plt.xlim(x_range)

    return encode_figure(figure)


def expose_methods():
    Front.instance().add_method(dist_plot)
    Front.instance().add_method(box_plot)
    Front.instance().add_method(aggregated_dist_plot)
