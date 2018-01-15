module.exports = function BlastInit(modifyPrototype) {

	var BlastClass,
	    Collection,
	    other_ver,
	    package,
	    Globals,
	    version,
	    Names,
	    Blast,
	    temp,
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
	} else {
		Globals = global;
		Blast.isNode = true;
	}

	// NW.js offers 2 contexts: node & chromium
	if (false && Blast.isNW && typeof window !== 'undefined') {
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

	// Maybe we can return an existing protoblast collection
	if (Globals.__Protoblast) {

		// If we don't have to modify the prototype, or if it's already done, return the existing collection
		if (!modifyPrototype || (modifyPrototype && Globals.__Protoblast.modifyPrototype)) {

			// See if the versions match on node.js
			if (Blast.isNode) {

				// Get the other version info
				other_ver = Globals.__Protoblast.version;

				// See if we can use the earlier loaded protoblast instance
				if (other_ver && other_ver.major == version.major && other_ver.minor == version.minor) {
					// If the earlier loaded protoblast instance has a higher patch, we can safely use that
					if (other_ver.patch >= version.patch) {
						return Globals.__Protoblast;
					}
				}
			} else {
				return Globals.__Protoblast;
			}
		} else {
			Blast = Globals.__Protoblast;
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
		Collection[Names[i]] = {};
		Blast.Bound[Names[i]] = {};
	}

	/**
	 * Add the defineProperty method if it doesn't exist yet,
	 * this will only support .value setters
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 */
	if (!Object.defineProperty || (typeof navigator !== 'undefined' && navigator.appVersion.indexOf('MSIE 8') > -1)) {
		Collection.Object.defineProperty = function defineProperty(obj, name, settings) {
			obj[name] = settings.value;
		};

		if (modifyPrototype) {
			Object.defineProperty = Collection.Object.defineProperty;
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

	/**
	 * Server side: create client side file
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.1
	 * @version   0.4.1
	 *
	 * @return    {String}
	 */
	Blast.getClientPath = function getClientPath(useCommon) {

		var template,
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

			cpath = __dirname + '/../client-file-common.js';
			Blast.clientPathCommon = cpath;
		} else {
			if (Blast.clientPath) {
				return Blast.clientPath;
			}

			cpath = __dirname + '/../client-file.js';
			Blast.clientPath = cpath;
		}

		// Require fs
		fs = require('fs');

		// Get the main template
		template = fs.readFileSync(__dirname + '/client.js', {encoding: 'utf8'});

		code = '';

		files = [
			'init',
			'inflections',
			'diacritics',
			'date_format',
			'weakmap',
			'function_flow',
			'function_inheritance',
			'benchmark',
			'string_entities',
			'setimmediate',
			'sorting'
		].concat(Names);

		// This file should only be for browsers
		files.push('browsershims');

		files.forEach(function(name, index) {

			name = name.toLowerCase();

			temp = fs.readFileSync(__dirname + '/' + name + '.js', {encoding: 'utf8'});

			code += 'require.register("' + name + '.js", function(module, exports, require){\n';
			code += temp;
			code += '});\n';

		});

		id = template.indexOf('//_REGISTER_//');

		if (useCommon) {
			code += '\nuseCommon = true;\n';
		}

		template = template.slice(0, id) + code + template.slice(id);

		// Remove everything between "//PROTOBLAST START CUT" and "//PROTOBLAST END CUT"
		template = template.replace(/\/\/\s?PROTOBLAST\s?START\s?CUT([\s\S]*?)(\/\/\s?PROTOBLAST\s?END\s?CUT)/gm, '');

		fs.writeFileSync(cpath, template);

		return cpath;
	};

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
	 * @version   0.3.6
	 */
	Blast.doLoaded = function doLoaded() {

		var i;

		if (!when_loaded) {
			return;
		}

		doQueuedTicks();

		for (i = 0; i < queued_meds.length; i++) {
			queued_meds[i]();
		}

		for (i = 0; i < when_loaded.length; i++) {
			when_loaded[i]();
		}

		queued_meds = false;
		when_loaded = false;
	};

	/**
	 * Require a Protoblast module
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.4.1
	 * @version   0.4.1
	 *
	 * @param     {String}   name
	 */
	Blast.require = function _require(name) {
		return require('./' + name + '.js')(Blast, Collection, Blast.Bound, Blast.Bound.Object);
	};

	// Make sure WeakMap is available first!
	Blast.require('weakmap');

	// Load the inheritance methods
	Blast.require('function_inheritance');

	// Require the scripts
	Names.forEach(function eachName(name) {
		name = name.toLowerCase();
		Blast.require(name);
	});

	// Turn Blast into an event emitter
	Blast.Collection.Object.inject(BlastClass.prototype, Blast.Classes.Informer.prototype);

	Blast.require('string_entities');
	Blast.require('function_flow');
	Blast.require('setimmediate');
	Blast.require('inflections');
	Blast.require('date_format');
	Blast.require('diacritics');
	Blast.require('benchmark');
	Blast.require('sorting');

	if (Blast.isBrowser) {
		Blast.require('browsershims');
	}

	// Now create bound methods, which are about 0,000129 ms slower
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