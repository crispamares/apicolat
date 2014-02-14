
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

	this.distributionOfResults = {};
	this.compareTwoResults = {};

	var template = 
	  '<div class="row">'
	  + '<div class="col-md-4 col-sm-6">'
            + '<p class="h4"> <%= text %> </p>'
	  + '</div>'
	  + '<div class="col-md-4 col-sm-6">'
	    + '<table class="table">'
              + '<thead>'
                + '<tr>'
                  + '<th></th>'
                  + '<th>Kolmogorov-Smirnov</th>'
                  + '<th>Wilcoxon</th>'
                + '</tr>'
              + '</thead>'
	      + '<tbody>'
                + '<tr>'
                  + '<td> p-value </td>'
                  + '<td class="p-value ks-p" data_test="ks" data_hypothesis=<%= testId %> > <%= ksPValue %> </td>'
                  + '<td class="p-value ws-p" data_test="ws" data_hypothesis=<%= testId %> > <%= wsPValue %> </td>'
                + '</tr>'
	      + '</tbody>'
	    + '</table>'
          + '</div>'
        + '</div>';

	this.update = function() {
	    	    
	    var compareResultsData=[];
	    compareResultsData.push(self.compareTwoResults['two-sided']);
	    compareResultsData.push(self.compareTwoResults['greater']);
	    compareResultsData.push(self.compareTwoResults['less']);

	    var compareResults = self.container.selectAll('div.compare-result')
		.data(compareResultsData);

	    compareResults.enter()
		.append('div')
		.attr('class', 'compare-result');

	    compareResults.html(function(d){
			  d.text = self._getText(d.testId);
			  return _.template(template, d);
		      });

	    self.container.selectAll("td.p-value")
		.each(function(d){
			  var td = d3.select(this);
			  var pValue = parseFloat(td.text());
			  var test = td.attr("data_test");
			  var hypothesis = td.attr("data_hypothesis");
			  var explanation = self._explainResult(pValue, test, hypothesis);
			  td.classed("success",  explanation === "valid");
			  td.classed("danger", explanation === "reject");
		      });

	};
	
	this._explainResult = function(pValue, test, hypothesis) {
	    var explanation = "";
	    if (test == "ws" || hypothesis == 'two-sided') {
		if (pValue < 0.05) explanation = "valid";
		else if (pValue >  0.95) explanation = "reject";		
	    }
	    else if (test == "ks") {
		if (pValue < 0.05) explanation = "reject";
		else if (pValue >  0.95) explanation = "valid";		
	    }
	    return explanation;
	};
	
	this._getText = function(testId) {
	    var s1 =  self.compareChoices.subset1;
	    var s2 =  self.compareChoices.subset2;
	    var texts = {
		"two-sided": 'Do ' + s1 + ' and '+ s2 +' come from the same distribution?:',
		"greater": "Is " + s1 +" stochastically larger than " + s2 + " ?:",
		"less": "Is " + s1 +" stochastically smaller than " + s2 + " ?:"
	    };
	    return texts[testId];
	};

	this.setData = function(dataset) {
	    this.dataset = dataset;
	};

	this.setCompareChoices = function(compareChoices) {
	    self.compareChoices = compareChoices;
	};

	this.refresh = function() {
	    this._computeDistributions(self.dataset, self.compareChoices)
		.then(this._rpcCompareTwo)
		.then(this.update)
		.otherwise(showError);
	};


	this._rpcCompareTwo = function(distributions) {
	    var d = distributions;
	    var d1 = d[0].list;
	    var d2 = (d.length > 1) ? d[1].list : d1;
	    
	    var collectResults = function(testId) {
		return function(results) {
		    self.compareTwoResults[testId] = 
			{ksPValue: results.ks,
			 wsPValue: results.wilcox,
			 testId: testId};
		};
	    };

	    var p1 = rpc.call("StatsSrv.compareTwo", [d1, d2, 'c', 'two.sided'])
		.then(collectResults('two-sided'));
	    var p2 = rpc.call("StatsSrv.compareTwo", [d1, d2, 'c', 'greater'])
		.then(collectResults('greater'));
	    var p3 = rpc.call("StatsSrv.compareTwo", [d1, d2, 'c', 'less'])
		.then(collectResults('less'));

	    return when.join(p1,p2,p3);
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