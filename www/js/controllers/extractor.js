+(function($admin, $) {

  var $DM;
  var Extractor = function() {
    $admin.UI.Controllers.Extractor = $this = this;
    console.log('Admin.Controllers.Extractor constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      console.log('Admin.Controllers.Extractor initialized');
    };
  };

  Extractor.prototype.ModalReset = function() {
  };

  Extractor.prototype.ModalSetup = function(data) {
    $('#extractorWizard').attr('data-id', data._id);
    $('#extractorWizard').attr('data-rev', data._rev);

    if (data.status == 'disabled') {
      $('#extractorWizard .modal-header [am-Button~=switch].status').attr('data-state-value', 'disabled').attr('data-state', 'off').text('Disabled');
    }

    /**
     * Load Saved Extractor for Editing
     */

    /**
     * Populate the first page of the extractor dialog
     */
    $('#extractorName').val(data.name);
    $('#ext-source-select').val(data.source);
    $('#ext-source-select').val(data.source);
    $('[name=ext-data-format]').val(data.target.format);

    /**
     * Setup the wizard based on the source type
     */
    var source = $DM.getSource(data.source).value.source;
    var type = source.type;

    $('#extractorWizard .source-options').hide();
    if (type === 'FTP') {

      $('#ftpFileName').val(data.target.res);
      $('#ext-ftp-browser .files').empty();
      $('#ext-ftp-options').show();
      $('.ext-ftp-options').show();
      $('.ext-rets-options').hide();
      $('#ext-rets-options').hide();

      if (data.target.format === 'delimited-text') {
        $('#extractorWizard [name=ext-unarchive][value=' + data.target.options.unarchive + ']').prop('checked', true);
        $('#extractorWizard [name=ext-csv-delimiter][value=' + data.target.options.delimiter + ']').prop('checked', true);
        $('#extractorWizard [name=ext-csv-escape][value=' + data.target.options.escape + ']').prop('checked', true);
      }
    } else if (type === 'RETS') {
      $('#ext-ftp-options').hide();
      $('.ext-ftp-options').hide();
      $('.ext-rets-options').show();
      $('#ext-rets-options').show();

      /**
       * We need to load the RETS metadata and re-select the saved options.
       *
       * Let's show the fields so that we can gracefully handle issues
       * in the future (like and expired-non working value - if the MLS changes
       * their class/resource names).
       *
       * TODO: add visual handler if one of the calls fails
       */
      $('#extractorWizard .rets-resource').removeClass('hide').show();
      $('#extractorWizard .rets-classification').removeClass('hide').show();

      /**
       * We'll start with getting resources
       */
      $DM.retsExplore(data.source, function(e) {
        if (e.body.meta.METADATA) {
          $('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
          $.each(e.body.meta.METADATA[0]['METADATA-RESOURCE'].Resource, function(index, item) {
            $('#ext-rets-resource').append('<option value="' + item.ResourceID[0] + '">' + item.VisibleName[0] + '</option>');
            $('#ext-rets-options .rets-resource').removeClass('hide').show();
          });
          /**
           * Set the value back to what the user had before
           */
          $('#ext-rets-resource').val(data.target.type);

          /**
           * Fetch the various classes
           */
          source.rets = { resource: data.target.type };
          $DM.retsBrowse({ source: source }, function(e) {
            if (e.body.meta.METADATA) {
              $('#ext-rets-class').html('<option>-- Select a data class --</option>')
              $.each(e.body.meta.METADATA[0]['METADATA-CLASS'].Class, function(index, item) {
                $('#ext-rets-class').append('<option value="' + item.ClassName[0] + '">' + item.VisibleName[0] + ((item.StandardName[0]) ? ' : ' + item.StandardName[0] : '') + '</option>');
                $('#ext-rets-options .rets-classification').removeClass('hide').show();
              });
              /**
               * Set the value back to what the user had before
               * This time - trigger the change so that our UI bindings
               * will auto-load the metadata fields to display on the next screen
               */
              $('#ext-rets-class').val(data.target.class).trigger('change');
            }
          });
        }
      });

      /**
       * Reset the RETS query to what the user had before
       */
      $('#ext-rets-query').val(data.target.res);

      if (data.target.options && data.target.options.mediaExtract == true) {
        $('#ext-rets-media').prop('checked', true);
        $('#ext-rets-media-strategy').val(data.target.options.mediaExtractStrategy);
        $('#ext-rets-media-extractKey').val(data.target.options.mediaExtractKey);
        $('#ext-rets-media-target').val(data.target.options.mediaExtractTarget);
        if (data.target.options.mediaExtractStrategy == 'MediaGetURL') {
          $('#rets-media-query-options').show();
          $('#ext-rets-media-query').val(data.target.options.mediaExtractQuery);
          $('#ext-rets-media-query-extractKey').val(data.target.options.mediaQueryExtractKey);
        }
      } else {
        $('#rets-media-query-options').hide();
        $('#ext-rets-media').prop('checked', false);
        $('#ext-rets-media-strategy').val('');
        $('#ext-rets-media-extractKey').val('');
        $('#ext-rets-media-target').val('');
      }
    }
  };

  $admin.module.register({
    name: 'Controllers.Extractor',
    instance: Extractor
  }, function(_unsealed) {
    // Initialize module
    var module = new Extractor();
    $admin = _unsealed(module._init); // fire constructor when DOM ready
  });
}(HoneyBadger.Admin, jQuery));
