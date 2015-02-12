define(["d3"],
function(d3) {
    
    d3.statSort = function() {
	var width = 1,
	    height = 1,
	    domain = null,
	    duration = 0,
	    itemHeight = 60,
	    itemWidth = 200;

	function statSort(g) {
	    g.each(function(d, i) {
		var groupedItems = reduceSorting(d);

		var marginSpace = height - (d.order.length * itemHeight),
		    margin = marginSpace / (groupedItems.length -1);

		var offsets = computeItemsOffset(groupedItems, margin, itemHeight);
		    
		var g = d3.select(this);
	
		var gItem = g.selectAll("g")
			.data(d.order)
		    .enter()
			.append("g")
			.attr("transform", function(d, i) { return "translate(0," + offsets[d] + ")"; });

		gItem.append("rect")
		    .attr("width", itemWidth)
		    .attr("height", itemHeight);

		gItem.append("text")
		    .attr("x", itemWidth / 2)
		    .attr("y", itemHeight / 2)
		    .attr("dy", ".35em")
		    .attr("text-anchor", "middle")
		    .text(function(d) { return d; });
		
		var linkLine = d3.svg.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.interpolate("monotone")
			.tension(0.5);

		var origin = d.order[1];
		var links = computeLinks(origin, d.order, offsets, itemHeight, itemWidth);

		var link = g.selectAll("path.link")
			.data(links)
		    .enter()
			.append("path")
			.attr("class", "link")
			.attr("d", linkLine);


		console.log(offsets);
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

	return statSort;
		
    };

    function reduceSorting(data) {
	var equals = data.equals;
	var ignore = {};
	var result = data.order.reduce(
	    function(acc, current, i, ordering){
		if (ignore[current] === true) {return acc;};
		if (equals[current] === null) {acc.push([current]);}
		else {
		    acc.push( Array(current).concat(equals[current]));

		    equals[current].forEach(function(e) {
			ignore[e] = true;
		    });
		}
		return acc;
	    }, []);
	return result;
    }

    function computeItemsOffset(groupedItems, margin, itemHeight) {
	var lastY = 0;
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
		.rangeRoundBands([ itemWidth , itemWidth + (order.length * 30)]);

	var y = d3.scale.ordinal()
	    .domain(d3.range(order.length - 1))
	    .rangePoints([ 0, itemHeight], 1);

	var iOrigin = order.indexOf(origin);
	order.forEach(function(target, i) {
	    if (target === origin) {return;}
	    var idx = (-i + order.length - 1 + iOrigin) % ( order.length );
	    links.push(computeLinePoints(origin, target, order, itemsY, y(idx), x, itemHeight, itemWidth));
	});
	return links;
    }

});
