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

    var rpc = WsRpc.instance();
    var hub = Hub.instance();
    
    var quantitative_attrs = ["feret", "area", "volume"];

    // ----------------------------------------
    //     Treemap
    // ----------------------------------------
    var Treemap = require("treemap");
    var treemap = new Treemap("#overview"); 
    hub.subscribe('comboChanged', 
	    function(topic, msg) { 
		console.log('To draw', topic, msg);

		treemap.use_count = (msg === '* count *');
		msg = (msg === '* count *')? quantitative_attrs[0] : msg;

		drawTreemap(when, rpc, treemap, msg);});

    drawTreemap(when, rpc, treemap, quantitative_attrs[0]);

    // ----------------------------------------
    //     ComboSelector
    // ----------------------------------------
    var ComboSelector = require("comboSelector");
    var menu = new ComboSelector('#menu');
    menu.options = quantitative_attrs.concat(menu.options);
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
    rpc.call('DynSelectSrv.new_dselect', ['spines_dselect', 'ds:synapses'])
	.then(
	    function(dselect) {
		treemap.setSpinesDselect(dselect);
		return rpc.call('DynSelectSrv.new_categorical_condition', [dselect, 'synapse_id']);
	    })
	.then(function(condition) {
		treemap.setSpinesCondition(condition);
		selectionList.setSpinesCondition(condition);
	    })
	.otherwise(showError);    



});

function drawTreemap(when, rpc, view, column) {
    when.map( groupBySpine(column),
	    function(pipeline) {
		console.log( JSON.stringify(pipeline));
		return rpc.call('TableSrv.aggregate', ["ds:synapses", pipeline]);})
	.then(
	    function(views) {
		console.log('views', views);
		return when.map(views, function(view) {return rpc.call('TableSrv.get_data', [view]);});
	    })
	.then(
	    function (sizes) {
		var data = {
		    name: "feret",
		    children: [
			   {name: "apical", children: sizes[0] },
			   {name: "colateral", children: sizes[1] }
			   ]};
		view.setData(data);
		console.log(data);
		view.render();		    
	    })
	.otherwise(showError);    
}

function groupBySpine(column) {
    column = column || 'feret';

    var project1 = {$project: {dendrite_type:1, cell: 1, synapse_id:1}};
    project1.$project[column] = 1;

    var group = {$group : {_id: "$cell", 
		 children: {$addToSet: {name: "$synapse_id", size:'$'+column}} }};

    var apical_pipeline = [{$match: {dendrite_type:"apical"}} ,
			   project1,
			   group,
			   {$project : { name: "$_id", children:1 , _id: 0}}];

    var colateral_pipeline = apical_pipeline.slice();
    colateral_pipeline[0] = {$match: {dendrite_type:"colateral"}};

    return [ apical_pipeline, colateral_pipeline];
}
