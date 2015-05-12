+function($){

	'use strict';

	var DataTable = function(element, options) {

		var $table = this.$table = $(element);
		var tools = [];

		if ($table.attr('am-Tools')) {
			tools = $table.attr('am-Tools').split(' ');
		}

		if (tools.indexOf('select-all') > -1 || tools.indexOf('select-multi') > -1) {

			var _select = function(e){
				var em = (e.target.nodeName == 'INPUT') ? $(e.target).parent().parent() : $(e.target).parent();
				var val = (em.attr('am-Selected') == '') ? 'false' : em.attr('am-Selected');
				em.attr('am-Selected', (val === 'true')? 'false':'true');
				em.find('td:first-child input[type=checkbox]').prop('checked',(val === 'true')? false:true);
				
				if (tools.indexOf('select-all') > -1) {
					if (val === 'true') $table.find('thead tr th:first-child input[type=checkbox]').prop('checked',false);
				}
			};

			var _selectAll = function(e){
				var em = $(e.target);
				$table.find('tbody tr').attr('am-Selected',em.prop('checked').toString());
				$table.find('tbody td:first-child input[type=checkbox]').prop('checked',em.prop('checked'))
			};

			$table.selected = function(){
				return $table.find('tbody tr[am-Selected=true]');
			}

			$table.on('click','tbody tr td',_select);
			
			if (tools.indexOf('select-all') > -1) {
				$table.find('thead tr th:first-child input[type=checkbox]').click(_selectAll);
			}
		}

		if (tools.indexOf('drag-sort') > -1) {
			$table.tableDnD({
				dragHandle: '.dragHandle'
			});
			$table.observe('childlist', 'tbody tr', function(){
				$table.tableDnDUpdate();
			});
		}

		if (tools.indexOf('edit-row') > -1) {
			$table.find('td:not(.table-control)').attr('contenteditable', true);
			$table.observe('childlist', 'tbody tr', function(e){
				if (e.addedNodes.length) $(e.addedNodes[0]).find('td:not(.table-control)').attr('contenteditable', true);
			});
		}

		if (tools.indexOf('removable') > -1) {
			$table.find('td.table-control .remove').click(function(){
				$(this).parent().parent().remove();
			});
			$table.observe('childlist', 'tbody tr td.table-control .remove', function(e){
				if (e.addedNodes.length) {
					$(e.addedNodes[0]).find('td.table-control .remove').click(function(){
						$(this).parent().parent().remove();
					});
				}
			});
		}
	};

	DataTable.DEFAULTS = {
		tools: [],
		sortable: false
	};

	// MODAL PLUGIN DEFINITION
	// =======================

	function Plugin(option, _relatedTarget) {
		return this.each(function () {
			var $this   = $(this)
			var data    = $this.data('bx.DataTable')
			var options = $.extend({}, DataTable.DEFAULTS, $this.data(), typeof option == 'object' && option)

			if (!data) $this.data('bx.DataTable', (data = new DataTable(this, options)))
			// if (typeof option == 'string') data[option](_relatedTarget)
			// else if (options.show) data.show(_relatedTarget)
		});
	};

	$.fn.DataTable = Plugin
	$.fn.DataTable.Constructor = DataTable

	$(document).ready(function(){
		$('[am-DataTable]').DataTable();
	});
}(jQuery);