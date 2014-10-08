require.config({
    baseUrl: 'js',
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
    var context = Context.instance();
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
	   'menuButton',
	   'mainBar',
	   'conditionsMenu',
	   'conditionsList',
	   'subsetMenu',
	   'compareMenu',
	   'box',
	   'pointError',
	   'facetedDistributionsView',
	   'lineDistributionsView',
	   'statsComparison'
], 

function($, _, when, bootstrap, Context, d3) {
    console.log('running');
    var context = Context.instance();
    console.log('IN SESSION: ', context.session);
    var rpc = context.rpc;
    var hub = context.hub;

    var quantitative_attrs = ["feret", "area", "volume"];

    var definition_dselect = null;
    var subsets = null;
    var subsets_v = null;
    var subsetsName = null;

//    rpc.call('init', []).then(function(){hub.clear();}).then(function() {
    rpc.call('init', [])
    .then(function(){
    // ========================================
    //     Indyva Objects Creation
    // ========================================    

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
    var mainBar = new MainBar("#main-bar>div");

    // ----------------------------------------
    //     Dynamics
    // ----------------------------------------

    // ----------------------------------------
    //     Subset Menu
    // ----------------------------------------
    var SubsetMenu = require("subsetMenu");
    var subsetMenu = new SubsetMenu("#subset-add","#subset-list", subsetsName, "synapses");

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
    //     ComboSelector
    // ----------------------------------------
    var ComboSelector = require("comboSelector");
    var menu = new ComboSelector('#overview-menu');
    menu.options = quantitative_attrs.concat(menu.options);
    menu.update();


    // ----------------------------------------
    //     CategoricalMenu and List
    // ----------------------------------------    
    var conditionsMenu = createCoditionsMenu(definition_dselect);
    var ConditionsList = require("conditionsList");
    var conditionsList = new ConditionsList('#conditions-list', definition_dselect);    


    hub.subscribe('active_subset_change', changeDselect);
    hub.subscribe('subset_change', changeSubsets);

    function changeDselect(topic, msg) {
	if (msg.active !== null) {
	    treemap.setDselect(msg.conditionSet);
	    conditionsMenu.setConditionSet(msg.conditionSet);
	    conditionsList.setConditionSet(msg.conditionSet);
	}
	else {
	    console.log('No handled active subset change:', msg);
	}
    }

    function changeSubsets(topic, msg){
	compareMenu.setSubsets(msg);
    }


    /**
     * Only in development
     */
//    mainBar.activeCompare();
    // ----------------------------------------
    //     Compare Menu
    // ----------------------------------------
    var CompareMenu = require("compareMenu");
    var compareMenu = new CompareMenu("#compare-bar", getSchema(), subsets, "synapses");
    var compareChoices = compareMenu.getChoices();
    // ----------------------------------------
    //     LineDistributions View
    // ----------------------------------------
    var LineDistributionsView = require("lineDistributionsView");
    var lineDistributionsView = null;
    hub.subscribe('main-bar-change', function(topic, msg) {
	if (msg.active === 'compare' && lineDistributionsView === null) {
	    lineDistributionsView = new LineDistributionsView("#compare-view", compareChoices, subsetMenu.subsets, "synapses");

	    hub.subscribe('compare', function(topic, msg) {
		console.log('COMPAREEEEEEE');
		lineDistributionsView.setCompareChoices(msg);
		lineDistributionsView.refresh();
		});

	    hub.subscribe('subset_change', function(topic, msg){
		lineDistributionsView.subsets = msg;
	    });

	}
	});
    // ----------------------------------------
    //     Comparison Stats 
    // ----------------------------------------
    var StatsComparison = require("statsComparison");
    var statsComparison = new StatsComparison("#compare-stats", compareChoices, subsets, "synapses");
    hub.subscribe('compare', function(topic, msg) {
		statsComparison.setCompareChoices(msg);
		statsComparison.refresh();
		});
    
    hub.subscribe('subset_change', function(topic, msg){
	statsComparison.subsets = msg;
    });


    });
    // =============================================================

    function createCoditionsMenu(dselect, attributes) {
	var ConditionsMenu = require("conditionsMenu");
	
	var schema = getSchema();
	var conditionsMenu = new ConditionsMenu('#conditions-menu', dselect, schema);
	return conditionsMenu;
    }


    function drawTreemap(view, column) {
	when.map( groupBySpine(column),
		  function(pipeline) {
		      console.log( JSON.stringify(pipeline));
		      return rpc.call('TableSrv.aggregate', ["synapses", pipeline]);})
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

});



    function getSchema() {
	//TODO: Add schema property to table_service
	var schema = {"dataset_type": "TABLE", "index": "synapse_id", "attributes": {"synapse_id": {"attribute_type": "CATEGORICAL", "spatial": false, "key": true, "shape": [], "continuous": false, "multivaluated": false}, "dendrite_type": {"attribute_type": "CATEGORICAL", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "cell": {"attribute_type": "CATEGORICAL", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "section": {"attribute_type": "ORDINAL", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "section10um": {"attribute_type": "CATEGORICAL", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "source": {"attribute_type": "CATEGORICAL", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "area": {"attribute_type": "QUANTITATIVE", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "volume": {"attribute_type": "QUANTITATIVE", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "feret": {"attribute_type": "QUANTITATIVE", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "dist_section": {"attribute_type": "QUANTITATIVE", "spatial": false, "key": false, "shape": [], "continuous": false, "multivaluated": false}, "centroid": {"attribute_type": "QUANTITATIVE", "spatial": false, "key": false, "shape": [3], "continuous": false, "multivaluated": false}}};
	schema.attributes = _.mapValues(schema.attributes, function(v,k){v.name = k; return v;});
	return schema;
    }



