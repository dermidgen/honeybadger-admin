+(function($admin, $) {

  var private = {}, protected = {}, pages = {};
  var self = $admin.UI = protected;
  var $HB, $DM;

  self.Controllers = {};

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

    $('[data-toggle="page"]').each(function(index, item) {
      $(item).click(function() {
        self.navigate($(this).attr('data-target'));
      });
    });

    /**
     * Handle keep any log windows down to the bottom
     */
    $('.logger').each(function(index, item) {
      item.addEventListener("DOMNodeInserted", function(e) {
        this.scrollTop = this.scrollHeight;
      });
    });

    /**
     * Detect when source modal is activated
     */
    $('#sourceEditor').on('show.bs.modal', function() {
      resetWizard('sourceEditor');
    });

    /**
     * Detect when extractor modal is activated
     */
    $('#extractorWizard').on('show.bs.modal', function() {
      resetWizard('extractorWizard');
    });

    /**
     * Detect when transformer modal is activated
     */
    $('#transformWizard').on('show.bs.modal', function() {
      resetWizard('transformWizard');
    });

    /**
     * Detect when loader modal is activated
     */
    $('#loaderWizard').on('show.bs.modal', function() {
      resetWizard('loaderWizard');
    });

    /**
     * Detect when task modal is activated
     */
    $('#taskWizard').on('show.bs.modal', function() {
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
    $('[am-Dialog]').each(function(index, item) {
      var _id = $(item).prop('id');
      $('[am-Button~=next]', item).click(function() {
        $('#' + _id + ' section.step.active').hide().removeClass('active').next().show().addClass('active');
        $('#' + _id + ' .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
        if (!$('#' + _id + ' section.step.active').is($('#' + _id + ' section.step').first())) $('#' + _id + ' [am-Button~=prev]').prop('disabled', false);
        if ($('#' + _id + ' section.step.active').is($('#' + _id + ' section.step').last())) {
          $('#' + _id + ' [am-Button~=next]').hide();
          $('#' + _id + ' [am-Button~=finish]').show();
        }
      });

      $('#' + _id + ' [am-Button~=prev]').click(function() {
        $('#' + _id + ' section.step.active').hide().removeClass('active').prev().show().addClass('active');
        $('#' + _id + ' .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
        if ($('#' + _id + ' section.step.active').is($('#' + _id + ' section.step').first())) $('#' + _id + ' [am-Button~=prev]').prop('disabled', true);
        if (!$('#' + _id + ' section.step.active').is($('#' + _id + ' section.step').last())) {
          $('#' + _id + ' [am-Button~=finish]').hide();
          $('#' + _id + ' [am-Button~=next]').show();
        }
      });
    });

    $('[am-Button~=switch]').click(function() {
      var state = $(this).attr('data-state');
      state = (state !== 'on') ? 'on' : 'off';
      var label = $(this).attr('data-' + state + '-text');
      var value = (state === 'on') ? 'active' : 'disabled';
      $(this).attr('data-state', state).attr('data-state-value', value).text(label);
    });

    /**
     * Finish init by navigating to a page
     */
    if (document.location.hash) self.navigate(document.location.hash.replace('#', ''));
    else self.navigate('dashboard');

    console.log('Admin.UI initialized');
  };

  $admin.module.register({
    name: 'UI',
    instance: self
  }, function(_unsealed) {
    // Initialize module
    $admin = _unsealed(_init); // fire constructor when DOM ready
    _construct();
  });

  var alert = self.alert = function(msg, opts) {
    if (arguments.length == 1) {
      var opts = (typeof msg === 'string') ? {
        msg: msg,
      } : msg;
    }

    var opts = opts || {};
    opts.type = opts.type || 'info';
    opts.msg = opts.msg || msg;
    opts.hide = opts.hide || 3;

    $('#alerts').prepend($('<div class="alert alert-' + opts.type + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + opts.msg + '</div>').slideDown().delay(opts.hide * 1000).fadeOut(function() {
      $(this).remove();
    }));
  };

  /**
   * Reset the UI - All of it if you dare
   *
   * @return {[type]} [description]
   */
  var reset = self.reset = function() {

  };

  var navigate = self.navigate = function(page, callback) {
    if (typeof pages[page] == 'undefined') return false;

    $('#bs-example-navbar-collapse-1 li.active').removeClass('active');
    $('[data-target="' + page + '"]').closest('.nav-item').addClass('active');
    $('#bodyContent > *').hide();
    pages[page].show();
  };

  /**
   * Modal resets
   */
  // var sourceModalReset = function() { self.Controllers.Source.ModalReset(); };

  var resetWizard = self.resetWizard = function(id) {
    $('#' + id).attr({'data-id': '', 'data-rev': ''});
    $('#' + id + ' section.step').hide().first().show();
    $('#' + id + ' .files').empty();
    $('input[type=text], input[type=password], select, textarea', '#' + id).val('');

    /**
     * Reset the modal buttons
     */
    $('#' + id + ' section.step').hide().removeClass('active').first().show().addClass('active');
    $('#' + id + ' [am-Button~=prev]').show().prop('disabled', true);
    $('#' + id + ' [am-Button~=next]').show().prop('disabled', false);
    $('#' + id + ' [am-Button~=finish]').prop('disabled', true).hide();

    $('#' + id + ' .body.logger').html('');
    $('#' + id + ' .wizard-result').html('');
  };

  /**
   * Populate the proper wizard with saved data
   * @param  {[type]} id
   * @param  {[type]} data
   * @return {[type]}
   */
  var setupWizard = self.setupWizard = function(id, data) {
    // ONLY EXECUTES ON EDIT NOT "NEW"
    // console.log(data);
    resetWizard(id);
    switch (id)
    {
      case 'sourceEditor':
        self.Controllers.Source.ModalReset();
        self.Controllers.Source.ModalSetup(data);
      break;
      case "extractorWizard":
        self.Controllers.Extractor.ModalSetup(data);
      break;
      case "transformWizard":
        self.Controllers.Transform.ModalSetup(data);
      break;
      case "loaderWizard":
        self.Controllers.Loader.ModalSetup(data);
      break;
      case "taskWizard":
        self.Controllers.Task.ModalSetup(data);
      break;
    }
  }

  var showWizard = self.showWizard = function(id) {
    $('#' + id).modal('show');
  }

  /**
   * Get an extractor definition from the UI
   * @return {[type]}
   */
  var ext = function() {
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

    switch (stype){
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
          if (extractor.target.options.mediaExtractStrategy == 'MediaGetURL') {
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
  var trn = function() {
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

    $('#transformNormalize .item input:text:enabled').each(function(index, item) {
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

  /**
   * Get a task definition from the UI
   * @return {[type]}
   */
  var tsk = function() {
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
