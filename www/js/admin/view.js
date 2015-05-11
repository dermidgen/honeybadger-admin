+(function($admin,$){

	// console.log($admin);
	var self = $admin.View = this;
	var private = {}, protected = {};
	var $HB, $DM;

	var _construct = function() {
		console.log('Admin.View constructor');
		$HB = $admin._parent;
		$DM = $HB.DataManager;
	};

	var _init = function() {
		// Our parent already listens for DOM ready
		console.log('Admin.View initialized');

		$HB.on('readyStateChange',self.connection());
		$HB.on('log-stream',self.livelog());
		$DM.on('sources',self.sources());
		$DM.on('extractors',self.extractors());
		$DM.on('transformers',self.transformers());
		$DM.on('loaders',self.loaders());
		$DM.on('tasks',self.tasks());
	};

	$admin.module.register({
		name: 'View',
		instance: this
	},function(_unsealed){
		// Initialize module
		$admin = _unsealed(_init); // fire initializer when DOM ready
		_construct(); // run constructor now
	});

	this.livelog = function() {
		return function render(data) {
			$('#'+data.target).append(data.body);
		};
	};

	this.connection = function() {
		return function render(readyState) {
			if (readyState === 1) {
				$('#connection').addClass('online').removeClass('offline');
				$('#connection .status').text('Online');
			}
			else {
				$('#connection').addClass('offline').removeClass('online');
				$('#connection .status').text('Offline');
			}
		};
	};
	
	this.sources = function() {
		// Do some preloader stuff here
		return function render(data) {
			$('#activeSources > tbody').html('');
			$('#inactiveSources > tbody').html('');
			$('#sourceList > tbody').html('');

			/**
			 * Reset the list of sources in the extractor dialog
			 */
			var cval = $('#ext-source-select').val();
			$('#ext-source-select').html('<option value="">-- Select Source --</option>');

			$(data).each(function(index, item){

				/**
				 * Add Source & Edit Dialog Hooks
				 * 
				 * Add the source to the sources page and setup
				 * a click handler for editing.
				 */
				$('#sourceList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.source.type+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					$admin.UI.showWizard('sourceEditor');
					$admin.UI.setupWizard('sourceEditor', $DM.getSource(item.id).value);
				}));

				/**
				 * Add an option to the list of sources in the extractor dialog.
				 */
				$('#ext-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');

				if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.source.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.source.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});

			$('#ext-source-select').val(cval);
		};
	};

	this.extractors = function() {

		return function render(data) {
			$('#extractorList > tbody').html('');

			/**
			 * Reset the list of extractors in the transform dialog
			 */
			var trn_val = $('#trn-source-select').val();
			$('#trn-source-select').html('<option value="">-- Select extractor --</option>');

			/**
			 * Reset the list of extractors in the task dialog
			 */
			var task_val = $('#task-extractor-select').val();
			$('#task-extractor-select').html('<option value="">-- Select extractor --</option>');

			$(data).each(function(index, item){

				/**
				 * Add Extractor & Edit Dialog Hooks
				 * 
				 * Add the extractor to the extractors page and setup
				 * a click handler for bringing up the edit dialog.
				 */
				$('#extractorList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.target.res+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					showWizard('extractorWizard');
					setupWizard('extractorWizard', item.value);

					$('#extractorWizard [am-Button~=next]').prop("disabled", false);
				}));
				
				/**
				 * Add an option to the list of sources in the transform dialog.
				 */
				$('#trn-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');

				/**
				 * Add an option to the list of sources in the transform dialog.
				 */
				$('#task-extractor-select').append('<option value="'+item.id+'">'+item.key+'</option>');
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});

			/**
			 * Reset the dialog value to whatever the previous selection was
			 */
			$('#trn-source-select').val(trn_val);

			/**
			 * Reset the dialog value to whatever the previous selection was
			 */
			$('#task-extractor-select').val(task_val);
		};
	};

	this.transformers = function() {


		return function render(data) {
			$('#transformerList > tbody').html('');

			/**
			 * Reset the list of extractors in the transform dialog
			 */
			var cval = $('#ldr-source-select').val();
			$('#ldr-source-select').html('<option value="">-- Select transformer --</option>');

			$(data).each(function(index, item){
				var ext = $DM.getExtractor(item.value.extractor);
				$('#transformerList > tbody').append($('<tr><td>'+item.key+'</td><td>'+ext.key+'</td><td>'+item.value.transform.input.length+' [ '+item.value.transform.input.join(', ').substring(0,100)+'... ]</td><td>'+item.value.status+'</td></tr>')
					.click(function(){
						showWizard('transformWizard');
						setupWizard('transformWizard', item.value);
				}));
				$('#ldr-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});

			/**
			 * Reset the dialog value to whatever the previous selection was
			 */
			$('#ldr-source-select').val(cval);
		};
	};

	this.loaders = function() {

		return function render(data) {
			$('#loaderList > tbody').html('');
			$(data).each(function(index, item){
				if (item.value.target.type === 'mysql') {
					$('#loaderList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.target.dsn+'/'+item.value.target.schema.name+'</td><td>'+item.value.status+'</td></tr>').click(function(){
						showWizard('loaderWizard');
						setupWizard('loaderWizard', item.value);
					}));
				}
				else if (item.value.target.type === 'ftp') {
					$('#loaderList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.target.dsn+'</td><td>'+item.value.status+'</td></tr>').click(function(){
						showWizard('loaderWizard');
						setupWizard('loaderWizard', item.value);
					}));
				}
				else if (item.value.target.type === 'filesystem') {
					$('#loaderList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.target.path+'</td><td>'+item.value.status+'</td></tr>').click(function(){
						showWizard('loaderWizard');
						setupWizard('loaderWizard', item.value);
					}));
				}
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});
		};
	};

	this.tasks = function() {

		return function render(data) {
			$('#taskList > tbody').html('');
			$(data).each(function(index, item){
				$('#taskList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.description+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					showWizard('taskWizard');
					setupWizard('taskWizard', item.value);
				}));
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});
		};
	};

	this.transformDataStructures = function() {

		return function render(data) {
			if (!data.headers && !data.data) return; 
			$('#transformNormalize').html('');
			$('#transformMapper .fields').html('');
			if (data.headers) {
				$.each(data.headers,function(index,item){
					$('#transformNormalize').append('<label class="row item"><div class="col-md-6 form-inline"><label><input type="checkbox" checked/><span class="name">'+item+'</span></label></div><div class="col-md-6"><input type="text" class="form-control" value="'+item+'"/></div></label>')
					$('#transformMapper .fields').append('<span class="item badge">'+item+'</span> ');
				});			
			} else if (data.data.data) {
				$.each(data.data.data[0],function(index,item){
					$('#transformNormalize').append('<label class="row item"><div class="col-md-6 form-inline"><label><input type="checkbox" checked/><span class="name">'+index+'</span></label></div><div class="col-md-6"><input type="text" class="form-control" value="'+index+'"/></div></label>')
					$('#transformMapper .fields').append('<span class="item badge">'+index+'</span> ');
				});			
			}

			$('#transformNormalize input:checkbox').change(function(){
				if (!$(this)[0].checked) $(this).parent().parent().parent().find('input[type="text"]').attr('disabled','disabled');
				else $(this).parent().parent().parent().find('[type=text]').prop('disabled',false);
			})
		};
	};

	this.loaderDefinition = function() {

		return function render(data) {
			$('#loaderSchemas .fields .maps').html('');

			$.each(data.headers,function(index,item){
				if (!item) return;
				$('#loaderSchemas .fields .maps').append('<div class="row form-group"><div class="col-md-6"><label>'+item+'</label></div><div class="col-md-6"><select class="form-control"><option value="string">String</option><option value="float">Float</option><option value="bool">Boolean</option><option value="text">Long Text</option></select></div></div>')
			});
		};
	};

}(HoneyBadger.Admin, jQuery));
