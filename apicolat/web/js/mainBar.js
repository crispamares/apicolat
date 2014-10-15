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
				  + '	    <li class="active groups-definition"><a href="#">Define Groups</a></li>'
				  + '	    <li class="compare"><a href="#">Compare</a></li>'
//				  + '	    <li class="export"><a href="#">Export</a></li>'
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
	var divCompare = d3.select('#compare');
	var divExport = d3.select('#export');

	this.container.select('li.groups-definition')
	    .on('click',function(){self.activeGroupsDefinition();});

	this.container.select('li.compare')
	    .on('click',function(){self.activeCompare();});

	this.container.select('li.export')
	    .on('click',function(){self.activeExport();});

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
	    divCompare.classed({show:false, hidden:true});
	    divExport.classed({show:false, hidden:true});	    

	    hub.publish('main-bar-change', {active: 'groups-definition'});
	};
	this.activeCompare = function() {
	    var li = self.container.select('li.compare');
	    self.container.selectAll('li').classed('active', false);
	    li.classed('active', true);
	    divGroupsDefinition.classed({show:false, hidden:true});
	    divCompare.classed({show:true, hidden:false});
	    divExport.classed({show:false, hidden:true});

	    hub.publish('main-bar-change', {active: 'compare'});
	};
	this.activeExport = function() {
	    var li = self.container.select('li.export');
	    self.container.selectAll('li').classed('active', false);
	    li.classed('active', true);
	    divGroupsDefinition.classed({show:false, hidden:true});
	    divCompare.classed({show:false, hidden:true});
	    divExport.classed({show:true, hidden:false});

	    hub.publish('main-bar-change', {active: 'export'});
	};

	
    }
    
    return MainBar;
}
);
