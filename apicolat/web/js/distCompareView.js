define(['lodash', 'context', 'd3', 'when', 'pointError', 'statsComparison'],
function(lodash, Context, d3, when, PointError, StatsComparison) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function DistCompareView(container, schema, subsets, dataset) {
	var self = this;
	this.container = d3.select(container);
	this.tableContainer = null;
	this.schema = schema;
	this.subsets = subsets;
	this.dataset = dataset;

	this.quantitative_attrs = _(schema.attributes).filter({attribute_type:'QUANTITATIVE', shape:[]}).sortBy('name').value();
	this.categorical_attrs = _.filter(schema.attributes, {attribute_type:'CATEGORICAL'});


	var template = '' +
	      '<div class="table-responsive">' +
		'<table class="table table-bordered">' +
		  '<thead>' +
		  '</thead>' +
		  '<tbody>' +
		  '</tbody>' +
		'</table>' +
	      '</div>';

	this.statsInfoModalTemplate = 
	    '  <div class="modal-dialog modal-lg">' +
	    '    <div class="modal-content">' +
	    '      <div class="modal-header">' +
	    '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
	    '        <h4 class="modal-title"><%= title %></h4>' +
	    '      </div>' +
	    '      <div class="modal-body">' +
	    '        <%= statsResults %>' +
	    '      </div>' +
	    '    </div>' +
	    '  </div>';

	this.plotsModalTemplate = 
	    '  <div class="modal-dialog modal-lg">' +
	    '    <div class="modal-content">' +
	    '      <div class="modal-header">' +
	    '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
	    '        <h4 class="modal-title"><%= title %></h4>' +
	    '      </div>' +
	    '      <div class="modal-body">' +
	    '        <ul class="nav nav-tabs" role="tablist">' +
	    '          <li role="presentation" class="active boxplot"><a href="#modal-box-plot" role="tab" data-toggle="tab">Box Plot</a></li>' +
	    '          <li role="presentation" class="kdeplot"><a href="#modal-kde-plot" role="tab" data-toggle="tab">KDE Plot</a></li>' +
	    '        </ul>' +
	    '        <div class="tab-content">' +
	    '          <div role="tabpanel" class="tab-pane active" id="modal-box-plot"><%= boxplot %></div>' +
	    '          <div role="tabpanel" class="tab-pane" id="modal-kde-plot"><%= kdeplot %></div>' +
	    '        </div>	    ' +
	    '      </div>' +
	    '    </div>' +
	    '  </div>';
	
	self.container.append('div')
	    .attr("id", "stats-info-modal")
	    .attr("class", "modal")
	    .html(_.template(this.statsInfoModalTemplate, {statsResults:"", title:""}));

	self.container.append('div')
	    .attr("id", "plots-modal")
	    .attr("class", "modal")
	    .html(_.template(this.plotsModalTemplate, {boxplot:"", kdeplot:"", title:""}));

	this.update = function() {

	    var thead_tr = self.tableContainer.select('thead').selectAll('tr')
		.data([0]);
	    thead_tr.enter().append('tr');
	    var thead_th = thead_tr.selectAll('th')
		.data([{"name":'#'}].concat(self.quantitative_attrs), function(d){return d.name;});
	    thead_th.enter().append('th');
	    thead_th.html(function(d){return '<span>'+d.name+'</span>';})
		.each(function(d) {
		    if (d.name === '#') return;
		    var button = d3.select(this).append('button')
			.attr("class", "btn btn-link btn-sm");
		    button.append('span')
			.attr("class", "glyphicon glyphicon-stats");
		    button.on('click', function() {
			var dselects = _.pluck(self.subsets, 'conditionSet');
			var subsetNames = _.pluck(self.subsets, 'name');
			drawModal('#plots-modal', self.plotsModalTemplate, self.dataset, d.name, dselects, subsetNames);
			d3.event.stopPropagation();
		    });
		});
	    thead_th.exit().remove();
	
	    var table_data = _(self.subsets).map(
		function(subset) {
		    var attrs = _.map(self.quantitative_attrs, function(attr) {
			return {name: attr.name, subset:subset, isAttr: true, isSelected: false};
		    });
		    return {'subset':subset.name, 'attrs': [{name:subset.name, isAttr:false}].concat(attrs)};
		}).value();
	    
	    var tbody_tr = self.tableContainer.select('tbody').selectAll('tr')
		.data(table_data, function(d){return d.subset;});
	    tbody_tr.exit().remove();	    
	    tbody_tr.enter().append('tr');


	    var tbody_td =  tbody_tr.selectAll('td')
		.data(function(d){return d.attrs;}, function(d){return d.name;});
	    tbody_td.exit().remove();
	    tbody_td.enter().append('td')
		.classed("attr", function(d){return d.isAttr;});
	    tbody_td
		.classed("selected", false)
		.each(function(d) {
		    var cell = this;
		    if (! d.isAttr) {
			this.textContent = d.name;
		    }
		    else {
			this.innerHTML = '<span class="glyphicon glyphicon-time"></span>';
			drawDistPlot(this, self.dataset, d.name, d.subset.conditionSet)
			    .otherwise(function(){
				cell.innerHTML = '<span class="glyphicon glyphicon-ban-circle"></span>';
			    });
			d3.select(this).on('click', null);
			d3.select(this)
			    .on('click', function(d){
				var attr_td = tbody_td.filter(function(d){return d.isAttr;});
				toggleSelection(this, d, attr_td);
			});
		    }
	    });

	};

	function toggleSelection(cell, cell_d, attr_td) {
	    var selected = cell.classList.toggle("selected");
	    attr_td.classed("selected", function(d){return (cell_d !== d)? 
						 false 
						 : this.classList.contains("selected");});
	    attr_td.selectAll('div.stats').remove();
	    if (selected) {
		return computeStatTest(cell_d, attr_td);
	    }
	    return null;
	}

	function computeStatTest(cell_d, attr_td) {
	    var subset = cell_d.subset;
	    var attr = cell_d.name;

	    attr_td.filter(function(d){
		    return d.name === attr && d.subset !== subset;})
		.each(function(d){
		    compareSubsets(attr, subset.name, d.subset.name, this);
		});
	}

	function compareSubsets(attr, subset_name, subset2_name, cell) {
//	    var container = d3.select().append("div").node();
	    var container = document.createElement("div");
	    var compareChoices = {
		attr: attr,
		subset1: subset_name,
		subset2: subset2_name
	    };
	    var statsComparison = new StatsComparison(container, 
						      compareChoices, 
						      self.subsets, 
						      self.dataset);


	    statsComparison.refresh()
		.then(function(){
		    console.log('res', statsComparison.compareTwoResults);

		    var stats_div = d3.select(cell).selectAll("div.stats")
			    .data([statsComparison.compareTwoResults]);
		    stats_div.enter().append('div').attr("class", "stats btn btn-default");
		    stats_div
			.on("click", function() {
			    $("#stats-info-modal")
				.html(_.template(self.statsInfoModalTemplate, {statsResults:container.innerHTML,
									       title:"Statistical Test Results"}))
				.modal();
			    d3.event.stopPropagation();
			})
			.append('span')
			.attr("class", "glyphicon glyphicon-info-sign")
			.text(composeStatsAbstarct(subset_name,
							subset2_name, 
							statsComparison.compareTwoResults));


	    });
	}

	function composeStatsAbstarct(subset1, subset2, compareTwoResults) {
	    var text = ' ';
	    if (compareTwoResults.greater.rejected) {
		text += subset2 + " > " + subset1;
	    }
	    if (compareTwoResults.less.rejected) {
		text += subset2 + " < " + subset1;
	    }
	    if (! compareTwoResults['two-sided'].rejected) {
		text += subset2 + " ~ " + subset1;
	    }
	    return text;
	}

	this.setSubsets =  function(subsets) {
	    self.subsets = subsets;
	    self.update();
	};
	
	this.tableContainer = this.container.append('div').html(template);
	this.update();

	function drawDistPlot(cell, dataset, attr, conditionSet) {
	    
	    return rpc.call('dist_plot', [dataset, attr, conditionSet])
		.then(function(png) {
		    d3.select(cell).html(null);
		    var img = placeImg(cell, png);
		    img.attr('class', "img-responsive");
		    d3.select(cell)
			.on('mouseover', function(){img.classed("img-responsive", false);})
			.on('mouseout', function(){img.classed("img-responsive", true);});
		});
	}

	function placeImg(container, png) {
	    var img = d3.select(container).selectAll('img')
		    .data([0])
		    .enter().append('img');
	    img.attr('src', 'data:image/png;base64,'+png);
	    return img;
	}

	function drawCell(cell, dataset, attr, conditionSet) {
	    var pointErrorPlot = d3.pointError()
		.height(200)
		.width(15);
	    
	    return rpcGetSubsetData(dataset, attr, conditionSet)
		.then(function(points) {
		    var svg = d3.select(cell).selectAll('svg').data([0])
			.enter()
			.append('svg');

		    svg.datum(points)
			.call(pointErrorPlot);
		});

	}

	function rpcGetSubsetData(dataset, attr, conditionSet) {
	    return rpc.call('DynSelectSrv.query', [conditionSet])
		.then(function(query){
		    var project = {};
		    project[attr] = true;
		    return rpc.call('TableSrv.find', [dataset, query, project]);
		})
		.then(function(tableview) {
		    return rpc.call('TableSrv.get_data', [tableview, "c_list"]);
		});	
	}


	function drawModal(modalContainerID, modalTemplate, dataset, attr, dselects, subsetNames) {
	    var boxNode = document.createElement("div");
	    var kdeNode = document.createElement("div");
	    return drawBoxPlot(self.dataset, attr, dselects, subsetNames)
		.then(function(png){placeImg(boxNode, png);})
		.then(function(){
		    return drawAggredatedKdePlot(self.dataset, attr, dselects, subsetNames);
		})
		.then(function(png){placeImg(kdeNode, png);})
		.then(function() {
		    $(modalContainerID)
			.html(_.template(modalTemplate,  {boxplot:boxNode.innerHTML, 
							  kdeplot:kdeNode.innerHTML,
							  title:attr+" distribution"}))
			.modal();
		});
	}


	function drawBoxPlot(container, dataset, attr, dselects, subsetNames) {
	    return _drawComparativePlot('box_plot', container, dataset, attr, dselects, subsetNames);
	}

	function drawAggredatedKdePlot(container, dataset, attr, dselects, subsetNames) {
	    return _drawComparativePlot('aggregated_dist_plot', container, dataset, attr, dselects, subsetNames);
	}

	function _drawComparativePlot(remoteCall, dataset, attr, dselects, subsetNames) {
	    return rpc.call(remoteCall, [dataset, attr, dselects, subsetNames]);
	}

    }
    
    return DistCompareView;
}
);
