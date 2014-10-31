define(
["jquery", "bootstrap"]
,
function ($) {

    var editableText = function(container) {
	this.container = $(container);
	var self = this;
	var onaccept = null;
	var oncancel = null;
	var input = null;
	var popover = null;
	var popoverContent = null;

	var template =
		'<div class="popover editable-container editable-popup">' +
		'    <div class="arrow"></div>' +
		'	<h3 class="popover-title"></h3>' +
		'	<div class="popover-content">' +
		'    </div>' +
		'</div>';

	var content = 
		'          <div>' +
			// div instead of form. Otherwise input submits on enter.
		'            <div class="form-inline editableform" action="">' +  
		'              <div class="control-group form-group">' +
		'                <div>' +
		'                  <div class="editable-input">' +
		'                    <input style="padding-right: 24px;" class="form-control input-sm" type="text">' +
		'                  </div>' +
		'                  <div class="editable-buttons">' +
		'                    <button type="button" class="btn btn-primary btn-sm submit">' +
		'                      <i class="glyphicon glyphicon-ok"></i>' +
		'                    </button>' +
		'                    <button type="button" class="btn btn-default btn-sm cancel">' +
		'                      <i class="glyphicon glyphicon-remove"></i>' +
		'                    </button>' +
		'                  </div>' +
		'                </div>' +
		'              </div>' +
		'            </div>' +
		'          </div>';
	
	this.container.popover({html: true, 
				trigger: 'manual', 
				'template':template, 
				'content': getContent, 
				'placement': 'top', 
				title: ''});

	this.container
	    .addClass('editable-link')
	    .on('click', showPopover);
	

	this.setValue = function(value) {
	    this.container.text(value);
	    if (input) input.val(value);
	};

	this.on = function(event, callback) {
	    switch(event) {
		case('accept'):
		    onaccept = callback;
		    break;
		case('cancel'):
		    oncancel = callback;
		    break;
		default:
		    console.error("Event not known:", event);
	    }
	};

	function onCancel(e) {
	    self.container.popover('hide');
	    if (oncancel) oncancel(input.val());
	}
	function onAccept(e) {
	    self.container.popover('hide');
	    if (onaccept) onaccept(input.val());
	}
	function onKeyPress(e) {
	    var keyCode = event.keyCode;
	    if (keyCode == 13) { // Enter
		onAccept(e);
	    }
	    if (keyCode == 27) { // Escape
		onCancel(e);
	    } 
	}
	
	function getContent() {
	    popoverContent = $(content);

	    input = popoverContent.find('input');
	    popoverContent.find('.cancel').on('click', onCancel);
	    popoverContent.find('.submit').on('click', onAccept);
	    input.on('keydown', onKeyPress);

	    return popoverContent;
	}

	function showPopover() {
	    self.container.popover('show');
	    popover = popoverContent.parents('.popover');
	    input.val(self.container.text());
	    input.select();
	}

    };    

    return editableText;
}
);
