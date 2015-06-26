+(function($admin, $) {

  var $DM;
  var Task = function() {
    var $this = $admin.UI.Controllers.Task = this;
    console.log('Admin.Controllers.Task constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      $this.Bindings();
      console.log('Admin.Controllers.Task initialized');
    };
  };

  Task.prototype.Bindings = function() {
    $('#taskRepeat').change(function() {
      var _repeat = $(this).val();
      switch (_repeat)
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

    $('#task-extractor-select').change(function() {

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

      $("#taskETLMap .sources").append('<li class="source"><div class="title">' + source.key + '</div></li>');
      $("#taskETLMap .extractors").append('<li class="extractor"><div class="title">' + extractor.key + '</div></li>');

      $(transformers).each(function(index, item) {
        if (item.value.extractor == _ext) {
          $('#taskTransformers').append('<li>' + item.key + '</li>');
          $("#taskETLMap .transformers").append('<li class="transformer" data-id="' + item.id + '"><div class="title">' + item.key + '</div></li>');
          _trn.push(item.id);
        }
      });

      $(loaders).each(function(index, item) {
        if (_trn.indexOf(item.value.transform) > -1) {
          $('#taskLoaders').append('<li>' + item.key + '</li>');
          $("#taskETLMap [data-id=" + item.value.transform + "]").append('<li class="loader" data-rel="' + item.value.transform + '" data-id="' + item.id + '"><div class="title">' + item.key + '</div></li>');
          _ldr.push(item.id);
        }
      });

    });

    /**
     * Binding for running task tests
     */
    $('#task-test').click(function() {
      $('#task-result').html('');
      $DM.task.sample(tsk(), function(e) {
        if (!e.err) {
          $('#task-result').html('<p class="bg-success">Task Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
          $('#taskWizard [am-Button~=finish]').prop('disabled', false);
        } else {
          $('#task-result').html('<p class="bg-danger">Task Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
          $('#taskWizard [am-Button~=finish]').prop('disabled', true);
        }
      });
    });

    /**
     * Clear the loader test log
     */
    $('#task-test-clear').click(function() {
      $('#task-log-body').html('');
      $('#task-result').html('');
    });

    /**
     * Binding to manually run the task
     */
    $('#task-run').click(function() {
      $('#task-log-body').html('');
      $('#task-result').html('');

      $('#task-log-body').html('<p class="text-warning">Manually Running Task! <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');

      $DM.task.run(tsk(), function(e) {
        if (!e.err) {
          $('#task-result').html('<p class="bg-success">Task Manual Run Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
          $('#taskWizard [am-Button~=finish]').prop('disabled', false);
        } else {
          $('#task-result').html('<p class="bg-danger">Task Manual Run Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
          $('#taskWizard [am-Button~=finish]').prop('disabled', true);
        }
      });


    });

    /**
     * Hook to the Dialog finish button
     */
    $('#taskWizard [am-Button~=finish]').click(function() {
      $('#taskWizard').modal('hide');
      $DM.task.save(tsk());
    });
  };

  Task.prototype.ModalReset = function() {
  };

  Task.prototype.ModalSetup = function(data) {
    $('#taskWizard').attr('data-id', data._id);
    $('#taskWizard').attr('data-rev', data._rev);

    if (data.status == 'disabled') {
      $('#taskWizard .modal-header [am-Button~=switch].status').attr('data-state-value', 'disabled').attr('data-state', 'off').text('Disabled');
    }

    $('#taskName').val(data.name);
    $('#taskDescription').val(data.description);
    $('#taskRepeat').val(data.repeat);
    $('#taskRundate').val(data.runDate);
    $('#taskRuntime').val(data.runTime);
    $('#task-extractor-select').val(data.extractor).change();
  };

  $admin.module.register({
    name: 'Controllers.Task',
    instance: Task
  }, function(_unsealed) {
    // Initialize module
    var module = new Task();
    $admin = _unsealed(module._init); // fire constructor when DOM ready
  });
}(HoneyBadger.Admin, jQuery));
