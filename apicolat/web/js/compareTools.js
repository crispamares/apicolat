define(['lodash', 'context', 'd3', 'when'],
function(lodash, Context, d3, when) {

    var context = Context.instance();
    var rpc = context.rpc;

    function CompareTools() {

	function placeImg(container, png) {
	    var img = d3.select(container).selectAll('img')
		    .data([0])
		    .enter().append('img');
	    img.attr('src', 'data:image/png;base64,'+png);
	    return img;
	}

	function rpcGetSubsetData(dataset, attr, conditionSet) {
	    return rpc.call('DynSelectSrv.query', [conditionSet])
		.then(function(query){
		    var project = {};
		    project[attr] = true;
		    return rpc.call('TableSrv.find', [dataset, query, project]);
		})
		.then(function(tableview) {
		    return rpc.call('TableSrv.get_data', [tableview, "c_list"]);
		});	
	}

	function drawBoxPlot(container, dataset, attr, dselects, subsetNames) {
	    return _drawComparativePlot('box_plot', container, dataset, attr, dselects, subsetNames);
	}

	function drawAggredatedKdePlot(container, dataset, attr, dselects, subsetNames) {
	    return _drawComparativePlot('aggregated_dist_plot', container, dataset, attr, dselects, subsetNames);
	}

	function _drawComparativePlot(remoteCall, container, dataset, attr, dselects, subsetNames) {
	    return rpc.call(remoteCall, [dataset, attr, dselects, subsetNames])
	    		.then(function(png){placeImg(container, png);});
	}

	this.placeImg = placeImg;
	this.rpcGetSubsetData = rpcGetSubsetData;
	this.drawBoxPlot = drawBoxPlot;
	this.drawAggredatedKdePlot = drawAggredatedKdePlot;
    }
    
    return CompareTools;
}
);
