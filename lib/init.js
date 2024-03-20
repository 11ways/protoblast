module.exports = function BlastInitLoader(modifyPrototype) {
	return BlastInit(modifyPrototype);
};

function BlastInit(modifyPrototype) {

	var blastRequirer,
	    Collection,
	    other_ver,
	    r_package,
	    required,
	    libpath,
	    Globals,
	    version,
	    modulep,
	    extras,
	    Names,
	    temp,
	    name,
	    ctx,
	    ua,
	    i;

	const BlastClass = function BlastClass(){};

	let Blast   = new BlastClass(),
	    __BLAST = Blast; // Needed for Terser & global_defs magic 

	const version_rx = /([0-9]+)\.([0-9]+)\.?([0-9]+\.?[0-9]*)?/,
	      PROTECTED_CLASSES = {};

	/**
	 * Parse a useragent string
	 * 
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.6.6
	 * @version  0.7.23
	 *
	 * @param    {String}     useragent   The useragent string
	 * @param    {Object}     navigator   Optional navigator object
	 *
	 * @return   {Object}
	 */
	function parseUseragent(ua, navigator) {

		if (!ua) {
			return null;
		}

		let platform,
		    webview = false,
		    version,
		    engine,
		    result,
		    major,
		    minor,
		    patch,
		    float,
		    index,
		    name,
		    temp,
		    os;

		ua = ua.toLowerCase();

		if (~ua.indexOf('mobile')) {
			platform = 'mobile';
		} else if (~ua.indexOf('tablet')) {
			platform = 'tablet';
		} else {
			platform = 'desktop';
		}

		if (~(index = ua.indexOf('msie'))) {
			name = 'internet explorer';
			platform = 'desktop';
		} else if (~(index = ua.indexOf('trident/'))) {
			name = 'internet explorer';
			platform = 'desktop';
			index += 13;
		} else if (~(index = ua.indexOf('edge/'))) {
			name = 'edge';
			engine = 'edgehtml';
		} else if (~(index = ua.indexOf('edg/'))) {
			name = 'edge';
			engine = 'blink';
		} else if (~(index = ua.indexOf('samsungbrowser/'))) {
			name = 'samsung browser';
			engine = 'blink';
		} else if (~(index = ua.indexOf('chromium/'))) {
			name = 'chromium';
		} else if (~(index = ua.indexOf('chrome/'))) {
			name = 'chrome';
		} else if (~(index = ua.indexOf('firefox/'))) {
			name = 'firefox';
			engine = 'gecko';
		} else if (~(index = ua.indexOf('safari/'))) {
			name = 'safari';
			index = ua.indexOf('version/');
			engine = 'webkit';
		}

		if (~index) {
			version = version_rx.exec(ua.slice(index));

			if (version) {
				float = parseFloat(version[0]);
				major = +version[1];
				minor = +version[2];
				patch = version[3] || '';
			}
		}

		if (!engine) {
			switch (name) {
				case 'internet explorer':
					engine = 'trident';
					break;

				case 'chromium':
				case 'chrome':
					if (major < 28) {
						engine = 'webkit';
					} else {
						engine = 'blink';
					}
					break;
			}
		}

		if (navigator && (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
			platform = 'mobile';
			os = 'ios';
		}

		if (platform != 'desktop') {
			if (~ua.indexOf('iphone') || ~ua.indexOf('ipad') || ~ua.indexOf('ipod')) {
				os = 'ios';

				if (ua.indexOf('safari') == -1) {
					webview = true;
				}
			} else if (~ua.indexOf('; wv')) {
				webview = true;
			}
		}

		result = {
			family    : name,
			version   : {
				major : major,
				minor : minor,
				patch : patch,
				float : float
			},
			platform  : platform,
			engine    : engine,
			webview   : webview,
			os        : os
		};

		return result;
	}

	Blast.parseUseragent = parseUseragent;

	// Is this a browser?
	__BLAST.isBrowser = false;

	// Is it running in a node-ish context?
	__BLAST.isNode = false;

	// Is this a server?
	__BLAST.isServer = false;

	// Is this Bun?
	__BLAST.isBun = false;

	// Is it running in NW.js?
	Blast.isNW = false;

	// Is it running in a NW.js window?
	Blast.isNWWindow = false;

	// Is it running in an Electron window?
	Blast.isElectron = false;

	// Is it running in a webview?
	Blast.isWebview = false;

	// Is it running on iOS?
	Blast.isiOS = false;

	// Is it running Safari?
	Blast.isSafari = false;

	// If it's a browser, is it IE?
	Blast.isIE = false;
	Blast.__init = BlastInit;

	// If it's a browser, is it Edge?
	Blast.isEdge = false;

	// Define custom argument configurations
	Blast.arguments = {};

	// See if we can modify class prototypes
	if (typeof modifyPrototype === 'undefined') {
		modifyPrototype = true;
	}

	if (typeof process === 'object' && typeof process.electronBinding == 'function') {
		Blast.isElectron = true;
		__BLAST.isNode = true;
		Globals = global;
	} else if (typeof process === 'object' && (process.__node_webkit || process.__nwjs)) {
		Blast.isNW = true;
		__BLAST.isNode = true;
		Globals = global;
	} else if (typeof window !== 'undefined') {
		Globals = window;
		__BLAST.isBrowser = true;

		if (window.navigator && window.navigator.userAgent) {
			ua = window.navigator.userAgent;
			ua = parseUseragent(window.navigator.userAgent, window.navigator);

			Blast.userAgent = ua;
			Blast.isIE = ua.browser == 'internet explorer';

			if (!Blast.isIE) {
				Blast.isEdge = ua.browser == 'edge';
			}

			if (!Blast.isEdge) {
				Blast.isiOS = ua.os == 'ios';
				Blast.isSafari = ua.family == 'safari';
				Blast.isWebview = ua.webview;
				Blast.isChrome = ua.family == 'chrome';
				Blast.isFirefox = ua.family == 'firefox';
			}
		}
	} else if (typeof self !== 'undefined' && self.constructor && self.constructor.name == 'DedicatedWorkerGlobalScope') {
		Globals = self;
		__BLAST.isBrowser = true;
		Blast.isWorker = true;
	} else {
		Globals = global;
		__BLAST.isNode = true;

		if (process.isBun) {
			__BLAST.isBun = true;
		}
	}

	// NW.js offers 2 contexts: node & chromium
	if (Blast.isNW && typeof __dirname == 'undefined') {
		Globals = window;
		Blast.isNWWindow = true;
	}

	if (__BLAST.isNode || __BLAST.isBun) {
		__BLAST.isServer = true;
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
		r_package = require(__dirname + '/../package.json');

		// And the path package
		libpath = require('path');

		// The `module` package is read-only on Bun
		if (Blast.isBun) {
			modulep = {
				original_wrap    : null,
				original_wrapper : null,
				strict_wrapper   : null,
			};

			Blast._bun_modulep = modulep;
		} else {
			// Require the module package
			modulep = require('module');

			// Sometimes scripts recursively call the blast init script,
			// make sure to not overwrite the original wrapper then
			if (!modulep.original_wrap) {
				modulep.original_wrap = modulep.wrap;
				modulep.original_wrapper = modulep.wrapper.slice(0);
				modulep.original_resolve = modulep._resolveFilename;
				modulep.strict_wrapper = modulep.original_wrapper[0] + '"use strict";';
			}
		}

		blastRequirer = require(__dirname + '/require.js')(Blast);

		// Split the version
		temp = r_package.version.split('.');

		// Interpret the numbers
		version = {
			major : parseInt(temp[0]),
			minor : parseInt(temp[1]),
			patch : parseInt(temp[2])
		};

		Blast.version = version;
		Blast.version_string = r_package.version;
		Blast.ACTIVE_FILE = Symbol('active_file');
	}
	// PROTOBLAST END CUT

	if (!blastRequirer) {
		blastRequirer = require;
	}

	// Find the context to check
	if (Blast.isNW && global.__Protoblast) {
		// "global" refers to the nodejs context in nwjs
		ctx = global;
	} else {
		ctx = Globals;
	}

	// Maybe we can return an existing protoblast collection
	if (ctx.__Protoblast) {

		if (!ctx.__Protoblast.loaded_versions) {
			ctx.__Protoblast.loaded_versions = {};
		}

		if (ctx.__Protoblast.version && !ctx.__Protoblast.version_string) {
			ctx.__Protoblast.version_string = ctx.__Protoblast.version.major + '.' + ctx.__Protoblast.version.minor + '.' + ctx.__Protoblast.version.patch;
		}

		if (ctx.__Protoblast.version_string && !ctx.__Protoblast.loaded_versions[ctx.__Protoblast.version_string]) {
			ctx.__Protoblast.loaded_versions[ctx.__Protoblast.version_string] = ctx.__Protoblast;
		}

		if (Blast.isNWWindow) {
			// We're in a NW.JS window, and Protoblast has already been loaded
			// in the node context. So we'll use the existing classes,
			// but override the default globals later
			Blast.Classes = Object.create(ctx.__Protoblast.Classes);
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
					} else {
						// The other version has a lower patch
						if (ctx.__Protoblast.loaded_versions[Blast.version_string]) {
							return ctx.__Protoblast.loaded_versions[Blast.version_string];
						} else {
							Blast.Classes = Object.create(ctx.__Protoblast.Classes);
						}
					}
				}
			} else {
				return ctx.__Protoblast;
			}
		} else {
			Blast = ctx.__Protoblast;
		}
	}

	if (Blast.version) {

		if (!Blast.loaded_versions) {
			Blast.loaded_versions = {};
		}

		Blast.loaded_versions[Blast.version_string] = Blast;
	}

	// Store shims under unit_test object
	// when unit testing
	if (module.exports.unit_test || Blast.Globals.__is_protoblast_unit_test) {
		Blast.Shims = {};
	}

	// Don't overwrite another protoblast instance
	if (!other_ver) {
		Globals.__Protoblast = Blast;
	}

	// Extra files to load go here
	Blast.extra_files = extras = [];

	// Already required files
	required = {};

	Names = [
		'Function',
		'Object',
		'Array',
		'LinkedList',
		'LruCache',
		'Crypto',
		'Date',
		'AbstractDateTime',
		'LocalDateTime',
		'AbstractNumeric',
		'Decimal',
		'Error',
		'Informer',
		'State',
		'Request',
		'FunctionQueue',
		'Iterator',
		'Deck',
		'HashKey',
		'HashSet',
		'JSON',
		'Magic',
		'Math',
		'Map',
		'Pledge',
		'SeededRng',
		'Set',
		'Number',
		'RegExp',
		'SampleCollector',
		'String',
		'StringBuilder',
		'RURL',
		'Cache',
		'Branch',
		'BackedMap',
		'WeakValueMap',
	];

	Blast.modifyPrototype = modifyPrototype;

	// Class references go here. They're shared among all Protoblast instances
	if (!Blast.Classes) {
		Blast.Classes = {
			Object  : Object,
			Boolean : Boolean,
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
		if (Blast.Globals[name]) {
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
	 * @version   0.6.2
	 *
	 * @param     {Object}   target      The object to add the property to
	 * @param     {String}   name        The name of the property
	 * @param     {Object}   value       The value of the property
	 * @param     {Object}   descriptor  Optional descriptor
	 */
	Blast.defineProperty(Collection.Object, 'defineValue', {
		value: function defineValue(target, name, value, descriptor) {

			var i;

			if (typeof name == 'function') {
				descriptor = value;
				value = name;
				name = value.name;
			}

			if (descriptor == null) {
				descriptor = {};
			} else if (typeof descriptor == 'boolean') {
				descriptor = {
					enumerable : descriptor
				};
			}

			// Things are not enumerable by default
			if (descriptor.enumerable == null) {
				descriptor.enumerable = false;
			}

			if (descriptor.configurable == null) {
				descriptor.configurable = true;
			}

			if (descriptor.writable == null) {
				descriptor.writable = true;
			}

			if (typeof descriptor.value == 'undefined') {
				descriptor.value = value;
			}

			if (Array.isArray(name)) {
				for (i = 0; i < name.length; i++) {
					Blast.defineValue(target, name[i], null, descriptor);
				}
				return;
			}

			// When in DEBUG mode show warnings for already existing properties
			if (Blast.DEBUG && Object.getOwnPropertyDescriptor(target, name) != null) {
				console.warn('Protoblast is overwriting property "' + name + '"');
			}

			if (!descriptor || typeof descriptor != 'object') {
				throw new TypeError('Invalid descriptor for key "' + name + '"');
			}

			Object.defineProperty(target, name, descriptor);
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
					Globals[name] = value;
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
	 * @version   0.6.3
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
		    definer,
		    length = arguments.length;

		if (typeof name == 'function') {

			if (typeof type == 'string') {
				length = 4;
				value = name;
				name = value.name;
			} else {
				length += 1;
				shim = value;
				value = type;
				type = name;
				name = type.name;
			}
		}

		if (length == 3) {
			value = type;
			type = 'value';
		}

		if (length == 4) {
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

			if (className) {
				Blast.protectClass(className);
			}

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
	 * Make sure nothing overwrites this class
	 * (Looking at you here, Facebook Pixel!)
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.14
	 * @version   0.7.14
	 *
	 * @param     {string}   class_name
	 */
	Blast.protectClass = function protectClass(class_name) {

		if (PROTECTED_CLASSES[class_name]) {
			return;
		}

		PROTECTED_CLASSES[class_name] = true;

		let current_class = Globals[class_name];

		// Only protect objects for now
		if (!current_class || typeof current_class != 'object') {
			return;
		}

		Object.defineProperty(Globals, class_name, {
			get: function() {
				return current_class;
			},
			set: function(new_class) {

				// Something wants to override a global object!
				// Facebook Pixel does this with the JSON object
				// (for no valid reason, it doesn't do anything special)
				let has_change = false,
				    entry,
				    key;

				// Let's make sure there's nothing extra in the new class
				for (key in new_class) {
					entry = new_class[key];

					if (entry != current_class[key]) {
						has_change = true;
						current_class[key] = entry;
					}
				}
			}
		});
	};

	/**
	 * Create a static definer for the given class
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.8.0
	 * @version   0.8.3
	 *
	 * @param     {String|Function}   target   The object to add the property to
	 * @param     {Boolean}           force    Force set it?
	 */
	Blast.createStaticDefiner = function createStaticDefiner(target, force) {
		return function staticDefiner(name, value, shim) {
			return Blast.defineStatic(target, name, value, shim, force);
		}
	};

	/**
	 * Create a prototype definer for the given class
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.8.0
	 * @version   0.8.0
	 *
	 * @param     {String|Function}   target   The object to add the property to
	 */
	Blast.createProtoDefiner = function createProtoDefiner(target) {
		return function protoDefiner(name, type, value, shim) {
			return Blast.definePrototype(target, ...arguments);
		}
	};

	/**
	 * Define a class function
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.8.3
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {Object}   value    The value of the property
	 * @param     {Boolean}  shim     Only set value if it's not already there
	 * @param     {Boolean}  force    Force-set it?
	 */
	Blast.defineStatic = function defineStatic(targetClass, name, value, shim, force) {

		var objTarget,
		    className,
		    targetBound;

		if (typeof name == 'function') {
			shim = value;
			value = name;
			name = value.name;
		}

		if (!name) {
			throw new Error('Unable to define static property, could not find name value');
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
		if (force || Blast.modifyPrototype || (targetClass && targetClass.setMethod)) {
			// Only set if it's not a shim, or if it's not there
			if (force || !shim || !targetClass.hasOwnProperty(name)) {
				Blast.defineValue(targetClass, name, value);
			}

			if (className) {
				Blast.protectClass(className);
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

		return value;
	};

	//PROTOBLAST START CUT
	require('./server_functions.js')(Blast, extras);
	//PROTOBLAST END CUT

	var when_ready = [],
	    when_loaded = [],
	    queued_meds = [],
	    queued_ticks = [],
	    did_initial_load = false;

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

		var original_length = queued_ticks.length;

		queued_ticks.push(fnc);

		// Initial load hasn't happened yet,
		// so no need to queue it
		if (!did_initial_load && !Blast.loading) {
			return;
		}

		// There already is something in the queue?
		// No need to schedule another one then
		if (original_length) {
			return;
		}

		Blast.nextTick(doQueuedTicks);
	};

	/**
	 * Do the tasks in an array
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.5
	 * @version   0.7.9
	 *
	 * @param     {Array}   arr
	 * @param     {number}  level
	 */
	function clearAndDoTasks(arr, level) {

		let tasks = arr.slice(0),
		    i;

		if (level == null) {
			level = 0;
		}

		level++;

		// Clear the original array
		arr.length = 0;

		for (i = 0; i < tasks.length; i++) {
			tasks[i]();
		}

		// Recursively clear the tasks should now ones have been added,
		// but make sure we don't get stuck in an infinite loop
		if (arr.length && level < 10) {
			clearAndDoTasks(arr);
		}
	}

	/**
	 * Do queued ticks
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.3.6
	 * @version   0.6.5
	 */
	function doQueuedTicks() {
		clearAndDoTasks(queued_ticks);
	}

	/**
	 * Execute function after Blast code has run
	 * This is after 'ready' and 'tick' but before 'loaded'
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.3.6
	 * @version   0.6.5
	 *
	 * @param     {Function}   fnc
	 */
	Blast.queueImmediate = function queueImmediate(fnc) {

		var original_length = queued_meds.length;

		// Add it to the immediate queue
		queued_meds.push(fnc);

		// Initial load hasn't happened yet,
		// so no need to queue it
		if (!did_initial_load && !Blast.loading) {
			return;
		}

		// There already is something in the queue?
		// No need to schedule another one then
		if (original_length) {
			return;
		}

		// Schedule an execution of the queued functions
		Blast.setImmediate(function doImmediate() {
			Blast.doLoaded();
		});
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
	 * @version   0.6.5
	 *
	 * @param     {Function}   fnc
	 *
	 * @return    {Boolean}    Returns if Protoblast has already loaded
	 */
	Blast.loaded = function loaded(fnc) {
		if (!did_initial_load) {

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
	 * @version   0.6.5
	 */
	Blast.doLoaded = function doLoaded() {

		if (!did_initial_load) {
			Blast.loading = true;
		}

		doQueuedTicks();
		clearAndDoTasks(queued_meds);
		clearAndDoTasks(when_loaded);

		if (!did_initial_load) {
			Blast.loading = false;
			did_initial_load = true;
		}
	};

	/**
	 * Do a task once Protoblast has finished loading.
	 * If Protoblast has already loaded, mark it as unloaded again
	 * and queue the task.
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.8.18
	 * @version   0.8.18
	 */
	Blast.executeAfterLoadingCycle = function executeAfterLoadingCycle(task) {

		if (!did_initial_load) {
			Blast.loaded(task);
			return;
		}

		did_initial_load = false;
		Blast.loaded(task);
		
		Blast.setImmediate(() => {
			Blast.doLoaded();
		});
	};

	/**
	 * Get an argument configuration by name
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.7.0
	 * @version   0.7.0
	 */
	Blast.getArgumentConfiguration = function getArgumentConfiguration(name) {

		var config;

		if (typeof name == 'string') {
			config = Blast.arguments[name];
		} else {
			config = name;
		}

		if (!config) {
			throw new Error('Unable to find custom argument configuration "' + name + '"');
		}

		return config;
	};

	/**
	 * Do a synchronous sleep (blocking the eventloop!)
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {number}   duration
	 */
	Blast.sleepSync = function sleepSync(duration) {

		const valid = duration < Infinity;

		if (!valid) {
			throw new Error('Unable to sleep, duration is not valid: "' + duration + '"');
		}

		if (typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined') {
			const nil = new Int32Array(new SharedArrayBuffer(4));
			Atomics.wait(nil, 0, 0, Number(duration));
		} else {
			const target = Date.now() + Number(duration);

			while (target > Date.now()) {
				// Let's go CPU!
			}
		}
	};

	//PROTOBLAST START CUT
	/**
	 * Check require call
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @version   0.7.25
	 *
	 * @param     {Object}   options
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

			var head;

			// Restore the original functions
			modulep.wrap = simpleScriptWrap;
			modulep._resolveFilename = modulep.original_resolve;

			if (options.add_wrapper !== false) {
				if (options.add_wrapper || script.slice(0, 14) != 'module.exports') {

					if (global.__coverage__ && script.indexOf('module.exports=function ') > 7) {
						// We're in coverage mode, just ignore
					} else {
						// Yes: "added_wrapper", as in "done"
						options.added_wrapper = true;

						head = 'module.exports = ';

						if (options.async) {
							head += 'async';
						}

						head += ' function(';

						if (options.arguments) {
							head += Blast.getArgumentConfiguration(options.arguments).names.join(',');
						} else {
							head += 'Blast, Classes, Types, Collection, Bound, Obj, Fn';
						}

						head += ') {';

						script = head + script + '\n};';
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
				modulep.wrap = simpleScriptWrap;
				modulep._resolveFilename = modulep.original_resolve;
				throw err;
			}
		};
	}

	/**
	 * Just restoring the originel `wrap` function doesn't seem to work
	 * when it tries to load a shebang file (Proxy nonsense?)
	 * So check the script first
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.2
	 * @version   0.7.2
	 *
	 * @param     {String}   script
	 *
	 * @return    {String}
	 */
	function simpleScriptWrap(script) {

		if (script[0] == '#' && script[1] == '!') {
			script = '//' + script.slice(2);
		}

		return modulep.original_wrap(script);
	}
	//PROTOBLAST END CUT

	/**
	 * Require all given Protoblast modules
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.6
	 * @version   0.6.6
	 *
	 * @param     {String}   name
	 * @param     {Object}   options
	 */
	Blast.requireAll = function requireAll(paths, options) {

		var i;

		for (i = 0; i < paths.length; i++) {
			Blast.require(paths[i], Object.assign({}, options));
		}
	};

	/**
	 * Require a Protoblast module
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.4.1
	 * @version   0.8.0
	 *
	 * @param     {String}   name
	 * @param     {Object}   options
	 */
	Blast.require = function _require(name, options) {

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

		let index = extras.push(options) - 1;

		if (options.pwd) {
			if (!Array.isArray(name)) {
				name = [name];
			} else {
				name = name.slice(0);
			}

			options.name_id = name.join('/');

			name.unshift(options.pwd);
		}

		if (Array.isArray(name)) {

			if (!options.name_id) {
				options.name_id = name.join('/');
			}

			if (Blast.isBrowser) {
				name = options.name_id;
			} else {
				name = libpath.resolve.apply(libpath, name);
			}
		}

		if (required[name]) {
			return;
		}

		required[name] = true;

		//PROTOBLAST START CUT
		let from_core = false;

		if (!options.path && !options.resolver) {
			if (name == libpath.basename(name)) {
				from_core = true;
				options.name = name;
				options.path = libpath.resolve(__dirname, name + '.js');
			} else {
				options.path = name;
				options.name = libpath.basename(options.path);
			}

			if (options.path.slice(-3) != '.js') {
				options.path += '.js';
			}
		}

		if (options.client && !from_core) {
			if (options.is_extra === false) {
				if (options.extra_name) {
					options.name_id = options.extra_name + '/' + (options.name_id || options.name);
				}
			} else {
				if (!options.name_id) {
					options.name_id = index + '_' + options.name;
				} else {
					options.name_id = index + '_' + options.name_id;
				}
			}
		} else if (!options.name_id) {
			options.name_id = options.name;
		}

		if (Blast.isNode && options.server === false) {
			return;
		}

		// Make next require strict + look for exports
		checkNextRequire(options);
		//PROTOBLAST END CUT

		if (Blast.isBrowser) {
			if (options.is_extra === false && !options.path) {
				options.path = options.name_id;

				if (options.extra_name) {
					options.path = options.extra_name + '/' + options.path;
				}
			}
		}

		if (Blast.isNode) {
			Blast[Blast.ACTIVE_FILE] = options;
		}

		// Get the exported function
		let exported_fnc = blastRequirer(options.path || name),
		    args;

		if (options.arguments) {
			args = Blast.getArgumentConfiguration(options.arguments).values;
		} else {
			args = [
				Blast,
				Blast.Classes,
				Blast.Types,
				Collection,
				Blast.Bound,
				Blast.Bound.Object,
				Collection.Function,
			];
		}

		if (typeof exported_fnc != 'function') {
			if (Blast.isNode) {
				Blast[Blast.ACTIVE_FILE] = false;
			}
			throw new Error('Module "' + (options.path || name) + '" did not export a function');
		}

		// Execute the exported function
		let result = exported_fnc.apply(null, args);

		if (Blast.isNode) {
			Blast[Blast.ACTIVE_FILE] = false;
		}

		if (result != null) {
			return result;
		}

		//PROTOBLAST START CUT
		if (blastRequirer.cache) {
			// Try getting the actual exported module
			let exported_module = require.cache[options.path || name];

			if (!exported_module) {
				return;
			}

			return exported_module.exports;
		}
		//PROTOBLAST END CUT
	};

	// Load the extra blast functions
	Blast.require('blast', {is_extra: false});

	// Load the inheritance methods
	Blast.require('function_inheritance', {is_extra: false});

	// Load the predefined decorators
	Blast.require('function_decorators', {is_extra: false});

	// Load the type system
	Blast.require('function_signatures', {is_extra: false});

	// Load the scheduler functions
	Blast.require('setimmediate', {add_wrapper: false, is_extra: false});

	// Require the scripts
	Names.forEach(function eachName(name) {

		var options = {
			// These are core files, don't add to extra
			is_extra    : false,

			// Core files are already wrapped
			add_wrapper : null
		};

		name = name.toLowerCase();

		Blast.require(name, options);
	});

	// Turn Blast into an event emitter
	Blast.Collection.Object.inject(BlastClass.prototype, Blast.Classes.Informer.prototype);

	Blast.require('string_entities', {add_wrapper: true, is_extra: false});
	Blast.require('function_flow', {add_wrapper: true, is_extra: false});
	Blast.require('inflections', {add_wrapper: true, is_extra: false});
	Blast.require('date_format', {add_wrapper: true, is_extra: false});
	Blast.require('diacritics', {add_wrapper: true, is_extra: false});
	Blast.require('benchmark', {add_wrapper: true, is_extra: false});
	Blast.require('sorting', {add_wrapper: true, is_extra: false});

	Blast.require('browsershims', {add_wrapper: true, server: false});
	Blast.require('request_browser', {add_wrapper: true, server: false});

	Blast._fn_token_prepare();
	Blast.emit('pre-extra-files');

	if (Blast.isNode) {
		Blast.require('request_agents', {add_wrapper: true, client: false});
		Blast.require('request_server', {add_wrapper: true, client: false});
		Blast.require('stream_ns', {client: false});
		Blast.require('stream_delayed', {client: false});
		Blast.require('stream_combined', {client: false});
		Blast.require('form_data', {client: false});
		Blast.require('devtools', {client: false});
	}

	Blast.require('request_events', {add_wrapper: true, client: true});

	// Now create bound methods
	Collection.Object.each(Collection, function eachCollection(StaticClass, className) {

		var proto_keys;

		// Make sure the bound collection object exists
		if (!Blast.Bound[className]) {
			Blast.Bound[className] = {};
		}

		// Add all the static functions as-is
		Collection.Object.each(StaticClass, function eachClass(StaticFunction, functionName) {
			Blast.Bound[className][functionName] = StaticFunction;
		});

		if (StaticClass._blast_class) {
			proto_keys = Object.getOwnPropertyNames(StaticClass.prototype);
		} else if (StaticClass.prototype) {
			proto_keys = Object.keys(StaticClass.prototype);
		} else {
			return;
		}

		// Add all the prototype functions (if no static version exists already)
		Collection.Object.each(proto_keys, function eachProperty(name, index) {

			var PrototypeFunction,
			    descriptor;

			descriptor = Object.getOwnPropertyDescriptor(StaticClass.prototype, name);

			if (!descriptor || !descriptor.value) {
				return;
			}

			PrototypeFunction = descriptor.value;

			if (typeof PrototypeFunction != 'function') {
				return;
			}

			// If there is a static function with the same name,
			// it gets precedence!
			// @version 0.3.7
			if (Object.hasOwnProperty.call(StaticClass, name)) {
				return;
			}

			Blast.Bound[className][name] = Collection.Function.prototype.unmethodize.call(PrototypeFunction, name);
		});
	});

	if (Blast.isBrowser) {
		client_extras.forEach(function eachExtra(entry) {
			Blast.require(entry[0], {arguments: entry[1]});
		});
	}

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

	// Create the state instance
	Blast.state = new Blast.Classes.State();

	// All files have been required
	Blast.emit('requiring');

	return Blast;
};