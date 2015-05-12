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

var EventEmitter = require('events').EventEmitter;
var DataManager = module.exports = new EventEmitter();

/** log facility */
var log = require('debug')('HoneyBadger:DataManager');

/** core deps */
var util = require('util');
var nano = require('nano')('http://localhost:5984');
var db = nano.use('honeybadger');
var feed = db.follow({since: "now"});

var sources = [],
    extractors = [],
    transformers = [],
    loaders = [],
    tasks = [],
    programs = [];

var __instance = null;

var readyState = 0;
var readyStateComplete = 5;


Object.defineProperty(DataManager, "sources", {
    get: function() { return sources; }
});

Object.defineProperty(DataManager, "extractors", {
    get: function() { return extractors; }
});

Object.defineProperty(DataManager, "transformers", {
    get: function() { return transformers; }
});

Object.defineProperty(DataManager, "loaders", {
    get: function() { return loaders; }
});

Object.defineProperty(DataManager, "tasks", {
    get: function() { return tasks; }
});

var refreshSources = function(callback){
    db.view('sources', 'list', function(err, body) {
        if(!err) {
            readyState++;
            sources = [];
            body.rows.forEach(function(doc){
                sources.push(doc);
            });
            if (readyState === readyStateComplete) {
                DataManager.emit('ready');
            }
        } else console.trace(err);

        log('Sources refreshed');
        DataManager.emit('sources',loaders);

        if(callback) callback(err, body);
    });
};

var refreshExtractors = function(callback){
    db.view('extractors', 'list', function(err, body) {
        if(!err) {
            readyState++;
            extractors = [];
            body.rows.forEach(function(doc){
                extractors.push(doc);
            });
            if (readyState === readyStateComplete) {
                DataManager.emit('ready');
            }
        } else console.trace(err);

        log('Extractors refreshed');
        DataManager.emit('extractors',loaders);

        if(callback) callback(err, body);
    });
};

var refreshTransformers = function(callback){
    db.view('transformers', 'list', function(err, body) {
        if(!err) {
            readyState++;
            transformers = [];
            body.rows.forEach(function(doc){
                transformers.push(doc);
            });
            if (readyState === readyStateComplete) {
                DataManager.emit('ready');
            }
        } else console.trace(err);

        log('Transformers refreshed');
        DataManager.emit('transformers',loaders);

        if(callback) callback(err, body);
    });
};

var refreshLoaders = function(callback){
    db.view('loaders', 'list', function(err, body) {
        if(!err) {
            readyState++;
            loaders = [];
            body.rows.forEach(function(doc){
                loaders.push(doc);
            });
            if (readyState === readyStateComplete) {
                DataManager.emit('ready');
            }
        } else console.trace(err);

        log('Loaders refreshed');
        DataManager.emit('loaders',loaders);

        if(callback) callback(err, body);
    });
};

var refreshTasks = function(callback){
    db.view('tasks', 'list', function(err, body) {
        if(!err) {
            readyState++;
            tasks = [];
            body.rows.forEach(function(doc){
                tasks.push(doc);
            });
            if (readyState === readyStateComplete) {
                DataManager.emit('ready');
            }
        } else console.trace(err);

        log('Tasks refreshed');
        DataManager.emit('tasks',tasks);

        if(callback) {
            callback(err, body);
        }
    });
};

DataManager.on('ready',function(){
    log('Completed loading Data Objects');
});

DataManager.refresh = function(){
    log('Refreshing Data Objects');
    readyState = 0;
    refreshSources();
    refreshExtractors();
    refreshTransformers();
    refreshLoaders();
    refreshTasks();
};
DataManager.refresh();

/**
 * Follow database changes
 */
feed.on('change', function (change) {
    log('Detected change in couch');
    DataManager.refresh();
});
feed.follow();

DataManager.sourceDetail = function(id) {
    return sources.filter(function(e) {
        return e._id === id;
    });
};

DataManager.getTask = function(id){
    return tasks.filter(function(item){
        if (item.id === id) return item;
    });
};

DataManager.getSource = function(id, cb) {
    db.get(id, cb);
};

