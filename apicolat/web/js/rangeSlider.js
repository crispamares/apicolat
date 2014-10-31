define(
["d3", "editableText"]
,
function (d3, EditableText) {

    var rangeSlider = function(container) {
	this.container = container;
	var self = this;
	var onstart = null;
	var onmove = null;
	var onend = null;

	var domain = {min:0, max:1};

	var margin = {top: 5, left: 10, bottom: 20, right: 10}
	, width = parseInt(d3.select(container).style('width'))
	, height = 45;

	var slider_width = width - margin.left - margin.right;
	var slider_height = height - margin.top - margin.bottom;

	var x = d3.scale.linear()
	    .domain([domain.min, domain.max])
	    .range([0, slider_width])
	    .nice();

	var brush = d3.svg.brush()
	    .x(x)
	    .on("brushstart", brushstart)
	    .on("brush", brushmove)
	    .on("brushend", brushend);

	var axis =  d3.svg.axis()
	    .scale(x)
	    .ticks(5)
	    .orient("bottom");

	var extentDiv = d3.select(container)
	    .append('div')
	    .style("padding-left", margin.left + "px")
	    .style("padding-right", margin.right + "px");

	var leftExtent = extentDiv.append('span')
	    .text('..');
	var leftEditable = new EditableText(leftExtent.node());
	leftEditable.on('accept', function(val){ 
		var extent =  brush.extent();
		extent[0] = parseFloat(val);
		self.setExtent(extent);
	    }
	);
	
	var rightExtent = extentDiv.append('span')
	    .text('..')
	    .style("float", "right");
	var rightEditable = new EditableText(rightExtent.node());
	rightEditable.on('accept', function(val){ 
		var extent =  brush.extent();
		extent[1] = parseFloat(val);
		self.setExtent(extent);
	    }
	);

	var svg = d3.select(container).append("svg")
	    .attr("class", "slider")
	    .style("width", width + "px")
	    .style("height", height + "px");

	var gAxis = svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(" + margin.left + "," + (slider_height + margin.top)  + ")")
	    .call(axis);

	var slider = svg.append('g')
	    .attr("class", "brush")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	    .call(brush);

	slider.selectAll("rect")
	    .attr("height", slider_height);
	slider.selectAll(".resize rect")
	    .style("visibility", "visible");
	slider.selectAll(".background")
	    .style("visibility", "visible");
	
	this.setExtent = function(extent) {
	    slider.call(brush.extent(extent));
	    brushmove();
	};

	this.setDomain = function(domain) {
	    self.domain = domain;
	    x.domain([domain.min, domain.max]).nice();
	    brush.x(x);
	    gAxis.call(axis.scale(x));
	};

	this.on = function(event, callback) {
	    switch(event) {
		case('start'):
		    onstart = callback;
		    break;
		case('move'):
		    onmove = callback;
		    break;
		case('end'):
		    onend = callback;
		    break;
		default:
		    console.error("Event not known:", event);
	    }
	};


	function brushstart() {
	    //svg.classed("selecting", true);
	    if (onstart) onstart(brush.extent());
	}

	function brushmove() {
	    // ############# CONTINUE HERE 
	    leftEditable.setValue(brush.extent()[0].toFixed(2));
	    rightEditable.setValue(brush.extent()[1].toFixed(2));

	    if (onmove) onmove(brush.extent());
	}

	function brushend() {
	    if (onend) onend(brush.extent());
	    //svg.classed("selecting", !d3.event.target.empty());
	}

    };    



return rangeSlider;
}
);
