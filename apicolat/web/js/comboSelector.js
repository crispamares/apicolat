define(['lodash', 'jquery', 'hub'],
function() {

    var hub = require('hub');

    function ComboSelector(container, table, attributeType) {
	this.container = $(container);
	// TODO: autoextract options from table and attributeType
	this.options = ["* count *"];
    }
    
    ComboSelector.prototype.update =  function() {
	
	var template = _.template('<div class="panel panel-default">'
			   + '  <div class="panel-heading">'
			   + '    <h3 class="panel-title">Visible Property</h3>'
			   + '  </div>'
			   + '  <div class="panel-body">'
			   + '<select class="form-control">'
			   + '<% _.forEach(options, function(option) {%>'
			   + '<option> <%- option  %> </option> <% }) %>'
			   + '</select>'
			   + '  </div>'
			   + '</div>');
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