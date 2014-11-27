define(['lodash','context', 'd3', 'FileSaver', 'when'],
function(lodash, Context, d3, saveAs, when) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function MainBar(container, table, subsets) {
	var self = this;
	this.container = d3.select(container);
	this.table = table;
	this.subsets = subsets;
	var template = _.template('<nav class="navbar navbar-default" role="navigation">'
				  + '   <div class="container-fluid">'
				  + '	  <div class="navbar-header">'
				  + '	    <a class="navbar-brand" href="#">Beta</a>'
				  + '	  </div> '
				  + '	  <ul class="nav navbar-nav">'
				  + '	    <li class="active groups-definition"><a href="#">Define Subsets</a></li>'
				  + '	    <li class="multi-dist-compare"><a href="#">Compare M:N</a></li>'
				  + '	    <li class="dist-compare"><a href="#">Compare 1:1</a></li>'
				  + '	  </ul>'
				  + '     <ul class="nav navbar-nav navbar-right">'
				  + '	      <li class="dropdown">'
				  + '	      <a href="#" class="dropdown-toggle" data-toggle="dropdown"> Analysis <span class="caret"></span></a>'
				  + '	      <ul class="dropdown-menu" role="menu">'
				  + '		  <li><a href="#" class="menu-open-file">Open...</a><input style="display:none" type="file" class="open-file"></li>'
				  + '		  <li><a href="#" class="menu-save-file">Save</a></li>'				  
				  + '	      </ul>'
				  + '	      </li>'
				  + '	  </ul>'
				  + '	  </div>'
				  + '	</nav>');
	var html = template();
	this.container.html(html);

	var divGroupsDefinition = d3.select('#groups-definition');
	var divDistCompare = d3.select('#dist-compare');
	var divMultiDistCompare = d3.select('#multi-dist-compare');

	this.container.select('a.navbar-brand')
	    .on('click',function(){self.activeGroupsDefinition();});

	this.container.select('li.groups-definition')
	    .on('click',function(){self.activeGroupsDefinition();});

	this.container.select('li.dist-compare')
	    .on('click',function(){self.activeDistCompare();});

	this.container.select('li.multi-dist-compare')
	    .on('click',function(){self.activeMultiDistCompare();});

	this.container.select('a.menu-open-file')
	    .on('click',function(){self.container.select("input.open-file")
				   .node().click();});
	this.container.select('a.menu-save-file')
	    .on('click',function(){self.saveFile();});

	self.container.select("input.open-file")
	    .on('change', function(){self.loadFile(d3.event);});

	this.loadFile = function(event) {
	    var files = event.target.files;
	    var reader = new FileReader();
	    reader.readAsText(files[0]);
	    event.target.value = ""; // So same file rise onChange

	    reader.onload = function() {
		var grammar = JSON.parse(this.result);
		    
	    when.join(rpc.call("DynSelectSrv.clear", []), rpc.call("SharedObjectSrv.clear", []))
		.then(function(){ return rpc.call("GrammarSrv.build", [grammar, [self.table]]); })
		.done(function(){ 
		    hub.publish("analysis_load", null);} );

	    };
	    
	};

	this.saveFile = function() {

	    rpc.call("GrammarSrv.new_root", ['root'])
		.then(function(){ rpc.call("GrammarSrv.add_dataset", ['root', [self.table, self.subsets]]);})
		.then(function(){ return rpc.call("SharedObjectSrv.pull", [self.subsets]);})
		.then(function(subsets){ 
		    return when.map(subsets[0], 
			function(subset) {
			    return rpc.call("DynSelectSrv.get_conditions", [subset.conditionSet])
				.then(function(conditions){ rpc.call("GrammarSrv.add_condition", ['root', conditions]);})
				.then(function(){ rpc.call("GrammarSrv.add_dynamic", ['root', subset.conditionSet]);});
			});
		})
		.then(function(){ return rpc.call("GrammarSrv.grammar", ['root']);})
		.then(function(grammar){ 
		    var blob = new Blob([JSON.stringify(grammar)], {type: "text/plain;charset=utf-8"});
		    saveAs(blob, self.table+"-analysis.json");
		})
		.done(function() { rpc.call("GrammarSrv.del_root", ['root']);});

	};


	this.activeGroupsDefinition = function() {
	    var li = self.container.select('li.groups-definition');
	    self.container.selectAll('li').classed('active', false);
	    li.classed('active', true);
	    divGroupsDefinition.classed({show:true, hidden:false});
	    divDistCompare.classed({show:false, hidden:true});	    
	    divMultiDistCompare.classed({show:false, hidden:true});

	    hub.publish('main-bar-change', {active: 'groups-definition'});
	};
//	this.activeCompare = function() {
//	    var li = self.container.select('li.compare');
//	    self.container.selectAll('li').classed('active', false);
//	    li.classed('active', true);
//	    divGroupsDefinition.classed({show:false, hidden:true});
//	    divCompare.classed({show:true, hidden:false});
//	    divDistCompare.classed({show:false, hidden:true});
//
//	    hub.publish('main-bar-change', {active: 'compare'});
//	};
	this.activeDistCompare = function() {
	    var li = self.container.select('li.dist-compare');
	    self.container.selectAll('li').classed('active', false);
	    li.classed('active', true);
	    divGroupsDefinition.classed({show:false, hidden:true});
	    divDistCompare.classed({show:true, hidden:false});
	    divMultiDistCompare.classed({show:false, hidden:true});

	    hub.publish('main-bar-change', {active: 'dist-compare'});
	};
	this.activeMultiDistCompare = function() {
	    var li = self.container.select('li.multi-dist-compare');
	    self.container.selectAll('li').classed('active', false);
	    li.classed('active', true);
	    divGroupsDefinition.classed({show:false, hidden:true});
	    divDistCompare.classed({show:false, hidden:true});
	    divMultiDistCompare.classed({show:true, hidden:false});

	    hub.publish('main-bar-change', {active: 'multi-dist-compare'});
	};

	
    }
    
    return MainBar;
}
);
