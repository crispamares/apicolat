define(['lodash','ws-rpc', 'hub', 'd3'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();

    function MainBar(container) {
	var self = this;
	this.container = d3.select(container);
	var template = _.template('<nav class="navbar navbar-default" role="navigation">'
				  + '	  <div class="navbar-header">'
				  + '	    <a class="navbar-brand" href="#">Brand</a>'
				  + '	  </div> '
				  + '	  <ul class="nav navbar-nav">'
				  + '	    <li class="active groups-definition"><a href="#">Define Groups</a></li>'
				  + '	    <li class="compare"><a href="#">Compare</a></li>'
				  + '	    <li class="export"><a href="#">Export</a></li>'
				  + '	  </ul>'
				  + '	</nav>');
	var html = template();
	this.container.html(html);

	var divGroupsDefinition = d3.select('#groups-definition');
	var divCompare = d3.select('#compare');
	var divExport = d3.select('#export');

	this.container.select('li.groups-definition')
	    .on('click',function(){
		    self.container.selectAll('li').classed('active', false);
		    d3.select(this).classed('active', true);
		    divGroupsDefinition.classed({show:true, hidden:false});
		    divCompare.classed({show:false, hidden:true});
		    divExport.classed({show:false, hidden:true});
		});

	this.container.select('li.compare')
	    .on('click',function(){
		    self.container.selectAll('li').classed('active', false);
		    d3.select(this).classed('active', true);
		    divGroupsDefinition.classed({show:false, hidden:true});
		    divCompare.classed({show:true, hidden:false});
		    divExport.classed({show:false, hidden:true});
		});

	this.container.select('li.export')
	    .on('click',function(){
		    self.container.selectAll('li').classed('active', false);
		    d3.select(this).classed('active', true);
		    divGroupsDefinition.classed({show:false, hidden:true});
		    divCompare.classed({show:false, hidden:true});
		    divExport.classed({show:true, hidden:false});
		});

    }
    
    return MainBar;
}
);