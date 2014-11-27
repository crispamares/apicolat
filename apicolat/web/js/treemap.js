
define(
["when","d3", "context",  "bootstrap", "jquery"]
,
function(when, d3, Context) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    var treemapView = function(container) {
	// Subscribe to 'r:'
	// Subscribe to dynamics
	// Setter Data from a table
	this.container = container;
	this.spinesDselect = null;
	this.spinesCondition = null;
	this.included_spines = null;

	this.use_count = false;
	var self = this;

	var margin = {top: 10, left: 10, bottom: 10, right: 10}
	, width = parseInt(d3.select(container).style('width'))
	, width = width - margin.left - margin.right
	, aspectRatio = .5
	, height = width * aspectRatio;

	var color = d3.scale.linear()
	    .range([d3.rgb('#cac7e1'), d3.rgb('#6c0da7')]);

	var treemap = d3.layout.treemap()
	    .size([width, height])
	    .padding(4);

	var svg = d3.select(container).append("svg")
	    .classed("treemap-svg", true)
	    .style("width", width + "px")
	    .style("height", height + "px");

	var parent_layer = svg.append('g');
	var leaf_layer = svg.append('g');

	var leaves = null;
	var parents = null;


	this.render = function() {	    

	    treemap.value(function(d) { return (self.use_count)? 1 : d.size; });
	    var treemap_data = treemap.nodes(this.data);
	    var leaves_data = treemap_data.filter(function(d){return ! Boolean(d.children);});
	    var parents_data = treemap_data.filter(function(d){return Boolean(d.children);})

	    color.domain(d3.extent(parents_data, function(d){return (d.depth === 2)? d.value : null;}));

	    function recursive_name(node) {
		var name = node.name;
		if ('children' in node && 'parent' in node) {
		    name = name + '.' + node.parent.name;
		}
		return name;
	    }
	    
	    leaves = leaf_layer.selectAll(".leaf")
		.data(leaves_data, function(d){return d.name;});
	    parents = parent_layer.selectAll(".parent")
		.data(parents_data, function(d){return recursive_name(d);}
		     );

	    parents.enter().append("rect")
		.attr("class", "node parent");

	    leaves.enter().append("rect")
		.attr("class", "node leaf")
		.attr("title", function(d,i){return d.name;})
//		.on("click", function(d) {
//			if (self.spinesCondition) {
//			    rpc.call('ConditionSrv.toggle_category', [self.spinesCondition, d.name]);
//			}
//		    })
		.each(function(){$(this).tooltip({'container': 'body',
						  'placement': 'right'
						 });
				});
	    leaf_layer
		.attr("opacity",0)
	      .transition()
	        .delay(400)
		.attr("opacity",1);
		
	    parents
		.attr("fill", function(d, i) { return color(d.value);})
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

	    self.render_dselect();
	};

	this.render_dselect = function() {
	    if (leaves !== null) {
		var included = d3.set(self.included_spines);
		leaves.classed("blurred", function(d) { return ! included.has(d.name); });
	    }
	};

    };
    
    treemapView.prototype.update = function() {
	if (this.view){
	    console.log('update', this.view.width());
	    this.view = this.view.update();
	}
	else
	    this.render();
    };

    treemapView.prototype.setData = function(data) {
	this.data = data;
    };

    treemapView.prototype._rpcIncludedSpines = function(dselect) {
	var self = this;
	var deferred = when.defer();
	rpc.call('DynSelectSrv.reference', [dselect])
	    .then(function(included_spines) {
		      self.included_spines = included_spines;
		      deferred.resolve();
		  });
	deferred.promise.otherwise(showError);
	return deferred.promise;
    };

    treemapView.prototype.onDselectChange = function(topic, msg) {
	this._rpcIncludedSpines(this.spinesDselect)
	    .then(this.render_dselect)
	    .otherwise(showError);
    };

    treemapView.prototype.setDselect = function(dselect) {
	var self = this;
	if (this.spinesDselect) {
	    hub.unsubscribe(this.spinesDselect+':change', this.onDselectChange, this);
	    hub.unsubscribe(this.spinesDselect+':remove', this.onDselectChange, this);
	}
	this.spinesDselect = dselect;
	this.included_spines = null;
	this._rpcIncludedSpines(dselect).then(this.render_dselect);
	hub.subscribe(dselect+':change', this.onDselectChange, this);
	hub.subscribe(dselect+':remove', this.onDselectChange, this);
    };

    treemapView.prototype.setSpinesCondition = function(condition) {
	this.spinesCondition = condition;
    };




return treemapView;
}
);
