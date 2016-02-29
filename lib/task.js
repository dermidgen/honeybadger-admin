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
