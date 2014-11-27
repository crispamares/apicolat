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
	this.container.append('<div class="row"></div>');
	this.container = this.container.children('.row');
	this.updateCombo();
	this.updateScale();
    };

    ComboSelector.prototype.updateCombo =  function() {

	var template = _.template('<div class="col-sm-7">'
				  + '      <form class="form-inline form-group form-group-sm" role="form">'
				  + '		  <label for="visible-property" class="control-label"> Showing: '
				  + '		    <select  class="form-control" id="visible-property">'
				  + '                  <% _.forEach(options, function(option) {%>'
				  + '                  <option> <%- option  %> </option> <% }) %>'
				  + '                  </select>'
				  + '             </label>'
				  + '	      </form>'
				  + '</div>');

	var html = template({options: this.options});
	this.container.append(html);
	
	this.container
	    .find('select')
	    .on('change', function(e) {
		    console.log (e);
		    hub.publish('comboChanged', e.target.value);
		});
    };

    ComboSelector.prototype.updateScale =  function() {

	var scaleBar = $('<div class="col-sm-4"> <span>-</span> <span class="color-scale">&nbsp;</span> <span>+</span> </div>');
	scaleBar.find('span').css({display: "inline-block"});
	var scale = scaleBar.children('span.color-scale');
	scale.css({ width: "80%", 
//		    height: "25px", 
		    color: "white", 
		    display: "inline-block",
		    background: "linear-gradient(to right, #cac7e1, #6c0da7)"});

	this.container.append(scaleBar);
	
    };    

    return ComboSelector;
}
);
