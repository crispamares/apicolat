define(['lodash', 'context', 'd3', 'when', 'pointError', 'statsComparison'],
function(lodash, Context, d3, when, PointError, StatsComparison) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function DistCompareView(container, schema, subsets, dataset) {
	var self = this;
	this.container = d3.select(container);
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

	this.modalTemplate = 
	    '  <div class="modal-dialog modal-lg">' +
	    '    <div class="modal-content">' +
	    '      <div class="modal-header">' +
	    '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
	    '        <h4 class="modal-title">Statistical Test Results</h4>' +
	    '      </div>' +
	    '      <div class="modal-body">' +
	    '        <%=statsResults%>' +
	    '      </div>' +
	    '    </div>' +
	    '  </div>';
	
	self.container.append('div')
	    .attr("id", "stats-info-modal")
	    .attr("class", "modal")
	    .html(_.template(this.modalTemplate, {statsResults:"POOOO"}));

	this.update = function() {

	    var thead_tr = self.container.select('thead').selectAll('tr')
		.data([0]);
	    thead_tr.enter().append('tr');

	    var thead_th =  thead_tr.selectAll('th')
		.data([{name:'#'}].concat(self.quantitative_attrs), function(d){return d.name;});
	    thead_th.enter().append('th');
	    thead_th.text(function(d){return d.name;});
	    thead_th.exit().remove();
	
	    var table_data = _(self.subsets).map(
		function(subset) {
		    var attrs = _.map(self.quantitative_attrs, function(attr) {
			return {name: attr.name, subset:subset, isAttr: true, isSelected: false};
		    });
		    return {'subset':subset.name, 'attrs': [{name:subset.name, isAttr:false}].concat(attrs)};
		}).value();
	    
	    var tbody_tr = self.container.select('tbody').selectAll('tr')
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
			drawKdePlot(this, self.dataset, d.name, d.subset.conditionSet)
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
			.append('span')
			.attr("class", "glyphicon glyphicon-info-sign")
			.text(composeStatsAbstarct(subset_name, 
							subset2_name, 
							statsComparison.compareTwoResults))
			.on("click", function() {
			    $("#stats-info-modal")
				.html(_.template(self.modalTemplate, {statsResults:container.innerHTML}))
				.modal();
			    d3.event.stopPropagation();
			});


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
	
	this.container.append('div').html(template);
	this.update();


	function drawKdePlot(cell, dataset, attr, conditionSet) {
	    
	    return rpc.call('kde_plot', [dataset, attr, conditionSet])
		.then(function(png) {
		    d3.select(cell).html(null);
		    var img = d3.select(cell).selectAll('img')
			.data([0])
			.enter().append('img');
		    img.attr('src', 'data:image/png;base64,'+png)
			.attr('class', "img-responsive");
		    d3.select(cell)
			.on('mouseover', function(){img.classed("img-responsive", false);})
			.on('mouseout', function(){img.classed("img-responsive", true);});
		});

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


    }
    
    return DistCompareView;
}
);
