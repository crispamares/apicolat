define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();

    function MainBar(container) {
	this.container = $(container);
	var template = _.template('<nav class="navbar navbar-default" role="navigation">'
				  + '	  <div class="navbar-header">'
				  + '	    <a class="navbar-brand" href="#">Brand</a>'
				  + '	  </div> '
				  + '	  <ul class="nav navbar-nav">'
				  + '	    <li class="active"><a href="#">Define Groups</a></li>'
				  + '	    <li><a href="#">Compare</a></li>'
				  + '	    <li><a href="#">Export</a></li>'
				  + '	  </ul>'
				  + '	</nav>');
	var html = template();
	console.log('paco', html);
	this.container.append(html);
    }
    
    return MainBar;
}
);