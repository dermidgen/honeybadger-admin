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

module.exports = Task();

/** log facility */
var log = require('debug')('HoneyBadger:Admin:Task');

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

function Task() {
  return {
    "task.list": function(callback){
        process.nextTick(function(){
            callback('onTaskList', null, DataManager.tasks);
        });
    },
    "task.test": function(task, callback) {
        callback('onvalidate',null,{success:true});
    },
    "task.run": function(task, callback) {
        log('Manually running task %s', task.name);

        var worker = require('honeybadger-service/lib/worker');
        var w = new worker();
        w.runTask(task,function(){
            log('Manual Run Task: %s ...complete', task.name);
            callback('onTaskRun',null,{success:true,task:task});
        });

    },
    "task.save": function(task, callback) {
        DataManager.taskSave(task, function(err, body){
            callback('onsave',err,body);
        });
    }    
  };
}
