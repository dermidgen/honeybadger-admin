var jQuery = jQuery2.noConflict(true);
var Admin = (function($this,$){
	var self = this;

	var public = {}, protected = {};
	var Emit = new Emitter(protected);
	var Modules = new Modular(this, function(){ return Extend(public,protected); });

	HoneyBadger.Admin = public;

	/**
	 * Our module's actual constructor
	 * This happens immediately before any initialization
	 * 
	 * @return {void} Constructor
	 */
	var _construct = function() {
		console.log('Admin constructor');
		protected._parent = $this;

		if ($this.__devmode) {
			/**
			 * Add the livereload script - we'll add it manually so
			 * that you don't need the browser plugin and you can do
			 * it from across hosts.
			 */
			console.log('__devmode enabled: Adding livereload script');
			$(document.body).append('<script src="http://'+document.location.hostname+':35729/livereload.js?snipver=1"></script>');
		}
	};

	/**
	 * Our module's initializer.
	 * This gets called via our public init() method.
	 *
	 * Since we've registered as a submodule of HoneyBadger
	 * this gets fired whenever HoneyBadger initializes all
	 * of it's submodules - that's why our public init()
	 * method is actually just calling HoneyBadger.init()
	 *
	 * The HoneyBadger module doesn't care about the UI
	 * So it's just inits all of its submodules right away.
	 * In the case of this module, we do care about the
	 * DOM, so we will wait for DOM to fire ready before
	 * initializing any submodules.
	 *
	 * Any submodules of Admin will have their _construct()
	 * fire immediately as they register and their _init()
	 * fire after DOM ready.
	 * 
	 * @return {void} Initializer
	 */
	var _init = function() {
		// HoneyBadger doesn't use jQuery, but the Admin does
		$(document).ready(function(){

			console.log('DOM READY');
			/** 
			 * Pre-initializing any modules on DOM ready
			 * You can do some work here before you fire
			 * _init() on all the submodules.
			 */

			/**
			 * Let's init those submodules
			 */
			Modules.init();

			/**
			 * Anything else you want to do after you've initialized submodules?
			 */
			
			console.log('Admin initialized');
		});
	};


	// Register our module
	$this.module.register({
		name: 'Admin',
		instance: this
	},function(_registerInit){ // We get back a callback that passes a method to register our real init
		
		// Setup init handler and get back and unsealed version of the parent
		$this = _registerInit(_init); // fires when the parent has been initialized

		// We can do this code now. In the event that our parent waits for DOM ready before firing init
		_construct();
	});

	public.init = HoneyBadger.init,
	public.module = { register: Modules.register };

	return public;

}(HoneyBadger,jQuery));