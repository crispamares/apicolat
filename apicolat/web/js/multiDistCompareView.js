define(['lodash', 'context', 'd3', 'when', 'compareTools'],
function(lodash, Context, d3, when, CompareTools) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function MultiDistCompareView(container, schema, subsets, dataset) {
	var self = this;
	this.container = d3.select(container);
	this.tableContainer = null;
	this.schema = schema;
	this.subsets = subsets;
	this.dataset = dataset;

	var tools = new CompareTools();
	var placeImg = tools.placeImg;
	var rpcGetSubsetData = tools.rpcGetSubsetData;
	var drawBoxPlot = tools.drawBoxPlot;
	var drawAggredatedKdePlot = tools.drawAggredatedKdePlot;

	this.quantitative_attrs = _(schema.attributes).filter({attribute_type:'QUANTITATIVE', shape:[]}).sortBy('name').value();
	this.categorical_attrs = _.filter(schema.attributes, {attribute_type:'CATEGORICAL'});


	var template = '' +
	      '<div class="table-responsive">' +
		'<table class="table table-bordered">' +
		  '<thead>' +
		  '</thead>' +
		  '<tbody>' +
		  '</tbody>' +
		'</table>' +
	      '</div>';
	
	this.update = function() {
	    
	};


	this.setSubsets =  function(subsets) {
	    self.subsets = subsets;
	    self.update();
	};
	
	this.tableContainer = this.container.append('div').html(template);
	this.update();

	function drawDistPlot(cell, dataset, attr, conditionSet) {
	    
	    return rpc.call('dist_plot', [dataset, attr, conditionSet])
		.then(function(png) {
		    d3.select(cell).html(null);
		    var img = placeImg(cell, png);
		    img.attr('class', "img-responsive");
		    d3.select(cell)
			.on('mouseover', function(){img.classed("img-responsive", false);})
			.on('mouseout', function(){img.classed("img-responsive", true);});
		});
	}

	function placeImg(container, png) {
	    var img = d3.select(container).selectAll('img')
		    .data([0])
		    .enter().append('img');
	    img.attr('src', 'data:image/png;base64,'+png);
	    return img;
	}

	function rpcGetSubsetData(dataset, attr, conditionSet) {
	    return rpc.call('DynSelectSrv.query', [conditionSet])
		.then(function(query){
		    var project = {};
		    project[attr] = true;
		    return rpc.call('TableSrv.find', [dataset, query, project]);
		})
		.then(function(tableview) {
		    return rpc.call('TableSrv.get_data', [tableview, "c_list"]);
		});	
	}


	function drawModal(modalContainerID, modalTemplate, dataset, attr, dselects, subsetNames) {
	    var boxNode = document.createElement("div");
	    var kdeNode = document.createElement("div");
	    return drawBoxPlot(self.dataset, attr, dselects, subsetNames)
		.then(function(png){placeImg(boxNode, png);})
		.then(function(){
		    return drawAggredatedKdePlot(self.dataset, attr, dselects, subsetNames);
		})
		.then(function(png){placeImg(kdeNode, png);})
		.then(function() {
		    $(modalContainerID)
			.html(_.template(modalTemplate,  {boxplot:boxNode.innerHTML, 
							  kdeplot:kdeNode.innerHTML,
							  title:attr+" distribution"}))
			.modal();
		});
	}


	function drawBoxPlot(container, dataset, attr, dselects, subsetNames) {
	    return _drawComparativePlot('box_plot', container, dataset, attr, dselects, subsetNames);
	}

	function drawAggredatedKdePlot(container, dataset, attr, dselects, subsetNames) {
	    return _drawComparativePlot('aggregated_dist_plot', container, dataset, attr, dselects, subsetNames);
	}

	function _drawComparativePlot(remoteCall, dataset, attr, dselects, subsetNames) {
	    return rpc.call(remoteCall, [dataset, attr, dselects, subsetNames]);
	}

    }
    
    return MultiDistCompareView;
}
);
