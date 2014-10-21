define(['lodash', 'context', 'd3', 'when', 'pointError'],
function(lodash, Context, d3, when) {

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
			return {name: attr.name, subset:subset, isAttr: true};
		    });
		    return {'subset':subset.name, 'attrs': [{name:subset.name, isAttr:false}].concat(attrs)};
		}).value();
	    
	    var tbody_tr = self.container.select('tbody').selectAll('tr')
		.data(table_data, function(d){return d.subset;});
	    tbody_tr.enter().append('tr');
	    tbody_tr.exit().remove();	    

	    var tbody_td =  tbody_tr.selectAll('td')
		.data(function(d){return d.attrs;}, function(d){return d.name;});
	    tbody_td.enter().append('td');
	    tbody_td.each(function(d) {
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
		    }
		});
	    tbody_td.exit().remove();

	};

	this.setSubsets =  function(subsets) {
	    self.subsets = subsets;
	    self.update();
	};
	
	this.container.html(template);
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
