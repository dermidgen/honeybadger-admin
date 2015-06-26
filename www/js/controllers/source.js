+(function($admin, $) {

  var Source = function() {
    $admin.UI.Controllers.Source = $this = this;
    console.log('Admin.Controllers.Source constructor');

    this._init = function() {
      console.log('Admin.Controllers.Source initialized');
    };
  };

  Source.prototype.ModalReset = function() {
    $('#validateBtn').removeAttr('disabled')
    .removeClass('btn-danger btn-success')
    .addClass('btn-primary');

    $('#sourceValidationStatus').removeClass('ok-sign exclamation-sign');
    $('#sourceTypeOptions .option-group').hide();
    $('#sourceEditorSave').prop('disabled', false);
  };

  Source.prototype.ModalSetup = function(data) {
    $('#sourceEditor').attr('data-id', data._id);
    $('#sourceEditor').attr('data-rev', data._rev);

    if (data.status == 'disabled') {
      $('#sourceEditor .modal-header [am-Button~=switch].status')
      .attr('data-state-value', 'disabled')
      .attr('data-state', 'off')
      .text('Disabled');
    }

    $('#sourceEditor [am-Button~=finish]').prop('disabled', true).show();
    $('#sourceEditor [am-Button~=next]').prop('disabled', true).hide();

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
    } else if (data.source.type == 'SOAP') {
      $('#source_SOAP').show();
    } else if (data.source.type == 'REST') {
      $('#source_REST').show();
    } else if (data.source.type == 'XML') {
      $('#source_XML').show();
    }
  };

  $admin.module.register({
    name: 'Controllers.Source',
    instance: Source
  }, function(_unsealed) {
    // Initialize module
    var module = new Source();
    $admin = _unsealed(module._init); // fire constructor when DOM ready
  });
}(HoneyBadger.Admin, jQuery));
