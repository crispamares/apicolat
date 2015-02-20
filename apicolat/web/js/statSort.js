define(["d3"],
function(d3) {
    
    d3.statSort = function() {
	var width = 1,
	    height = 1,
	    domain = null,
	    duration = 0,
	    itemHeight = 60,
	    itemWidth = 200,
	    dispatch = d3.dispatch("itemclick", "linkmouseover"),
	    selectedLink = null,
	    bluredLinks = null,
	    origin = null;

	function statSort(g) {
	    g.each(function(d, i) {
		var groupedItems = reduceSorting(d);

		console.log("groupedItems", JSON.stringify(groupedItems));

		var marginSpace = Math.round(height - (d.order.length * itemHeight)),
		    margin = Math.round(marginSpace / (groupedItems.length -1));

		var offsets = computeItemsOffset(groupedItems, margin, marginSpace, itemHeight);
		    
		var g = d3.select(this)
		    .classed("statSort", true);
	
		var linkLine = d3.svg.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.interpolate("linear");//.interpolate("monotone");

		if (d.order.indexOf(origin) >= 0) {
		    
		    var links = computeLinks(origin, d.order, offsets, itemHeight, itemWidth);

		    var link = g.selectAll("path.link").data(links);
		    link.enter()
			.append("path")
			.attr("class", "link")
			.on("mouseover", function(d){
			    dispatch.linkmouseover({origin:d.origin,
						    target:d.target,
						    el: this});
			});
		       
		    link.classed("selected", function(d){ 
			    return selectedLink !== null
							  && selectedLink["origin"] === d.origin 
							  && selectedLink["target"] === d.target;});
		    link.each(function(d){
			   if (bluredLinks === null){return;}
			   var founded = false;
			   bluredLinks.forEach(function(l){
			       if ((l[0] === d.origin  || l[0] === d.target)
				   &&(l[1] === d.origin  || l[1] === d.target) ) {
				   founded = true;
			       }
			   });
			   var filter = (founded) ? "url(#blur-filter)" : null;
			   d3.select(this).attr("filter", filter);
			});
			

		    link.transition().attr("d", function(d){return linkLine(d.points);});
		    
		    link.exit().remove();
		}

		var groupRect = g.selectAll("rect.group").data(groupedItems);
		groupRect.enter()
		    .append("rect")
		    .attr("class","group")
		    .attr("transform", function(d, i) { return "translate(-1," + (offsets[d[0]] - 1) + ")"; });
		groupRect.attr("width", itemWidth + 1)
		    .attr("height", function(d){return itemHeight * d.length;});

		var gItem = g.selectAll("g.gItem").data(d.order);
		gItem.enter()
		    .append("g")
		    .attr("class", "gItem")
		    .attr("transform", function(d, i) { return "translate(0," + offsets[d] + ")"; });
		gItem.classed("origin", function(d){return origin == d;});

		// needed due diffences in crispEdges behavior
		var pixelCorrection = (/firefox/i).test(navigator.userAgent)? 2 : 1;

		var rect = gItem.selectAll("rect.item").data(function(d){return [d];});
		rect.enter()
		    .append("rect")
		    .attr("class", "item")
		    .on("click", function(d){dispatch.itemclick(d);});
		rect.attr("width", itemWidth)
		    .attr("height", itemHeight - pixelCorrection);
		rect.exit().remove();

		var text = gItem.selectAll("text").data(function(d){return [d];});
		text.enter().append("text");
		text.attr("x", itemWidth / 2)
		    .attr("y", itemHeight / 2)
		    .attr("dy", ".35em")
		    .attr("text-anchor", "middle")
		    .text(function(d) { return d; });
		text.exit().remove();

		if (g.select("defs").empty()) { 
		    g.append("defs").selectAll("filter")
			.data(["blur-filter"])
		      .enter().append("filter")
			.attr("id", String)
			.attr("x", 0)
			.attr("y", 0)
	              .append("feGaussianBlur")
			.attr("in", "SourceGraphic")
			.attr("stdDeviation", 3);
		}
	    });
	}

	statSort.width = function(x) {
	    if (!arguments.length) return width;
	    width = x;
	    return statSort;
	};

	statSort.height = function(x) {
	    if (!arguments.length) return height;
	    height = x;
	    return statSort;
	};

	statSort.duration = function(x) {
	    if (!arguments.length) return duration;
	    duration = x;
	    return statSort;
	};

	statSort.domain = function(x) {
	    if (!arguments.length) return domain;
	    domain = x == null ? x : d3.functor(x);
	    return statSort;
	};

	statSort.origin = function(x) {
	    if (!arguments.length) return origin;
	    origin = x;
	    return statSort;
	};

	statSort.itemHeight = function(x) {
	    if (!arguments.length) return itemHeight;
	    itemHeight = x;
	    return statSort;
	};

	statSort.itemWidth = function(x) {
	    if (!arguments.length) return itemWidth;
	    itemWidth = x;
	    return statSort;
	};

	statSort.dispatch = function() {
	    return dispatch;
	};

	statSort.selectedLink = function(origin, target) {
	    if (!arguments.length) return selectedLink;
	    selectedLink = {"origin":origin, "target":target};
	    return statSort;
	};

	statSort.unselectLinks = function() {
	    selectedLink = null;
	    return statSort;
	};

	statSort.bluredLinks = function(x) {
	    if (!arguments.length) return bluredLinks;
	    bluredLinks = x;
	    return statSort;
	};
	
	return statSort;		
    };

    function reduceSorting(data) {
	var equals = data.equals;
	//	var ignore = {};
	var next_group = 0;
	var groups = {};
	var result = [];
	data.order.forEach(function(current){
	    var g = null;
	    if (current in groups) {
		g = groups[current];
	    }
	    else { 
		g = next_group;
		result[g] = d3.set([]);
		next_group += 1;
	    }

	    if (equals[current] === null) {
		groups[current] = g;
		result[g].add(current);
	    }
	    else if( typeof equals[current] === 'string' ) {
		groups[equals[current]] = g;
		result[g].add(equals[current]);
	    }
	    else { // Several equals
		equals[current].forEach(function(e) {
		    groups[e] = g;
		    result[g].add(e);
		});
	    }
	});

	return result.map(function(d){
	    return d.values()
		.sort(function(a,b){return data.order.indexOf(a) - data.order.indexOf(b);});});
    }

    function computeItemsOffset(groupedItems, margin, marginSpace, itemHeight) {
	var lastY = (groupedItems.length == 1)? marginSpace/2 : 0;
	var itemsOffset = {};

	groupedItems.forEach(function(g) {
	    g.forEach(function(item) {
		itemsOffset[item] = lastY;
		lastY += itemHeight;
	    });
	    lastY += margin;
	});

	return itemsOffset;
    }

    function computeLinks(origin, order, itemsY, itemHeight, itemWidth) {

	function computeLinePoints(origin, target, order, itemsY, yOffset, xOffsetScale, itemHeight, itemWidth) {
	    var points = [
		{y: itemsY[origin] + yOffset, x: itemWidth},
		{y: itemsY[origin] + yOffset, x: xOffsetScale(Math.abs(order.indexOf(origin) - order.indexOf(target)))},
		{y: itemsY[target] + itemHeight/2, x: xOffsetScale(Math.abs(order.indexOf(origin) - order.indexOf(target)))},
		{y: itemsY[target] + itemHeight/2, x: itemWidth}
	    ];
	    return points;
	}

    	var links = [];

	var x = d3.scale.ordinal()
		.domain(d3.range(order.length))
		.rangeRoundBands([ itemWidth , itemWidth + (order.length * 20)]);

	var y = d3.scale.ordinal()
	    .domain(d3.range(order.length - 1))
	    .rangePoints([ 0, itemHeight], 1);

	var iOrigin = order.indexOf(origin);
	order.forEach(function(target, i) {
	    if (target === origin) {return;}
	    var idx = (-i + order.length - 1 + iOrigin) % ( order.length );
	    var  link = {};
	    link.points = computeLinePoints(origin, target, order, itemsY, y(idx), x, itemHeight, itemWidth);
	    link.origin = origin;
	    link.target = target;
	    links.push(link);
	});
	return links;
    }

});
