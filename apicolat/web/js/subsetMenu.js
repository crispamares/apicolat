define(['lodash', 'jquery', 'context', 'd3', 'when'],
function(lodash, jquery, Context, d3, when) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function SubsetMenu(addContainer, listContainer, subsetsName, dataset) {
	var self = this;
	this.listContainer = d3.select(listContainer);
	this.subsetsName = subsetsName;
	this.subsets = null;
	this.subsets_v = null;
	this.dataset = dataset;

	this.counter = 0;

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
//				  '	      <li><a href="#" class="use-this">Use this</a></li>' +
				  '	      <li><a href="#" class="rename">Rename</a></li>' +
				  '	      <li><a href="#" class="export">Export</a></li>' +
//				  '	      <li><a href="#" class="duplicate">Duplicate</a></li>' +
				  '	      <li class="divider"></li>' +
				  '	      <li><a href="#" class="remove">Remove</a></li>' +
				  '	    </ul>'
				  );

	rpc.call("SharedObjectSrv.pull", [this.subsetsName])
	    .then(onChange);

	hub.subscribe(subsetsName+":change", function(topic, msg) { onChange(msg.result);});

	function update() {
	    var buttons = self.listContainer.selectAll('div.btn-group')
		.data(self.subsets, function(d){return d.name;});
	    
	    buttons.enter()
		.insert('div', addContainer)
		.classed('btn-group tab', true)
		.each(function(d){ 
			  var btn_group = d3.select(this);
			  btn_group.html(subsets_template(d));
		      });

	    buttons
		.each(function(d){ 
			  var btn_group = d3.select(this);
			  btn_group.select("button")
			      .text(d.name);
			  btn_group.selectAll('button')
			      .classed({"btn-default": !d.active, "btn-primary": d.active});

			  btn_group.select("button")
			      .on("click", function(){activate(d.name);});
			  btn_group.select("a.use-this")
			      .on("click", function(){activate(d.name);});
			  btn_group.select("a.duplicate")
			      .on("click", function(){duplicate(d);});
			  btn_group.select("a.remove")
			      .on("click", function(){remove(d.name);});
			  btn_group.select("a.rename")
			      .on("click", function(){rename(d.name);});
			  btn_group.select("a.export")
			      .on("click", function(){exportDSelect(d.conditionSet, self.dataset, d.name);});

		      });

	    buttons.select("a.remove")
		.classed('text-muted', function(){return (self.subsets.length <= 1); });

	    buttons.exit().remove();

	}

	function activate(name) {
	    var activated = null;
	    var hasChanged = false;
	    _.forEach(self.subsets, function(subset) {
			  if (subset.name === name) {
			      activated = subset;
			      hasChanged = ! activated.active;
			  }
			  subset.active = (subset.name === name);
		      });
	    if (hasChanged) {
		hub.publish("active_subset_change", _.clone(activated));		
	    }
	    return rpcPush(self.subsets, self.subsets_v);
	}


	this.publishActive = function publishActive() {
	    _.forEach(self.subsets, function(subset) {
			  if (subset.active) {
			      hub.publish("active_subset_change", _.clone(subset));
			  }
		      });
	};

	function rename(name) {
	    var deferred = when.defer();
	    var subset = _.find(self.subsets, {name:name});

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
		'        <button type="button" class="btn btn-default cancel" data-dismiss="modal">Close</button>' +
		'        <button type="button" class="btn btn-primary submit">Rename</button>' +
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
			    rpcPush(self.subsets, self.subsets_v)
				.then(function(){
				    deferred.resolve(newName);
				    $('#rename-subset-modal').modal('hide');
				})
				.otherwise(function(){
				    console.error("No possible to push changes of subsets");
				    deferred.reject();
				});
			}
			
		    });
	    renameModal.select('button.cancel')
		.on('click', function(){
			deferred.reject();
		    });
	    $('#rename-subset-modal').modal('show');
	    $('#rename-subset-modal').on('hide.bs.modal', function(){deferred.reject();});

	    //This behavior may be overwritten
//	    deferred.promise.then(function() {hub.publish("subset_change", _.clone(self.subsets));} );
	    return deferred.promise;
	}


	function duplicate(subset) {
	    var copy = _.clone(subset);
	    copy.name = subset.name + "_copy";
	    copy.active = false;
	    self.subsets.push(copy);
	    return rpcPush(self.subsets, self.subsets_v);
	}

	function remove(name) {
	    if (self.subsets.length == 1) return;
	    
	    var subset = _.find(self.subsets, {name:name});
	    self.subsets = _.without(self.subsets, subset);
	    rpcPush(self.subsets, self.subsets_v);
	    if (subset.active) {
		activate(self.subsets[0].name);
	    }
	}

	function createSubset() {
	    var subset = {name:'new_subset-'+(++self.counter)};
	    self.subsets.push(subset);
	    createDSelect(subset.name, self.dataset)
		.then(function(){activate(subset.name);})
		.done(update);
	}

	function createDSelect(name, dataset) {
	    return rpc.call('DynSelectSrv.new_dselect', [name, dataset, 'AND'])
		.then(function(fullName){
			  var subset = _.find(self.subsets, {name:name});
			  subset.conditionSet = fullName;
			  return rpcPush(self.subsets, self.subsets_v);
		      });
	}

	function exportDSelect(conditionSet, dataset, name) {
	    var modalTemplate = 
		'  <div class="modal-dialog">' +
		'    <div class="modal-content">' +
		'      <div class="modal-header">' +
		'        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
		'        <h4 class="modal-title">Successful export</h4>' +
		'      </div>' +
		'      <div class="modal-body">' +
		'        <p class="h5"> Exported to <a href="http://<%= path %>" target="_blank"><%= path %></a></p>' +
		'      </div>' +
		'    </div><!-- /.modal-content -->' +
		'  </div><!-- /.modal-dialog -->';
	    var renameModal = d3.selectAll('#export-subset-modal')
		.data([conditionSet]);
	    renameModal.enter()
		.append('div')
		.attr('class', "modal")
		.attr('id', 'export-subset-modal');

	    rpc.call('export_dselect', [conditionSet, dataset, name])
		.then(function(d){ 
			  var path = window.location.host + window.location.pathname + d;
			  renameModal.html(_.template(modalTemplate, {path:path}));
			  $('#export-subset-modal').modal('show');
		      })
		.otherwise(showError);
	};




	this.pull = function pull(name) {
	    return rpc.call("SharedObjectSrv.pull", [name])
		.then(onChange);
	};

	function onChange(so) {
	    self.subsets = so[0];
	    self.subsets_v = so[1];
	    self.counter = Math.max(self.counter, self.subsets.length -1);

	    hub.publish("subset_change", _.clone(self.subsets));
	    update();
	}

	function rpcPush(subsets, subsets_v) {
	    var deferred = when.defer();

	    rpc.call("SharedObjectSrv.push", ["subsets", subsets, subsets_v])
		.then(function(res){
		    var conflict = res[0],
			newVersion = res[1];
		    self.subsets_v = newVersion;
		    if (conflict) {
			rpc.call("SharedObjectSrv.pull", ["subsets"])
			    .then(function(so) {
				self.subsets = so[0];
				self.subsets_v = so[1];

				deferred.reject();
			    });
		    }
		    else {			
			deferred.resolve(subsets);
		    }
		});

	    return deferred.promise;
	}

    }
    

    return SubsetMenu;
}
);
