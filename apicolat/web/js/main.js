require.config({
    baseUrl: 'js',
    urlArgs: "bust="+ Math.random(), // Usefull in development. Bust Caches
    packages: [{ name: 'when', location: 'vendor/when', main: 'when' }],
    paths: {
        jquery: 'vendor/jquery.min',
	bootstrap: 'vendor/bootstrap.min',
	d3: 'vendor/d3.v3.min',
	vega: 'vendor/vega',
	lodash: 'vendor/lodash.min',
        context: 'lib/indyva-js/context',
        hub: 'lib/indyva-js/hub',
	FileSaver: 'vendor/FileSaver.min',
        'ws-rpc': 'lib/indyva-js/ws-rpc',
	'reconnecting-websocket': 'lib/indyva-js/reconnecting-websocket'
    },
    shim: {
	bootstrap: {deps: ['jquery']}
    }
});

function showError(err) { console.error(err, err.stack); }

requirejs(['context'],
function(Context) {
    var context = new Context(window.location.hostname, 'ws', 19000);
    context.install();
    var session = 's'+String(Math.round((Math.random()*100000)));
    context.openSession(session);

    window.onbeforeunload = function() {return "The session will be lost";};
    window.onunload = function() {context.closeSession();};
});

requirejs(['jquery', 
	   'lodash',
	   'when', 
	   'bootstrap', 
	   'context',
	   'd3',
	   'when/pipeline',
	   'when/monitor/console',
	   'treemap',
	   'comboSelector',
	   'treemapStatusBar',
	   'menuButton',
	   'mainBar',
	   'conditionsMenu',
	   'conditionsList',
	   'subsetMenu',
//	   'compareMenu',
//	   'box',
//	   'pointError',
//	   'facetedDistributionsView',
//	   'lineDistributionsView',
	   'compareTools',
	   'statsComparison',
	   'distCompareView',
	   'multiDistCompareView'
], 

function($, _, when, bootstrap, Context, d3) {
    console.log('running');
    var context = Context.instance();
    console.log('IN SESSION: ', context.session);
    var rpc = context.rpc;
    var hub = context.hub;

//  var quantitative_attrs = ["feret", "area", "volume"];
    var quantitative_attrs = null;

    var table = null;
    var schema = null;
    var definition_dselect = null;
    var subsets = null;
    var subsets_v = null;
    var subsetsName = null;
    var totalItems = null;

    rpc.call('init', [])
    .then(function(names){
	table = names["table"];
	var promise = rpc.call("TableSrv.row_count", [table])
		.then(function(rowCount){totalItems = rowCount;})
		.then(function() {return rpc.call("TableSrv.schema", [table]);});

	return promise;
    }) 
    .then(function(_schema){
    // ========================================
    //     Indyva Objects Creation
    // ========================================    
	schema = _schema;
	schema.attributes = _.mapValues(schema.attributes, function(v,k){v.name = k; return v;});

	quantitative_attrs = getQuantitativeAttrs(schema);
	definition_dselect = "definition_dselect"; // Already created in the kernel
	subsetsName = "subsets";

	var subsetsData = [{name:'new_subset', active:true, conditionSet: definition_dselect}];	
	var promise = rpc.call("SharedObjectSrv.new_shared_object", [subsetsName, subsetsData])
	    .then(function(name){return rpc.call("SharedObjectSrv.pull", [name]);})
	    .then(function(so){ 
		subsets = so[0];
		subsets_v = so[1];
	    });
	return promise;
    })
    .then(function() {
    // ========================================
    //     GUI Creation
    // ========================================    
    
    // ----------------------------------------
    //     Main Bar
    // ----------------------------------------
    var MainBar = require("mainBar");
    var mainBar = new MainBar("#main-bar>div", table, subsetsName);

    // ----------------------------------------
    //     Dynamics
    // ----------------------------------------

    // ----------------------------------------
    //     Subset Menu
    // ----------------------------------------
    var SubsetMenu = require("subsetMenu");
    var subsetMenu = new SubsetMenu("#subset-add","#subset-list", subsetsName, table);

    hub.subscribe("analysis_load", function(){
	subsetMenu.pull(subsetsName)
	    .done(subsetMenu.publishActive);
    });


    // ----------------------------------------
    //     ComboSelector
    // ----------------------------------------
    var ComboSelector = require("comboSelector");
    var menu = new ComboSelector('#overview-menu');
    menu.options = quantitative_attrs.concat(menu.options);
    menu.update();

    // ----------------------------------------
    //     TreemapStatusBar
    // ----------------------------------------
    var hierarchy = ['Dendritic Compartment', 'Dendrite Id', 'Spine Id'];
    var TreemapStatusBar = require("treemapStatusBar");
    var treemapStatusBar = new TreemapStatusBar('#overview-status', hierarchy, totalItems);
    treemapStatusBar.setDselect(definition_dselect);

    // ----------------------------------------
    //     Treemap
    // ----------------------------------------
    var Treemap = require("treemap");
    var treemap = new Treemap("#overview"); 
    hub.subscribe('comboChanged', 
	    function(topic, msg) { 
		console.log('To draw', topic, msg);

		treemap.use_count = (msg === '# count');
		msg = (msg === '# count')? quantitative_attrs[0] : msg;

		drawTreemap(treemap, msg);});

    drawTreemap(treemap, quantitative_attrs[0]);
    treemap.setDselect(definition_dselect);


    // ----------------------------------------
    //     CategoricalMenu and List
    // ----------------------------------------    
    var ConditionsMenu = require("conditionsMenu");
    var conditionsMenu = new ConditionsMenu('#conditions-menu', definition_dselect, schema);

    var ConditionsList = require("conditionsList");
    var conditionsList = new ConditionsList('#conditions-list', definition_dselect);

    hub.subscribe('active_subset_change', changeDselect);

    function changeDselect(topic, msg) {
	if (msg.active !== null) {
	    treemap.setDselect(msg.conditionSet);
	    treemapStatusBar.setDselect(msg.conditionSet);
	    conditionsMenu.setConditionSet(msg.conditionSet);
	    conditionsList.setConditionSet(msg.conditionSet);
	}
	else {
	    console.log('No handled active subset change:', msg);
	}
    }



    /**
     * Only in development
     */
	//    mainBar.activeDistCompare();

    var DistCompareView = require("distCompareView");
    var distCompareView = new DistCompareView("#dist-compare-view", schema, subsets, table);
    var MultiDistCompareView = require("multiDistCompareView");
    var multiDistCompareView = new MultiDistCompareView("#multi-dist-compare-view", schema, subsets, table);

    hub.subscribe('subset_change', function(topic, msg){
	distCompareView.subsets = msg;
	multiDistCompareView.subsets = msg;
    });

    hub.subscribe('main-bar-change', function(topic, msg) {
	if (msg.active === 'dist-compare') {
	    distCompareView.update();
	}
	if (msg.active === 'multi-dist-compare') {
	    multiDistCompareView.update();
	}

    });


    });
    // =============================================================

    function drawTreemap(view, column) {
	when.map( groupBySpine(column),
		  function(pipeline) {
		      console.log( JSON.stringify(pipeline));
		      return rpc.call('TableSrv.aggregate', [table, pipeline]);})
	    .then(
		function(views) {
		    console.log('views', views);
		    return when.map(views, function(view) {return rpc.call('TableSrv.get_data', [view]);});
		})
	    .then(
		function (sizes) {
		    var data = {
			name: "Spine Volume",
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
	column = column || 'Spine Volume';

	//	var project1 = {$project: {dendrite_type:1, cell: 1, synapse_id:1}};

	var project1 = {$project: {'Dendritic Compartment':1, 'Dendrite Id': 1, 'Spine Id':1}};
	project1.$project[column] = 1;

	var group = {$group : {_id: "$Dendrite Id", 
			       children: {$addToSet: {name: "$Spine Id", size:'$'+column}} }};

	var apical_pipeline = [{$match: {"Dendritic Compartment":"apical"}} ,
			       project1,
			       group,
			       {$project : { name: "$_id", children:1 , _id: 0}}];

	var colateral_pipeline = apical_pipeline.slice();
	colateral_pipeline[0] = {$match: {"Dendritic Compartment":"colateral"}};

	return [ apical_pipeline, colateral_pipeline];
    }

});

    function getQuantitativeAttrs(schema) {
	var attrs = _.pick(schema.attributes, function(value, key) {
	    return value.attribute_type === "QUANTITATIVE" && ! value.shape.length;
	});
	return _(attrs).keys().sort().value();
    }

