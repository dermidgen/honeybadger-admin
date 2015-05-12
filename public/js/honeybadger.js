/**
 * quick lifted promises
 * https://gist.github.com/softwaredoug/9044640
 */
var Promise = function(wrappedFn, wrappedThis) {
  this.then = function(wrappedFn, wrappedThis) {
    this.next = new Promise(wrappedFn, wrappedThis);
    return this.next;
  };
    
  this.run = function() {
    wrappedFn.promise = this;
    wrappedFn.apply(wrappedThis);
  };
    
  this.complete = function() {
    if (this.next) {
      this.next.run();
    }
  };
};
 
Promise.create = function(func) { 
  if (func.hasOwnProperty('promise')) { 
    return func.promise;
  } else { 
    return new Promise();
  } 
};

/**
 * This little guy might help organize things later
 * @param {object} context
 */
var Emitter = function (context){

  var _register = [];
  context.on = function(event, callback) {
    // var s = _register.map(function(i){
    //   if (i.event !== event && i.context !== context && i.callback !== callback) return i;
    // });
    // if (!s.length)
    
    _register.push({
      event: event,
      context: context,
      callback: callback
    });

  };

  var _emit = function(event, data, context){
    // console.log(_register)
    for (var i=0; i<_register.length; i++) {
      if (_register[i].event === event && _register[i].context) _register[i].callback(data)
    }
  };

  return function Emit(event, data){
    _emit(event,data,context);
  };
};

/**
 * Let a module securely accept submodules
 * and share protected methods with them
 */
var Modular = function(base, protected) {
  var self = this, __modules = {}, __inits = [];

  var _registerInitializer = function(callback) {
    __inits.push(callback);
    return protected();
  };

  this.init = function() {
    for(var i = 0; i < __inits.length; i++) {
      __inits[i]();
    }
  };

  this.register = function(module, init) {
      if (typeof module.name == undefined || typeof module.instance == undefined) return;
      if (typeof __modules[module.name] == undefined) __modules[module.name] = module.instance
      if (init) init(_registerInitializer);
  };
};

