define(["d3"],
function(d3) {
    
    d3.simpleAxis = function() {
	var width = 1,
	    height = 1,
	    domain = null,
	    marketHeight = 8;

	function simpleAxis(g) {

	    g.call(function(d, i) {

		g.classed("simpleAxis", true);

		var x = d3.scale.ordinal()
		    .domain(d3.range(2))
		    .rangeRoundBands([ 0 , width], 0.5);

		g.append("defs").selectAll("marker")
		    .data(["arrow"])
		   .enter().append("marker")
		    .attr("id", String)
		    .attr("viewBox", "0 -5 10 10")
		    .attr("markerWidth", marketHeight)
		    .attr("markerHeight", marketHeight)
		    .attr("orient", "auto")
		   .append("path")
		    .attr("d", "M0,-5L10,0L0,5");

		g.selectAll("line.axis")
		    .data([d])
		   .enter()
		    .append("line")
		    .classed("axis", true)
		    .attr("x1", x(1))
		    .attr("x2", x(1))
		    .attr("y1", height)
		    .attr("y2", marketHeight)
		    .attr("marker-end", "url(#arrow)");

		g.selectAll("text.axis")
		    .data(function(d){return [d];})
		   .enter()
		    .append("text")
		    .attr("x", x(0))
		    .attr("y", height / 2)
		    .attr("dy", ".35em")
		    .attr("text-anchor", "middle")
		    .attr("transform", "rotate(270 "+ x(0) +","+ height/2 +")")
		    .text(function(d) { return d; });

	    });	
	}

	simpleAxis.width = function(x) {
	    if (!arguments.length) return width;
	    width = x;
	    return simpleAxis;
	};

	simpleAxis.height = function(x) {
	    if (!arguments.length) return height;
	    height = x;
	    return simpleAxis;
	};
	
	return simpleAxis;		
    };


});
