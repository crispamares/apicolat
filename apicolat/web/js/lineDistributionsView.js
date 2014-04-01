
define(
["when","ws-rpc", "d3", "hub",  "bootstrap", "jquery", "pointError"]
,
function(when, WsRpc, d3, Hub) {

    var hub = Hub.instance();
    var rpc = WsRpc.instance();

    var pipeline = require("when/pipeline");

    var LineDistributionsView = function(container, compareChoices, subsets, dataset) {
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
	
	var pointErrorWidth = 15;
	var pointErrorMargin = 25;
	var pointErrorGroupMargin = 20;

	var color = d3.scale.category10();

	var min = Infinity, max = -Infinity;

	var pointErrorPlot = d3.pointError()
	    .height(height)
	    .width(pointErrorWidth);

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
	    .attr("class", "lineError-svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.bottom + margin.top);

	var gXAxis = svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(" + margin.left + "," + (margin.top + height + 10) + ")");

	var gYAxis = svg.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var gLines = svg.append("g")
	    .attr("class", "lines")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var gPointErrors = svg.append("g")
	    .attr("class", "pointErrors")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var line = d3.svg.line()
	    .x(function(d) { return x(d.facetAttr); })
	    .y(function(d) { return y(d3.mean(d.list)); })
	    .interpolate("basis");

	this.update = function() {
	    console.log("UPDATEEEEE", self);	   
	    var nDistributions = self.distributions.length;
	    var distributions =  self.distributions;
/*	    distributions = _.flatten(_.forEach(self.distributions, function(dist, i){
				     return _.map(dist, function(v){return v.subset = i;});}));
	     factedData = _.groupBy(distributions, 'facetAttr');
*/	    
	    var nGroups = d3.max(_.map(self.distributions, 'length'));
	    var facets = _.unique(_.pluck(_.flatten(distributions), "facetAttr")).sort();
					     
	    var pointErrorGroupWidth = pointErrorWidth + 2 * pointErrorMargin;

	    // -----------------------------
	    //     Resize the svg
	    // -----------------------------	    
	    width = (pointErrorGroupWidth + 2*pointErrorGroupMargin) * nGroups;
	    svg.style("width", width + margin.left + margin.right);

	    // -----------------------------
	    //     Update the axes
	    // -----------------------------
	    y.domain(self._getDomain())
	        .nice();
	    pointErrorPlot.domain(y.domain());
	    gYAxis.transition().call(yAxis);

	    x.domain(facets)
		.rangeBands([0,width]);
	    gXAxis.transition().call(xAxis);

	    xGroup.rangeRound([0, width])
		.domain([0, nGroups]);

	    // -----------------------------
	    //     Update the pointErrorPlots
	    // -----------------------------

	    var pointErrorGroup = gPointErrors.selectAll('g.pointErrorGroup')
		.data(distributions);
	    pointErrorGroup.enter().append('g')
		.classed('pointErrorGroup', true);

	    var pointError = pointErrorGroup.selectAll('g.pointError')
		.data(function(d) { return d; });

	    pointError.enter().append('g')
		.classed('pointError', true);

	    //pointErrorGroup.attr("transform", function(d,i) {return "translate(" + (xGroup(i) + pointErrorGroupMargin) + ",0)";});

	    pointError.attr("transform", function(d,i) {
//			 var offset = pointErrorMargin + ((pointErrorGroupWidth/2) * d.subset);
			 return "translate(" + x(d.facetAttr) + ",0)";})
		.classed('subset1', function(d){return !self.useOnlyOne && d.subset === 0;})
		.classed('subset2', function(d){return !self.useOnlyOne && d.subset === 1;})
		.datum(function(d){return d.list;})
		.call(pointErrorPlot);
	    
	    pointError.exit().remove();
	    pointErrorGroup.exit().remove();

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

return LineDistributionsView;
}
);