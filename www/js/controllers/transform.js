+(function($admin, $) {

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

  var $DM;
  var Transform = function() {
    var $this = $admin.UI.Controllers.Transform = this;
    console.log('Admin.Controllers.Transform constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      $this.Bindings();
      console.log('Admin.Controllers.Transform initialized');
    };
  };

  Transform.prototype.Bindings = function() {
    /**
     * Setup dialog button to be next vs save
     */
    $('#transformWizard [am-Button~=finish]').hide();

    /**
     * Input type selection for the transformer
     * This should pretty much just be "bind to extractor" now
     */
    $('#trn-source-toggle').change(function() {
      if ($(this).val() !== 'custom') $('#trn-source-select').prop('disabled', false);
      else $('#trn-source-select').attr('disabled', 'disabled');
    });

    /**
     * When a user selects an extractor to feed into the transformer let's load
     * some metadata
     */
    $('#trn-source-select').change(function() {
      var v = $(this).val();
      var s = $DM.getExtractors().filter(function(e) {
        if (e.id == v) return e;
        else return null;
      }).pop();
      if (!s) return;
      $DM.extractor.sample(s.value, function(e) {
        if (!e.err) {
          Admin.View.transformDataStructures()(e.body);
          $('#transformWizard [am-Button~=next]').prop('disabled', false);
        }
      });
    });

    $('#transformNormalize').hide();
    $('#transformMapper').hide();

    /**
     * When you choose a transformation type
     */
    $('#trn-transform-type').change(function() {
      if ($(this).val() == 'normalize') {
        $('#transformNormalize').show();
        $('#transformMapper').hide();
      }
      if ($(this).val() == 'map') {
        $('#transformNormalize').hide();
        $('#transformMapper').show();
      }
    });

    /**
     * Bind to the transformer test button
     */
    $('#trn-test').click(function() {
      $('#transformer-result').html('');
      $DM.transformer.sample(trn(), function(e) {
        if (!e.err) {
          $('#transformer-result').html('<p class="bg-success">Transform Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
          $('#transformWizard [am-Button~=finish]').prop('disabled', false);
        } else {
          $('#transformer-result').html('<p class="bg-danger">Transform Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
          $('#transformWizard [am-Button~=finish]').prop('disabled', true);
        }
      });
    });

    /**
     * Reset tranform test log
     */
    $('#trn-test-clear').click(function() {
      $('#transformer-log-body').html('');
      $('#transformer-result').html('');
    });

    /**
     * Hook to the Dialog finish button
     */
    $('#transformWizard [am-Button~=finish]').click(function() {
      $('#transformWizard').modal('hide');
      $DM.transformer.validate(trn());
      $DM.transformer.save(trn(), function() { $DM.loadTransformers(); });
    });
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
