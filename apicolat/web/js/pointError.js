define(
["d3"]
,
function(d3) {
// Derived from d3.box plugin
d3.pointError = function() {
  var width = 1,
      height = 1,
      duration = 0,
      domain = null,
      value = Number,
      whiskers = pointErrorWhiskers;

  // For each small multiple…
  function pointError(g) {
    g.each(function(d, i) {
      d = d.map(value).sort(d3.ascending);
      var g = d3.select(this),
          n = d.length,
          min = d[0],
          max = d[n - 1];

      var meanData = d3.mean(d);

      // Compute whiskers. Must return exactly 2 elements, or null.
      var whiskerData = whiskers && whiskers.call(this, d, i);

      // Compute the new x-scale.
      var x1 = d3.scale.linear()
          .domain(domain && domain.call(this, d, i) || [min, max])
          .range([height, 0]);

      // Retrieve the old x-scale, if this is an update.
      var x0 = this.__chart__ || d3.scale.linear()
          .domain([0, Infinity])
          .range(x1.range());

      // Stash the new scale.
      this.__chart__ = x1;

      // Note: the pointError, median, and pointError tick elements are fixed in number,
      // so we only have to handle enter and update. In contrast, the outliers
      // and other elements are variable, so we need to exit them! Variable
      // elements also fade in and out.

      // Update center line: the vertical line spanning the whiskers.
      var center = g.selectAll("line.center")
          .data(whiskerData ? [whiskerData] : []);

      center.enter().insert("line", "circle")
          .attr("class", "center")
          .attr("x1", width / 2)
          .attr("y1", function(d) { return x0(d[0]); })
          .attr("x2", width / 2)
          .attr("y2", function(d) { return x0(d[1]); })
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("y1", function(d) { return x1(d[0]); })
          .attr("y2", function(d) { return x1(d[1]); });

      center.transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("y1", function(d) { return x1(d[0]); })
          .attr("y2", function(d) { return x1(d[1]); });

      center.exit().transition()
          .duration(duration)
          .style("opacity", 1e-6)
          .attr("y1", function(d) { return x1(d[0]); })
          .attr("y2", function(d) { return x1(d[1]); })
          .remove();

      // Update Mean Point
      var pointError = g.selectAll("circle.pointError")
          .data([meanData]);

      pointError.enter().append("circle")
          .attr("class", "pointError")
          .attr("cx", width/2)
          .attr("cy", x0)
          .attr("r", width/2);

      pointError.transition()
          .duration(duration)
          .attr("cy", x1);

      // Update whiskers.
      var whisker = g.selectAll("line.whisker")
          .data(whiskerData || []);

      whisker.enter().insert("line", "circle")
          .attr("class", "whisker")
          .attr("x1", 0)
          .attr("y1", x0)
          .attr("x2", width)
          .attr("y2", x0)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1)
          .style("opacity", 1);

      whisker.transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1)
          .style("opacity", 1);

      whisker.exit().transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1)
          .style("opacity", 1e-6)
          .remove();

    });
    d3.timer.flush();
  }

  pointError.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return pointError;
  };

  pointError.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return pointError;
  };

  pointError.duration = function(x) {
    if (!arguments.length) return duration;
    duration = x;
    return pointError;
  };

  pointError.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x == null ? x : d3.functor(x);
    return pointError;
  };

  pointError.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return pointError;
  };

  pointError.whiskers = function(x) {
    if (!arguments.length) return whiskers;
    whiskers = x;
    return pointError;
  };

  return pointError;
};

function variance(d) {
    var n = d.length;
    if (n < 1) return NaN;
    if (n === 1) return 0;
    var mean = d3.mean(d),
    i = -1,
    s = 0;
    while (++i < n) {
	var v = d[i] - mean;
	s += v * v;
    }
    return s / (n - 1);
}

function deviation(d) {
    return Math.sqrt(variance(d));
}


function pointErrorWhiskers(d) {	
    var mean = d3.mean(d);
    var stddev = deviation(d);
    return [mean - stddev, mean + stddev];
}

});