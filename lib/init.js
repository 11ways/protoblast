module.exports = function BlastInit(modifyPrototype) {

	var class_reset,
	    BlastClass,
	    Collection,
	    other_ver,
	    required,
	    libpath,
	    package,
	    Globals,
	    version,
	    modulep,
	    extras,
	    Names,
	    Blast,
	    temp,
	    name,
	    ctx,
	    key,
	    i;

	BlastClass = function BlastClass(){};
	Blast = new BlastClass();

	// Is it a pure, regular browser?
	Blast.isBrowser = false;

	// Is it running in a node context?
	Blast.isNode = false;

	// Is it running in NW.js?
	Blast.isNW = false;

	// Is it running in a NW.js window?
	Blast.isNWWindow = false;

	// If it's a browser, is it IE?
	Blast.isIE = false;
	Blast.__init = BlastInit;

	// If it's a browser, is it Edge?
	Blast.isEdge = false;

	// See if we can modify class prototypes
	if (typeof modifyPrototype === 'undefined') {
		modifyPrototype = true;
	}

	if (typeof process === 'object' && (process.__node_webkit || process.__nwjs)) {
		Blast.isNW = true;
		Blast.isNode = true;
		Globals = global;
	} else if (typeof window !== 'undefined') {
		Globals = window;
		Blast.isBrowser = true;

		if (window.navigator && window.navigator.userAgent) {
			Blast.isIE = (window.navigator.userAgent.indexOf('MSIE') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1);

			if (!Blast.isIE) {
				Blast.isEdge = window.navigator.userAgent.indexOf('Edge/') > -1;
			}
		}
	} else if (typeof self !== 'undefined' && self.constructor && self.constructor.name == 'DedicatedWorkerGlobalScope') {
		Globals = self;
		Blast.isBrowser = true;
		Blast.isWorker = true;
	} else {
		Globals = global;
		Blast.isNode = true;
	}

	// NW.js offers 2 contexts: node & chromium
	if (Blast.isNW && typeof __dirname == 'undefined') {
		Globals = window;
		Blast.isNWWindow = true;
	}

	Blast.Globals = Globals;

	// Get the debug environment variable
	// This is not meant to debug protoblast
	if (typeof process != 'undefined') {
		Blast.DEBUG = !!process.env.DEBUG;
	} else {
		Blast.DEBUG = !!Blast.Globals.DEBUG;
	}

	// PROTOBLAST START CUT
	// Get version information of this protoblast instance
	if (Blast.isNode) {
		package = require(__dirname + '/../package.json');

		// Require the module package
		modulep = require('module');

		// And the path package
		libpath = require('path');

		// Sometimes scripts recursively call the blast init script,
		// make sure to not overwrite the original wrapper then
		if (!modulep.original_wrap) {
			modulep.original_wrap = modulep.wrap;
			modulep.original_wrapper = modulep.wrapper.slice(0);
			modulep.original_resolve = modulep._resolveFilename;
			modulep.strict_wrapper = modulep.original_wrapper[0] + '"use strict";';
		}

		// Split the version
		temp = package.version.split('.');

		// Interpret the numbers
		version = {
			major : parseInt(temp[0]),
			minor : parseInt(temp[1]),
			patch : parseInt(temp[2])
		};

		Blast.version = version;
	}
	// PROTOBLAST END CUT

	// Find the context to check
	if (Blast.isNW && global.__Protoblast) {
		// "global" refers to the nodejs context in nwjs
		ctx = global;
	} else {
		ctx = Globals;
	}

	// Maybe we can return an existing protoblast collection
	if (ctx.__Protoblast) {

		if (Blast.isNWWindow) {
			// We're in a NW.JS window, and Protoblast has already been loaded
			// in the node context. So we'll use the existing classes,
			// but override the default globals later
			Blast.Classes = Object.create(ctx.__Protoblast.Classes);
			class_reset = true;
		} else if (!modifyPrototype || (modifyPrototype && ctx.__Protoblast.modifyPrototype)) {
			// If we don't have to modify the prototype, or if it's already done, return the existing collection

			// See if the versions match on node.js
			if (Blast.isNode) {

				// Get the other version info
				other_ver = ctx.__Protoblast.version;

				// See if we can use the earlier loaded protoblast instance
				if (other_ver && other_ver.major == version.major && other_ver.minor == version.minor) {
					// If the earlier loaded protoblast instance has a higher patch, we can safely use that
					if (other_ver.patch >= version.patch) {
						return ctx.__Protoblast;
					}
				}
			} else {
				return ctx.__Protoblast;
			}
		} else {
			Blast = ctx.__Protoblast;
		}
	}

	// Store shims under unit_test object
	// when unit testing
	if (module.exports.unit_test) {
		Blast.Shims = {};
	}

	// Don't overwrite another protoblast instance
	if (!other_ver) {
		Globals.__Protoblast = Blast;
	}

	// Extra files to load go here
	extras = [];

	// Already required files
	required = {};

	Names = [
		'Function',
		'Object',
		'Array',
		'Crypto',
		'Date',
		'Error',
		'Informer',
		'Request',
		'FunctionQueue',
		'Iterator',
		'Deck',
		'JSON',
		'JSONPath',
		'Math',
		'Pledge',
		'SeededRng',
		'Number',
		'RegExp',
		'String',
		'URL'
	];

	Blast.modifyPrototype = modifyPrototype;

	// Class references go here. They're shared among all Protoblast instances
	if (!Blast.Classes) {
		Blast.Classes = {
			Object: Object
		};
	}

	// All definitions will also be set on these objects
	Blast.Collection = Collection = {};
	Blast.Bound = {};

	// Create the defaults already
	for (i = 0; i < Names.length; i++) {
		name = Names[i];

		Collection[name] = {};
		Blast.Bound[name] = {};

		// More nwjs fixes
		if (class_reset && Blast.Globals[name]) {
			Blast.Classes[name] = Blast.Globals[name];
		}
	}

	if (!Collection.Object.defineProperty) {
		Collection.Object.defineProperty = Object.defineProperty;
	}

	// Create the property definer
	Blast.defineProperty = function defineProperty(obj, name, settings) {
		return Collection.Object.defineProperty(obj, name, settings);
	};

	/**
	 * Inherit the prototype methods from one constructor into another
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.3
	 * @version   0.1.3
	 *
	 * @param     {Function}  constructor       The new constructor
	 * @param     {Function}  superConstructor  The 'super' constructor
	 * @param     {Boolean}   setSuper          Set super on constructor [TRUE]
	 */
	Blast.inherits = function inherits(constructor, superConstructor, setSuper) {

		// Store the parent constructor if wanted
		if (typeof setSuper === 'undefined' || setSuper) {
			constructor.super_ = superConstructor;
		}

		// Create the prototype
		constructor.prototype = Object.create(superConstructor.prototype, {
			constructor: {
				value: constructor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
	};

	/**
	 * Define a non-enumerable property
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.3.5
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {Object}   value    The value of the property
	 */
	Blast.defineProperty(Collection.Object, 'defineValue', {
		value: function defineValue(target, name, value, enumerable) {

			var i;

			if (typeof enumerable == 'undefined') {
				enumerable = false;
			}

			if (Array.isArray(name)) {
				for (i = 0; i < name.length; i++) {
					Blast.defineValue(target, name[i], value, enumerable);
				}
				return;
			}

			// When in DEBUG mode show warnings for already existing properties
			if (Blast.DEBUG && Object.getOwnPropertyDescriptor(target, name) != null) {
				console.warn('Protoblast is overwriting property "' + name + '"');
			}

			Object.defineProperty(target, name, {
				value: value,
				enumerable: enumerable,
				configurable: true,
				writable: true
			});
		}
	});

	Blast.defineValue = Collection.Object.defineValue;

	if (modifyPrototype) {
		Blast.defineValue(Object, 'defineValue', Blast.defineValue);
	}

	/**
	 * Define a property getter
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.3
	 * @version   0.1.3
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {Object}   value    The value of the property
	 */
	Blast.defineGet = function defineGet(target, name, value, enumerable) {

		if (target && typeof target[name] !== 'undefined') {
			return;
		}

		if (typeof enumerable == 'undefined') {
			enumerable = false;
		}

		Object.defineProperty(target, name, {
			get: value,
			enumerable: enumerable
		});
	};

	/**
	 * Define a class constructor.
	 * Always returns the given constructor.
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.2
	 * @version   0.1.12
	 */
	Blast.defineClass = function defineClass(className, constructor, shim) {

		var objTarget;

		if (shim && Globals[className]) {
			Blast.Classes[className] = Globals[className];
		} else {

			// Indicate this defined class belongs to protoblast
			Blast.defineValue(constructor, '_blast_class', true);

			// Store the new constructor in the classes object
			Blast.Classes[className] = constructor;

			// If we're allowed to modify prototypes, turn it into a global
			if (Blast.modifyPrototype) {
				Globals[className] = constructor;
			}
		}

		return constructor;
	};

	/**
	 * Define a global
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.2
	 * @version   0.1.2
	 */
	Blast.defineGlobal = function defineGlobal(name, value, shim) {

		if (shim && Globals[name]) {
			Blast[name] = Globals[name];
		} else {

			// Always add it to Blast
			Blast[name] = value;

			if (Blast.modifyPrototype) {
				if (Blast.isNode) {
					// In node, every global is an own property of the `global` object
					Globals[name] = constructor;
				} else {
					// In the browser, it's mostly a property of the window prototype
					if (Globals.constructor && Globals.constructor.prototype) {
						Globals.constructor.prototype[name] = value;
					} else {
						Globals[name] = value;
					}
				}
			}
		}
	};

	/**
	 * Define a prototype value
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.1.12
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {String}   type     get/set/value, defaults to value
	 * @param     {Object}   value    The value of the property
	 * @param     {Boolean}  shim     Only set value if it's not already there
	 */
	Blast.definePrototype = function definePrototype(targetClass, name, type, value, shim) {

		var objTarget,
		    className,
		    definer;

		if (arguments.length == 3) {
			value = type;
			type = 'value';
		}

		if (arguments.length == 4) {
			if (typeof value == 'boolean') {
				shim = value;
				value = type;
				type = 'value';

			}
		}

		if (type == 'get') {
			definer = Blast.defineGet;
		} else {
			definer = Blast.defineValue;
		}

		if (typeof targetClass == 'string') {

			className = targetClass;

			if (!Collection[className]) {
				Collection[className] = {};
			}

			if (!Blast.Classes[className]) {
				if (!Globals[className]) {
					Globals[className] = {};
				}

				Blast.Classes[className] = Globals[className];
			}

			objTarget = Collection[className];
			targetClass = Blast.Classes[className];
		} else if (shim || Blast.modifyPrototype) {
			objTarget = targetClass;
		}

		if (shim && Blast.Shims) {
			Blast.Shims[(className || targetClass.name) + '#' + name] = value;

			// Force overwrite while unit testing
			if (module.exports.unit_test) {
				shim = false;
			}
		}

		if (Blast.modifyPrototype) {

			if (!targetClass.prototype) {
				targetClass.prototype = {};
			}

			// Only set if it's not a shim, or if it's not there
			if (!shim || !(targetClass.prototype[name] && targetClass.prototype.hasOwnProperty(name))) {
				definer(targetClass.prototype, name, value);
			}
		} else if (targetClass._blast_class || (shim && !targetClass.prototype[name])) {
			definer(targetClass.prototype, name, value);
		}

		if (objTarget) {

			if (!objTarget.prototype) {
				objTarget.prototype = {};
			}

			// If this is only a shim, and it already exists on the real class, use that
			if (shim && targetClass.prototype && targetClass.prototype.hasOwnProperty(name)) {
				if (type == 'get') {
					// If we want to set a getter, it needs to be a function
					if (typeof targetClass.prototype[name] == 'function') {
						definer(objTarget.prototype, name, targetClass.prototype[name], true);
					}
				} else {
					definer(objTarget.prototype, name, targetClass.prototype[name], true);
				}
			} else {
				definer(objTarget.prototype, name, value, true);
			}
		}
	};

	/**
	 * Define a class function
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.4.2
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {Object}   value    The value of the property
	 * @param     {Boolean}  shim     Only set value if it's not already there
	 */
	Blast.defineStatic = function defineStatic(targetClass, name, value, shim) {

		var objTarget,
		    className,
		    targetBound;

		if (typeof targetClass == 'string') {

			className = targetClass;

			if (!Collection[className]) {
				Collection[className] = {};
			}

			if (!Blast.Classes[className]) {
				if (!Globals[className]) {
					Globals[className] = {};
				}

				Blast.Classes[className] = Globals[className];
			}

			objTarget = Collection[className];
			targetClass = Blast.Classes[className];

			if (!Blast.Bound[className]) {
				Blast.Bound[className] = {};
			}

			targetBound = Blast.Bound[className];
		}

		if (shim && Blast.Shims) {
			Blast.Shims[(className || targetClass.name) + '.' + name] = value;

			// Force overwrite while unit testing
			if (module.exports.unit_test) {
				shim = false;
			}
		}

		// Honour the 'modifyPrototype' setting, except for classes we created ourselves
		if (Blast.modifyPrototype || (targetClass && targetClass.setMethod)) {
			// Only set if it's not a shim, or if it's not there
			if (!shim || !targetClass.hasOwnProperty(name)) {
				Blast.defineValue(targetClass, name, value);
			}
		}

		if (objTarget) {
			// If this is only a shim, and it already exists on the real class, use that
			if (shim && targetClass.hasOwnProperty(name)) {
				Blast.defineValue(objTarget, name, targetClass[name], true);

				if (!targetBound.hasOwnProperty(name)) {
					Blast.defineValue(targetBound, name, targetClass[name], true);
				}
			} else {
				Blast.defineValue(objTarget, name, value, true);

				if (!targetBound.hasOwnProperty(name)) {
					Blast.defineValue(targetBound, name, value, true);
				}
			}
		}
	};

	/**
	 * Return a string representing the source code of the given variable.
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object}           variable   The variable to uneval
	 * @param     {Boolean|Number}   tab        If indent should be used
	 *
	 * @return    {String}
	 */
	Blast.uneval = function uneval(variable, tab) {

		var result,
		    type = typeof variable;

		if (tab === true) {
			tab = 1;
		}

		if (!variable) {
			result = ''+variable;
		} else if (type == 'number') {
			result = ''+variable;
		} else if (!(type == 'string' || type == 'boolean') && variable.toSource) {
			result = variable.toSource(tab);
		} else {
			result = JSON.stringify(variable, jsonuneval);
		}

		return result;
	};

	/**
	 * The root was not uneval-able, but the rest could be
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.4
	 * @version   0.1.4
	 */
	function jsonuneval(key, value) {

		if (key === '') {
			return value;
		}

		return Blast.uneval(value);
	}

	//PROTOBLAST START CUT
	/**
	 * Server side: create client side file
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.1
	 * @version   0.5.1
	 *
	 * @return    {String}
	 */
	Blast.getClientPath = function getClientPath(useCommon) {

		var client_extras = [],
		    template,
		    result,
		    cpath,
		    files,
		    code,
		    temp,
		    id,
		    fs;

		if (useCommon) {
			if (Blast.clientPathCommon) {
				return Blast.clientPathCommon;
			}

			cpath = libpath.resolve(__dirname, '..', 'client-file-common.js');
			Blast.clientPathCommon = cpath;
		} else {
			if (Blast.clientPath) {
				return Blast.clientPath;
			}

			cpath = libpath.resolve(__dirname, '..', 'client-file.js');
			Blast.clientPath = cpath;
		}

		// Require fs
		fs = require('fs');

		// Get the main template
		template = fs.readFileSync(libpath.resolve(__dirname, 'client.js'), {encoding: 'utf8'});

		code = '';

		files = [
			'init',
			'json-dry'
		].concat(Names);

		// This file should only be for browsers
		files.push('browsershims');

		files.forEach(function eachFile(name, index) {

			var path;

			name = name.toLowerCase();

			if (name == 'json-dry') {
				path = require.resolve('json-dry');
			} else {
				path = libpath.resolve(__dirname, name + '.js');
			}

			temp = fs.readFileSync(path, {encoding: 'utf8'});

			code += 'require.register("' + name + '.js", function(module, exports, require){\n';
			code += temp;
			code += '});\n';
		});

		// Now iterate over the extras
		extras.forEach(function eachExtra(options) {

			var temp = fs.readFileSync(options.path, {encoding: 'utf8'});

			if (options.added_wrapper) {
				temp = 'module.exports = function(Blast, Collection, Bound, Obj) {"use strict";' + temp + '\n};';
			}

			code += 'require.register("' + options.name + '", function(module, exports, require){\n';
			code += temp;
			code += '});\n';
		});

		id = template.indexOf('//_REGISTER_//');

		if (useCommon) {
			code += '\nuseCommon = true;\n';
		}

		// Add the extras to the client
		extras.forEach(function eachExtra(options) {

			if (options.client === false) {
				return;
			}

			client_extras.push({
				name   : options.name
			});
		});

		code += '\nclient_extras = ' + JSON.stringify(client_extras) + ';\n';

		template = template.slice(0, id) + code + template.slice(id);

		// Remove everything between "PROTOBLAST START CUT" and "PROTOBLAST END CUT" (with slashes)
		template = template.replace(/\/\/\s?PROTOBLAST\s?START\s?CUT([\s\S]*?)(\/\/\s?PROTOBLAST\s?END\s?CUT)/gm, '');

		fs.writeFileSync(cpath, template);

		return cpath;
	};
	//PROTOBLAST END CUT

	var when_ready = [],
	    when_loaded = [],
	    queued_meds = [],
	    queued_ticks = [];

	/**
	 * Execute function after Blast code has run.
	 * This is normally after 'ready' on a real 'nextTick',
	 * but can be forced with a 'doLoaded' call.
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.3.6
	 * @version   0.3.6
	 *
	 * @param     {Function}   fnc
	 */
	Blast.queueTick = function queueTick(fnc) {
		if (queued_ticks) {
			queued_ticks.push(fnc);
		} else {
			Blast.nextTick(fnc);
		}
	};

	/**
	 * Do queued ticks
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.3.6
	 * @version   0.3.6
	 */
	function doQueuedTicks() {

		var i;

		if (!queued_ticks) {
			return;
		}

		for (i = 0; i < queued_ticks.length; i++) {
			queued_ticks[i]();
		}

		queued_ticks = false;
	}

	/**
	 * Execute function after Blast code has run
	 * This is after 'ready' and 'tick' but before 'loaded'
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.3.6
	 * @version   0.3.6
	 *
	 * @param     {Function}   fnc
	 */
	Blast.queueImmediate = function queueImmediate(fnc) {
		if (when_loaded) {
			queued_meds.push(fnc);
		} else {
			Blast.setImmediate(fnc);
		}
	};

	/**
	 * Execute function after Blast has been completely defined.
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.2
	 * @version   0.3.6
	 *
	 * @param     {Function}   fnc
	 *
	 * @return    {Boolean}    Returns if Protoblast is already ready
	 */
	Blast.ready = function ready(fnc) {
		if (when_ready) {

			if (fnc) {
				when_ready.push(fnc);
			}

			return false;
		} else {

			if (fnc) {
				fnc();
			}

			return true;
		}
	};

	/**
	 * Execute function after Blast and all other scripts have executed.
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.10
	 * @version   0.3.6
	 *
	 * @param     {Function}   fnc
	 *
	 * @return    {Boolean}    Returns if Protoblast has already loaded
	 */
	Blast.loaded = function loaded(fnc) {
		if (when_loaded) {

			if (fnc) {
				when_loaded.push(fnc);
			}

			return false;
		} else {

			if (fnc) {
				fnc(true);
			}

			return true;
		}
	};

	/**
	 * Force Protoblast into executing the when_loaded functions
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.2.0
	 * @version   0.5.0
	 */
	Blast.doLoaded = function doLoaded() {

		var i;

		if (!when_loaded) {
			return;
		}

		Blast.loading = true;

		doQueuedTicks();

		for (i = 0; i < queued_meds.length; i++) {
			queued_meds[i]();
		}

		for (i = 0; i < when_loaded.length; i++) {
			when_loaded[i]();
		}

		queued_meds = false;
		when_loaded = false;
		Blast.loading = false;
	};

	/**
	 * Check require call
	 */
	function checkNextRequire(options) {

		if (!modulep) {
			return;
		}

		if (options.strict === false) {
			return;
		}

		// Overwrite the original wrap method
		modulep.wrap = function wrap(script) {

			// Restore the original functions
			modulep.wrap = modulep.original_wrap;
			modulep._resolveFilename = modulep.original_resolve;

			if (options.add_wrapper !== false) {
				if (options.add_wrapper || script.slice(0, 14) != 'module.exports') {

					if (script.indexOf('__cov_') > -1 && script.indexOf('module.exports=function ') > 7) {
						// We're in coverage mode, just ignore
					} else {
						// Yes: "added_wrapper", as in "done"
						options.added_wrapper = true;

						script = 'module.exports = function(Blast, Collection, Bound, Obj) {' + script + '\n};';
					}
				}
			}

			// Add the strict wrapper for this requirement
			return modulep.strict_wrapper + script + modulep.wrapper[1];
		};

		// Overwrite the original _resolveFilename method
		modulep._resolveFilename = function _resolveFilename(request, parent, is_main) {
			try {
				return modulep.original_resolve(request, parent, is_main);
			} catch (err) {
				modulep.wrap = modulep.original_wrap;
				modulep._resolveFilename = modulep.original_resolve;
				throw err;
			}
		};
	}

	/**
	 * Require a Protoblast module
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.4.1
	 * @version   0.5.1
	 *
	 * @param     {String}   name
	 * @param     {Object}   options
	 */
	Blast.require = function _require(name, options) {

		var exported_module,
		    exported_fnc,
		    result;

		if (!options) {
			options = {};
		}

		if (options.client == null) {
			options.client = true;
		}

		if (options.server == null) {
			options.server = true;
		}

		options.name = name;

		if (options.is_extra !== false) {
			extras.push(options);
		}

		if (Array.isArray(name)) {
			name = libpath.resolve.apply(libpath, name);
		}

		if (required[name]) {
			return;
		}

		required[name] = true;

		if (!options.path) {
			if (libpath) {
				if (name == libpath.basename(name)) {
					options.name = name;
					options.path = libpath.resolve(__dirname, name + '.js');
				} else {
					options.path = name;
					options.name = libpath.basename(options.path);
				}
			}
		}

		if (Blast.isNode && options.server === false) {
			return;
		}

		// Make next require strict + look for exports
		checkNextRequire(options);

		// Get the exported function
		exported_fnc = require(options.path || name);

		// Execute the exported function
		result = exported_fnc(Blast, Collection, Blast.Bound, Blast.Bound.Object);

		if (result != null) {
			return result;
		} else if (require.cache) {
			// Try getting the actual exported module
			exported_module = require.cache[options.path || name];

			if (!exported_module) {
				return;
			}

			return exported_module.exports;
		}
	};

	// Make sure WeakMap is available first!
	Blast.require('weakmap');

	// Load the inheritance methods
	Blast.require('function_inheritance');

	// Require the scripts
	Names.forEach(function eachName(name) {

		var options = {
			// These are core files, don't add to extra
			is_extra    : false,

			// Core files are already wrapped
			add_wrapper : false
		};

		name = name.toLowerCase();

		if (name == 'jsonpath') {
			options.strict = false;
		}

		Blast.require(name, options);
	});

	// Turn Blast into an event emitter
	Blast.Collection.Object.inject(BlastClass.prototype, Blast.Classes.Informer.prototype);

	Blast.require('string_entities', {add_wrapper: false});
	Blast.require('function_flow', {add_wrapper: false});
	Blast.require('setimmediate', {add_wrapper: false});
	Blast.require('inflections', {add_wrapper: false});
	Blast.require('date_format', {add_wrapper: false});
	Blast.require('diacritics', {add_wrapper: false});
	Blast.require('benchmark', {add_wrapper: false});
	Blast.require('sorting', {add_wrapper: false});

	if (Blast.isBrowser) {
		Blast.require('browsershims');

		client_extras.forEach(function eachExtra(options) {
			Blast.require(options.name);
		});
	}

	// Now create bound methods
	Collection.Object.each(Collection, function eachCollection(StaticClass, className) {

		// Make sure the bound collection object exists
		if (!Blast.Bound[className]) {
			Blast.Bound[className] = {};
		}

		// Add all the static functions as-is
		Collection.Object.each(StaticClass, function eachClass(StaticFunction, functionName) {
			Blast.Bound[className][functionName] = StaticFunction;
		});

		// Add all the prototype functions (if no static version exists already)
		Collection.Object.each(StaticClass.prototype, function eachProperty(PrototypeFunction, functionName) {

			// If there is a static function with the same name,
			// it gets precedence!
			// @version 0.3.7
			if (Object.hasOwnProperty.call(StaticClass, functionName)) {
				return;
			}

			Blast.Bound[className][functionName] = Collection.Function.prototype.unmethodize.call(PrototypeFunction, functionName);
		});
	});

	for (var i = 0; i < when_ready.length; i++) {
		when_ready[i]();
	}

	when_ready = false;

	// The core has loaded and the `return Blast` will have executed
	Blast.nextTick(function afterThisFunction() {
		Blast.emit('ready');
		doQueuedTicks();
	});

	// Any other synchronous javascript after this has also finished
	Blast.setImmediate(function afterOtherScripts() {
		Blast.doLoaded();
		Blast.emit('loaded');
	});

	return Blast;
};