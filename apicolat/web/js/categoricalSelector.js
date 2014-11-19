define(['lodash', 'jquery', 'context', 'd3', 'when', 'menuButton'],

function(lodash, jquery, Context, d3, when, MenuButton) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    /**
     * When the user clicks on the "Remove" menu item, then 
     * CategoricalSelector.onRemove is call. Set your own function.
     */
    function CategoricalSelector(container, name, grammar) {
	var self = this;
	this.container = d3.select(container);
	this.grammar = grammar;
	this.name = name;
	this.condition = grammar.name;

	this.items = {}; //{cat1: {name:'cat1',included:true}, cat2: {name:'cat2',included:false}};


	if (this.grammar) {
	    this.grammar.included_categories.forEach(function(i) { self.items[i] = {name:i, included:true}; });
	    this.grammar.excluded_categories.forEach(function(i) { self.items[i] = {name:i, included:false}; });
	}

	hub.subscribe(this.condition+ ':change',
	    function(topic, msg) {
		when.map([self._rpcExcludedCategories(self.condition), 
			  self._rpcIncludedCategories(self.condition)])
		    .then(function(){self.update();});
	    });


	var template = _.template('<div class="panel panel-default categorical-selector">'
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
			   + '  <div class="panel-body" style="overflow-y: auto; max-height: 400px;">'
			   + '     <form>'
			   + '     </form>'
			   + '    </div>'			   
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
    
    CategoricalSelector.prototype.update =  function() {
	var self = this;
//	console.log('updating', this.name, JSON.stringify(this.items));

	var data_items = _(this.items).values().sortBy('name').value();
	var label = this.container.select(".categorical-selector")
	    .select('form').selectAll('div').data(data_items, function(d){return d.name;});
	label.enter()
	    .append('div')
	    .attr("class", "checkbox-incolumn")
	    .append('label')
	    .each(function(d) {
		    var checkbox = d3.select(this);
		    checkbox.append('input')
			.attr("value", function(d){return d.name;})
			.attr("type", "checkbox")
			.on("change", function(d) {
			    self._rpcToggleCategory(d.name);
			});
		    $(this).append(d.name);

		  });

	label.selectAll('input').property('checked', function(d){ return self.items[d.name].included;});
	

	label.exit()
	    .remove();

    };

    CategoricalSelector.prototype._rpcIncludedCategories = function(condition) {
	var self = this;
	var promise = rpc.call('ConditionSrv.included_categories', [condition])
	    .then(function(included_categories) {
		      included_categories.forEach(function(i) { self.items[i] = {name:i, included:true}; });
		  });
	promise.otherwise(showError);
	return promise;
    };

    CategoricalSelector.prototype._rpcExcludedCategories = function(condition) {
	var self = this;
	var promise = rpc.call('ConditionSrv.excluded_categories', [condition])
	    .then(function(excluded_categories) {
		      excluded_categories.forEach(function(i) { self.items[i] = {name:i, included:false}; });
		  });
	promise.otherwise(showError);
	return promise;
    };

    CategoricalSelector.prototype._rpcToggleCategory = function(category) {
	var self = this;
	var promise = rpc.call('ConditionSrv.toggle_category', [self.condition, category])
	    .then(function(change) {
		      change.included.forEach(function(i) { self.items[i] = {name:i, included:true}; });
		      change.excluded.forEach(function(i) { self.items[i] = {name:i, included:false}; });
		      console.log("change", change, self);
		  });
	promise.otherwise(showError);
	return promise;
    };

    return CategoricalSelector;
}
);
