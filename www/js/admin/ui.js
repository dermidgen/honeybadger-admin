+(function($admin,$){

	var self = $admin.UI = this;
	var private = {}, protected = {}, pages = {};
	var $HB, $DM;

	var _construct = function() {
		console.log('Admin.UI constructor');
		$HB = $admin._parent;
		$DM = $HB.DataManager;
	};

	var _init = function() {
		// Our parent already listens for DOM ready
		
		/**************** UI Bindings ***************/
		/**
		 * This HUGE block handles all of the setup and bindings
		 * For latching onto buttons, initializing the UI, etc.
		 * This is essentially our root DOM ready handler
		 *
		 * If you're wondering, "Where the fuck is the handler
		 * for this stupid button?"; or "How is this UI event
		 * getting handled?" - this is your spot.
		 *
		 * If you're looking for where data is rendered into the
		 * UI, where DOM getting manipulated or updated; look at
		 * view.js
		 */

		pages = {
			dashboard: $('#dashboard').hide(),
			sourceManager: $('#sourceManager').hide(),
			extractorManager: $('#extractorManager').hide(),
			transformManager: $('#transformManager').hide(),
			loaderManager: $('#loaderManager').hide(),
			taskManager: $('#taskManager').hide()
		};

		$('[data-toggle="page"]').each(function(index,item){
			$(item).click(function(){
				self.navigate($(this).attr('data-target'));
			});
		});

		/**
		 * Handle keep any log windows down to the bottom
		 */
		$('.logger').each(function(index, item){
			item.addEventListener("DOMNodeInserted", function(e){
				this.scrollTop = this.scrollHeight;
			});
		});

		/**
		 * Detect when source modal is activated 
		 */
		$('#sourceEditor').on('show.bs.modal', function(){
			resetWizard('sourceEditor');
		});

		/**
		 * Detect when extractor modal is activated 
		 */
		$('#extractorWizard').on('show.bs.modal', function(){
			resetWizard('extractorWizard');
		});

		/**
		 * Detect when transformer modal is activated 
		 */
		$('#transformWizard').on('show.bs.modal', function(){
			resetWizard('transformWizard');
		});

		/**
		 * Detect when loader modal is activated 
		 */
		$('#loaderWizard').on('show.bs.modal', function(){
			resetWizard('loaderWizard');
		});

		/**
		 * Detect when task modal is activated 
		 */
		$('#taskWizard').on('show.bs.modal', function(){
			resetWizard('taskWizard');
		});

		/**
		 * Reset our wizards
		 */
		resetWizard('extractorWizard');
		resetWizard('transformWizard');
		resetWizard('loaderWizard');
		resetWizard('taskWizard');
		// $('.wizard section.step').first().show();

		/**
		 * Dialog Wizard navigation
		 * 
		 * This provides a generic mechanism for handling the
		 * prev/next/finish buttons and back & forth navigation
		 * of the Dialog wizards.
		 */
		$('[am-Dialog]').each(function(index,item){
			var _id = $(item).prop('id');
			$('[am-Button~=next]',item).click(function(){
				$('#'+_id+' section.step.active').hide().removeClass('active').next().show().addClass('active');
				$('#'+_id+' .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
				if (!$('#'+_id+' section.step.active').is($('#'+_id+' section.step').first())) $('#'+_id+' [am-Button~=prev]').prop('disabled',false);
				if ($('#'+_id+' section.step.active').is($('#'+_id+' section.step').last())) {
					$('#'+_id+' [am-Button~=next]').hide();
					$('#'+_id+' [am-Button~=finish]').show();
				}
			});

			$('#'+_id+' [am-Button~=prev]').click(function(){
				$('#'+_id+' section.step.active').hide().removeClass('active').prev().show().addClass('active');
				$('#'+_id+' .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
				if ($('#'+_id+' section.step.active').is($('#'+_id+' section.step').first())) $('#'+_id+' [am-Button~=prev]').prop('disabled',true);
				if (!$('#'+_id+' section.step.active').is($('#'+_id+' section.step').last())) {
					$('#'+_id+' [am-Button~=finish]').hide();
					$('#'+_id+' [am-Button~=next]').show();
				}
			});
		});

		
		$('[am-Button~=switch]').click(function(){
			var state = $(this).attr('data-state');
			state = (state !== 'on') ? 'on' : 'off';
			var label = $(this).attr('data-'+state+'-text');
			var value = (state === 'on') ? 'active' : 'disabled';
			$(this).attr('data-state',state).attr('data-state-value',value).text(label);
		});


		/**************** UI Bindings ***************/
		/**************** Sources ***************/

		$('#validateBtn').click(function(){
			Admin.Validator.source.validate();
		});

		$('#sourceEditor [am-Button~=prev]').hide();
		$('#sourceEditor [am-Button~=next]').hide();
		$('#sourceEditor [am-Button~=finish]').click(function(){
			Admin.Validator.source.save();
		});

		/**
		 * From the source Wizard; display source options based on selected source type
		 */
		$('#sourcetype').change(function(){
			sourceModalReset();
			if ($(this).val() == 'RETS') $('#source_RETS').show();
			else if ($(this).val() == 'FTP') $('#source_FTP').show();
			else if ($(this).val() == 'SOAP') $('#source_SOAP').show();
			else if ($(this).val() == 'REST') $('#source_REST').show();
			else if ($(this).val() == 'XML') $('#source_XML').show();
		}).change();

		/**************** UI Bindings ***************/
		/**************** Extractors ***************/

		/**
		 * Setup dialog button to be next vs save
		 */
		$('#extractorWizard [am-Button~=finish]').hide();

		/**
		 * FTP Extractor Browse Button
		 * From the extractor Wizard; if selected source is FTP, bind to the browse button
		 * to find a target from the FTP source
		 */
		$('#ext-ftp-browse').click(function(){
			$DM.ftpBrowse($DM.getSource($('#ext-source-select').val()), $('#ftpRootPath').val(), function(e){
				if(!e.err && e.body.success === true) {
					$('#ext-ftp-browser .files').empty();
					e.body.list.forEach(function(item, index){
						if (item.name) $('#ext-ftp-browser .files').append($('<li class="file">'+item.name+'</li>').click(function(){
							var path = ($('#ftpRootPath').val()) ? $('#ftpRootPath').val() + '/' + item.name : item.name;
							$('#ftpFileName').val(path);
							$('#ext-ftp-browser .files').empty();
							// $('#extractorWizard [am-Button~=prev]').prop("disabled", false);
							$('#extractorWizard [am-Button~=next]').prop("disabled", false);
						}));
					});
				}
			});
		});

		/**
		 * From the extractor wizard:
		 * When selecting a data source for an extractor let's do some logic
		 * based on the type of source they've chosen
		 */
		$('#extractorWizard .source-options').hide();
		$('#ext-source-select').change(function(){
			var s = $DM.getSource($(this).val());

			$('#ext-rets-options .rets-resource').hide();
			$('#ext-rets-options .rets-classification').hide();
			$('#extractorWizard .source-options').hide();

			if (!s) return;
			if (s.value.source.type === 'FTP') {
				$('#ext-ftp-browser .files').empty();
				$('#ftpRootPath').val('');
				$('#ftpFileName').val('');
				$('#ext-ftp-options').show();
				$('#ext-rets-options').hide();
				$('#ext-step-2 > .ext-ftp-options').show();
				$('#ext-step-2 > .ext-rets-options').hide();
			}
			else if (s.value.source.type === 'RETS') {
				$('#ext-ftp-options').hide();
				$('#ext-rets-options').show();
				$('#ext-step-2 > .ext-ftp-options').hide();
				$('#ext-step-2 > .ext-rets-options').show();

				s.value.source.rets = { resource: $('#ext-rets-resource').val() };
				$DM.retsExplore(s.value, function(e){
					if (e.body.meta) {
						$('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
						$.each(e.body.meta.data,function(index,item){
							// console.log(item);
							$('#ext-rets-resource').append('<option value="'+item.ResourceID[0]+'">'+item.VisibleName[0]+'</option>');
							$('#ext-rets-options .rets-resource').removeClass('hide').show();
						});
					}
				});
			}
		});

		/**
		 * From the extractor wizard; for RETS sources, when a user selects a resource
		 */
		$('#ext-rets-resource').change(function(){
			var s = $DM.getSource($('#ext-source-select').val()).value;
			s.source.rets = { resource: $('#ext-rets-resource').val() };
			$DM.retsBrowse(s, function(e){
				if (e.body.meta) {
					$('#ext-rets-class').html('<option>-- Select a data class --</option>')
					$.each(e.body.meta.data,function(index,item){
						// console.log(item);
						$('#ext-rets-class').append('<option value="'+item.ClassName[0]+'">'+item.VisibleName[0] + ((item.StandardName[0]) ? ' : '+item.StandardName[0] : '') +'</option>');
						$('#ext-rets-options .rets-classification').removeClass('hide').show();
					});
				}
			});
		});

		/**
		 * From the extractor wizard; for RETS sources, when a user selects a class
		 */
		$('#ext-rets-class').change(function(){
			var s = $DM.getSource($('#ext-source-select').val()).value;
			s.source.rets = {
				resource: $('#ext-rets-resource').val(),
				classification: $('#ext-rets-class').val()
			};
			$DM.retsInspect(s, function(e){
				$('#ext-step-2 > .ext-rets-options .fields').html('');
				$.each(e.body.meta.data, function(index,item){
					// console.log(item);
					$('#ext-step-2 > .ext-rets-options .fields').append('<div class="item"><strong>'+item.LongName[0]+'</strong> <em>'+index+'</em> <small>'+item.StandardName[0]+'</small> '+((item.Searchable[0] == '1') ? '<span class="badge">Searchable</span>' : '')+'<div class="detail"><small><em>'+item.DataType[0]+'</em> </small></div></div>');
					// +item.ShortName[0]+' '+item.DBName[0]+' '
				});
				$('#extractorWizard [am-Button~=next]').prop("disabled",false);
			});
		});

		$('#ext-rets-media-strategy').change(function(){
			if ($(this).val() == 'MediaGetURL') $('#rets-media-query-options').show();
			else $('#rets-media-query-options').hide();
		});

		/**
		 * From the extractor wizard: bindings for unarchive options
		 */
		$('#ext-unarchive').change(function(){
			if ($('#ext-unarchive')[0].checked) $('#ext-archive-opts').prop('disabled',false);
			else  $('#ext-archive-opts').prop('disabled',true);
		});

		/**
		 * From the extractor wizard: Run the extractor test
		 */
		$('#ext-test').click(function(){
			$('#extraction-result').html('');
			$DM.extractor.sample(ext(),function(e){
				// console.log(e);
				if (!e.err) {
					$('#extraction-result').html('<p class="bg-success">Extractor Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
					$('#extractorWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#extractorWizard [am-Button~=finish]').prop('disabled',true);
					$('#extraction-result').html('<p class="bg-danger">Extractor Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
				}
			});
		});

		/**
		 * Clear the log window
		 */
		$('#ext-test-clear').click(function(){
			$('#extractor-log-body').html('');
			$('#extraction-result').html('');
		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#extractorWizard [am-Button~=finish]').click(function(){
			$('#extractorWizard').modal('hide');
			$DM.extractor.validate(ext());
			$DM.extractor.save(ext(),function() { $DM.loadExtractors(); });
		});



		/**************** UI Bindings ***************/
		/**************** Transformer ***************/


		/**
		 * Setup dialog button to be next vs save
		 */
		$('#transformWizard [am-Button~=finish]').hide();

		/**
		 * Input type selection for the transformer
		 * This should pretty much just be "bind to extractor" now
		 */
		$('#trn-source-toggle').change(function(){
			if ($(this).val() !== 'custom') $('#trn-source-select').prop('disabled',false);
			else $('#trn-source-select').attr('disabled','disabled');
		});

		/**
		 * When a user selects an extractor to feed into the transformer let's load
		 * some metadata
		 */
		$('#trn-source-select').change(function(){
			var v = $(this).val();
			var s = $DM.getExtractors().filter(function(e){
				if (e.id == v) return e;
				else return null;
			}).pop();
			if (!s) return;
			$DM.extractor.sample(s.value,function(e){
				if (!e.err) {
					Admin.View.transformDataStructures()(e.body);
					$('#transformWizard [am-Button~=next]').prop('disabled',false);
				}
			});
		});

		$('#transformNormalize').hide();
		$('#transformMapper').hide();

		/**
		 * When you choose a transformation type
		 */
		$('#trn-transform-type').change(function(){
			if ($(this).val() == 'normalize') {
				$('#transformNormalize').show();
				$('#transformMapper').hide();
			}
			if ($(this).val() == 'map') {
				$('#transformNormalize').hide();
				$('#transformMapper').show();
			}
		});

		/**
		 * Bind to the transformer test button
		 */
		$('#trn-test').click(function(){
			$('#transformer-result').html('');
			$DM.transformer.sample(trn(),function(e){
				if (!e.err) {
					$('#transformer-result').html('<p class="bg-success">Transform Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
					$('#transformWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#transformer-result').html('<p class="bg-danger">Transform Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
					$('#transformWizard [am-Button~=finish]').prop('disabled',true);
				}
			});
		});

		/**
		 * Reset tranform test log
		 */
		$('#trn-test-clear').click(function(){
			$('#transformer-log-body').html('');
			$('#transformer-result').html('');
		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#transformWizard [am-Button~=finish]').click(function(){
			$('#transformWizard').modal('hide');
			$DM.transformer.validate(trn());
			$DM.transformer.save(trn(),function() { $DM.loadTransformers(); });
		});


		/**************** UI Bindings ***************/
		/****************  Loaders  ***************/


		/**
		 * Setup dialog button to be next vs save
		 */
		$('#loaderWizard [am-Button~=finish]').hide();

		/**
		 * When choosing a transformer to feed the loader
		 */
		$('#ldr-source-toggle').change(function(){
			if ($(this).val() !== 'custom') $('#ldr-source-select').removeAttr('disabled');
			else $('#ldr-source-select').attr('disabled','disabled');
		});

		var trnSample = {};

		/**
		 * When choosing a transformer to feed the loader
		 */
		$('#ldr-source-select').change(function(){
			var v = $(this).val();
			var s = $DM.getTransformers().filter(function(e){
				if (e.id == v) return e;
				else return null;
			}).pop();

			$DM.transformer.sample(s.value,function(e){
				if (!e.err) {
					Admin.View.loaderDefinition()(e.body);
					// update('loaderDefinition',e.body);
					trnSample = e.body;
				} 
			});
		});

		$('#loaderMySQL').hide();
		$('#loaderCouchDB').hide();
		$('#loaderFTP').hide();
		$('#loaderFilesystem').hide();
		/**
		 * Bindings to validate the loader DSN, URI, whatever
		 */
		$('#loaderDSN button').click(function(){
			$DM.loader.validateConnection(ldr(),function(e){
				var t = $('#ldr-target-type').val();
				var btn = $('#ldr-'+t+'-validate');
				switch(t) {
					case "mysql":
					break;
					case "couchdb":
					break;
					case "ftp":
					break;
					case "filesystem":
					break;
				}
				$(btn).removeClass('btn-danger btn-success').addClass('btn-primary');
				if (!e.err) {
					$(btn).removeClass('btn-primary').addClass('btn-success');
					$('.validation-status',btn).removeClass('asterisk').addClass('ok-sign');
					$('#loaderWizard [am-Button~=next]').prop('disabled',false);
				} else {
					$(btn).prop('disabled',false).removeClass('btn-primary').addClass('btn-danger');
					$('.validation-status',btn).removeClass('asterisk').addClass('exclamation-sign');
				}

			});
		});

		$('#ldr-target-type').change(function(){
			switch($(this).val())
			{
				case "mysql":
					$('.loader-options').hide();
					$('#loaderSchemas').show();

					/**
					 * Bindings to the create schema button for MySQL loaders
					 */
					$('#ldr-create-schema').click(function(){
						$DM.loader.createSchema(ldr(),function(e){
							$('#ldr-create-schema').removeClass('btn-danger btn-success').addClass('btn-primary');
							if (!e.err) {
								$('#ldr-create-schema').removeClass('btn-primary').addClass('btn-success')
								$('#ldr-create-schema .schema-status').removeClass('asterisk').addClass('ok-sign');
							} else {
								$('#ldr-create-schema').prop('disabled',false).removeClass('btn-primary').addClass('btn-danger')
								$('#ldr-create-schema .schema-status').removeClass('asterisk').addClass('exclamation-sign');
							}

						});
					});

					$('#loaderSchemas .fields').hide();
					$('#ldr-new-schema').click(function(){
						$('#loaderSchemas .create').hide();
						$('#loaderSchemas .fields').show();
					});
					$('#loaderMySQL').show();
					$('#loaderCouchDB').hide();
					$('#loaderFTP').hide();
					$('#loaderFilesystem').hide();
				break;
				case "couchdb":
					$('.loader-options').hide();
					$('#ldr-couchdb-options').show();
					
					$('#loaderMySQL').hide();
					$('#loaderCouchDB').show();
					$('#loaderFTP').hide();
					$('#loaderFilesystem').hide();
				break;
				case "ftp":
					$('.loader-options').hide();
					$('#ldr-ftp-options').show();

					$('#loaderMySQL').hide();
					$('#loaderCouchDB').hide();
					$('#loaderFTP').show();
					$('#loaderFilesystem').hide();
				break;
				case "filesystem":
					$('.loader-options').hide();
					$('#ldr-filesystem-options').show();

					$('#loaderMySQL').hide();
					$('#loaderCouchDB').hide();
					$('#loaderFTP').hide();
					$('#loaderFilesystem').show();
				break;
			}
		});

		/**
		 * Binding for running loader tests
		 */
		$('#ldr-test').click(function(){
			$('#loader-result').html('');
			$DM.loader.sample(ldr(),function(e){
				if (!e.err) {
					$('#loader-result').html('<p class="bg-success">Loader Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
					$('#loaderWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#loader-result').html('<p class="bg-danger">Loader Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
					$('#loaderWizard [am-Button~=finish]').prop('disabled',true);
				}
			});
		});

		/**
		 * Clear the loader test log
		 */
		$('#ldr-test-clear').click(function(){
			$('#loader-log-body').html('');
			$('#loader-result').html('');
		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#loaderWizard [am-Button~=finish]').click(function(){
			$('#loaderWizard').modal('hide');
			$DM.loader.validate(ldr());
			$DM.loader.save(ldr());
		});


		/**************** UI Bindings ***************/
		/****************  Tasks  ***************/

		$('#taskRepeat').change(function(){
			var _repeat = $(this).val();
			switch(_repeat)
			{
				case 'daily':
					$('#taskRepeatOptions').hide();
				break;
				case 'weekly':
					$('.repeatOptions').hide();
					$('#taskRepeatWeeklyOptions').show();
					$('#taskRepeatOptions').show();
				break;
				case 'monthly':
					$('.repeatOptions').hide();
					$('#taskRepeatMonthlyOptions').show();
					$('#taskRepeatOptions').show();
				break;
				case 'periodically':
					$('.repeatOptions').hide();
					$('#taskRepeatPeriodicOptions').show();
					$('#taskRepeatOptions').show();
				break;
				default:
					$('#taskRepeatOptions').hide();
			}
		});

		$('#taskRepeatOptions').hide();

		$('#task-extractor-select').change(function(){

			var _ext = $(this).val();
			if (!_ext) return;

			var extractor = $DM.getExtractor(_ext);
			var source = $DM.getSource(extractor.value.source);

			var transformers = $DM.getTransformers();
			var loaders = $DM.getLoaders();

			var _trn = [];
			var _ldr = [];

			$('#taskETLMap > ul').html('');
			$('#taskTransformers').html('');
			$('#taskLoaders').html('');

			$("#taskETLMap .sources").append('<li class="source"><div class="title">'+source.key+'</div></li>');
			$("#taskETLMap .extractors").append('<li class="extractor"><div class="title">'+extractor.key+'</div></li>');

			$(transformers).each(function(index, item){
				if (item.value.extractor == _ext) {
					$('#taskTransformers').append('<li>'+item.key+'</li>');
					$("#taskETLMap .transformers").append('<li class="transformer" data-id="'+item.id+'"><div class="title">'+item.key+'</div></li>');
					_trn.push(item.id);
				}
			});

			$(loaders).each(function(index, item){
				if (_trn.indexOf(item.value.transform) > -1) {
					$('#taskLoaders').append('<li>'+item.key+'</li>');
					$("#taskETLMap [data-id="+item.value.transform+"]").append('<li class="loader" data-rel="'+item.value.transform+'" data-id="'+item.id+'"><div class="title">'+item.key+'</div></li>');
					_ldr.push(item.id);
				}
			});

		});

		/**
		 * Binding for running task tests
		 */
		$('#task-test').click(function(){
			$('#task-result').html('');
			$DM.task.sample(tsk(),function(e){
				if (!e.err) {
					$('#task-result').html('<p class="bg-success">Task Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
					$('#taskWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#task-result').html('<p class="bg-danger">Task Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
					$('#taskWizard [am-Button~=finish]').prop('disabled',true);
				}
			});
		});

		/**
		 * Clear the loader test log
		 */
		$('#task-test-clear').click(function(){
			$('#task-log-body').html('');
			$('#task-result').html('');
		});

		/**
		 * Binding to manually run the task
		 */
		$('#task-run').click(function(){
			$('#task-log-body').html('');
			$('#task-result').html('');

			$('#task-log-body').html('<p class="text-warning">Manually Running Task! <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');

			$DM.task.run(tsk(),function(e){
				if (!e.err) {
					$('#task-result').html('<p class="bg-success">Task Manual Run Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
					$('#taskWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#task-result').html('<p class="bg-danger">Task Manual Run Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
					$('#taskWizard [am-Button~=finish]').prop('disabled',true);
				}
			});


		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#taskWizard [am-Button~=finish]').click(function(){
			$('#taskWizard').modal('hide');
			$DM.task.save(tsk());
		});



		/**************** UI Bindings ***************/
		/****************  Complete Init  ***************/

		/**
		 * Finish init by navigating to a page
		 */

		if (document.location.hash) self.navigate(document.location.hash.replace('#',''));
		else self.navigate('dashboard');

		console.log('Admin.UI initialized');
	};

	$admin.module.register({
		name: 'UI',
		instance: this
	},function(_unsealed){
		// Initialize module
		$admin = _unsealed(_init); // fire constructor when DOM ready
		_construct();
	});

	this.alert = function(msg, opts){
		if (arguments.length == 1) {
			var opts = (typeof msg === 'string') ? {
					msg: msg,
				} : msg;
		}

		var opts = opts || {};
		opts.type = opts.type || 'info';
		opts.msg = opts.msg || msg;
		opts.hide = opts.hide || 3;

		$('#alerts').prepend($('<div class="alert alert-'+opts.type+' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+opts.msg+'</div>').slideDown().delay( opts.hide * 1000 ).fadeOut(function(){
			$(this).remove();
		}));
	};

	/**
	 * Reset the UI - All of it if you dare
	 * 
	 * @return {[type]} [description]
	 */
	this.reset = function() {

	};

	this.navigate = function(page, callback){
		if (typeof pages[page] == 'undefined') return false;

		$('#bs-example-navbar-collapse-1 li.active').removeClass('active');
		$('[data-target="'+page+'"]').closest('.nav-item').addClass('active');
		$('#bodyContent > *').hide();
		pages[page].show();
	};

	/**
	 * Modal resets
	 */
	this.sourceModalReset = function(){
		$('#validateBtn').removeAttr('disabled').removeClass('btn-danger btn-success').addClass('btn-primary');
		$('#sourceValidationStatus').removeClass('ok-sign exclamation-sign');
		$('#sourceTypeOptions .option-group').hide();
		$('#sourceEditorSave').prop('disabled',false);
	};

	this.resetWizard = function(id){
		$('#'+id).attr({'data-id':'','data-rev':''});
		$('#'+id+' section.step').hide().first().show();
		$('#'+id+' .files').empty();
		$('input[type=text], input[type=password], select, textarea','#'+id).val('');

		/**
		 * Reset the modal buttons
		 */
		$('#'+id+' section.step').hide().removeClass('active').first().show().addClass('active');
		$('#'+id+' [am-Button~=prev]').show().prop('disabled',true);
		$('#'+id+' [am-Button~=next]').show().prop('disabled',false);
		$('#'+id+' [am-Button~=finish]').prop('disabled',true).hide();

		$('#'+id+' .body.logger').html('');
		$('#'+id+' .wizard-result').html('');
	};

	/**
	 * Populate the proper wizard with saved data
	 * @param  {[type]} id
	 * @param  {[type]} data
	 * @return {[type]}
	 */
	this.setupWizard = function(id, data){
		// ONLY EXECUTES ON EDIT NOT "NEW"
		// console.log(data);
		resetWizard(id);
		switch(id)
		{
			case "sourceEditor":
				sourceModalReset();

				$('#sourceEditor').attr('data-id',data._id);
				$('#sourceEditor').attr('data-rev',data._rev);

				if (data.status == 'disabled') {
					$('#sourceEditor .modal-header [am-Button~=switch].status').attr('data-state-value','disabled').attr('data-state','off').text('Disabled');
				}

				$('#sourceEditor [am-Button~=finish]').prop('disabled',true).show();
				$('#sourceEditor [am-Button~=next]').prop('disabled',true).hide();

				$('#sourcename').val(data.name);
				$('#sourcetype').val(data.source.type);
				if (data.source.type == 'RETS') {
					$('#sourceuri').val(data.source.uri);
					$('#sourceuser').val(data.source.auth.username);
					$('#sourcepassword').val(data.source.auth.password);
					$('#sourceua').val(data.source.auth.userAgentHeader);
					$('#sourceuapw').val(data.source.auth.userAgentPassword);
					$('#source_RETS').show();
				} else if (data.source.type == 'FTP') {
					$('#ftphost').val(data.source.uri);
					$('#ftpuser').val(data.source.auth.username);
					$('#ftpauth').val(data.source.auth.password);
					$('#source_FTP').show();
				}
				else if (data.source.type == 'SOAP') $('#source_SOAP').show();
				else if (data.source.type == 'REST') $('#source_REST').show();
				else if (data.source.type == 'XML') $('#source_XML').show();	
			break;
			case "extractorWizard":

				$('#extractorWizard').attr('data-id',data._id);
				$('#extractorWizard').attr('data-rev',data._rev);

				if (data.status == 'disabled') {
					$('#extractorWizard .modal-header [am-Button~=switch].status').attr('data-state-value','disabled').attr('data-state','off').text('Disabled');
				}

				/**
				 * Load Saved Extractor for Editing
				 */
				
				/**
				 * Populate the first page of the extractor dialog
				 */
				$('#extractorName').val(data.name);
				$('#ext-source-select').val(data.source);
				$('#ext-source-select').val(data.source);
				$('[name=ext-data-format]').val(data.target.format);

				/**
				 * Setup the wizard based on the source type
				 */
				var source = $DM.getSource(data.source).value.source;
				var type = source.type;

				$('#extractorWizard .source-options').hide();
				if (type === 'FTP') {

					$('#ftpFileName').val(data.target.res);
					$('#ext-ftp-browser .files').empty();
					$('#ext-ftp-options').show();
					$('.ext-ftp-options').show();
					$('.ext-rets-options').hide();
					$('#ext-rets-options').hide();

					
					if (data.target.format === 'delimited-text') {
						$('#extractorWizard [name=ext-unarchive][value='+data.target.options.unarchive+']').prop('checked',true);
						$('#extractorWizard [name=ext-csv-delimiter][value='+data.target.options.delimiter+']').prop('checked',true);
						$('#extractorWizard [name=ext-csv-escape][value='+data.target.options.escape+']').prop('checked',true);
					}
				}
				else if (type === 'RETS') {
					$('#ext-ftp-options').hide();
					$('.ext-ftp-options').hide();
					$('.ext-rets-options').show();
					$('#ext-rets-options').show();

					/**
					 * We need to load the RETS metadata and re-select the saved options.
					 *
					 * Let's show the fields so that we can gracefully handle issues
					 * in the future (like and expired-non working value - if the MLS changes
					 * their class/resource names).
					 *
					 * TODO: add visual handler if one of the calls fails
					 */
					$('#extractorWizard .rets-resource').removeClass('hide').show();
					$('#extractorWizard .rets-classification').removeClass('hide').show();

					/**
					 * We'll start with getting resources
					 */
					$DM.retsExplore( { source: source }, function(e){
						if (e.body.meta) {
							$('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
							$.each(e.body.meta.data,function(index,item){
								$('#ext-rets-resource').append('<option value="'+item.ResourceID[0]+'">'+item.VisibleName[0]+'</option>');
								$('#ext-rets-options .rets-resource').removeClass('hide').show();
							});
							/**
							 * Set the value back to what the user had before
							 */
							$('#ext-rets-resource').val(data.target.type);

							/**
							 * Fetch the various classes
							 */
							source.rets = { resource: data.target.type };
							$DM.retsBrowse({ source: source }, function(e){
								if (e.body.meta) {
									$('#ext-rets-class').html('<option>-- Select a data class --</option>')
									$.each(e.body.meta.data,function(index,item){
										$('#ext-rets-class').append('<option value="'+item.ClassName[0]+'">'+item.VisibleName[0] + ((item.StandardName[0]) ? ' : '+item.StandardName[0] : '') +'</option>');
										$('#ext-rets-options .rets-classification').removeClass('hide').show();
									});
									/**
									 * Set the value back to what the user had before
									 * This time - trigger the change so that our UI bindings
									 * will auto-load the metadata fields to display on the next screen
									 */
									$('#ext-rets-class').val(data.target.class).trigger('change');
								}
							});
						}
					});

					/**
					 * Reset the RETS query to what the user had before
					 */
					$('#ext-rets-query').val(data.target.res);

					if (data.target.options && data.target.options.mediaExtract == true) {
						$('#ext-rets-media').prop('checked',true);
						$('#ext-rets-media-strategy').val(data.target.options.mediaExtractStrategy);
						$('#ext-rets-media-extractKey').val(data.target.options.mediaExtractKey);
						$('#ext-rets-media-target').val(data.target.options.mediaExtractTarget);
						if (data.target.options.mediaExtractStrategy == 'MediaGetURL') {
							$('#rets-media-query-options').show();
							$('#ext-rets-media-query').val(data.target.options.mediaExtractQuery);
							$('#ext-rets-media-query-extractKey').val(data.target.options.mediaQueryExtractKey);
						}
					} else {
						$('#rets-media-query-options').hide();
						$('#ext-rets-media').prop('checked',false);
						$('#ext-rets-media-strategy').val('');
						$('#ext-rets-media-extractKey').val('');
						$('#ext-rets-media-target').val('');
					}
				}
			break;
			case "transformWizard":
				$('#transformWizard').attr('data-id',data._id);
				$('#transformWizard').attr('data-rev',data._rev);

				if (data.status == 'disabled') {
					$('#transformWizard .modal-header [am-Button~=switch].status').attr('data-state-value','disabled').attr('data-state','off').text('Disabled');
				}

				$('#transformerName').val(data.name);
				$('#transformerDescription').val(data.description);
				$('#trn-source-toggle').val(data.style);

				/**
				 * Set the users selected extractor
				 * Also fire the change event so the metadata will load
				 */
				$('#trn-source-select').prop('disabled',false).val(data.extractor).trigger('change');

				var extractor = $DM.getExtractor(data.extractor);
				if (!extractor) {
					console.log('Invalid extractor, perhaps that extractor was deleted');
					return;
				}
				$DM.extractor.sample(extractor.value,function(e){
					if (e.err) {
						console.log('Error sampling the extractor', e);
						return;
					}

					// console.log(e.body);

					Admin.View.transformDataStructures()(e.body);
					$('#trn-transform-type').val((data.transform.normalize.length)?'normalize':'normalize').trigger('change');

					$('#transformNormalize input[type=checkbox]').prop('checked',false).trigger('change');

					$(data.transform.normalize).each(function(index,item){
						var $out = $('input[value="'+item.in+'"');
						var $row = $out.parent().parent();
						$out.val(item.out);
						$row.find('input[type=checkbox]').prop('checked',true).trigger('change');
						// $row.find('input[type=checkbox]').prop('checked',true).trigger('change');
						// console.log(item);
					});

					// $('#transformNormalize .item input:text:enabled').each(function(index,item){
					// 	transform.transform.input.push($('.name', $(item).parent().parent()).text());
					// 	transform.transform.normalize.push({
					// 		in: $('.name', $(item).parent().parent()).text(),
					// 		out: $(item).val()
					// 	});
					// });


				});
			break;
			case "loaderWizard":
				$('#loaderWizard').attr('data-id',data._id);
				$('#loaderWizard').attr('data-rev',data._rev);

				if (data.status == 'disabled') {
					$('#loaderWizard .modal-header [am-Button~=switch].status').attr('data-state-value','disabled').attr('data-state','off').text('Disabled');
				}

				$('#loaderName').val(data.name);
				$('#ldr-source-select').val(data.transform);
				$('#ldr-target-type').val(data.target.type);

				$('.loader-options').hide();
				switch(data.target.type)
				{
					case "mysql":
						$('#loaderSchemas').show();
						$DM.transformer.sample($DM.getTransformer(data.transform).value,function(e){
							if (!e.err) {
								Admin.View.loaderDefinition()(e.body);
								// update('loaderDefinition',e.body);
								trnSample = e.body;
							} 
						});
						$DM.loader.validate(data, function(res){
							if (res.err) {
								$('#loaderSchemas .create').show();
								$('#loaderSchemas .fields').hide();
							}

							$('#loaderSchemas .create').hide();
							$('#loaderSchemas .fields').show().find('p:first-child').hide();
							$('#ldr-create-schema').hide();

							$('#loaderSchemas input').prop('disabled',true);
							$('#loaderSchemas select').prop('disabled',true);

						});
						$('#ldr-mysql-dsn').val(data.target.dsn);
						$('#ldr-target-schema').val(data.target.schema.name);
						$('#loaderMySQL').show();
						$('#loaderCouchDB').hide();
						$('#loaderFTP').hide();
						$('#loaderFilesystem').hide();
					break;
					case "couchdb":
						$('#ldr-couchdb-options').show();
						$('#loaderMySQL').hide();
						$('#loaderCouchDB').show();
						$('#loaderFTP').hide();
						$('#loaderFilesystem').hide();
					break;
					case "ftp":
						$('#ldr-ftp-options').show();
						$('#ldr-ftp-dsn').val(data.target.dsn);

						$('#ldr-ftp-basepath').val(data.target.basepath);
						$('#ldr-ftp-filename').val(data.target.filename);

						$('#loaderMySQL').hide();
						$('#loaderCouchDB').hide();
						$('#loaderFTP').show();
						$('#loaderFilesystem').hide();
					break;
					case "filesystem":
						$('#ldr-filesystem-options').show();
						$('#ldr-filesystem-dsn').val(data.target.dsn);
						$('#loaderMySQL').hide();
						$('#loaderCouchDB').hide();
						$('#loaderFTP').hide();
						$('#loaderFilesystem').show();
					break;
				}
			break;
			case "taskWizard":
				$('#taskWizard').attr('data-id',data._id);
				$('#taskWizard').attr('data-rev',data._rev);

				if (data.status == 'disabled') {
					$('#taskWizard .modal-header [am-Button~=switch].status').attr('data-state-value','disabled').attr('data-state','off').text('Disabled');
				}

				$('#taskName').val(data.name);
				$('#taskDescription').val(data.description);
				$('#taskRepeat').val(data.repeat);
				$('#taskRundate').val(data.runDate);
				$('#taskRuntime').val(data.runTime);
				$('#task-extractor-select').val(data.extractor).change();

			break;
		}
	}

	this.showWizard = function(id) {
		$('#'+id).modal('show');
	}

	/**
	 * Get an extractor definition from the UI
	 * @return {[type]}
	 */
	var ext = function(){
		var stype = $DM.getSource($('#ext-source-select').val()).value.source.type;

		var extractor = {
			name: $('#extractorName').val(),
			source: $('#ext-source-select').val(),
			target: {
				type: (stype == 'RETS') ? $('#ext-rets-resource').val() : "file",
				class: (stype == 'RETS') ? $('#ext-rets-class').val() : "",
				res: (stype == 'RETS') ? $('#ext-rets-query').val() : $('#ftpFileName').val(),
				format: (stype == 'RETS') ? 'DMQL2' : $('[name=ext-data-format]').val()
			},
			status: $('#transformWizard .modal-header [am-Button~=switch].status').attr('data-state-value')
		};

		var id = $('#extractorWizard').attr('data-id');
		var _rev = $('#extractorWizard').attr('data-rev');
		if (id && _rev) {
			extractor._id = id;
			extractor._rev = _rev;
		}

		switch(stype){
			case "FTP":
				if (extractor.target.format === 'delimited-text') {
					extractor.target.options = {
						unarchive: $('[name=ext-unarchive]:checked').val(),
						delimiter: $('[name=ext-csv-delimiter]:checked').val(),
						escape: $('[name=ext-csv-escape]:checked').val()
					};
				}
			break;
			case "RETS":
				if ($('#ext-rets-media').prop('checked')) {
					extractor.target.options = {
						mediaExtract: true,
						mediaExtractStrategy: $('#ext-rets-media-strategy').val(),
						mediaExtractKey: $('#ext-rets-media-extractKey').val(),
						mediaExtractTarget: $('#ext-rets-media-target').val()
					};
					if(extractor.target.options.mediaExtractStrategy == 'MediaGetURL'){
						extractor.target.options.mediaExtractQuery = $('#ext-rets-media-query').val();
						extractor.target.options.mediaQueryExtractKey = $('#ext-rets-media-query-extractKey').val();
					}
				}
			break;
		}

		return extractor;
	};

	/**
	 * Get an transformer definition from the UI
	 * @return {[type]}
	 */
	var trn = function(){
		var transform = {
			name: $('#transformerName').val(),
			description: $('#transformerDescription').val(),
			style: $('#trn-source-toggle').val(),
			extractor: $('#trn-source-select').val(),
			transform: {
				input: [],
				normalize: [],
				map: $('#trn-map').val()
			},
			status: $('#transformWizard .modal-header [am-Button~=switch].status').attr('data-state-value')
		};

		var id = $('#transformWizard').attr('data-id');
		var _rev = $('#transformWizard').attr('data-rev');
		if (id && _rev) {
			transform._id = id;
			transform._rev = _rev;
		}

		$('#transformNormalize .item input:text:enabled').each(function(index,item){
			transform.transform.input.push($('.name', $(item).parent().parent()).text());
			transform.transform.normalize.push({
				in: $('.name', $(item).parent().parent()).text(),
				out: $(item).val()
			});
		});

		return transform;
	};

	/**
	 * Get a loader definition from the UI
	 * @return {[type]}
	 */
	var ldr = function(){
		var res = {
			name: $('#loaderName').val(),
			transform: $('#ldr-source-select').val(),
			target: {
				type: $('#ldr-target-type').val()
			},
			status: $('#loaderWizard .modal-header [am-Button~=switch].status').attr('data-state-value')
		};


		var id = $('#loaderWizard').attr('data-id');
		var _rev = $('#loaderWizard').attr('data-rev');
		if (id && _rev) {
			res._id = id;
			res._rev = _rev;
		}


		switch(res.target.type) {
			case "mysql":
				res.target.dsn = $('#ldr-mysql-dsn').val();
				res.target.schema = {
					name: $('#ldr-target-schema').val(),
					fields: []
				};
				$('#loaderSchemas .fields .maps label').each(function(index,item){
					res.target.schema.fields.push({
						key: $(item).text(),
						type: $(item).parent().parent().find('select').val()
					});
				});
			break;
			case "ftp":
				res.target.dsn = $('#ldr-ftp-dsn').val();
				res.target.basepath = $('#ldr-ftp-basepath').val();
				res.target.filename = $('#ldr-ftp-filename').val();
			break;
			case "filesystem":
				res.target.basepath = $('#ldr-filesystem-basepath').val();
				res.target.filename = $('#ldr-filesystem-filename').val();
				res.target.path = res.target.basepath + res.target.filename;
			break;
			case "couchdb":
			break;
		}

		return res;
	};

	/**
	 * Get a task definition from the UI
	 * @return {[type]}
	 */
	var tsk = function(){
		var id = $('#taskWizard').attr('data-id');
		var _rev = $('#taskWizard').attr('data-rev');
		var res = {
			name: $('#taskName').val(),
			description: $('#taskDescription').val(),
			runDate: $('#taskRundate').val(),
			runTime: $('#taskRuntime').val(),
			repeat: $('#taskRepeat').val(),
			extractor: $('#task-extractor-select').val(),
			status: $('#taskWizard .modal-header [am-Button~=switch].status').attr('data-state-value')
		};

		if (id && _rev) {
			res._id = id;
			res._rev = _rev;
		}
		
		return res;
	};

}(HoneyBadger.Admin, jQuery));
