define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    function CategorialSelector(container, name) {
	this.container = $(container);
	this.condition = null;

	this.name = name;
	this.items = {}; //{cat1: {name:'cat1',included:true}, cat2: {name:'cat2',included:false}};

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
	this.container.append(html);

    }
    
    CategorialSelector.prototype.update =  function() {
	var self = this;
//	console.log('updating', this.name, JSON.stringify(this.items));


	var label = d3.select(this.container.selector).select("#categorical-selector-"+this.name)
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
	

	div.exit()
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


    CategorialSelector.prototype.setCondition = function(condition) {
	var self = this;
	this.condition = condition;

	when.map([this._rpcExcludedCategories(condition), 
		  this._rpcIncludedCategories(condition)])
	    .then(function(){self.update();});

	hub.subscribe(condition+ ':change',
	    function(topic, msg) {
		when.map([self._rpcExcludedCategories(condition), self._rpcIncludedCategories(condition)])
		    .then(function(){self.update();});
	    });
    };

    
    return CategorialSelector;
}
);