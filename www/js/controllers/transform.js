+(function($admin, $) {

  var $DM;
  var Transform = function() {
    $admin.UI.Controllers.Transform = $this = this;
    console.log('Admin.Controllers.Transform constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      console.log('Admin.Controllers.Transform initialized');
    };
  };

  Transform.prototype.ModalReset = function() {
  };

  Transform.prototype.ModalSetup = function(data) {
    $('#transformWizard').attr('data-id', data._id);
    $('#transformWizard').attr('data-rev', data._rev);

    if (data.status == 'disabled') {
      $('#transformWizard .modal-header [am-Button~=switch].status').attr('data-state-value', 'disabled').attr('data-state', 'off').text('Disabled');
    }

    $('#transformerName').val(data.name);
    $('#transformerDescription').val(data.description);
    $('#trn-source-toggle').val(data.style);

    /**
     * Set the users selected extractor
     * Also fire the change event so the metadata will load
     */
    $('#trn-source-select').prop('disabled', false).val(data.extractor).trigger('change');

    var extractor = $DM.getExtractor(data.extractor);
    if (!extractor) {
      console.log('Invalid extractor, perhaps that extractor was deleted');
      return;
    }
    $DM.extractor.sample(extractor.value, function(e) {
      if (e.err) {
        console.log('Error sampling the extractor', e);
        return;
      }

      // console.log(e.body);

      Admin.View.transformDataStructures()(e.body);
      $('#trn-transform-type').val((data.transform.normalize.length)?'normalize':'normalize').trigger('change');

      $('#transformNormalize input[type=checkbox]').prop('checked', false).trigger('change');

      $(data.transform.normalize).each(function(index, item) {
        var $out = $('input[value="' + item.in + '"');
        var $row = $out.parent().parent();
        $out.val(item.out);
        $row.find('input[type=checkbox]').prop('checked', true).trigger('change');
        // $row.find('input[type=checkbox]').prop('checked',true).trigger('change');
        // console.log(item);
      });

      // $('#transformNormalize .item input:text:enabled').each(function(index,item){
      //  transform.transform.input.push($('.name', $(item).parent().parent()).text());
      //  transform.transform.normalize.push({
      //    in: $('.name', $(item).parent().parent()).text(),
      //    out: $(item).val()
      //  });
      // });
  

    });
  };

  $admin.module.register({
    name: 'Controllers.Transform',
    instance: Transform
  }, function(_unsealed) {
    // Initialize module
    var module = new Transform();
    $admin = _unsealed(module._init); // fire constructor when DOM ready
  });
}(HoneyBadger.Admin, jQuery));
