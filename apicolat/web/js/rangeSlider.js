
define(
["when","ws-rpc", "d3", "hub", "jquery"]
,
function () {
    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();

    var rangeSlider = function(container) {
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
	, height = 30;

	var x = d3.scale.linear().range([0, width]);	

	var brush = d3.svg.brush()
	    .x(x)
	    .extent([.3, .5])
	    .on("brushstart", brushstart)
	    .on("brush", brushmove)
	    .on("brushend", brushend);

	var svg = d3.select(container).append("svg")
	    .style("width", width + "px")
	    .style("height", height + "px");

	var slider = svg.append('g')
	    .attr("class", "brush")
	    .call(brush);
    };
    
    function brushstart() {
	//svg.classed("selecting", true);
    }

    function brushmove() {
	//var s = brush.extent();
	//circle.classed("selected", function(d) { return s[0] <= d && d <= s[1]; });
    }

    function brushend() {
	//svg.classed("selecting", !d3.event.target.empty());
    }

    rangeSlider.prototype.update = function() {
	// update the brush
    };

    rangeSlider.prototype.setData = function(data) {
	this.data = data;
    };

return rangeSlider;
}
);