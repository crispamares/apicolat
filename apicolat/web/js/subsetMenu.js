define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    function SubsetMenu(container, subsets) {
	var self = this;
	this.container = d3.select(container);
	this.subsets = subsets;

	this.subsets = [{name: 'paco', active:true}, {name: 'paco2'}];

	var button_template = _.template(
				  '	    <button type="button" class="btn btn-default "><%- name  %></button>' +
				  '	    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
				  '           <span class="caret"></span>' +
				  '	    </button>' +
				  '	    <ul class="dropdown-menu" role="menu">' +
				  '	      <li><a href="#" class="use-this">Use this</a></li>' +
				  '	      <li><a href="#" class="rename">Rename</a></li>' +
				  '	      <li><a href="#" class="duplicate">Duplicate</a></li>' +
				  '	      <li class="divider"></li>' +
				  '	      <li><a href="#" class="remove">Remove</a></li>' +
				  '	    </ul>'
				  );

	update();

	function update() {
	    var buttons = self.container.selectAll('div.btn-group')
		.data(self.subsets, function(d){return d.name;});
	    
	    buttons.enter()
		.append('div')
		.classed('btn-group', true)
		.each(function(d){ 
			  var btn_group = d3.select(this);
			  btn_group.html(button_template(d));

			  btn_group.select("button")
			      .on("click", function(){activate(d.name);});
			  btn_group.select("a.use-this")
			      .on("click", function(){activate(d.name);});
			  btn_group.select("a.duplicate")
			      .on("click", function(){duplicate(d);});
			  btn_group.select("a.remove")
			      .on("click", function(){remove(d.name);});
			  btn_group.select("a.rename")
			      .on("click", function(){modal_rename(d);});

		      });

	    buttons
		.each(function(d){ 
			  var btn_group = d3.select(this);
			  btn_group.select("button")
			      .text(d.name);
			  btn_group.selectAll('button')
			      .classed({"btn-default": !d.active, "btn-primary": d.active});
		      });

	    buttons.exit().remove();

	}

	function activate(name) {
	    _.forEach(self.subsets, function(subset) {subset.active = (subset.name === name);});
	    update();
	}

	function modal_rename(subset) {
	    // TODO show the modal
	    
	    update();
	}


	function duplicate(subset) {
	    var copy = _.clone(subset);
	    copy.name = subset.name + "_copy";
	    copy.active = false;
	    self.subsets.push(copy);
	    update();
	}

	function remove(name) {
	    self.subsets = _.remove(self.subsets, function(subset) {return (subset.name !== name);});
	    update();
	}



    }
    

    return SubsetMenu;
}
);