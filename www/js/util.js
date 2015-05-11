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