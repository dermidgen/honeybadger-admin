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

module.exports = Loader();

/** log facility */
var log = require('debug')('HoneyBadger:Admin:Loader');

/** log via websocket directly to client */
var clog = function(target, client){
    return function(data){
        client.send('{ "event":"log-stream", "target": "'+target+'", "body":'+JSON.stringify(data)+'}');
    };
};

/** core deps */
var ftp = require('./ftp');
var rets = require('./rets');
var DataManager = require('honeybadger-service/lib/data-manager');
var mysql = require('mysql');

function Loader() {
  return {
    "loader.list": function(callback) {
        process.nextTick(function(){
            callback('onLoaderList', null, DataManager.loaders);
        });
    },
    "loader.test": function(loader, callback, client) {

        var _log = clog('loader-log-body',client);
        _log('Testing loader from transformer: '+ loader.transform);

        switch(loader.target.type)
        {
            case 'mysql':

                var dsn = utility.dsn(loader.target.dsn);
                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });

                var insert_query = 'INSERT INTO '+loader.target.schema.name+' SET ?';

                // log(transformer);
                //We want to pipe transformer events back to the client
                db.get(loader.transform, function(err, transformer){

                    _log('Checking transformer for extractor: '+ transformer.extractor);

                    // log(transformer);
                    //We want to pipe transformer events back to the client
                    db.get(transformer.extractor,function(err, extractor){
                        if (err) { _log('Error fetching extractor'); return; }

                        _log('Testing extraction from source: '+ extractor.source);

                        //We want to pipe extraction events back to the client
                        DataManager.getSource(extractor.source,function(err, body){
                            if (err) {
                                console.trace(err);
                                _log('<div class="text-danger">Extraction source is bad.</div>');
                                return callback('onLoaderTest',err,null);
                            }

                            _log('<div class="text-success">Extraction source is valid.</div>');
                            var source = body;

                            var testlimit = 10;
                            // log(source.source);
                            /**
                             * We're going to leave in a bunch of extra steps here for the sake
                             * of verbosity to the client. I had intended to simply this all down
                             * to just instantiating an extractor and running a test, but I
                             * decided that it was nice to have the extra info pumping to the UI.
                             */
                            if (source.source.type === 'FTP') {
                                _log('<div class="text-info">Extraction source is an FTP resource.</div>');

                                ftp.validate(source.source, function(err,body){
                                    (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                                    if (err) return callback('onLoaderTest',err,null);

                                    _log('<div class="text-info">Searching for extraction target.</div>');
                                    ftp.get(source.source, extractor.target.res, function(err,stream){
                                        (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                                        if (err) return callback('onLoaderTest',err,null);

                                        _log('<div class="text-success">Discovered source file on remote file-system.</div>');

                                        stream.once('close', function(){
                                            _log('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                        });

                                        var _delim = { csv: ',', tsv: "\t", pipe: '|' };
                                        var _quot = { default: '', dquote: '"', squote: "'" };

                                        var rawheaders = [];
                                        var headers = [];
                                        var trnheaders = [];
                                        var errors = false;


                                        var xformed = [];
                                        var records = [];
                                        var loaded = 0;
                                        var processed = 0;

                                        var xfm = streamTransform(function(record, cb){
                                            // log(record);
                                            log('processed %s', processed++);
                                            if (processed < 10) {
                                                var rec = {};
                                                var rstr = '{\n';
                                                transformer.transform.normalize.forEach(function(item, index){
                                                    var i = rawheaders.indexOf(item.in);
                                                    if (headers.indexOf(item.out) === -1) headers[i] = item.out;
                                                    rec[item.out] = record[i];
                                                    rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
                                                });
                                                rstr += '}';
                                                _log('<pre>'+rstr+'</pre>');

                                                connection.query(insert_query,rec,function(err,res){
                                                    if (!err) {
                                                        records.push(true);
                                                        _log('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');

                                                    } else {
                                                        errors = true;
                                                    }
                                                });
                                                cb(null, null);
                                            } else if (processed == 10) {
                                                _log('<div class="text-success">Load completed successfully.</div>');
                                                callback('onLoaderTest',null,{headers:headers, records:records});
                                                stream.end();
                                            }

                                        }, {parallel: 1});


                                        var csvStream = csv.parse(_delim[ extractor.target.options.delimiter || 'csv' ], _quot[ extractor.target.options.escape || 'default' ], stream);
                                        csvStream.on('headers',function(res){
                                            rawheaders = res;
                                            log('Received headers from CSV helper');
                                            _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                            _log('<pre>'+res.join("\n")+'</pre>');
                                        });

                                        csvStream.on('end',function(){
                                            log('CSV stream ended');
                                            _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                            _log('<div class="text-success">Transform completed successfully.</div>');
                                        });

                                        csvStream.on('finish',function(){
                                            log('CSV stream finished');
                                        });
                                        csvStream.pipe(xfm);

                                    });
                                });
                            } else if (source.source.type === 'RETS') {
                                _log('<div class="text-info">Extraction source is a RETS resource.</div>');

                                rets.validate(source.source, function(err,client){
                                    (!err)? _log('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>'):
                                            _log('<div class="text-danger">There was an error connecting to the RETS resource.</div>');
                                    if (err) return callback('onLoaderTest',err,null);

                                    _log('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                                    _log('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                                    _log('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');

                                    var Query = utility.tokenz(extractor.target.res);
                                    _log('<div class="text-info">-- Query: '+Query+'</div>');

                                    var qry = {
                                        SearchType: extractor.target.type,
                                        Class: extractor.target.class,
                                        Query: Query,
                                        Format: 'COMPACT-DECODED',
                                        Limit: testlimit
                                    };

                                    var rawheaders = [];
                                    var headers = [];
                                    var trnheaders = [];
                                    var errors = false;

                                    var xformed = [];
                                    var records = [];

                                    var xfm = streamTransform(function(record, cb){

                                        var rec = {};
                                        var rstr = '{\n';
                                        transformer.transform.normalize.forEach(function(item, index){
                                            var i = rawheaders.indexOf(item.in);
                                            if (headers.indexOf(item.out) === -1) headers[i] = item.out;
                                            // log(item,i,headers[i],record[i]);
                                            rec[item.out] = record[i];
                                            rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
                                        });
                                        rstr += '}';
                                        _log('<pre>'+rstr+'</pre>');

                                        connection.query(insert_query,rec,function(err,res){
                                            if (err) {
                                                errors = true;
                                            }

                                            if (records.length >= testlimit) {
                                                if (!errors) {
                                                    _log('<div class="text-success">Load completed successfully.</div>');
                                                    callback('onLoaderTest',null,{headers:headers, records:records});
                                                } else {
                                                    _log('<div class="text-danger">Load failed.</div>');
                                                    callback('onLoaderTest',{err:"Did not load all records"},{headers:headers, records:records});
                                                }
                                                return;
                                            } else {
                                                records.push(rec);
                                                _log('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
                                            }
                                        });

                                        cb(null, null);

                                    }, {parallel: 1});

                                    var csvStream = csv.parse("\t", "", client);
                                    csvStream.on('headers',function(res){
                                        rawheaders = res;
                                        log('Received headers from CSV helper');
                                        _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                        _log('<pre>'+res.join("\n")+'</pre>');
                                    });

                                    csvStream.on('end',function(){
                                        log('CSV stream ended');
                                        _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                        _log('<div class="text-success">Transform completed successfully.</div>');
                                        callback('onLoaderTest',null,{headers:headers, records:records});
                                    });

                                    csvStream.on('finish',function(){
                                        log('CSV stream finished');
                                    });
                                    csvStream.pipe(xfm);
                                    client.searchQuery(qry, null, true );
                                });
                            }
                        });
                    });
                });
            break;
            case 'ftp':
                callback('onLoaderTest', null, {success: true});
            break;
        }

    },
    "loader.save": function(loader, callback) {
        DataManager.loaderSave(loader, function(err, body){
            callback('onLoaderSave',err,body);
        });
    },
    "loader.validate": function(loader, callback) {
        log('Validating loader');
        switch(loader.target.type)
        {
            case "mysql":
                var mysql = require('mysql');

                var dsn = utility.dsn(loader.target.dsn);
                var schema = loader.target.schema;

                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });

                connection.query('DESCRIBE '+schema.name, function(err, res){
                    if (err) {
                        console.trace(err);
                        callback('onLoaderValidate',err,null);
                        return;
                    }

                    var fields = schema.fields.map(function(i){
                        return i.key;
                    });

                    var matches = res.filter(function(i){
                        return (fields.indexOf(i.Field) > -1) ? true : false;
                    });

                    if (fields.length === matches.length) callback('onLoaderValidate',null,{schema:res,fields:fields,matches:matches});
                    else callback('onLoaderValidate',{ err: "The fields for this loader don't match the schema on the target"},{schema:res,fields:fields,matches:matches});
                });
            break;
            case "couchdb":
            break;
            case "ftp":
            break;
            case "filesystem":
            break;
        }
    },
    "loader.validateConnection": function(loader, callback) {
        log('Validating loader', loader.name);
        switch(loader.target.type)
        {
            case "mysql":
                var mysql = require('mysql');

                var dsn = utility.dsn(loader.target.dsn);
                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });
                connection.query('SHOW tables', function(err, res){
                    if (err) {
                        console.trace(err);
                        callback('onLoaderValidateConnection',err,null);
                        return;
                    }
                    callback('onLoaderValidateConnection',null,{tables:res});
                });
            break;
            case "couchdb":
            break;
            case "ftp":
                log('Validate FTP connection');
                var dsn = utility.dsn(loader.target.dsn);
                var options = {
                    uri: dsn.host,
                    port: dsn.port,
                    auth: {
                        username: dsn.user,
                        password: dsn.password
                    }
                };
                ftp.validate(options, function(err, res){
                    callback('onLoaderValidateConnection',err,res);
                });
            break;
            case "filesystem":
                callback(null,null);
            break;
        }
    },
    "loader.createSchema": function(loader, callback) {
        switch(loader.target.type)
        {
            case "mysql":
                var mysql = require('mysql');

                var dsn = utility.dsn(loader.target.dsn);
                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });

                var qry = 'CREATE TABLE `'+loader.target.schema.name+'` ( `id` INT NOT NULL AUTO_INCREMENT, ';
                loader.target.schema.fields.forEach(function(item, index){
                    qry += '`'+item.key+'` ';
                    switch(item.type) {
                        case "string":
                            qry += 'VARCHAR(255) NULL,';
                        break;
                        case "boolean":
                            qry += 'INT NULL,';
                        break;
                        case "float":
                            qry += 'FLOAT NULL,';
                        break;
                        case "date":
                            qry += 'DATE NULL,';
                        break;
                        case "text":
                            qry += 'TEXT NULL,';
                        break;
                    }
                });
                qry += 'PRIMARY KEY (`id`), UNIQUE INDEX `id_UNIQUE` (`id` ASC));';
                connection.query(qry, function(err, res){
                    if (err) {
                        console.trace(err);
                        callback('onLoaderSchemaCreate',err,null);
                        return;
                    }
                    callback('onLoaderSchemaCreate',null,{res:res});
                });
            break;
            case "couchdb":
            break;
            case "ftp":
            break;
        }
    }    
  };
}
