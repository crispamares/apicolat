define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    var RangeSlider = require("rangeSlider");


    function RangeSelector(container, name, grammar) {
	var self = this;
	this.container = d3.select(container);
	this.grammar = grammar;
	this.name = name;
	this.condition = 'c:' + grammar.name;

	this.range = this.grammar.range;
	this.domain = this.grammar.domain;

	this.rangeSlider = new RangeSlider();


	hub.subscribe(this.condition+ ':change',
	    function(topic, msg) {
		rpc.call('ConditionSrv.range', [self.condition])
		    .then(function(){self.update();})
		    .then(showError);
	    }, this);


	var template = _.template('<div class="panel panel-default" id="range-selector-<%-name%>">'
			   + '  <div class="panel-heading">'
			   + '    <h3 class="panel-title"> <%- name  %></h3>'
			   + '  </div>'
			   + '  <div class="panel-body">'
			   + '    <div class="slider-container">'
			   + '    </div>'			   
			   + '  </div>'
			   + '</div>');
	var html = template({items: this.items, name: this.name});
	this.container.html(html);

	this.update();
    }
    
    RangeSelector.prototype.update =  function() {
	var self = this;
//	console.log('updating', this.name, JSON.stringify(this.items));

	var label = this.container.select('.slider-container')
	    .call(this.rangeSlider);

    };

    RangeSelector.prototype._rpcSetRange = function(condition, range) {
	var self = this;
	var promise = rpc.call('ConditionSrv.set_range', [condition])
	    .then(function(change) {
		      console.log(change);
		  })
	    .otherwise(showError);
	return promise;
    };


    return RangeSelector;
}
);