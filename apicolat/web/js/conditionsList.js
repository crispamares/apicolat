define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when', 'categoricalSelector'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    function ConditionsList(container, conditionSet, service) {
	var self = this;
	this.container = $(container);
	this.conditionSet = conditionSet;

	this.service = service || 'DynSelectSrv';
	this.attributes = [];

	hub.subscribe(this.service+'.'+conditionSet+':change', this.onConditionSetChange, this);
	
	// TODO: Add service method to retrieve conditions information
	rpc.call(this.service+'.get_conditions', [conditionSet])
	    .then(function(conditions){})
	    .otherwise(showError);

	this.update();
    }
    
    ConditionsList.prototype.update =  function() {
	var self = this;
	console.log('updating', this, JSON.stringify(this.attributes));

	var option = d3.select(this.container.selector).select("select")
	    .selectAll('option').data(self.attributes, _.identity);
	option.enter()
	    .append('option')
	    .text(_.identity);

	option.exit()
	    .remove();

    };

    ConditionsList.prototype.onConditionSetChange = function(topic, msg) {
	console.log('ConditionSet Changed', msg);
    };

    ConditionsList.prototype.add_condition = function(attribute) {
	var self = this;
	var attribute_schema = this.schema.attributes[attribute];
	
	if (attribute_schema.attribute_type === 'CATEGORICAL') {
	    createCategoricalSelectors(this.conditionSet, attribute, this.service);
	}
    };
    
    function createCategoricalSelectors(conditionSet, attribute, service) {
	var CategoricalSelector = require("categoricalSelector");
	var categoricalSelector = new CategoricalSelector('#conditions-list', attribute);
	rpc.call(service+'.new_categorical_condition', [conditionSet, attribute])
	    .then(function(condition) {
		      categoricalSelector.setCondition(condition);
		  })
	    .otherwise(showError);    
    }


    return ConditionsList;
}
);