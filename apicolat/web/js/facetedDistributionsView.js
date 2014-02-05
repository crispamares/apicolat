
define(
["when","ws-rpc", "d3", "hub",  "bootstrap", "jquery", "box"]
,
function () {
    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');
    var pipeline = require("when/pipeline");
    require('bootstrap');
    require('box');

    var FacetedDistributionsView = function(container, compareChoices, subsets, dataset) {
	var self = this;
	// Subscribe to 'r:'
	// Subscribe to dynamics
	// Setter Data from a table
	this.container = d3.select(container);
	this.compareChoices = compareChoices;
	this.subsets = subsets;
	this.dataset = dataset;
	this.distributions = [];
	this.useOnlyOne = false;

	var margin = {top: 10, left: 80, bottom: 10, right: 10};
	var width = parseInt(this.container.style('width'));
	width = width - margin.left - margin.right;
	var aspectRatio = .5;
	var height = width * aspectRatio;

	var color = d3.scale.category10();

	var min = Infinity, max = -Infinity;

	var boxPlot = d3.box()
	    .whiskers(iqr(1.5)); // width and height setted in update

	var y = d3.scale.linear()
	    .range([0, height]); // domain setted in update

	var x = d3.scale.linear()
	    .range([0, width]); // domain setted in update

	var axis =  d3.svg.axis()
	    .scale(y)
	    .ticks(5)
	    .orient("left");

	var svg = this.container.append("svg")
	    .style("width", width + "px")
	    .style("height", height + "px");

	var gAxis = svg.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var gBoxes = svg.append("g")
	    .attr("class", "boxes")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	this.update = function() {
	    console.log("UPDATEEEEE", self);

	    // -----------------------------
	    //     Update the axis
	    // -----------------------------
	    y.domain(self._getDomain());
	    gAxis.transition().call(axis);

	    x.domain([0, self.distributions[0].length]);

	    boxPlot.width(40)
		.height(height - 20)
		.domain(y);

	    var box = gBoxes.selectAll('g.box')
		.data(self.distributions[0]);

	    box.enter().append('g')
		.classed('box', true);

	    box.attr("transform", function(d,i) {return "translate(" + x(i) + "," + 0 + ")";})
		.datum(function(d){return d.list;})
		.call(boxPlot);
	    
	    box.exit().remove();

	    console.log(y.domain());
	};

	this._getDomain = function() {
	    var minmax = function(acc, v){
		acc.min = Math.min(acc.min, v.min);
		acc.max = Math.max(acc.max, v.max);
		return acc;
	    };
	    var domain =  _.reduce(_.flatten(self.distributions), minmax, {'min':Infinity, 'max':-Infinity});	    
	    return [domain.min, domain.max];
	};

	this.setData = function(dataset) {
	    this.dataset = dataset;
	};

	this.setCompareChoices = function(compareChoices) {
	    this.compareChoices = compareChoices;
	};

	this.refresh = function() {
	    this._computeDistributions(this.dataset, this.compareChoices);
	};

	this._computeDistributions = function(dataset, compareChoices) {
	    var c = compareChoices;
	    var conditionSet1 = _.find(this.subsets, {name:c.subset1}).conditionSet;
	    var conditionSet2 = _.find(this.subsets, {name:c.subset2}).conditionSet;

	    if (compareChoices.subset1 === compareChoices.subset2) {
		this.useOnlyOne = true;
		this._rpcGetSubsetData(dataset, c.attr, conditionSet1, c.facetAttr)
		    .then(function(data){
			      self.distributions = [data]; self.update();});
	    }
	    else {
		this.useOnlyOne = false;
		when.map([[dataset, c.attr, conditionSet1, c.facetAttr],
			  [dataset, c.attr, conditionSet2, c.facetAttr]],
			 self._rpcGetSubsetData)
		    .then(function(a){self.distributions = a; self.update();});
	    }
	};

	this._rpcGetSubsetData = function(dataset, attr, conditionSet, facetAttr) {
	    var tasks = [
		function (conditionSet) {	return rpc.call('DynSelectSrv.query', conditionSet);},
		function (query) {
		    var aggregation = [{$match: query},
				       {$group: {_id: '$'+facetAttr, 
						 'list': {$push: '$'+attr},
						 'max': {$max: '$'+attr},
						 'min': {$min: '$'+attr}
						}
				       },
				       {$project: {facetAttr: '$_id', _id: false, 'list':true, 'max':true, 'min':true}}
				      ];
		    console.log(JSON.stringify(aggregation));
		    var promise = rpc.call('TableSrv.aggregate', [dataset, aggregation]);
		    return promise;
		},
		function (tableview) {return rpc.call('TableSrv.get_data', [tableview]);}
	    ];
	    var promise = pipeline(tasks, [conditionSet]);
	    promise.otherwise(showError);
	    return promise;
	};
    };
    // Returns a function to compute the interquartile range.
    function iqr(k) {
	return function(d, i) {
	    var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            iqr = (q3 - q1) * k,
            i = -1,
            j = d.length;
	    while (d[++i] < q1 - iqr);
		while (d[--j] > q3 + iqr);
		    return [i, j];
	};
    }

return FacetedDistributionsView;
}
);