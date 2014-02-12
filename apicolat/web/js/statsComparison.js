
define(
["when","ws-rpc", "d3", "hub",  "bootstrap", "jquery"]
,
function () {
    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');
    var pipeline = require("when/pipeline");
    require('bootstrap');

    var StatsComparison = function(container, compareChoices, subsets, dataset) {
	var self = this;
	// Subscribe to 'r:'
	this.container = d3.select(container);
	this.compareChoices = compareChoices;
	this.subsets = subsets;
	this.dataset = dataset;
	this.distributions = [];
	this.useOnlyOne = false;

	this.distributionOfResults = {	};
	this.compareTwoResults = {};

	this.update = function() {
	    self.container.html(JSON.stringify(self.distributionOfResults));
	    self.container.append('div').html(JSON.stringify(self.compareTwoResults));
	};

	this.setData = function(dataset) {
	    this.dataset = dataset;
	};

	this.setCompareChoices = function(compareChoices) {
	    this.compareChoices = compareChoices;
	};

	this.refresh = function() {
	    this._computeDistributions(this.dataset, this.compareChoices)
		.then(this._rpcCompareTwo)
		.then(this.update);
	};


	this._rpcCompareTwo = function(distributions) {
	    var d = distributions;
	    var d1 = d[0].list;
	    var d2 = (d.length > 1) ? d[1].list : d1;
	    var promise = rpc.call("StatsSrv.compareTwo", [d1, d2])
		.then(function(compareTwoResults) {
			  self.compareTwoResults = compareTwoResults;
		      });
	    return promise;
	};

	this._rpcDistributionOf = function(distributions) {
	    var deferred = when.defer();
	    when.map(distributions,
		     function(d){return rpc.call("StatsSrv.distributionOf", [d.list]);})
		.then(function(distributionOfResults){
			  self.distributionOfResults = distributionOfResults;
			  deferred.resolve();
		      })
		.otherwise(showError);
	    return deferred.promise;
	};

	this._computeDistributions = function(dataset, compareChoices) {
	    var deferred = when.defer();

	    var c = compareChoices;
	    var conditionSet1 = _.find(self.subsets, {name:c.subset1}).conditionSet;
	    var conditionSet2 = _.find(self.subsets, {name:c.subset2}).conditionSet;

	    if (compareChoices.subset1 === compareChoices.subset2) {
		self.useOnlyOne = true;
		self._rpcGetSubsetData(dataset, c.attr, conditionSet1, c.facetAttr)
		    .then(function(data){
			      self.distributions = [{list: data[c.attr], dist: c.subset1}]; 
			      deferred.resolve(self.distributions);
			      });
	    }
	    else {
		self.useOnlyOne = false;
		when.map([[dataset, c.attr, conditionSet1, c.facetAttr],
			  [dataset, c.attr, conditionSet2, c.facetAttr]],
			 function(v){return self._rpcGetSubsetData(v[0],v[1],v[2],v[3]);})
		    .then(function(a){
			      self.distributions = [{list: a[0][c.attr], dist: c.subset1},
						    {list: a[1][c.attr], dist: c.subset2}]; 
			      deferred.resolve(self.distributions);
			      });
	    }
	    deferred.promise.otherwise(showError);
	    return deferred.promise;
	};

	this._rpcGetSubsetData = function(dataset, attr, conditionSet, facetAttr) {
	    var tasks = [
		function (conditionSet) {	return rpc.call('DynSelectSrv.query', conditionSet);},
		function (query) {
		    var project = {};
		    project[attr] = true;
		    var promise = rpc.call('TableSrv.find', [dataset, query, project]);
		    return promise;
		},
		function (tableview) {return rpc.call('TableSrv.get_data', [tableview, "c_list"]);}
	    ];
	    var promise = pipeline(tasks, [conditionSet]);
	    promise.otherwise(showError);
	    return promise;
	};
    };

return StatsComparison;
}
);