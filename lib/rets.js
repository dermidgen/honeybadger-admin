// Copyright Impact Marketing Specialists, Inc. and other contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

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
    }
    else {
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
      .getMetadata({ Type: 'METADATA-RESOURCE'});
    } else {
      this.connect(source, function(error, client) {
        client
        .on('metadata', callback)
        .getMetadata({ Type: 'METADATA-RESOURCE'});
      });
    }
  },
  getMetadataTable: function(source, callback, client) {
    if (client) {
      client.getMetadataTable(source.rets.resource, source.rets.classification, callback);
    } else {
      this.connect(source, function(error, client) {
        client.getMetadataTable(source.rets.resource, source.rets.classification, callback);
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
