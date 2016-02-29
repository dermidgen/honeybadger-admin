/** log facility */
var log = require('debug')('HoneyBadger:Admin:RETS');

/** core deps */
var url = require('url');
var rets = require('rets.js');

module.exports = {
  connect: function(source, callback) {
    var uri = url.parse(source.uri);
    uri.auth = source.auth.username + ':' + source.auth.password;

    var client = new rets({
      url: uri,
      version: source.version || 'RETS/1.7.2',
      ua: {
        name: source.auth.userAgentHeader,
        pass: source.auth.userAgentPassword
      }
    });

    client.on('error', function(err) {
      console.trace(err);
    });

    client.on('login', function(err, res) {
      callback(err, client);
    }).login()
        .on('error', function() {
          log('Connection failed: %s.', error.message);
          callback(error, null);
        });
  },
  validate: function(source, callback) {
    this.connect(source, function(err, client) {
      if (!client) {
        log('Connection failed: %s.', error.message);
        callback(error, null);
      }        else {
        log('Connected to RETS server.');
        callback(null, client);
      }
    });
  },
  getClassifications: function(source, callback, client) {
    log(source);
    if (client) {
      client
      .on('metadata', callback)
      .getMetadata({ Type: 'METADATA-CLASS', ID: source.rets.resource });
    } else {
      this.connect(source, function(error, client) {
        client
        .on('metadata', callback)
        .getMetadata({ Type: 'METADATA-CLASS', ID: source.rets.resource });
      });
    }
  },
  getMetadataResources: function(source, callback, client) {
    if (client) {
      client
      .on('metadata', callback)
      .getMetadata({ Type: 'METADATA-RESOURCE', ID: 0 });
    } else {
      this.connect(source, function(error, client) {
        client
        .on('metadata', callback)
        .getMetadata({ Type: 'METADATA-RESOURCE', ID: 0 });
      });
    }
  },
  getMetadataTable: function(source, callback, client) {
    if (client) {
      client
      .on('metadata', callback)
      .getMetadata({ Type: 'METADATA-TABLE', ID: source.rets.resource + ':' + source.rets.classification });
    } else {
      this.connect(source, function(error, client) {
        client
        .on('metadata', callback)
        .getMetadata({ Type: 'METADATA-TABLE', ID: source.rets.resource + ':' + source.rets.classification });
      });
    }
  },
  getMetadataLookup: function(source, field, callback, client) {
    console.log('source', source);
    console.log('field %s', field);
    if (client) {
      client
      .on('metadata', callback)
      .getMetadata({ Type: 'METADATA-LOOKUP_TYPE', ID: source.rets.classification + ':' + field });
    } else {
      this.connect(source, function(error, client) {
        client
        .on('metadata', callback)
        .getMetadata({ Type: 'METADATA-LOOKUP_TYPE', ID: source.rets.resource + ':' + field });
      });
    }
  },
  query: function(_type, _class, _query, _limit, callback, client) {
    // Fetch classifications
    client.query({
      SearchType: _type || 'Property',
      Class: _class || 'A',
      Query: _query || '(status=Listed)',
      Limit: _limit || 10
    }, function(error, data) {
      log(require('util').inspect(data, { showHidden: false, colors: true, depth: 5 }));
    });
  },
  getObject: function() {
    client.getMetadataObjects('Property', function(meta) {
      log('Got object metadata');
      log(meta);
      // client.getObject('Property','PHOTO','','*',0,function(res){
      //  log('getObject Callback');
      //  log(res);
      // });
    });
  }
};
