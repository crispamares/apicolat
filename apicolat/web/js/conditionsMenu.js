define(['lodash', 'jquery', 'ws-rpc', 'hub', 'd3', 'when', 'categoricalSelector'],
function() {

    var hub = require('hub').instance();
    var rpc = require('ws-rpc').instance();
    var when = require('when');

    function ConditionsMenu(container, conditionSet, schema, attributes, service) {
	var self = this;
	this.container = $(container);
	this.conditionSet = conditionSet;
	this.schema = schema;

	this.attributes = attributes || _.keys(schema.attributes);
	this.service = service || 'DynSelectSrv';

	console.log('weeeeeee', this);


	var template = _.template('	  <div class="panel">'
				  + '	    <form class="form-inline" >'
				  + '	      <div class="form-group" style="width:80%;">'
				  + '		<select class="form-control">'
				  + '		</select>'
				  + '	      </div>'
				  + '	      <button type="button" class="btn btn-default" style="width:18%;">'
				  + '		<span class="glyphicon glyphicon-plus"></span> Add'
				  + '	      </button>'
				  + '	    </form>'
				  + '	  </div>');
	var html = template();
	this.container.append(html);

	this.update();

	var select_widget = d3.select(container).select("select");
	d3.select(container)
	    .select("button")
	    .on("click", function(){self.add_condition(select_widget.property("value"));});
    }
    
    ConditionsMenu.prototype.update =  function() {
	var self = this;
	console.log('updating', this, JSON.stringify(this.attributes));

	var option = d3.select(this.container.selector).select("select")
	    .selectAll('option').data(self.attributes, _.identity);
	option.enter()
	    .append('option')
	    .text(_.identity);

	option.exit()
	    .remove();

    };

    ConditionsMenu.prototype.add_condition = function(attribute) {
	var self = this;
	var attribute_schema = this.schema.attributes[attribute];
	
	if (attribute_schema.attribute_type === 'CATEGORICAL') {
	    createCategoricalSelectors(this.conditionSet, attribute, this.service);
	}
    };
    
    function createCategoricalSelectors(conditionSet, attribute, service) {
	var CategoricalSelector = require("categoricalSelector");
	var categoricalSelector = new CategoricalSelector('#conditions-list', attribute);
	rpc.call(service+'.new_categorical_condition', [conditionSet, attribute])
	    .then(function(condition) {
		      categoricalSelector.setCondition(condition);
		  })
	    .otherwise(showError);    
    }


    return ConditionsMenu;
}
);