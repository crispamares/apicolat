define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when', 'categoricalSelector', 'rangeSelector'],
function(lodash, jquery, WsRpc, Hub, d3, when, CategoricalSelector, RangeSelector) {

    var hub = Hub.instance();
    var rpc = WsRpc.instance();

    function ConditionsList(container, conditionSet, service) {
	var self = this;
	this.container = $(container);
	this.conditionSet = conditionSet;

	this.service = service || 'DynSelectSrv';
	this.gvConditions = [];

	hub.subscribe(conditionSet+':change', this.onConditionSetChange, this);
	hub.subscribe(conditionSet+':remove', this.onConditionSetChange, this);
	
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
	    .attr('class', 'condition col-sm-12')
	    .each(function(d) {createSelector(this, d, self);});

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


    ConditionsList.prototype.setConditionSet = function(conditionSet) {
	hub.unsubscribe(this.conditionSet+':change', this.onConditionSetChange, this);

	this.conditionSet = conditionSet;
	hub.subscribe(conditionSet+':change', this.onConditionSetChange, this);
	this._rpcGrammar(conditionSet);
    };

    
    function createSelector(container, gvCondition, self) {
	var selector = null;
	switch (gvCondition.type) {
	    case('categorical'):
		selector = 
		    new CategoricalSelector(container, gvCondition.attr, gvCondition);	    
		
		break;
	    case('range'):
		selector = new RangeSelector(container, gvCondition.attr, gvCondition);
		break;
	    default:
		console.error("Condition Type:", gvCondition.type, "not implemented");
	    }
	if (selector !== null) {
	    selector.onRemove = function(){
		rpc.call(self.service+'.remove_condition', [self.conditionSet, 'c:'+gvCondition.name]);
	    };
	}
    }


    return ConditionsList;
}
);