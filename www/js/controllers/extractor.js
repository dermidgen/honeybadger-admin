+(function($admin, $) {

  var $DM;

  /**
   * Get an extractor definition from the UI
   * @return {[type]}
   */
  var ext = function(){
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

    switch(stype){
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
          if(extractor.target.options.mediaExtractStrategy == 'MediaGetURL'){
            extractor.target.options.mediaExtractQuery = $('#ext-rets-media-query').val();
            extractor.target.options.mediaQueryExtractKey = $('#ext-rets-media-query-extractKey').val();
          }
        }
      break;
    }

    return extractor;
  };


  var Extractor = function() {
    var $this = $admin.UI.Controllers.Extractor = this;
    console.log('Admin.Controllers.Extractor constructor');

    this._init = function() {
      $DM = $admin._parent.DataManager;
      $this.Bindings();
      console.log('Admin.Controllers.Extractor initialized');
    };

  };

  Extractor.prototype.Bindings = function() {
    /**
     * Setup dialog button to be next vs save
     */
    $('#extractorWizard [am-Button~=finish]').hide();

    /**
     * FTP Extractor Browse Button
     * From the extractor Wizard; if selected source is FTP, bind to the browse button
     * to find a target from the FTP source
     */
    $('#ext-ftp-browse').click(function() {
      $DM.ftpBrowse($DM.getSource($('#ext-source-select').val()), $('#ftpRootPath').val(), function(e) {
        if (!e.err && e.body.success === true) {
          $('#ext-ftp-browser .files').empty();
          e.body.list.forEach(function(item, index) {
            if (item.name) $('#ext-ftp-browser .files').append($('<li class="file">' + item.name + '</li>').click(function() {
              var path = ($('#ftpRootPath').val()) ? $('#ftpRootPath').val() + '/' + item.name : item.name;
              $('#ftpFileName').val(path);
              $('#ext-ftp-browser .files').empty();
              // $('#extractorWizard [am-Button~=prev]').prop("disabled", false);
              $('#extractorWizard [am-Button~=next]').prop("disabled", false);
            }));
          });
        }
      });
    });

    /**
     * From the extractor wizard:
     * When selecting a data source for an extractor let's do some logic
     * based on the type of source they've chosen
     */
    $('#extractorWizard .source-options').hide();
    $('#ext-source-select').change(function() {
      var s = $DM.getSource($(this).val());

      $('#ext-rets-options .rets-resource').hide();
      $('#ext-rets-options .rets-classification').hide();
      $('#extractorWizard .source-options').hide();

      if (!s) return;
      if (s.value.source.type === 'FTP') {
        $('#ext-ftp-browser .files').empty();
        $('#ftpRootPath').val('');
        $('#ftpFileName').val('');
        $('#ext-ftp-options').show();
        $('#ext-rets-options').hide();
        $('#ext-step-2 > .ext-ftp-options').show();
        $('#ext-step-2 > .ext-rets-options').hide();
      }      else if (s.value.source.type === 'RETS') {
        $('#ext-ftp-options').hide();
        $('#ext-rets-options').show();
        $('#ext-step-2 > .ext-ftp-options').hide();
        $('#ext-step-2 > .ext-rets-options').show();

        s.value.source.rets = { resource: $('#ext-rets-resource').val() };
        // console.log(s);
        // 
        
        /**
         * Populate the Resources Selection Dropdown for RETS extractors
         */
        $DM.retsExplore(s.value, function(e) {
          console.dir(e);
          if (e.body.meta) {
            $('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
            $.each(e.body.meta.RETS.METADATA[0]['METADATA-RESOURCE'][0].Resource, function(index, item) {
              console.log(item);
              $('#ext-rets-resource').append('<option value="' + item.ResourceID[0] + '">' + item.VisibleName[0] + '</option>');
              $('#ext-rets-options .rets-resource').removeClass('hide').show();
            });
          }
        });
      }
    });

    /**
     * From the extractor wizard; for RETS sources, when a user selects a resource
     */
    $('#ext-rets-resource').change(function() {
      var s = $DM.getSource($('#ext-source-select').val()).value;
      s.source.rets = { resource: $('#ext-rets-resource').val() };
      console.log(s);
      $DM.retsBrowse(s, function(e) {
        console.dir(e);
        if (e.body.meta) {
          $('#ext-rets-class').html('<option>-- Select a data class --</option>')
          $.each(e.body.meta.RETS.METADATA[0]['METADATA-CLASS'][0].Class, function(index, item) {
            $('#ext-rets-class').append('<option value="' + item.ClassName[0] + '">' + item.VisibleName[0] + ((item.StandardName[0]) ? ' : ' + item.StandardName[0] : '') + '</option>');
            $('#ext-rets-options .rets-classification').removeClass('hide').show();
          });
        }
      });
    });

    /**
     * From the extractor wizard; for RETS sources, when a user selects a class
     */
    $('#ext-rets-class').change(function() {
      var s = $DM.getSource($('#ext-source-select').val()).value;
      s.source.rets = {
        resource: $('#ext-rets-resource').val(),
        classification: $('#ext-rets-class').val()
      };
      // Grab all the fields to show the user
      $DM.retsInspect(s, function(e) {
        $('#ext-step-2 > .ext-rets-options .fields').html('');
        console.dir(e);
        $.each(e.body.meta.RETS.METADATA[0]['METADATA-TABLE'][0].Field, function(index, item) {
          $('#ext-step-2 > .ext-rets-options .fields').append('<div class="item"><strong>' + item.LongName[0] + '</strong> <em>' + index + '</em> <small>' + item.StandardName[0] + '</small> ' + ((item.Searchable[0] == '1') ? '<span class="badge">Searchable</span>' : '') + '<div class="detail"><small><em>' + item.DataType[0] + '</em> </small></div></div>');
          // Check if the item is a lookup field and get it's possible values to show the user
          // if (item.LookupName[0] === 'STATUS') {
          //   $DM.retsLookup(s, item.LookupName[0], function(res) {
          //     console.log(res);
          //     $.each(res.body.meta.RETS.METADATA[0]['METADATA-LOOKUP_TYPE'][0].Lookup, function(i, it) {
          //       $('#ext-step-2 > .ext-rets-options .fields').append('<span>' + it.LongValue[0] + ' : ' + it.Value[0] + '</span>');
          //     });
          //   });
          // }
          // +item.ShortName[0]+' '+item.DBName[0]+' '
        });
        $('#extractorWizard [am-Button~=next]').prop("disabled", false);
      });
    });

    $('#ext-rets-media').change(function() {
      if ($(this).prop('checked')) $('#rets-media-options').show();
      else $('#rets-media-options').hide();
    });

    $('#ext-rets-media-strategy').change(function() {
      if ($(this).val() == 'MediaGetURL') $('#rets-media-query-options').show();
      else $('#rets-media-query-options').hide();
    });

    /**
     * From the extractor wizard: bindings for unarchive options
     */
    $('#ext-unarchive').change(function() {
      if ($('#ext-unarchive')[0].checked) $('#ext-archive-opts').prop('disabled', false);
      else $('#ext-archive-opts').prop('disabled', true);
    });

    /**
     * From the extractor wizard: Run the extractor test
     */
    $('#ext-test').click(function() {
      $('#extraction-result').html('');
      $DM.extractor.sample(ext(), function(e) {
        // console.log(e);
        if (!e.err) {
          $('#extraction-result').html('<p class="bg-success">Extractor Test Completed Successfully <span am-Icon="glyph" class="glyphicon ok-circle"></span></p>');
          $('#extractorWizard [am-Button~=finish]').prop('disabled', false);
        } else {
          $('#extractorWizard [am-Button~=finish]').prop('disabled', true);
          $('#extraction-result').html('<p class="bg-danger">Extractor Test Failed! Check your settings and try again. <span am-Icon="glyph" class="glyphicon warning-sign"></span></p>');
        }
      });
    });

    /**
     * Clear the log window
     */
    $('#ext-test-clear').click(function() {
      $('#extractor-log-body').html('');
      $('#extraction-result').html('');
    });

    /**
     * Hook to the Dialog finish button
     */
    $('#extractorWizard [am-Button~=finish]').click(function() {
      $('#extractorWizard').modal('hide');
      $DM.extractor.validate(ext());
      $DM.extractor.save(ext(), function() { $DM.loadExtractors(); });
    });
  };

  Extractor.prototype.ModalReset = function() {
  };

  Extractor.prototype.ModalSetup = function(data) {
    $('#extractorWizard').attr('data-id', data._id);
    $('#extractorWizard').attr('data-rev', data._rev);

    if (data.status == 'disabled') {
      $('#extractorWizard .modal-header [am-Button~=switch].status')
      .attr('data-state-value', 'disabled')
      .attr('data-state', 'off')
      .text('Disabled');
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
        $('#extractorWizard [name=ext-unarchive][value=' + data.target.options.unarchive + ']')
        .prop('checked', true);
        $('#extractorWizard [name=ext-csv-delimiter][value=' + data.target.options.delimiter + ']')
        .prop('checked', true);
        $('#extractorWizard [name=ext-csv-escape][value=' + data.target.options.escape + ']')
        .prop('checked', true);
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
            $('#ext-rets-resource')
            .append('<option value="' + item.ResourceID[0] + '">' + item.VisibleName[0] + '</option>');
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
