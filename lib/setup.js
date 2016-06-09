var config = require('./config')();
var client = require('grave').connect(config.couchdb.host, config.couchdb.port);
var db = client.db('honeybadger');

function check(callback) {
  db.exists(function(err, exists){
    if (err) {
      throw(err);
    }

    if (exists) {
      console.log('CouchDB database already setup.');
      callback();
    } else {
      console.log('CouchDB database does not exist.');
      db.create(function(err, res){
        console.log('CouchDB database created.');
        design(callback);
      });
    } 
  });
}

function design(callback) {
  console.log('Populating design docs.');

  var sources = db.design('sources', '0.2.0');
  var extractors = db.design('extractors', '0.2.0');
  var transformers = db.design('transformers', '0.2.0');
  var loaders = db.design('loaders', '0.2.0');
  var tasks = db.design('tasks', '0.2.0');

  var source = function(doc) {
    if (doc.type == 'dsn') emit(doc.name, doc);
  };

  var extractor = function(doc) {
    if (doc.type == 'extractor') emit(doc.name, doc);
  };

  var transformer = function(doc) {
    if (doc.type == 'transformer') emit(doc.name, doc);
  };

  var loader = function(doc) {
    if (doc.type == 'loader') emit(doc.name, doc);
  };

  var task = function(doc) {
    if (doc.type == 'task') emit(doc.name, doc);
  };

  sources.view('fetch', {
    map: source
  });

  sources.view('list', {
    map: source
  });

  extractors.view('fetch', {
    map: extractor
  });

  extractors.view('list', {
    map: extractor
  });

  transformers.view('fetch', {
    map: transformer
  });

  transformers.view('list', {
    map: transformer
  });

  loaders.view('fetch', {
    map: loader
  });

  loaders.view('list', {
    map: loader
  });

  tasks.view('fetch', {
    map: task
  });

  tasks.view('list', {
    map: task
  });

  sources.end();
  extractors.end();
  transformers.end();
  loaders.end();
  tasks.end();

  console.log('CouchDB setup complete.');
  if (callback) setTimeout(callback, 1000);
}

module.exports = check;
