define(['lodash', 'jquery', 'd3'],
function(lodash, jquery, d3) {

    /**
     * @fn MenuButton
     * 
     * @param container: valid DOM selector
     * @param menuItems: [{"name": name, "type": "item", "onclick": callback, "text": text, "title":title, "class": class}, 
     *                    {"type": "divider"}]
     */
    function MenuButton(container, menuItems, aligment) {
	var self = this;
	this.container = d3.select(container);
	this.menuItems = menuItems;
	this.aligment = aligment || 'left';

	var template = _.template(
		'        <div class="btn-group btn-group-xs">' +
		'	    <button type="button" class="btn btn-link btn-black dropdown-toggle" data-toggle="dropdown">' +
		'           <span class="caret"></span>' +
		'	    </button>' +
		'	    <ul class="dropdown-menu dropdown-menu-<%= aligment %>" role="menu">' +
//		'	      <li><a href="#" class="use-this">Use this</a></li>' +
//		'	      <li class="divider"></li>' +
		'	    </ul>' +
		'         </div>');
	this.container.html(template({aligment: this.aligment}));

	this.update =  function() {

	    var li = self.container.select('ul.dropdown-menu').selectAll('li')
		.data(self.menuItems);

	    li.enter()
		.append('li')
		  .attr('class', function(d){
			  var classed = (d.type === "divider") ? "divider" : d.classed;
			  return classed; })
		.filter(function(d){return d.type === "item";})
		.append('a')
		  .attr('href', '#')
		  .on("click", function(d){return d.onclick(d);})
		  .attr('title', function(d){return d.title;})
		  .text(function(d){return d.text;});

	};

	this.update();
        
    };

    return MenuButton;
}
);