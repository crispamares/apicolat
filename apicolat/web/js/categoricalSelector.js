define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    function CategorialSelector(container, name, grammar) {
	var self = this;
	this.container = d3.select(container);
	this.grammar = grammar;
	this.name = name;
	this.condition = 'c:' + grammar.name;

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


	var template = _.template('<div class="panel panel-default" id="categorical-selector-<%-name%>">'
			   + '  <div class="panel-heading">'
			   + '    <h3 class="panel-title"> <%- name  %></h3>'
			   + '  </div>'
			   + '  <div class="panel-body">'
			   + '     <form role="form">'
/*			   + '        <% _.forEach(items, function(item) {%>'
			   + '        <div class="checkbox">'
			   + '          <label>'
			   + '            <input type="checkbox" value="<%- item.name %>" <% if (item.included){print("checked")} %> >'
			   + '            <%- item.name  %>'
			   + '          </label>'
			   + '        </div> <% }) %>'
*/			   + '     </form>'
			   + '    </div>'			   
			   + '  </div>'
			   + '</div>');
	var html = template({items: this.items, name: this.name});
	this.container.html(html);

	this.update();
    }
    
    CategorialSelector.prototype.update =  function() {
	var self = this;
//	console.log('updating', this.name, JSON.stringify(this.items));


	var label = this.container.select("#categorical-selector-"+this.name)
	    .select('form').selectAll('label').data(_.values(this.items), function(d){return d.name;});
	label.enter()
	    .append('label')
	    .attr("class", "checkbox-inline")
	    .text(function(d){return d.name;})
	    .call(function(checkbox) {
		      checkbox.append('input')
			  .attr("value", function(d){return d.name;})
			  .attr("type", "checkbox")
			  .on("change", function(d) {
				  self._rpcToggleCategory(d.name);
			      });
		  });

	label.selectAll('input').property('checked', function(d){ return self.items[d.name].included;});
	

	label.exit()
	    .remove();

    };

    CategorialSelector.prototype._rpcIncludedCategories = function(condition) {
	var self = this;
	var promise = rpc.call('ConditionSrv.included_categories', [condition])
	    .then(function(included_categories) {
		      included_categories.forEach(function(i) { self.items[i] = {name:i, included:true}; });
		  });
	promise.otherwise(showError);
	return promise;
    };

    CategorialSelector.prototype._rpcExcludedCategories = function(condition) {
	var self = this;
	var promise = rpc.call('ConditionSrv.excluded_categories', [condition])
	    .then(function(excluded_categories) {
		      excluded_categories.forEach(function(i) { self.items[i] = {name:i, included:false}; });
		  });
	promise.otherwise(showError);
	return promise;
    };

    CategorialSelector.prototype._rpcToggleCategory = function(category) {
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

    return CategorialSelector;
}
);