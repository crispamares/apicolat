from indyva.facade.front import Front
from indyva.facade.showcase import Showcase
import seaborn as sns
import StringIO
import numpy as np
import base64
import matplotlib.pyplot as plt

sns.set_palette("deep", desat=.6)
sns.set_context(rc={"figure.figsize": (4, 2)})


def get_range(dataset, attr):
    data = np.array(dataset.find({}, {attr: True}).get_data("c_list")[attr])
    return [data.min(), data.max()]


def kde_plot(dataset_name, attr, dselect_name):
    dselect = Showcase.instance().get(dselect_name)
    dataset = Showcase.instance().get(dataset_name)

    x_range = get_range(dataset, attr)

    plt.figure(figsize=(6, 3))

    data = np.array(dataset.find(dselect.query, {attr: True}).get_data("c_list")[attr])
    figure = sns.kdeplot(data, shade=True).figure
    sns.rugplot(data)

    plt.xlim(x_range)

    imgdata = StringIO.StringIO()
    figure.savefig(imgdata, format='png')
    imgdata.seek(0)  # rewind the data
    png = imgdata.read()

    plt.close(figure)

    return base64.b64encode(png)


def expose_methods():
    Front.instance().add_method(kde_plot)
