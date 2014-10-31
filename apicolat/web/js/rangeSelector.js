define(['lodash', 'jquery', 'context', 'd3', 'when', 'rangeSlider', 'menuButton'],
function(lodash, jquery, Context, d3, when, RangeSlider, MenuButton) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function RangeSelector(container, name, grammar) {
	var self = this;
	this.container = d3.select(container);
	this.grammar = grammar;
	this.name = name;
	this.condition = grammar.name;

	this.range = this.grammar.range;
	this.domain = this.grammar.domain;

	hub.subscribe(this.condition+ ':change',
	    function(topic, msg) {
		rpc.call('ConditionSrv.range', [self.condition])
		    .then(function(){self.update();})
		    .otherwise(showError);
	    }, this);


	var template = _.template('<div class="panel panel-default" id="range-selector-<%-name%>">'
			   + '  <div class="panel-heading">'
			   + '    <div class="row">'
			   + '      <div class="col-sm-10">'
			   + '        <h3 class="panel-title"> <%- name  %></h3> '
			   + '      </div>'
			   + '      <div class="col-sm-1">'
			   + '         <div class="menu"></div>'
			   + '      </div>'
			   + '    </div>'
			   + '  </div>'
			   + '  <div class="panel-body">'
			   + '  </div>'
			   + '</div>');
	var html = template({items: this.items, name: this.name});
	this.container.html(html);


	var menuItems = [/*{"name": "disable", "type": "item", "text": "Enable/Disable", 
			  "title":"Disabled conditions do not affect the selection", "class": "",
			  "onclick": function(d){console.log('disable',d);}},
			 {"type": "divider"},*/
			 {"name": "remove", "type": "item", "text": "Remove", 
			  "title":"Remove this condition", "class": "",
			  "onclick": function(d){console.log('remove',d);
						self.onRemove();}}
                         ];
	var menuButton = new MenuButton(this.container.select('div.menu').node(), menuItems, 'right');

	
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

    
    function rpcSetRange(condition, extent) {
	var params =  {condition_oid: condition, 
		       min: extent[0], 
		       max: extent[1], 
		       relative: false};
	return rpc.call('ConditionSrv.set_range', params);
    };

    var throttledRpcSetRange= _.throttle(rpcSetRange, 100);

    RangeSelector.prototype._createRangeSlicer = function(container, gvCondition) {
	var self = this;
	var rangeSlider = new RangeSlider(container);
	rangeSlider.setDomain(gvCondition.domain);
	var extent =  [gvCondition.range['min'], gvCondition.range['max']];
	rangeSlider.setExtent(extent);


	rangeSlider.on('move', function(extent){
		throttledRpcSetRange(self.condition, extent);
	});
    };

    

    return RangeSelector;
}
);
