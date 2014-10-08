define(['lodash', 'jquery', 'context', 'd3', 'when'],
function(lodash, jquery, Context, d3, when) {

    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function CompareMenu(container, schema, subsets, dataset) {
	var self = this;
	this.container = d3.select(container);
	this.schema = schema;
	this.subsets = subsets;
	this.dataset = dataset;

	this.quantitative_attrs = _.filter(schema.attributes, {attribute_type:'QUANTITATIVE', shape:[]});
	this.categorical_attrs = _.filter(schema.attributes, {attribute_type:'CATEGORICAL'});

	var template = '         <form class="form-inline" role="form">'
	    + '        <div class="form-group well well-sm well-white">'
	    + '	    <span>Compare the</span>'
	    + '	    <select class="form-control attr">'
	    + '	    </select>'
	    + '        </div>'

	    + '        <div class="form-group well well-sm well-white">'
//	    + '	    <button class="btn btn-default glyphicon glyphicon-ok-circle"></button>'
	    + '	    <span>Between</span>'
	    + '	    <select class="form-control subset1">'
	    + '	    </select>'
	    + '	    <span>and</span>'
	    + '	    <select class="form-control subset2">'
	    + '	    </select>'
	    + '        </div>'

	    + '        <div class="form-group well well-sm well-white">'
	    + '	    <span>Split by</span>'
	    + '	    <select class="form-control facet-attr">'
	    + '	    </select>'
	    + '	    </div>'

	    + '     <button type="button" class="btn btn-primary compare"> Compare </button>'

	    + '	</form>';


	this.update = function() {
	    var optionAttr = self.container.select('select.attr').selectAll('option')
		    .data(self.quantitative_attrs, function(d){return d.name;});
	    optionAttr.enter()
		.append('option');
	    optionAttr.text(function(d){return d.name;});
	    optionAttr.exit().remove();

	    var optionSubset1 = self.container.select('select.subset1').selectAll('option')
		    .data(self.subsets, function(d){return d.name;});
	    optionSubset1.enter()
		.append('option');
	    optionSubset1.text(function(d){return d.name;});
	    optionSubset1.exit().remove();
	    
	    var optionSubset2 = self.container.select('select.subset2').selectAll('option')
		    .data(self.subsets, function(d){return d.name;});
	    optionSubset2.enter()
		.append('option');
	    optionSubset2.text(function(d){return d.name;});
	    optionSubset2.exit().remove();

	    var optionFacetAttr = self.container.select('select.facet-attr').selectAll('option')
		    .data(self.categorical_attrs, function(d){return d.name;});
	    optionFacetAttr.enter()
		.append('option');
	    optionFacetAttr.text(function(d){return d.name;});
	    optionFacetAttr.exit().remove();

	};

	this.setSubsets =  function(subsets) {
	    self.subsets = subsets;
	    self.update();
	};

	this.getChoices =  function() {
	    var choices = {attr: self.container.select('select.attr').property('value'),
		       subset1: self.container.select('select.subset1').property('value'),
		       subset2: self.container.select('select.subset2').property('value'),
		       facetAttr: self.container.select('select.facet-attr').property('value')};
	    return choices;
	};

	this.onCompare = function() {
	    var msg = self.getChoices();
	    hub.publish("compare", msg);
	};

	this.container.html(template);

	this.container.select('button.compare')
	    .on('click', this.onCompare);

	this.update();
    }
    

    return CompareMenu;
}
);
