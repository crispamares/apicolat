define(['lodash', 'jquery', 'context'],
function(lodash, jquery, Context) {
    var context = Context.instance();
    var hub = context.hub;

    function ComboSelector(container, table, attributeType) {
	this.container = $(container);
	// TODO: autoextract options from table and attributeType
	this.options = ["# count"];
    }
    
    ComboSelector.prototype.update =  function() {
	

	var template = _.template('	      <form class="form-horizontal" role="form">'
				  + '		<div class="form-group">'
				  + '		  <label for="visible-property" class="col-sm-8 control-label">Feature</label>'
				  + '		  <div class="col-sm-4">'
				  + '		    <select  class="form-control" id="visible-property">'
				  + '<% _.forEach(options, function(option) {%>'
				  + '<option> <%- option  %> </option> <% }) %>'
				  + '</select>'
				  + '		  </div>'
				  + '		</div>'
				  + '	      </form>');

	var html = template({options: this.options});
	this.container.append(html);

	this.container
	    .find('select')
	    .on('change', function(e) {
		    console.log (e);
		    hub.publish('comboChanged', e.target.value);
		});
    };
    

    return ComboSelector;
}
);
