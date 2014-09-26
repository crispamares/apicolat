define(
["when","d3", "context",  "bootstrap", "jquery", "box"]
,
function(when, d3, Context) {
    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    var pipeline = require("when/pipeline");

    var FacetedDistributionsView = function(container, compareChoices, subsets, dataset) {
	var self = this;
	// Subscribe to 'r:'
	this.container = d3.select(container);
	this.compareChoices = compareChoices;
	this.subsets = subsets;
	this.dataset = dataset;
	this.distributions = [];
	this.useOnlyOne = false;

	var margin = {top: 10, left: 80, bottom: 40, right: 10};
	var width = parseInt(this.container.style('width'));
	var aspectRatio = .5;
	var height = width * aspectRatio;
	width = width - margin.left - margin.right;
	height = height - margin.top - margin.bottom;
	
	var boxWidth = 20;
	var boxMargin = 25;
	var boxGroupMargin = 20;

	var color = d3.scale.category10();

	var min = Infinity, max = -Infinity;

	var boxPlot = d3.box()
	    .height(height)
	    .width(boxWidth)
	    .whiskers(iqr(1.5)); // width and height setted in update

	var x = d3.scale.ordinal(); // domain and rangeBound setted in update

	var y = d3.scale.linear()
	    .rangeRound([height, 0]); // domain setted in update

	var xGroup = d3.scale.linear()
	    .rangeRound([0, width]); // domain setted in update

	var xAxis =  d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis =  d3.svg.axis()
	    .scale(y)
	    .ticks(5)
	    .orient("left");

	var svg = this.container.append("svg")
	    .attr("class", "box-svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.bottom + margin.top);

	var gXAxis = svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(" + margin.left + "," + (margin.top + height + 10) + ")");

	var gYAxis = svg.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var gBoxes = svg.append("g")
	    .attr("class", "boxes")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	this.update = function() {
	    console.log("UPDATEEEEE", self);

	    var nDistributions = self.distributions.length;
	    var distributions = _.flatten(_.forEach(self.distributions, function(dist, i){
				     return _.map(dist, function(v){return v.subset = i;});}));
	    var factedData = _.groupBy(distributions, 'facetAttr');
	    var nBoxGroups = d3.max(_.map(self.distributions, 'length'));
					     
	    var boxGroupWidth = nDistributions * (boxWidth + 2 * boxMargin);

	    // -----------------------------
	    //     Resize the svg
	    // -----------------------------	    
	    width = (boxGroupWidth + 2*boxGroupMargin) * nBoxGroups;
	    svg.style("width", width + margin.left + margin.right);

	    // -----------------------------
	    //     Update the axes
	    // -----------------------------
	    y.domain(self._getDomain())
	        .nice();
	    boxPlot.domain(y.domain());
	    gYAxis.transition().call(yAxis);

	    x.domain(_.keys(factedData))
		.rangeBands([0,width]);
	    gXAxis.transition().call(xAxis);

	    xGroup.rangeRound([0, width])
		.domain([0, nBoxGroups]);

	    // -----------------------------
	    //     Update the boxPlots
	    // -----------------------------

	    var boxGroup = gBoxes.selectAll('g.boxGroup')
		.data(_.values(factedData));
	    boxGroup.enter().append('g')
		.classed('boxGroup', true);

	    var box = boxGroup.selectAll('g.box')
		.data(function(d) { return d; });

	    box.enter().append('g')
		.classed('box', true);

	    boxGroup.attr("transform", function(d,i) {return "translate(" + (xGroup(i) + boxGroupMargin) + ",0)";});

	    box.attr("transform", function(d,i) {
			 var offset = boxMargin + ((boxGroupWidth/2) * d.subset);
			 return "translate(" + offset + ",0)";})
		.classed('subset1', function(d){return !self.useOnlyOne && d.subset === 0;})
		.classed('subset2', function(d){return !self.useOnlyOne && d.subset === 1;})
		.datum(function(d){return d.list;})
		.call(boxPlot);
	    
	    box.exit().remove();
	    boxGroup.exit().remove();

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
			      self.distributions = [_.map(data, function(v){v.dist = c.subset1; return v;})]; 
			      self.update();});
	    }
	    else {
		this.useOnlyOne = false;
		when.map([[dataset, c.attr, conditionSet1, c.facetAttr],
			  [dataset, c.attr, conditionSet2, c.facetAttr]],
			 function(v){return self._rpcGetSubsetData(v[0],v[1],v[2],v[3]);})
		    .then(function(a){
			      var data = [];
			      data[0] = _.map(a[0], function(v){v.dist = c.subset1; return v;});
			      data[1] = _.map(a[1], function(v){v.dist = c.subset2; return v;});
			      self.distributions = data; 
			      self.update();});
	    }
	};

	this._rpcGetSubsetData = function(dataset, attr, conditionSet, facetAttr) {
	    console.log('RPC:', dataset, attr, conditionSet, facetAttr);
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
		    //console.log(JSON.stringify(aggregation));
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
