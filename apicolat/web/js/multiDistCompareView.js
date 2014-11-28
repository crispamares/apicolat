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


	var row_template = '' +
	      '<h3> <%= attr %> </h3>' +
	      '<div class="row">' +
		'<div class="plot col-sm-6"></div>' +
		'<div class="stat-result col-sm-6"> Stats Results here </div>' +
	      '</div>';
	
	this.update = function() {
	    var dselects = _.pluck(this.subsets, 'conditionSet');
	    var subsetNames = _.pluck(this.subsets, 'name');

	    var attrRows = this.container.selectAll("div.attr-row")
		.data(this.quantitative_attrs, function(d){return d.name;});
	    
	    attrRows.enter()
	      .append("div")
		.attr("class", "attr-row well")
//		.html(function(d) {return _.template(row_template, {"attr":d.name});});
		.each(function () {
		    	d3.select(this).append("h3")
			    .text(function (d){return d.name;});
			var row = d3.select(this).append("div")
			    .attr("class", "row");
			row.append("div")
			    .attr("class", "plot col-sm-6");
			row.append("div")
			    .attr("class", "stat-result col-sm-6")
			    .text("Stats Results Here");
		});

	    attrRows.selectAll("div.plot")
		.each(function(d){
		    var node = this;
		    this.innerHTML = '<span class="glyphicon glyphicon-time"></span>';
		    drawAggredatedKdePlot(this, self.dataset, d.name, dselects, subsetNames)
			.otherwise(function(){
			    node.innerHTML = '<span class="glyphicon glyphicon-ban-circle"></span>';
			});

		});
	};

	this.setSubsets =  function(subsets) {
	    this.subsets = subsets;
	    this.update();
	};
	
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

	function drawModal(modalContainerID, modalTemplate, dataset, attr, dselects, subsetNames) {
	    var boxNode = document.createElement("div");
	    var kdeNode = document.createElement("div");
	    return drawBoxPlot(boxNode, dataset, attr, dselects, subsetNames)
		.then(function(){
		    return drawAggredatedKdePlot(kdeNode, dataset, attr, dselects, subsetNames);
		})
		.then(function() {
		    $(modalContainerID)
			.html(_.template(modalTemplate,  {boxplot:boxNode.innerHTML, 
							  kdeplot:kdeNode.innerHTML,
							  title:attr+" distribution"}))
			.modal();
		});
	}

    }
    
    return MultiDistCompareView;
}
);