DataManager.sourceSave = function(source, callback) {

    var _updateSource = function(){
        if (!source._rev) {
            console.log('Document has no _rev; cannot update');
            console.trace();
            callback({err:true,body:'Document has no _rev; cannot update'});
            return false;
        }
        source.type = 'dsn'; // Set the document type to Data Source Name // added by dan to ensure these are set since they do not have a field to change them
        source.status = source.status || 'active'; // Activate the source // added by dan to ensure these are set since they do not have a field to change them
        source.activatedOn = Date.now();
        db.insert(source, null, function(err, body){
            refreshSources(function(){
                if (callback) callback(err, body);
            });
        });
    };

    var _newSource = function(){
        source.type = 'dsn'; // Set the document type to Data Source Name
        source.status = 'active'; // Activate the source
        source.activatedOn = Date.now();
        db.insert(source, null, function(err, body){
            refreshSources(function(){
                if (callback) callback(err, body);
            });
        });
    };

    if (source._id) _updateSource();
    else _newSource();
};

DataManager.extractorSave = function(extractor, callback) {

    var _updateExtractor = function(){
        if (!extractor._rev) {
            console.log('Document has no _rev; cannot update');
            console.trace();
            callback({err:true,body:'Document has no _rev; cannot update'});
            return false;
        }
        extractor.type = 'extractor'; // Set the document type to Data Source Name
        extractor.status = extractor.status || 'active'; // Activate the source
        extractor.activatedOn = Date.now();

        db.insert(extractor, extractor._id, function(err,body){
           refreshExtractors(function(){
                if (callback) callback(err, body);
            });
        });
    };

    var _newExtractor = function(){
        extractor.type = 'extractor'; // Set the document type to Data Source Name
        extractor.status = 'active'; // Activate the source
        extractor.activatedOn = Date.now();
        db.insert(extractor, null, function(err,body){
            refreshExtractors(function(){
                if (callback) callback(err, body);
            });
        });
    };

    if (extractor._id) _updateExtractor();
    else _newExtractor();
};

DataManager.transformerSave = function(transformer, callback) {

    var _updateTransformer = function(){
        if (!transformer._rev) {
            console.log('Document has no _rev; cannot update');
            console.trace();
            callback({err:true,body:'Document has no _rev; cannot update'});
            return false;
        }

        transformer.type = 'transformer'; // Set the document type to Data Source Name
        transformer.status = transformer.status || 'active'; // Activate the source
        transformer.activatedOn = Date.now();
        db.insert(transformer, transformer._id, function(err,body){
            refreshTransformers(function(){
                if (callback) callback(err, body);
            });
        });
    };

    var _newTransformer = function(){
        transformer.type = 'transformer'; // Set the document type to Data Source Name
        transformer.status = 'active'; // Activate the source
        transformer.activatedOn = Date.now();
        db.insert(transformer, null, function(err,body){
            refreshTransformers(function(){
                if (callback) callback(err, body);
            });
        });
    };

    if (transformer._id) _updateTransformer();
    else _newTransformer();
};

DataManager.loaderSave = function(loader, callback) {

    log('Saving loader');

    var _updateLoader = function(){
        if (!loader._rev) {
            console.log('Document has no _rev; cannot update');
            console.trace();
            callback({err:true,body:'Document has no _rev; cannot update'});
            return false;
        }

        loader.type = 'loader'; // Set the document type to Data Source Name
        loader.status = 'active'; // Activate the source
        loader.activatedOn = Date.now();
        db.insert(loader, loader._id, function(err, body){
            refreshLoaders(function(){
                if (callback) callback(err, body);
            });
        });
    };

    var _newLoader = function(){
        loader.type = 'loader'; // Set the document type to Data Source Name
        loader.status = loader.status || 'active'; // Activate the source
        loader.activatedOn = Date.now();
        db.insert(loader, null, function(err, body){
            refreshLoaders(function(){
                if (callback) callback(err, body);
            });
        });
    };

    if (loader._id) _updateLoader();
    else _newLoader();
};

DataManager.taskSave = function(task, callback) {

    var _updateTask = function(){
        if (!task._rev) {
            console.log('Document has no _rev; cannot update');
            console.trace();
            callback({err:true,body:'Document has no _rev; cannot update'});
            return false;
        }

        task.type = 'task';
        task.status = task.status || 'active';
        task.activatedOn = Date.now();
        db.insert(task, task._id, function(err, body){
            refreshTasks(function(){
                if (callback) callback(err, body);
            });
        });
    };

    var _newTask = function(){
        task.type = 'task';
        task.status = 'active';
        task.activatedOn = Date.now();
        db.insert(task, null, function(err, body){
            refreshTasks(function(){
                if (callback) callback(err, body);
            });
        });
    };

    if (task._id) _updateTask();
    else _newTask();
};
