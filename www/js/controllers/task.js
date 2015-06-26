+(function($admin, $) {

  var $DM;
  var Task = function() {
    $admin.UI.Controllers.Task = $this = this;
    console.log('Admin.Controllers.Task constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      console.log('Admin.Controllers.Task initialized');
    };
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
