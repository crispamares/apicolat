
define(
["when","ws-rpc", "d3", "hub",  "bootstrap", "jquery"]
,
function(when, WsRpc, d3, Hub) {

    var hub = Hub.instance();
    var rpc = WsRpc.instance();

    var pipeline = require("when/pipeline");


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
            + '<p class="h4"> <%= description %> </p>'
	  + '</div>'
	  + '<div class="col-md-4 col-sm-6">'
	    + '<table class="table">'
              + '<thead>'
                + '<tr>'
                  + '<th></th>'
                  + '<th> <%= statisticalTest %> </th>'
                  + '<th> Decision </th>'
                + '</tr>'
              + '</thead>'
	      + '<tbody>'
                + '<tr>'
                  + '<td> p-value </td>'
                  + '<td class="p-value <%= tdClass %>" data_hypothesis=<%= testId %> > <%= pValue %> </td>'
                  + '<td class="decision"> <%= decision %> </td>'
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
				    d.tdClass = (d.rejected) ? 'success':'danger';
				    return _.template(template, d);
		      });

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
			{pValue: results.pvalue,
			 decision: results.decision,
			 testId: testId,
			 statisticalTest: results.test,
			 description: results.desc,
			 rejected: results.rejected};
		};
	    };

	    var p1 = rpc.call("StatsSrv.compare", [[d1, d2], 'i', 'two.sided'])
		.then(collectResults('two-sided'));
	    var p2 = rpc.call("StatsSrv.compare", [[d1, d2], 'i', 'greater'])
		.then(collectResults('greater'));
	    var p3 = rpc.call("StatsSrv.compare", [[d1, d2], 'i', 'less'])
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