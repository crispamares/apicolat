define(['lodash', 'context', 'd3', 'when', 'compareTools', 'statSort', 'simpleAxis'],
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
	    '<div class="col-sm-12">' +
	    '<div class="panel panel-default">' +
	    '  <div class="panel-heading">' +
	    '    <h3 class="panel-title"> <%= attr %> </h3>' +
	    '    <button type="button" class="btn btn-default"><span class="glyphicon glyphicon-refresh"> Compare </span></button>' +
	    '  </div>' +
	    '  <div class="panel-body">' +
	    '    <div class="row">' +
	    '       <div class="plot col-sm-6"></div>' +
	    '       <div class="col-sm-6"> ' +
//	    '         <hr>' +
	    '         <div class="row"> ' +
	    '            <div class="stat-chart col-sm-6">' +
	    '            </div>' +
	    '            <div class="stat-details col-sm-6" style="margin-top: 20px;">' +
	    '            </div>' +
	    '          </div>' +
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

		    var chartContainer = d3.select(this).select("div.stat-chart");
		    var detailsContainer = d3.select(this).select("div.stat-details");
		    d3.select(this).select("button").data([d])
			.on("click", function(d){
			    chartContainer.html("");
			    detailsContainer.html("");
			    compare(chartContainer, detailsContainer, self.dataset, d.name, self.subsets);
			});
		});

	    

//	    attrRows.selectAll("div.plot")
//		.each(function(d){
//		    var node = this;
//		    this.innerHTML = '<span class="glyphicon glyphicon-time"></span>';
//		    drawAggredatedKdePlot(this, self.dataset, d.name, dselects, subsetNames)
//			.otherwise(function(){
//			    node.innerHTML = '<span class="glyphicon glyphicon-ban-circle"></span>';
//			});
//
//		});

	    //    attrRows.selectAll("div.stat-chart").html("");
	    //    attrRows.selectAll("div.stat-details").html("");

	    attrRows
		.each(function(d){
		    var node = d3.select(this).select("div.plot").node();
		    node.innerHTML = '<span class="glyphicon glyphicon-time"></span>';
		    drawAggredatedKdePlot(node, self.dataset, d.name, dselects, subsetNames)
			.otherwise(function(){
			    node.innerHTML = '<span class="glyphicon glyphicon-ban-circle"></span>';
			});

		    var chartContainer = d3.select(this).select("div.stat-chart");
		    var detailsContainer = d3.select(this).select("div.stat-details");
		    chartContainer.html('<span class="glyphicon glyphicon-time"></span>');
		    detailsContainer.html("");
		    compare(chartContainer, detailsContainer, self.dataset, d.name, self.subsets)
			.otherwise(function(){
			    chartContainer.html('<span class="glyphicon glyphicon-ban-circle"></span>');
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
	
	function compare(container, detailsContainer, dataset, attr, subsets) {
	    return CompareTools.rpcStatSort(dataset, attr, subsets)
		.then(function(data) {
//		    container.append('p').text(JSON.stringify(data));
		    container.html(null);

		    var svg = container.append("svg")
			    .attr("width", "100%")
			    .attr("height", 330)
			    .attr("title", JSON.stringify(data));

		    var axis = d3.simpleAxis()
			    .width(40)
			    .height(300);
		    svg.append("g")
			.attr("transform", "translate(0, 20)")
			.data([attr])
			.call(axis);

		    var viz = svg.selectAll("viz")
			    .data([data.sorting]);

		    var bluredLinks = [];
		    data.tests.forEach(function(testResult){
			if (testResult.pvalue < 0.95) {bluredLinks.push([testResult.subsetA, testResult.subsetB]);}
		    });
		    console.log(bluredLinks);

		    var statSortChart = d3.statSort()
			    .width(300)
			    .height(300)
			    .itemHeight(50)
			    .itemWidth(130)
			    .origin(data.sorting.order[0])
			    .bluredLinks(bluredLinks);
		    var g = viz.enter().append("g").attr("transform", "translate(60, 20)");



		    g.call(statSortChart);
		    showTestDetails(detailsContainer, []);
		    
		    statSortChart.dispatch().on("itemclick", function(d){
			statSortChart.origin(d).unselectLinks();
			g.call(statSortChart);
			showTestDetails(detailsContainer, []);
		    });

		    statSortChart.dispatch().on("linkmouseover", function(d){
			statSortChart.selectedLink(d.origin, d.target);
			g.call(statSortChart);
			showTestDetails(detailsContainer, data.tests, d.origin, d.target);
		    });

		})
		.otherwise(function(error){
		    detailsContainer.html('<div><p>It has been imposible to sort the subsets based on this variable.</p>'+
					  '<p>Probably every comparison has been rejected</p>'+
					  '<p>Be aware that every subset needs more tan 50 elements to be compared</p>'+
					  '</div>');
		    throw error;
		});
	}

	function showTestDetails(container, tests, subsetX, subsetY) {
	    function foundTestResult(tests, subsetX, subsetY) {
		var result = null;
		tests.forEach(function(testResult){
		    if ((testResult.subsetA === subsetX  || testResult.subsetA === subsetY)
			&&(testResult.subsetB === subsetX  || testResult.subsetB === subsetY) ) {
			result = testResult;
		    }
		});
		return result;
	    }

	    var testResult = foundTestResult(tests, subsetX, subsetY);
	    if (testResult === null) {
		container.html('<div class="text-muted"><p>Point to the blue links to show the statistical tests details</p>'+
			       +'<div>');
	    }
	    else {
		container.html(
		    '<p> <strong> Test: </strong> '+ testResult.test +'</p>' +
		    '<p> <strong> p-value: </strong> '+ d3.round(testResult.pvalue, 3) +'</p>' +
		    '<p> <strong> Description: </strong> '+ testResult.desc +'</p>' +
		    '<p> <strong> Decision: </strong> '+ testResult.decision +'</p>'
		);
	    }
	}


    }
    
    return MultiDistCompareView;
}
);
