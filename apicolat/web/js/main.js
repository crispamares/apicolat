require.config({
    baseUrl: 'js',
    paths: {
        jquery: 'vendor/jquery.min',
	bootstrap: 'vendor/bootstrap.min',
	when: 'vendor/when',
	d3: 'vendor/d3.v3.min',
	vega: 'vendor/vega',
	lodash: 'vendor/lodash.min',
        hub: 'lib/indyva-js/hub',
        'ws-rpc': 'lib/indyva-js/ws-rpc'
    }
});

function showError(err) { console.log(err, err.stack); }

requirejs(['jquery', 
	   'lodash',
	   'when', 
	   'bootstrap', 
	   'ws-rpc',
	   'hub',
	   'd3',
	   'treemap',
	   'comboSelector',
	   'selectionList'], 

function($, _, when, bootstrap, WsRpc, Hub, d3) {
    console.log('running');

    rpc = WsRpc.instance();
    hub = Hub.instance();

    // ----------------------------------------
    //     Treemap
    // ----------------------------------------
    var Treemap = require("treemap");
    var treemap = new Treemap("#overview"); 
    hub.subscribe('comboChanged', 
	    function(topic, msg) { 
		console.log('To draw', topic, msg);
		drawTreemap(when, rpc, treemap, msg);});

    drawTreemap(when, rpc, treemap, "size");

    // ----------------------------------------
    //     ComboSelector
    // ----------------------------------------
    var ComboSelector = require("comboSelector");
    var menu = new ComboSelector('#menu');
    menu.update();


    // ----------------------------------------
    //     SelectionList
    // ----------------------------------------
    var SelectionList = require("selectionList");
    var selectionList = new SelectionList('#menu');
    selectionList.update();


    // ----------------------------------------
    //     Dynamics
    // ----------------------------------------
    rpc.call('DynSelectSrv.new_dselect', ['spines_dselect', 'ds:spines'])
	.then(
	    function(dselect) {
		treemap.setSpinesDselect(dselect);
		return rpc.call('DynSelectSrv.new_categorical_condition', [dselect, 'spine_id']);
	    })
	.then(function(condition) {
		treemap.setSpinesCondition(condition);
		selectionList.setSpinesCondition(condition);
	    })
	.otherwise(showError);    



});

function drawTreemap(when, rpc, view, column) {
    when.map( groupBySpine(column),
	    function(pipeline) {return rpc.call('TableSrv.aggregate', ["ds:spines", pipeline]);})
	.then(
	    function(views) {
		console.log('views', views);
		return when.map(views, function(view) {return rpc.call('TableSrv.get_data', [view]);});
	    })
	.then(
	    function (sizes) {
		var data = {
		    name: "sizes",
		    children: [
			   {name: "apical", children: sizes[0] },
			   {name: "basal", children: sizes[1] }
			   ]};
		view.setData(data);
		view.render();		    
	    })
	.otherwise(showError);    
}

function groupByDendriteId(column) {
    column = column || 'size';

    var apical_pipeline = [{$match: {dendrite_type:"apical"}},
		    {$project: {dendrite_type:1, size:1, dendrite_id: 1}  }, 
		    {$group : {_id: "$dendrite_id", size: {$sum : "$size"}} }, 
		    {$project : { name: "$_id", size:1 , _id: 0}}];

    var basal_pipeline = apical_pipeline.slice();
    basal_pipeline[0] = {$match: {dendrite_type:"basal"}};

    return [ apical_pipeline, basal_pipeline];
}

function groupBySpine(column) {
    column = column || 'size';

    var project1 = {$project: {dendrite_type:1, dendrite_id: 1, spine_id:1}};
    project1.$project[column] = 1;

    var group = {$group : {_id: "$dendrite_id", 
		 children: {$addToSet: {name: "$spine_id", size:'$'+column}} }};

    var apical_pipeline = [{$match: {dendrite_type:"apical"}} ,
			   project1,
			   group,
			   {$project : { name: "$_id", children:1 , _id: 0}}];

    var basal_pipeline = apical_pipeline.slice();
    basal_pipeline[0] = {$match: {dendrite_type:"basal"}};

    return [ apical_pipeline, basal_pipeline];
}
