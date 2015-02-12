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


});
