define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when', 'categoricalSelector', 'rangeSelector'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');
    var CategoricalSelector = require("categoricalSelector");
    var RangeSelector = require("rangeSelector");

    function ConditionsList(container, conditionSet, service) {
	var self = this;
	this.container = $(container);
	this.conditionSet = conditionSet;

	this.service = service || 'DynSelectSrv';
	this.gvConditions = [];

	hub.subscribe(conditionSet+':change', this.onConditionSetChange, this);
	
	this._rpcGrammar(conditionSet);
	this.update();
    }
    
    ConditionsList.prototype.update =  function() {
	var self = this;

	var condition = d3.select(this.container.selector)
	    .selectAll("div.condition")
	    .data(this.gvConditions, function(d){return d.name;});

	condition.enter()
	    .append('div')
	    .attr('class', 'condition')
	    .each(function(d) {createSelector(this, d);});

	condition.exit()
	    .remove();

    };

    ConditionsList.prototype._rpcGrammar = function(conditionSet) {
	var self = this;
	var promise = rpc.call(this.service+'.grammar', [conditionSet]);
	promise.then(function(grammar){
			 self.gvConditions = grammar.conditions;
			 self.update(); // TODO: Change when sync rendering is used
		     })
	    .otherwise(showError);
	return promise;
    };


    ConditionsList.prototype.onConditionSetChange = function(topic, msg) {
	console.log('ConditionSet Changed', msg);
	this._rpcGrammar(this.conditionSet);
    };
    
    function createSelector(container, gvCondition) {
	switch (gvCondition.type) {
	    case('categorical'):
		var categoricalSelector = 
		    new CategoricalSelector(container, gvCondition.attr, gvCondition);	    
		break;
	    case('range'):
		var rangeSlider = new RangeSelector(container, gvCondition.attr, gvCondition);
		break;
	    default:
		console.error("Condition Type:", gvCondition.type, "not implemented");
	    }
    }


    return ConditionsList;
}
);