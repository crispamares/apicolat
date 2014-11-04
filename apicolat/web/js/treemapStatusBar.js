define(['lodash', 'jquery', 'context'],
function(_, $, Context) {
    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function TreemapStatusBar(container, hierarchy, totalItems) {
	this.container = $(container);
	this.hierarchy = hierarchy;
	this.totalItems = totalItems;

	this.dselect = null;

	this.includedCount = null;

    }

    TreemapStatusBar.prototype.update =  function() {

	var template = _.template('<span> <%- (includedCount/totalItems * 100).toFixed(0) %>% ( <strong><%- includedCount %></strong> / <%- totalItems %> ) - </span>' +
				  '<span> <%- levels.join(" / ") %> </span>'
				  );

	var html = template({levels: this.hierarchy, 'includedCount': this.includedCount, 'totalItems': this.totalItems});
	this.container.html(html);
    };

    TreemapStatusBar.prototype.onDselectChange = function(topic, msg) {
	var self = this;
	rpc.call('DynSelectSrv.reference', [this.dselect])
	    .done(function(included_items) {
		self.includedCount = included_items.length;
		self.update();
	    });
    };

    TreemapStatusBar.prototype.setDselect = function(dselect) {
	var self = this;
	if (this.dselect) {
	    hub.unsubscribe(this.dselect+':change', this.onDselectChange, this);
	    hub.unsubscribe(this.dselect+':remove', this.onDselectChange, this);
	}
	this.dselect = dselect;
	this.includedCount = null;
	rpc.call('DynSelectSrv.reference', [this.dselect])
	    .done(function(included_items) {
		self.includedCount = included_items.length;
		self.update();
	    });
	hub.subscribe(dselect+':change', this.onDselectChange, this);
	hub.subscribe(dselect+':remove', this.onDselectChange, this);
    };

    return TreemapStatusBar;
}
);
