+(function($admin, $) {

  var $DM;
  var Loader = function() {
    $admin.UI.Controllers.Loader = $this = this;
    console.log('Admin.Controllers.Loader constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      console.log('Admin.Controllers.Loader initialized');
    };
  };

  Loader.prototype.ModalReset = function() {
  };

  Loader.prototype.ModalSetup = function(data) {
    $('#loaderWizard').attr('data-id', data._id);
    $('#loaderWizard').attr('data-rev', data._rev);

    if (data.status == 'disabled') {
      $('#loaderWizard .modal-header [am-Button~=switch].status')
      .attr('data-state-value', 'disabled')
      .attr('data-state', 'off')
      .text('Disabled');
    }

    $('#loaderName').val(data.name);
    $('#ldr-source-select').val(data.transform);
    $('#ldr-target-type').val(data.target.type);

    $('.loader-options').hide();
    switch (data.target.type)
    {
      case "mysql":
        $('#loaderSchemas').show();
        $DM.transformer.sample($DM.getTransformer(data.transform).value, function(e) {
          if (!e.err) {
            Admin.View.loaderDefinition()(e.body);
            // update('loaderDefinition',e.body);
            trnSample = e.body;
          }
        });
        $DM.loader.validate(data, function(res) {
          if (res.err) {
            $('#loaderSchemas .create').show();
            $('#loaderSchemas .fields').hide();
          }

          $('#loaderSchemas .create').hide();
          $('#loaderSchemas .fields').show().find('p:first-child').hide();
          $('#ldr-create-schema').hide();

          $('#loaderSchemas input').prop('disabled', true);
          $('#loaderSchemas select').prop('disabled', true);

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
  };

  $admin.module.register({
    name: 'Controllers.Loader',
    instance: Loader
  }, function(_unsealed) {
    // Initialize module
    var module = new Loader();
    $admin = _unsealed(module._init); // fire constructor when DOM ready
  });
}(HoneyBadger.Admin, jQuery));
