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

	var placeImg = CompareTools.placeImg;
	var rpcGetSubsetData = CompareTools.rpcGetSubsetData;
	var drawBoxPlot = CompareTools.drawBoxPlot;
	var drawAggredatedKdePlot = CompareTools.drawAggredatedKdePlot;

	this.quantitative_attrs = _(schema.attributes).filter({attribute_type:'QUANTITATIVE', shape:[]}).sortBy('name').value();
	this.categorical_attrs = _.filter(schema.attributes, {attribute_type:'CATEGORICAL'});


	var row_template = '' +
	    '<div class="col-sm-6">' +
	    '<div class="panel panel-default">' +
	    '  <div class="panel-heading">' +
	    '    <h3 class="panel-title"> <%= attr %> </h3>' +
	    '  </div>' +
	    '  <div class="panel-body">' +
	    '    <div class="row">' +
	    '       <div class="plot col-sm-12"></div>' +
	    '       <div class="col-sm-12"> ' +
//	    '         <hr>' +
	    '         <button type="button" class="btn btn-default btn-block"><span class="glyphicon glyphicon-refresh"> Compare </span></button>' +
	    '         <div class="stat-result"> Stats Results here </div>' +
	    '       </div>' +
	    '    </div>' +
	    '  </div>' +
	    '</div>' +
	    '</div>';
	
	this.update = function() {
	    var dselects = _.pluck(this.subsets, 'conditionSet');
	    var subsetNames = _.pluck(this.subsets, 'name');

	    var attrRows = this.container.selectAll("div.attr-row")
		.data(this.quantitative_attrs, function(d){return d.name;});
	    
	    attrRows.enter()
	      .append("div")
		.attr("class", "attr-row")
		.html(function(d) {return _.template(row_template, {"attr":d.name});})
		.each(function(d) {
		    d3.select(this).select("div.plot").data([d]);

		    var container = d3.select(this).select("div.stat-result");
		    d3.select(this).select("button").data([d])
			.on("click", function(d){
			    container.html("");
			    compare(container, self.dataset, d.name, self.subsets);
			});
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

	    attrRows.selectAll("div.stat-result").html("");
		
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
	
	function compare(container, dataset, attr, subsets) {
	    CompareTools.rpcCompare(dataset, attr, subsets, 'i', "two.sided")
		.then(function(results) {
		    container.append('p').text(JSON.stringify(results));
		});
//	    CompareTools.rpcCompare(dataset, attr, subsets, 'i', "greater")
//		.then(function(results) {
//		    container.append('p').text(JSON.stringify(results));
//		});
//	    CompareTools.rpcCompare(dataset, attr, subsets, 'i', "less")
//		.then(function(results) {
//		    container.append('p').text(JSON.stringify(results));
//		});

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
