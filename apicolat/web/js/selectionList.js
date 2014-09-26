define(['lodash', 'jquery', 'context', 'd3'],
function(lodash, jquery, Context, d3) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function SelectionList(container, dselect) {
	this.container = $(container);
	this.dselect = dselect;
	this.spinesCondition = null;

	this.items = [];

	var template = _.template('<div class="panel panel-default">'
			   + '  <div class="panel-heading">'
			   + '    <h3 class="panel-title">Selections</h3>'
			   + '  </div>'
			   + '  <div class="panel-body">'
			   + '    <div class="list-group">'
			   + '    </div>'			   
			   + '  </div>'
			   + '</div>');
	var html = template({items: this.items});
	this.container.append(html);

    }
    
    SelectionList.prototype.update =  function() {
	var self = this;
	
	var div = d3.select(this.container.selector)
	    .select('div.list-group').selectAll('a').data(this.items, function(d){return d;});

	div.enter()
	    .append('a')
	    .attr("class", "list-group-item")
	    .attr("href", "#")
	    .call(function(a) {
		      a.text(function(d) {return  d;})
			  .on("click", function(d) {
				  hub.publish('spine_selected', d);});
		      a.append('button')
			  .attr("class", "close")
			  .attr("type", "button")
			  .text('x')
			  .on("click", function(d) { 
				  console.log('close', d);
				  rpc.call('ConditionSrv.remove_category', [self.spinesCondition, d]);
				  d3.event.stopPropagation();
			      });

		  });

	div.exit()
	    .remove();

    };

    SelectionList.prototype._rpcIncludedItems = function(condition) {
	var self = this;
	var promise = rpc.call('ConditionSrv.included_items', [condition])
	    .then(function(included_items) {self.items = included_items;});
	promise.otherwise(showError);
	return promise;
    };


    SelectionList.prototype.setSpinesCondition = function(condition) {
	var self = this;
	this.spinesCondition = condition;
	this._rpcIncludedItems(condition);
	hub.subscribe(condition+ ':change',
	    function(topic, msg) {
		self._rpcIncludedItems(condition).then(function(){self.update();});
	    });

    };

    
    return SelectionList;
}
);
