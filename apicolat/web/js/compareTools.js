define(['lodash', 'context', 'd3', 'when'],
function(lodash, Context, d3, when) {

    var context = Context.instance();
    var rpc = context.rpc;

    function CompareTools(){};

    function placeImg(container, png) {
	var el = d3.select(container).html(null);
	var img = el.selectAll('img')
	    .data([0]);
	img.enter().append('img');
	img.attr({'src': 'data:image/png;base64,'+png,
		  'class': "img-responsive"});

	return img;
    }


    /**
     *
     * @param subsets: array[{name:"",conditionSet:""}]
     *
     */
    function rpcStatSort(dataset, attr, subsets) {
	return when.map(_.pluck(subsets, 'conditionSet'), 
			function(conditionSet){return rpcGetSubsetData(dataset, attr, conditionSet);})
	    .then(function(columns){
		return rpc.call("StatsSrv.statSort", 
		    [_.pluck(columns, attr), 
		    _.map(_.range(subsets.length), function(){return attr;}), 
		    _.pluck(subsets, 'name')]);
		});
    }

    /**
     *
     * @param subsets: array[{name:"",conditionSet:""}]
     * @param type: independent (i) or dependent data (d), default=i
     * @param type_comparison: string, possible values: two.sided | greater | less,
     *
     */
    function rpcCompare(dataset, attr, subsets, type, type_comparison) {
	return when.map(_.pluck(subsets, 'conditionSet'), 
			function(conditionSet){return rpcGetSubsetData(dataset, attr, conditionSet);})
	    .then(function(columns){
		return rpc.call("StatsSrv.compare", 
		    [_.pluck(columns, attr), 
		    _.map(_.range(subsets.length), function(){return attr;}), 
		    _.pluck(subsets, 'name'), 
		    type, 
		    type_comparison]);
		});
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

    CompareTools.placeImg = placeImg;
    CompareTools.rpcGetSubsetData = rpcGetSubsetData;
    CompareTools.rpcCompare = rpcCompare;
    CompareTools.rpcStatSort = rpcStatSort;
    CompareTools.drawBoxPlot = drawBoxPlot;
    CompareTools.drawAggredatedKdePlot = drawAggredatedKdePlot;
        
    return CompareTools;
}
);
