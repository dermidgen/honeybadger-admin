+(function($admin, $) {

  var $DM;
  var Solution = function() {
    $admin.UI.Controllers.Solution = $this = this;
    console.log('Admin.Controllers.Solution constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      console.log('Admin.Controllers.Solution initialized');
    };
  };

  Solution.prototype.ModalReset = function() {
  };

  Solution.prototype.ModalSetup = function(data) {
  };

  $admin.module.register({
    name: 'Controllers.Solution',
    instance: Solution
  }, function(_unsealed) {
    // Initialize module
    var module = new Solution();
    $admin = _unsealed(module._init); // fire constructor when DOM ready
  });
}(HoneyBadger.Admin, jQuery));
