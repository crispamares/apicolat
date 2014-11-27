define(['lodash', 'jquery', 'context', 'd3', 'when'],
function(lodash, jquery, Context, d3, when) {
    var context = Context.instance();
    var rpc = context.rpc;
    var hub = context.hub;

    function ConditionsMenu(container, conditionSet, schema, attributes, service) {
	var self = this;
	this.container = $(container);
	this.conditionSet = conditionSet;
	this.schema = schema;

	this.attributes = attributes || _(schema.attributes).keys().sort().value();
	this.service = service || 'DynSelectSrv';

	var template = _.template('	  <div class="col-sm-12">'
				  + '       <div class="well well-sm well-white clearfix">'
				  + '         <form>'
				  + '	        <div class="row" style="line-height: 29px;">'
				  + '             <div class="col-xs-3">'
				  + '               <label> Filter by: </label>'
				  + '             </div>'
				  + '             <div class="col-xs-8 row">'
				  + '		  <select class="form-control"> </select>'
				  + '             </div>'
				  + '             <div class="">'
				  + '	            <button type="button" class="btn btn-default" >'
				  + '		      <span class="glyphicon glyphicon-plus"></span>'
				  + '	            </button>'
				  + '             </div>'
				  + '           </div>'
				  + '	      </form>'
				  + '	    </div>'
				  + '     </div>');
	var html = template();
	this.container.append(html);

	this.update();

	var select_widget = d3.select(container).select("select");
	d3.select(container)
	    .select("button")
	    .on("click", function(){self.addCondition(select_widget.property("value"));});
    }
    
    ConditionsMenu.prototype.update =  function() {
	var self = this;
	console.log('updating', this, JSON.stringify(this.attributes));

	var option = d3.select(this.container.selector).select("select")
	    .selectAll('option').data(self.attributes, _.identity);
	option.enter()
	    .append('option')
	    .classed('hidden', function(d){
		    var attr = self.schema.attributes[d];
		    console.log(attr);
		    return (attr.shape.length > 0 
			    || _.indexOf(['CATEGORICAL', 'QUANTITATIVE'], 
				      attr.attribute_type) === -1);
	    })
	    .text(_.identity);

	option.exit()
	    .remove();

    };

    ConditionsMenu.prototype.addCondition = function(attribute) {
	var self = this;
	var attribute_schema = this.schema.attributes[attribute];
	if (attribute_schema.attribute_type === 'CATEGORICAL') {
	    rpc.call(this.service+'.new_categorical_condition', [this.conditionSet, attribute])
		.otherwise(showError);	    
	}
	else if (attribute_schema.attribute_type === 'QUANTITATIVE' &&
		_.isEqual(attribute_schema.shape, [])) {
	    rpc.call(this.service+'.new_range_condition', [this.conditionSet, attribute])
		.otherwise(showError);	    
	}
    };

    ConditionsMenu.prototype.setConditionSet = function(conditionSet) {
	this.conditionSet = conditionSet;
    };

    return ConditionsMenu;
}
);
