+(function($admin, $) {

  /**
   * Get a loader definition from the UI
   * @return {[type]}
   */
  var ldr = function() {
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


    switch (res.target.type) {
      case "mysql":
        res.target.dsn = $('#ldr-mysql-dsn').val();
        res.target.schema = {
          name: $('#ldr-target-schema').val(),
          fields: []
        };
        $('#loaderSchemas .fields .maps label').each(function(index, item) {
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


  var $DM;
  var Loader = function() {
    var $this = $admin.UI.Controllers.Loader = this;
    console.log('Admin.Controllers.Loader constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      $this.Bindings();
      console.log('Admin.Controllers.Loader initialized');
    };
  };

  Loader.prototype.Bindings = function() {
    /**
     * Setup dialog button to be next vs save
     */
    $('#loaderWizard [am-Button~=finish]').hide();

    /**
     * When choosing a transformer to feed the loader
     */
    $('#ldr-source-toggle').change(function() {
      if ($(this).val() !== 'custom') $('#ldr-source-select').removeAttr('disabled');
      else $('#ldr-source-select').attr('disabled', 'disabled');
    });

    var trnSample = {};

    /**
     * When choosing a transformer to feed the loader
     */
    $('#ldr-source-select').change(function() {
      var v = $(this).val();
      var s = $DM.getTransformers().filter(function(e) {
        if (e.id == v) return e;
        else return null;
      }).pop();

      $DM.transformer.sample(s.value, function(e) {
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
    $('#loaderDSN button').click(function() {
      $DM.loader.validateConnection(ldr(), function(e) {
        var t = $('#ldr-target-type').val();
        var btn = $('#ldr-' + t + '-validate');
        switch (t) {
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
          $('.validation-status', btn).removeClass('asterisk').addClass('ok-sign');
          $('#loaderWizard [am-Button~=next]').prop('disabled', false);
        } else {
          $(btn).prop('disabled', false).removeClass('btn-primary').addClass('btn-danger');
          $('.validation-status', btn).removeClass('asterisk').addClass('exclamation-sign');
        }

      });
    });

    $('#ldr-target-type').change(function() {
      switch ($(this).val())
      {
        case "mysql":
          $('.loader-options').hide();
          $('#loaderSchemas').show();

          /**
           * Bindings to the create schema button for MySQL loaders
           */
          $('#ldr-create-schema').click(function() {
            $DM.loader.createSchema(ldr(), function(e) {
              $('#ldr-create-schema').removeClass('btn-danger btn-success').addClass('btn-primary');
              if (!e.err) {
                $('#ldr-create-schema').removeClass('btn-primary').addClass('btn-success')
                $('#ldr-create-schema .schema-status').removeClass('asterisk').addClass('ok-sign');
              } else {
                $('#ldr-create-schema').prop('disabled', false).removeClass('btn-primary').addClass('btn-danger')
                $('#ldr-create-schema .schema-status').removeClass('asterisk').addClass('exclamation-sign');
              }

            });
          });

          $('#loaderSchemas .fields').hide();
          $('#ldr-new-schema').click(function() {
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
    $('#ldr-test').click(function() {
      $('#loader-result').html('');
      $DM.loader.sample(ldr(), function(e) {
        if (!e.err) {
          $('#loader-result').html('<p class="bg-success">Loader Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
          $('#loaderWizard [am-Button~=finish]').prop('disabled', false);
        } else {
          $('#loader-result').html('<p class="bg-danger">Loader Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
          $('#loaderWizard [am-Button~=finish]').prop('disabled', true);
        }
      });
    });

    /**
     * Clear the loader test log
     */
    $('#ldr-test-clear').click(function() {
      $('#loader-log-body').html('');
      $('#loader-result').html('');
    });

    /**
     * Hook to the Dialog finish button
     */
    $('#loaderWizard [am-Button~=finish]').click(function() {
      $('#loaderWizard').modal('hide');
      $DM.loader.validate(ldr());
      $DM.loader.save(ldr());
    });
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
