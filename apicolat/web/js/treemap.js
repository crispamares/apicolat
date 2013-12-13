
define(
["when","ws-rpc", "d3", "hub", "jquery"]
,
function () {
    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();

    var treemapView = function(container) {
	// Subscribe to 'r:'
	// Subscribe to dynamics
	// Setter Data from a table
	this.container = container;
	this.spinesDselect = null;
	this.spinesCondition = null;
	this.included_spines = null;


	var width = 960,
	    height = 500;

	var color = d3.scale.category20c();

	var treemap = d3.layout.treemap()
	    .size([width, height])
	    .padding(4)
	    .value(function(d) { return d.size; });

	var svg = d3.select(container).append("svg")
	    .style("width", width + "px")
	    .style("height", height + "px");

	var parent_layer = svg.append('g');
	var leaf_layer = svg.append('g');

	var leaves = null;
	var parents = null;
	var self = this;

	this.render = function() {

	    var treemap_data = treemap.nodes(this.data);

	    function recursive_name(node) {
		var name = node.name;
		if ('children' in node && 'parent' in node) {
		    name = name + '.' + node.parent.name;
		}
		return name;
	    }
	    
	    leaves = leaf_layer.selectAll(".leaf")
		.data(treemap_data.filter(function(d){return ! Boolean(d.children);}),
		    function(d){return d.name;});
	    parents = parent_layer.selectAll(".parent")
		.data(treemap_data.filter(function(d){return Boolean(d.children);}),
		    function(d){return recursive_name(d);}
		     );

	    parents.enter().append("rect")
		.attr("class", "node parent")
		.attr("fill", function(d, i) { return color(i);});

	    leaves.enter().append("rect")
		.attr("class", "node leaf")
		.on("click", function(d) {
			if (self.spinesCondition) {
			    rpc.call('ConditionSrv.toggle_category', [self.spinesCondition, d.name]);
			}
		    });
	    leaf_layer
		.attr("opacity",0)
	      .transition()
	        .delay(400)
		.attr("opacity",1);
		
	    parents
	      .transition()
		.duration(350)
		.attr("x", function(d) { return d.x + "px"; })
		.attr("y", function(d) { return d.y + "px"; })
		.attr("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
		.attr("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });

	    leaves
		.attr("x", function(d) { return d.x + "px"; })
		.attr("y", function(d) { return d.y + "px"; })
		.attr("width", function(d) { return d.dx + "px"; })
		.attr("height", function(d) { return d.dy + "px"; });
	};

	this.render_dselect = function() {
	    console.log('paco', leaves);
	    leaves.style("stroke-width", function(d) { return (self.included_spines.indexOf(d.name) >= 0) ? "3px" : null; });
	};

    };
    
    treemapView.prototype.update = function() {
	if (this.view){
	    console.log('update', this.view.width());
	    this.view = 
	    this.view.update();
	}
	else
	    this.render();
    };

    treemapView.prototype.setData = function(data) {
	this.data = data;
    };

    treemapView.prototype._rpcIncludedSpines = function(dselect) {
	var self = this;
	var promise = rpc.call('DynSelectSrv.reference', [dselect])
	    .then(function(included_spines) {self.included_spines = included_spines;});
	promise.otherwise(showError);
	return promise;
    };

    treemapView.prototype.setSpinesDselect = function(dselect) {
	var self = this;
	this.spinesDselect = dselect;
	this.included_spines = null;
	this._rpcIncludedSpines(dselect);
	hub.subscribe(dselect+':change', 
	    function(topic, msg) {
		self._rpcIncludedSpines(dselect)
		    .then(self.render_dselect);
	    });

    };

    treemapView.prototype.setSpinesCondition = function(condition) {
	this.spinesCondition = condition;
    };




return treemapView;
}
);