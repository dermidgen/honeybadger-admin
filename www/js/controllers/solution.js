+(function($admin, $) {

  var $DM;
  var Solution = function() {
    var $this = $admin.UI.Controllers.Solution = this;
    console.log('Admin.Controllers.Solution constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      $this.Bindings();
      console.log('Admin.Controllers.Solution initialized');
    };
  };

  Solution.prototype.Bindings = function() {
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
