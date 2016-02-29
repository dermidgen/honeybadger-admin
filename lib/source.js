module.exports = Source();

/** log facility */
var log = require('debug')('HoneyBadger:Admin:Source');

/** log via websocket directly to client */
var clog = function(target, client) {
  return function(data) {
    client.send('{ "event":"log-stream", "target": "' + target + '", "body":' + JSON.stringify(data) + '}');
  };
};

/** core deps */
var ftp = require('./ftp');
var rets = require('./rets');
var DataManager = require('honeybadger-service/lib/data-manager');

function Source() {
  return {
    "source.list": function(callback) {
      process.nextTick(function() {
        callback('onSourceList', null, DataManager.sources);
      });
    },
    "source.test": function(source, callback) {

      log(source.type + ' Client Test');

      /**
       * Testing a source really just means validating access.
       * That may mean validating credentials, a URL or other
       * data endpoint.
       */
      switch (source.type)
      {
        case "FTP":
          ftp.validate(source, function(err, body) {
            (!err) ? callback('onvalidate', null, {success: true, body: body}) : callback('onvalidate', err, null);
          });
        break;
        case "RETS":
          rets.validate(source, function(err, body) {
            (!err) ? callback('onvalidate', null, {success: true, body: body}) : callback('onvalidate', err, null);
          });
        break;
      }
    },
    "source.save": function(source, callback) {
      DataManager.sourceSave(source, function(err, body) {
        callback('onsave', err, body);
      });
    }
  };
}
