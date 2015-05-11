+(function($admin,$){

	var self = $admin.Validator = this;
	var private = {}, protected = {}, pages = {};
	var $HB, $DM;

	var _construct = function() {
		console.log('Admin.Validator constructor');
		$HB = $admin._parent;
		$DM = $HB.DataManager;
	};

	var _init = function() {
		// Our parent already listens for DOM ready
		console.log('Admin.Validator initialized');
	};

	$admin.module.register({
		name: 'Validator',
		instance: this
	},function(_unsealed){
		// Initialize module
		$admin = _unsealed(_init); // fire initializer when DOM ready
		_construct(); // run constructor now
	});

	this.source = {};
	this.source.validate = function(src){

		var src = {},
			type = $('#sourcetype').val();

		switch(type) {
			case "RETS":
				src.uri = $('#sourceuri').val();
				src.type = type;
				src.auth = {
					username: $('#sourceuser').val(),
					password: $('#sourcepassword').val(),
					userAgentHeader: $('#sourceua').val(),
					userAgentPassword: $('#sourceuapw').val()
				};
			break;
			case "FTP":
				src.uri = $('#ftphost').val();
				src.type = type;
				src.port = 21;
				src.auth = {
					username: $('#ftpuser').val(),
					password: $('#ftpauth').val()
				};
			break;
		}

		$('#sourceValidationStatus').removeClass('ok-sign exclamation-sign').addClass('asterisk');
		// $('#validateBtn').attr('disabled','disabled');

		$DM.validateSource(src,function(e){
			$('#validateBtn').removeClass('btn-danger btn-success').addClass('btn-primary');
			if (!e.err) {
				$('#validateBtn').removeClass('btn-primary').addClass('btn-success')
				$('#sourceValidationStatus').removeClass('asterisk').addClass('ok-sign');
				$('#sourceEditor [am-Button~=next]').hide();
				$('#sourceEditor [am-Button~=finish]').show().prop("disabled", false);
			} else {
				$('#validateBtn').removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
				$('#sourceValidationStatus').removeClass('asterisk').addClass('exclamation-sign');
				$('#sourceEditor [am-Button~=finish]').prop('disabled',true);
			}
		});
	};
	this.source.save = function(){

		if (!$('#sourcename').val()) return false;

		var type = $('#sourcetype').val(),
			src = {	name: $('#sourcename').val() },
			src_id = $('#sourceEditor').attr('data-id'),
			src_rev = $('#sourceEditor').attr('data-rev');
		if( src_id ){ src._id = src_id; }
		if( src_rev ){ src._rev = src_rev; }
		
		src.status = $('#sourceEditor .modal-header [am-Button~=switch].status').attr('data-state-value');

		switch(type)
		{
			case "RETS":
				src.source = {
					uri: $('#sourceuri').val(),
					type: type,
					version: '1.5',
					auth: {
						username: $('#sourceuser').val(),
						password: $('#sourcepassword').val(),
						userAgentHeader: $('#sourceua').val(),
						userAgentPassword: $('#sourceuapw').val()
					}
				};
			break;
			case "FTP":
				src.source = {
					uri: $('#ftphost').val(),
					type: type,
					auth: {
						username: $('#ftpuser').val(),
						password: $('#ftpauth').val()
					}
				};
			break;
			case "SOAP":
			break;
			case "REST":
			break;
			case "XML":
			break;
		}

		$DM.saveSource(src,function(e){
			$DM.loadSources();
		});

		sourceModalReset();
		$('#sourceEditor').modal('hide');
	};

}(HoneyBadger.Admin, jQuery));
