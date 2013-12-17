define(['lodash', 'jquery', 'hub'],
function() {

    var hub = require('hub');

    function ComboSelector(container, table, attributeType) {
	this.container = $(container);
	// TODO: autoextract options from table and attributeType
	this.options = ["* count *"];
    }
    
    ComboSelector.prototype.update =  function() {
	

	var template = _.template('	      <form class="form-horizontal" role="form">'
				  + '		<div class="form-group">'
				  + '		  <label for="visible-property" class="col-sm-8 control-label">Visible Property</label>'
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
		    hub.instance().publish('comboChanged', e.target.value);
		});
    };
    

    return ComboSelector;
}
);