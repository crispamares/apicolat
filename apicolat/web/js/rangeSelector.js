define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when', 'rangeSlider'],
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
			   + '  </div>'
			   + '</div>');
	var html = template({items: this.items, name: this.name});
	this.container.html(html);
	
	this.update();
    }
    
    RangeSelector.prototype.update =  function() {
	var self = this;

	var slider = this.container.select('.panel-body')
	    .selectAll('.slider-container')
	    .data([this.grammar]);

	slider.enter()
	    .append('div')
	    .attr("class", 'slider-container')
	    .each(function (d) {
		      self._createRangeSlicer.apply(self, [this, d]);
		  });

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


    RangeSelector.prototype._createRangeSlicer = function(container, gvCondition) {
	var self = this;
	var rangeSlider = new RangeSlider(container);
	var extent =  [gvCondition.range['relative_min'], gvCondition.range['relative_max']];
	rangeSlider.setExtent(extent);

	rangeSlider.on('move', function(extent){
		var params =  {condition_name: self.condition, 
			       min:extent[0], 
			       max:extent[1], 
			       relative: true};
		rpc.call('ConditionSrv.set_range', params)
			       .otherwise(showError);
		       });
    };

    return RangeSelector;
}
);