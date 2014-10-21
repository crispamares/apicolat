from indyva.facade.front import Front
from indyva.facade.showcase import Showcase
import seaborn as sns
import StringIO
import numpy as np

sns.set_palette("deep", desat=.6)
sns.set_context(rc={"figure.figsize": (8, 4)})


def kde_plot(dataset_name, attr, dselect_name):
    dselect = Showcase.instance().get(dselect_name)
    dataset = Showcase.instance().get(dataset_name)

    data = np.array(dataset.find(dselect.query, {attr: True}).get_data("c_list")[attr])
    figure = sns.kdeplot(data, shade=True).figure
    sns.rugplot(data)

    imgdata = StringIO.StringIO()
    figure.savefig(imgdata, format='svg')
    imgdata.seek(0)  # rewind the data
    svg = imgdata.read()
    return svg


def expose_methods():
    Front.instance().add_method(kde_plot)
