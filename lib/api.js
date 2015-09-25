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

module.exports = API();

/** log facility */
var log = require('debug')('HoneyBadger:Admin:API');

/** log via websocket directly to client */
var clog = function(target, client) {
  return function(data) {
    client.send('{ "event":"log-stream", "target": "' + target + '", "body":' + JSON.stringify(data) + '}');
  };
};

/** core deps */
var ftp = require('./ftp');
var rets = require('./rets');
var csv = require('honeybadger-etl/lib/helpers/csv');

var utility = require('./utility');
var DataManager = require('honeybadger-service/lib/data-manager');
var nano = require('nano')('http://localhost:5984');
var db = nano.use('honeybadger');
var streamTransform = require('stream-transform');

function API() {

  var util = require('util');
  this.api = {};
  util._extend(this.api, require('./source'));
  util._extend(this.api, require('./extractor'));
  util._extend(this.api, require('./transform'));
  util._extend(this.api, require('./loader'));
  util._extend(this.api, require('./task'));
  util._extend(this.api, {
    "ftp.browse": function(source, basepath, callback) {
      DataManager.getSource(source.id, function(error, body) {
        if (!error && body.source.type === 'FTP') {
          body.source.basepath = basepath;
          ftp.browse(body.source, function(err, list) {
            if (err) return callback('onFTPBrowse', err, null);
            return callback('onFTPBrowse', null, {success: true, list: list});
          });
        }
      });
    },
    "rets.getClassifications": function(source, callback) {
      DataManager.getSource(source.id, function(err, src) {
        rets.getClassifications(source.source, function(err, data) {
          if (!err) callback('onRETSBrowse', null, {success: true, meta: data});
          else callback('onRETSBrowse', err, null);
        });
      });
    },
    "rets.getMetadataResources": function(source, callback) {
      DataManager.getSource(source._id, function(err, src) {
        rets.getMetadataResources(src.source, function(err, data) {
          log(err, data);
          if (!err) callback('onRETSExplore', null, {success: true, meta: data});
          else callback('onRETSExplore', err, null);
        });
      });
    },
    "rets.getMetadataTable": function(source, callback, client) {
      DataManager.getSource(source.id, function(err, src) {
        rets.getMetadataTable(source.source, function(err, data) {
          if (!err) callback('onRETSInspect', null, {success: true, meta: data});
          else callback('onRETSInspect', err, null);
        });
      });
    },
    "rets.getMetadataLookup": function(source, field, callback, client) {
      DataManager.getSource(source.id, function(err, src) {
        rets.getMetadataLookup(source.source, field, function(err, data) {
          if (!err) callback('onRETSLookup', null, {success: true, meta: data});
          else callback('onRETSLookup', err, null);
        });
      });
    },
    "rets.query": function(_type, _class, _query, _limit, callback, client) {
      // Fetch classifications
      client.searchQuery({
        SearchType: _type || 'Property',
        Class: _class || 'A',
        Query: _query || '(status=Listed)',
        Limit: _limit || 10
      }, function(error, data) {
        log(require('util').inspect(data, { showHidden: false, colors: true, depth: 5 }));
      });
    }
  });
  return this.api;
}
