define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    function SubsetMenu(addContainer, listContainer, subsets) {
	var self = this;
	this.listContainer = d3.select(listContainer);
	this.subsets = subsets;

	this.subsets = [{name: 'paco', active:true}, {name: 'paco2'}];

	d3.select(addContainer)
	  .append('button')
	    .attr('class', "btn btn-default")
	    .on('click', createSubset)
	    .append('span')
		.attr('class', "glyphicon")
		.attr('title', 'Add new subset')
		.text('+');


	var subsets_template = _.template(
				  '	    <button type="button" class="btn btn-default "><%- name  %></button>' +
				  '	    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
				  '           <span class="caret"></span>' +
				  '	    </button>' +
				  '	    <ul class="dropdown-menu" role="menu">' +
				  '	      <li><a href="#" class="use-this">Use this</a></li>' +
				  '	      <li><a href="#" class="rename">Rename</a></li>' +
//				  '	      <li><a href="#" class="duplicate">Duplicate</a></li>' +
				  '	      <li class="divider"></li>' +
				  '	      <li><a href="#" class="remove">Remove</a></li>' +
				  '	    </ul>'
				  );

	update();



	function update() {
	    var buttons = self.listContainer.selectAll('div.btn-group')
		.data(self.subsets, function(d){return d.name;});
	    
	    buttons.enter()
		.append('div')
		.classed('btn-group', true)
		.each(function(d){ 
			  var btn_group = d3.select(this);
			  btn_group.html(subsets_template(d));

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
	    var modalTemplate = 
		'  <div class="modal-dialog">' +
		'    <div class="modal-content">' +
		'      <div class="modal-header">' +
		'        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
		'        <h4 class="modal-title">Rename the subset</h4>' +
		'      </div>' +
		'      <div class="modal-body">' +
		'        <input type="text" class="form-control" placeholder="New unique name">' +
		'      </div>' +
		'      <div class="modal-footer">' +
		'        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
		'        <button type="button" class="btn btn-primary submit">Save changes</button>' +
		'      </div>' +
		'    </div><!-- /.modal-content -->' +
		'  </div><!-- /.modal-dialog -->';
	
	    var renameModal = d3.selectAll('#rename-subset-modal')
		.data([subset]);
	    renameModal.enter()
		.append('div')
		.attr('class', "modal")
		.attr('id', 'rename-subset-modal')
		.html(modalTemplate);

	    renameModal.select('input')
		.property('value', subset.name)
		.on('input', function(){
			/**
			 * Validation: the name must be unique
			 */
			var newName = this.value;
			var used = (_.some(self.subsets, function(s){return s.name === newName;}));
			
			renameModal.select('.modal-body').classed('has-error', used);
			renameModal.select('button.submit').attr('disabled', function(){return (used)? 'disabled': null;});
		    });


	    renameModal.select('button.submit')
		.attr('disabled', 'disabled')
		.on('click', function(){
			var input = renameModal.select('input');
			var newName = input.property('value');
			if (!_.some(self.subsets, function(s){return s.name === newName;})
			    || subset.name === newName
			   )
			{
			    subset.name = newName;
			    $('#rename-subset-modal').modal('hide');
			    update();	
			}
			
		    });

	    $('#rename-subset-modal').modal('show');
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

	function createSubset() {
	    self.subsets.push({name:'The new one'});
	    update();
	}



    }
    

    return SubsetMenu;
}
);