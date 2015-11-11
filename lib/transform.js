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

module.exports = Transform();

/** log facility */
var log = require('debug')('HoneyBadger:Admin:Transform');

/** log via websocket directly to client */
var clog = function(target, client){
    return function(data){
        client.send('{ "event":"log-stream", "target": "'+target+'", "body":'+JSON.stringify(data)+'}');
    };
};

/** core deps */
var ftp = require('./ftp');
var rets = require('./rets');
var nano = require('nano')('http://localhost:5984');
var db = nano.use('honeybadger');
var csv = require('honeybadger-etl/lib/helpers/csv');
var streamTransform = require('stream-transform');
var DataManager = require('honeybadger-service/lib/data-manager');

function Transform() {
  return {
        "transformer.list": function(callback){
        process.nextTick(function(){
            callback('onTransformerList', null, DataManager.transformers);
        });
    },
    "transformer.test": function(transformer, callback, client) {

        var _log = clog('transformer-log-body',client);
        _log('Testing transformer from extractor: '+ transformer.extractor);

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
                    return callback('onTransformerTest',err,null);
                }

                _log('<div class="text-success">Extraction source is valid.</div>');
                var source = body;
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
                        if (err) return callback('onTransformerTest',err,null);

                        _log('<div class="text-info">Searching for extraction target.</div>');
                        ftp.get(source.source, extractor.target.res, function(err,stream){
                            (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                            if (err) return callback('onTransformerTest',err,null);

                            _log('<div class="text-success">Discovered source file on remote file-system.</div>');

                            stream.once('close', function(){
                                _log('<div class="text-success">Completed reading source file from remote file-system.</div>');
                            });

                            var _delim = { csv: ',', tsv: "\t", pipe: '|' };
                            var _quot = { default: '', dquote: '"', squote: "'" };

                            var rawheaders = [];
                            var headers = [];
                            var records = [];
                            var trnheaders = [];
                            var errors = false;

                            var xfm = streamTransform(function(record, cb){
                                if (records.length >= 10) {
                                    process.nextTick(function(){
                                        _log('<div class="text-success">Transform completed successfully.</div>');
                                        if (!errors) callback('onTransformerTest',null,{headers:headers, records:records});
                                    });
                                    stream.end();
                                    return;
                                }

                                var rec = {};
                                var rstr = '{\n';
                                transformer.transform.normalize.forEach(function(item, index){
                                    var i = rawheaders.indexOf(item.in);
                                    if (headers.indexOf(item.out) === -1) headers[i] = item.out;
                                    rec[item.out] = record[i];
                                    rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
                                });
                                rstr += '}';

                                records.push(rec);
                                _log('<pre>'+rstr+'</pre>');

                                cb(null, null);
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
                                callback('onTransformerTest',null,{headers:headers, records:records});
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
                        if (err) return callback('onTransformerTest',err,null);

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
                            Limit: 10
                        };

                        var rawheaders = [];
                        var headers = [];
                        var records = [];
                        var trnheaders = [];
                        var errors = false;

                        var xfm = streamTransform(function(record, cb){

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
                            callback('onTransformerTest',null,{headers:headers, records:records});
                        });

                        csvStream.on('finish',function(){
                            log('CSV stream finished');
                        });
                        csvStream.pipe(xfm);
                        client.searchQuery(qry, null, true );

                        // client.getMetadataObjects('Property',function(meta){
                        //     console.log('Got object metadata');
                        //     console.log(meta);
                        // });
                        // client.getObject('Property','PHOTO','','*',0,function(res){
                        //  console.log('getObject Callback');
                        //  console.log(res);
                        // });

                    });
                }
            });


        });
    },
    "transformer.save": function(transformer, callback) {
        DataManager.transformerSave(transformer, function(err, body){
            callback('onTransformerSave',err,body);
        });
    }
  };
}
