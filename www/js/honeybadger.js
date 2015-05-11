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