var Extend = function(base, ext) {
  var _base;
  var o = {};
  for(var i in base) {
    if (base.hasOwnProperty(i)) {
      var cb = base[i];
      if (typeof cb == Function) {
        o[i] = function() { cb.apply(o,arguments); };
      } else {
        o[i] = base[i];
      }
    }
  }
  for(var i in ext) {
    if (ext.hasOwnProperty(i)) {
      o[i] = ext[i];
    }
  }
  return o;
};
var HoneyBadger = (function($this){

	var ts,tp,socket,host = "ws://"+location.host+"/admin/";

	var self = this;
	var __cbqueue = {},
		__logverbose = false,
		__devmode = ( window.location.host.indexOf("localhost") > -1 || window.location.host.indexOf('192.168') > -1 ) ? true : false;

	var public = {}, protected = {};
	var Emit = new Emitter(protected);
	var Modules = new Modular(this, function(){ return Extend(public,protected); });

	console.log('HoneyBadger starting up');
	var _init = function() {
		console.log('HoneyBadger initializing');
		
		connect();

		console.log('HoneyBadger initializing submodules');
		Modules.init();

		console.log('HoneyBadger initializing complete!');
	};

	var connect = function() {
		if (ts) clearInterval(ts);
		if (tp) clearInterval(tp);

		socket = new WebSocket(host);
		socket.onopen = function(){
			if (ts) clearInterval(ts);
			tp = setInterval(function(){
				socket.send('ping');
			}, 15000);
			Emit('readyStateChange',1);
		};

		socket.onclose = function(){
			if (tp) clearInterval(tp);
			ts = setInterval(connect, 1000);
		};

		socket.onmessage = receive;
		return socket;
	};

	var send = function(method, args, callback){
		var args = args || [];
		var msig = (callback) ? (new Date().getTime() * Math.random(1000)).toString(36) : null;
		if (msig) { __cbqueue[msig] = callback }
		if( __devmode && __logverbose ){ console.trace(); console.dir({method:method,msig:msig,args:args}); }
		socket.send(JSON.stringify({method:method,msig:msig,args:args}));
	};

	var receive = function(e) {

		if (e.data === 'pong') return;
		if ( __devmode && __logverbose ){ console.dir(e); }

		var d = JSON.parse(e.data);
		var msig = d.msig || null;
		if (msig && __cbqueue[msig]) {
			__cbqueue[msig](d);
			delete __cbqueue[msig];
			return;
		}

		if (d.event == 'log-stream') {
			Emit('log-stream',d);
		}
	};

	public.init = _init,
	public.module = { register: Modules.register };

	protected.__devmode = __devmode;
	protected.__logverbose = __logverbose;
	protected.exec = function(method, args, callback){
		send(method, args, callback);
	};

	return public;

}(HoneyBadger||{}));
+(function($this){
	var self = this,
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [],
		tasks = [];

	var _construct = function() {
		console.log('DataManager constructor');
		$this.on('readyStateChange',function(readyState){
			if (readyState === 1) {
				Emit('ready',true);
				self.refresh();
			}
		});
	};

	var _init = function() {
		console.log('DataManager initialized');
	};

	$this.module.register({
		name: 'DataManager',
		instance: this
	},function(_unsealed){
		$this = _unsealed(_init); 
		_construct();
	});

	var Emit = new Emitter(this);
	HoneyBadger.DataManager = this;

	this.loadSources = function(callback){
		var promise = Promise.create(self.loadSources);
		$this.exec('source.list',null,function(e){
			if (!e.err) { sources = e.body; }
			if (callback) callback(e);
			Emit('sources',sources);
			promise.complete();
		});
		return promise;
	};

	this.loadExtractors = function(callback){
		var promise = Promise.create(self.loadExtractors);
		$this.exec('extractor.list',null,function(e){
			if (!e.err) { extractors = e.body; }
			if (callback) callback(e);
			Emit('extractors',extractors);
			promise.complete();
		});
		return promise;
	};

	this.loadTransformers = function(callback){
		var promise = Promise.create(self.loadTransformers);
		$this.exec('transformer.list',null,function(e){
			if (!e.err) { transformers = e.body; }
			if (callback) callback(e);
			Emit('transformers',transformers);
			promise.complete();
		});
		return promise;
	};

	this.loadLoaders = function(callback){
		var promise = Promise.create(self.loadLoaders);
		$this.exec('loader.list',null,function(e){
			if(!e.err) { loaders = e.body; }
			if (callback) callback(e);
			Emit('loaders',loaders);
			promise.complete();
		});
		return promise;
	};

	this.loadTasks = function(callback){
		var promise = Promise.create(self.loadTasks);
		$this.exec('task.list',null,function(e){
			if(!e.err) { tasks = e.body; }
			if (callback) callback(e);
			Emit('tasks',tasks);
			promise.complete();
		});
		return promise;
	};

	this.refresh = function(callback){
		//TODO: add parallelized promises
		this.loadSources().then(this.loadExtractors).then(this.loadTransformers).then(this.loadLoaders).then(this.loadTasks).then(function(){
			if (callback) callback();
			Emit('refresh',{
				sources: sources,
				extractors: extractors,
				transformers: transformers,
				loaders: loaders,
				tasks: tasks
			});
		});
	};

	this.getSources = function(){
		return sources;
	};

	this.getExtractors = function(){
		return extractors;
	};

	this.getTransformers = function(){
		return transformers;
	};

	this.getLoaders = function(){
		return loaders;
	};

	this.getTasks = function(){
		return tasks;
	};

	this.getSource = function(id){
		return self.getSources().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getExtractor = function(id){
		return self.getExtractors().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getTransformer = function(id){
		return self.getTransformers().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getLoader = function(id){
		return self.getLoaders().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getTask = function(id){
		return self.getTasks().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.source = function(name, type, properties){

	};
	this.validateSource = function(source, callback){
		$this.exec('source.test', [source], callback);
	};

	this.saveSource = function(source, callback){
		$this.exec('source.save', [source], callback);
	};

	this.extractor = {};
	this.extractor.validate = function(){

	};

	this.extractor.save = function(ext, callback){
		$this.exec('extractor.save', [ext], callback);
	};

	this.extractor.sample = function(ext, callback){
		$this.exec('extractor.test', [ext], callback);
	};

	this.transformer = {};
	this.transformer.validate = function(trn, callback){

	};

	this.transformer.save = function(trn, callback){
		$this.exec('transformer.save', [trn], callback);
	};

	this.transformer.sample = function(trn, callback){
		$this.exec('transformer.test', [trn], callback);
	};

	this.loader = {};
	this.loader.validate = function(ldr, callback){
		$this.exec('loader.validate', [ldr], callback);
	};

	this.loader.validateConnection = function(ldr, callback){
		$this.exec('loader.validateConnection', [ldr], callback);
	};

	this.loader.createSchema = function(ldr, callback){
		$this.exec('loader.createSchema', [ldr], callback);
	};

	this.loader.save = function(ldr, callback){
		$this.exec('loader.save', [ldr], callback);
	};

	this.loader.sample = function(ldr, callback){
		$this.exec('loader.test', [ldr], callback);
	};


	this.task = {};
	this.task.save = function(tsk, callback){
		$this.exec('task.save', [tsk], callback);
	};

	this.task.sample = function(tsk, callback){
		$this.exec('task.test', [tsk], callback);
	};

	this.task.run = function(tsk, callback){
		$this.exec('task.run', [tsk], callback);
	};


	this.ftpBrowse = function(source, basepath, callback)
	{
		$this.exec('ftp.browse',[source, basepath],callback);
	};

	this.retsExplore = function(source, callback)
	{
		$this.exec('rets.getMetadataResources',[source],callback);
	};

	this.retsBrowse = function(source, callback)
	{
		$this.exec('rets.getClassifications',[source],callback);
		// $this.exec('rets.getMetadataTable',[source],callback);
	};

	this.retsInspect = function(source, callback)
	{
		// $this.exec('rets.getMetadataResources',[source],callback);
		$this.exec('rets.getMetadataTable',[source],callback);
	};

}(HoneyBadger||{}));
+(function($this){

	var $hb;

	var __init = function(_unsealed) {
		$hb = _unsealed;
	};

	$this.source = function(id){
		return {
			create:function(){},
			read:function(){},
			update:function(){},
			delete:function(){}
		};
	};
	return $this;
}(HoneyBadger||{}));