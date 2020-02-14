module.exports = function BlastInitLoader(modifyPrototype) {
	return BlastInit(modifyPrototype);
};

function BlastInit(modifyPrototype) {

	var class_reset,
	    BlastClass,
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
	    Blast,
	    temp,
	    name,
	    ctx,
	    key,
	    ua,
	    fs,
	    i;

	BlastClass = function BlastClass(){};
	Blast = new BlastClass();

	const version_rx = /([0-9]+)\.([0-9]+)\.?([0-9]+\.?[0-9]*)?/

	/**
	 * Parse a useragent string
	 * 
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.6
	 * @version  0.6.6
	 *
	 * @param    {String}     useragent
	 *
	 * @return   {Object}
	 */
	function parseUseragent(ua) {

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

	// Is it a pure, regular browser?
	Blast.isBrowser = false;

	// Is it running in a node context?
	Blast.isNode = false;

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
		Blast.isNode = true;
		Globals = global;
	} else if (typeof process === 'object' && (process.__node_webkit || process.__nwjs)) {
		Blast.isNW = true;
		Blast.isNode = true;
		Globals = global;
	} else if (typeof window !== 'undefined') {
		Globals = window;
		Blast.isBrowser = true;

		if (window.navigator && window.navigator.userAgent) {
			ua = window.navigator.userAgent;
			ua = parseUseragent(window.navigator.userAgent);

			Blast.userAgent = ua;
			Blast.isIE = ua.browser == 'internet explorer';

			if (!Blast.isIE) {
				Blast.isEdge = ua.browser == 'edge';
			}

			if (!Blast.isEdge) {
				Blast.isiOS = ua.os == 'ios';
				Blast.isWebview = ua.webview;
				Blast.isChrome = ua.family == 'chrome';
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
		r_package = require(__dirname + '/../package.json');

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
		temp = r_package.version.split('.');

		// Interpret the numbers
		version = {
			major : parseInt(temp[0]),
			minor : parseInt(temp[1]),
			patch : parseInt(temp[2])
		};

		fs = require('fs');

		Blast.version = version;
		Blast.version_string = r_package.version;
		Blast.ACTIVE_FILE = Symbol('active_file');
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
					} else {
						// The other version has a lower patch
						if (ctx.__Protoblast.loaded_versions[Blast.version]) {
							return ctx.__Protoblast.loaded_versions[Blast.version];
						} else {
							Blast.Classes = Object.create(ctx.__Protoblast.Classes);
							class_reset = true;
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

		Blast.loaded_versions[Blast.version] = Blast;
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
	Blast.extra_files = extras = [];

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
		'State',
		'Request',
		'FunctionQueue',
		'Iterator',
		'Deck',
		'JSON',
		'JSONPath',
		'Magic',
		'Math',
		'Map',
		'Pledge',
		'SeededRng',
		'Number',
		'RegExp',
		'String',
		'RURL',
		'Cache'
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
	 * Function's should really have a name property,
	 * this is not yet implemented in IE9, IE10 or IE11.
	 * Because this is so important to Protoblast,
	 * it's always added to the prototype.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.7.0
	 *
	 * @return   {String}
	 */
	Blast.defineGet(Function.prototype, 'name', function name() {

		var fncName;

		if (this._name) {
			return this._name;
		}

		// Turn the function into a string and extract the name using a regex
		fncName = this.toString().match(/^\s*function\s*(\S*?)\s*\(/);

		// If no name is found, use an empty string
		if (!fncName || !fncName[1]) {
			fncName = '';
		} else {
			fncName = fncName[1];
		}

		// Store the name property on the function itself
		this._name = fncName;

		// Return the name
		return fncName;
	});

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
	 * @version   0.7.0
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
	let os = require('os'),
	    tmpdir = fs.mkdtempSync(libpath.resolve(os.tmpdir(), 'protoblast')),
	    cache = {};

	/**
	 * Server side: create client side file
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.1
	 * @version   0.7.0
	 *
	 * @param     {Object}   options
	 *
	 * @return    {Pledge}
	 */
	Blast.getClientPath = function getClientPath(options) {

		var refresh = false,
		    ua,
		    id;

		if (!options) {
			options = {};
		} else {
			if (options.ua) {
				ua = Blast.parseUseragent(options.ua);
				id = ua.family + '-' + ua.major + '.' + ua.minor;
			}

			if (options.refresh) {
				refresh = true;
			}
		}

		if (!id) {
			id = 'full';
		}

		if (options.use_common) {
			id = 'common_' + id;
		} else if (options.modify_prototypes) {
			id = 'global_' + id;
		}

		if (cache[id] && !refresh) {
			return cache[id];
		}

		let extra_files = [],
		    compose_id = '',
		    extra,
		    i;

		// Now iterate over the extras
		for (i = 0; i < extras.length; i++) {
			extra = extras[i];

			if (!extra.client) {
				continue;
			}

			// See if we've been given a useragent
			if (ua && extra.versions && id != 'full' && id != 'full_common') {
				let entry = extra.versions[ua.family];

				// If the user's browser version is higher than the required max,
				// it is also not needed
				if (entry && ua.version.float > entry.max) {
					continue;
				}
			}

			extra_files.push(extra);
			compose_id += i + '-';
		}

		compose_id = Blast.Bound.Object.checksum(compose_id);

		if (cache[compose_id] && !refresh) {
			cache[id] = cache[compose_id];
			return cache[id];
		}

		let files = [
			'init',
			'json-dry',
			'browsershims',
			'request_browser'
		];

		let code = '',
		    tasks = [];

		// The first file should be the template
		tasks.push(Blast.getCachedFile('client.js'));

		// Queue some basic, pre-wrapped files
		files.forEach(function eachFile(name, index) {

			var path;

			name = name.toLowerCase();

			if (name == 'json-dry') {
				path = require.resolve('json-dry');
			} else {
				path = libpath.resolve(__dirname, name + '.js');
			}

			tasks.push(function getFile(next) {
				Blast.getCachedFile(path).then(function gotCode(code) {
					var data = 'require.register("' + name + '.js", function(module, exports, require){\n';
					data += code;
					data += '});\n';
					next(null, data);
				}).catch(next);
			});
		});

		extra_files.forEach(function eachExtraFile(options) {
			tasks.push(function getExtraFile(next) {
				Blast.getCachedFile(options.path).then(function gotCode(code) {

					if (options.add_wrapper !== false) {
						if (options.add_wrapper || code.slice(0, 14) != 'module.exports') {
							let data = 'module.exports = function(';

							if (options.arguments) {
								data += Blast.getArgumentConfiguration(options.arguments).names.join(',');
							} else {
								data += 'Blast, Collection, Bound, Obj';
							}

							data += ') {';

							code = data + code + '\n};';
						}
					}

					code = 'require.register("' + (options.name_id || options.name) + '", function(module, exports, require){\n'
					     + code
					     + '});\n';

					next(null, code);

				}).catch(next);
			});
		});

		cache[id] = new Blast.Classes.Pledge();
		cache[compose_id] = cache[id];

		Blast.Bound.Function.parallel(tasks, function gotFiles(err, files) {

			if (err) {
				return cache[id].reject(err);
			}

			let template = files.shift(),
			    index = template.indexOf('//_REGISTER_//'),
			    filename = libpath.resolve(tmpdir, compose_id + '.js'),
			    code = files.join('\n');

			if (options.use_common) {
				code += '\nuse_common = true;\n';
			} else if (options.modify_prototypes) {
				code += '\nmodify_prototypes = true;\n';
			}

			let client_extras = [];

			extra_files.forEach(function eachExtraFile(options) {
				if (options.client === false || options.is_extra === false) {
					return;
				}

				client_extras.push([options.name_id, options.arguments]);
			});

			code += '\nclient_extras = ' + JSON.stringify(client_extras) + ';\n';

			template = template.slice(0, index) + code + template.slice(index);

			// Remove everything between "PROTOBLAST START CUT" and "PROTOBLAST END CUT" (with slashes)
			template = template.replace(/\/\/\s?PROTOBLAST\s?START\s?CUT([\s\S]*?)(\/\/\s?PROTOBLAST\s?END\s?CUT)/gm, '');

			let retries = 0;

			function retryWithTempdir(filename, template) {
				retries++;

				fs.mkdtemp(libpath.resolve(os.tmpdir(), 'protoblast'), function madeDir(err, result) {

					if (err) {
						return cache[id].reject(err);
					}

					tmpdir = result;
					filename = libpath.resolve(tmpdir, compose_id + '.js')

					writeFile(filename, template);
				});
			}

			function writeFile(filename, template) {
				fs.writeFile(filename, template, function written(err) {

					if (err) {

						if (retries == 0) {
							return retryWithTempdir(filename, template);
						}

						return cache[id].reject(err);
					}

					cache[id].resolve(filename);
				});
			}

			writeFile(filename, template);
		});

		return cache[id];
	};

	/**
	 * Get a file and cache it
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.7.0
	 * @version   0.7.0
	 *
	 * @param     {String}   path
	 *
	 * @return    {Promise}
	 */
	Blast.getCachedFile = function getCachedFile(path) {

		if (path[0] != '/') {
			path = libpath.resolve(__dirname, path);
		}

		return new Promise(function doReadFile(resolve, reject) {
			fs.readFile(path, 'utf8', function gotResult(err, data) {

				if (err) {
					return reject(err);
				}

				resolve(data);
			});
		});
	};
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
	 * @version   0.6.5
	 */
	function clearAndDoTasks(arr) {

		var tasks = arr.slice(0),
		    i;

		// Clear the original array
		arr.length = 0;

		for (i = 0; i < tasks.length; i++) {
			tasks[i]();
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

	//PROTOBLAST START CUT
	/**
	 * Check require call
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @version   0.6.6
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
			modulep.wrap = modulep.original_wrap;
			modulep._resolveFilename = modulep.original_resolve;

			if (options.add_wrapper !== false) {
				if (options.add_wrapper || script.slice(0, 14) != 'module.exports') {

					if (script.indexOf('__cov_') > -1 && script.indexOf('module.exports=function ') > 7) {
						// We're in coverage mode, just ignore
					} else {
						// Yes: "added_wrapper", as in "done"
						options.added_wrapper = true;

						head = 'module.exports = function(';

						if (options.arguments) {
							head += Blast.getArgumentConfiguration(options.arguments).names.join(',');
						} else {
							head += 'Blast, Collection, Bound, Obj';
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
				modulep.wrap = modulep.original_wrap;
				modulep._resolveFilename = modulep.original_resolve;
				throw err;
			}
		};
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
	 * @version   0.7.0
	 *
	 * @param     {String}   name
	 * @param     {Object}   options
	 */
	Blast.require = function _require(name, options) {

		var exported_module,
		    exported_fnc,
		    from_core,
		    result,
		    index,
		    args;

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

		index = extras.push(options) - 1;

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
		if (!options.path) {
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
		exported_fnc = require(options.path || name);

		if (options.arguments) {
			args = Blast.getArgumentConfiguration(options.arguments).values;
		} else {
			args = [Blast, Collection, Blast.Bound, Blast.Bound.Object];
		}

		if (typeof exported_fnc != 'function') {
			if (Blast.isNode) {
				Blast[Blast.ACTIVE_FILE] = false;
			}
			throw new Error('Module "' + (options.path || name) + '" did not export a function');
		}

		// Execute the exported function
		result = exported_fnc.apply(null, args);

		if (Blast.isNode) {
			Blast[Blast.ACTIVE_FILE] = false;
		}

		if (result != null) {
			return result;
		}

		//PROTOBLAST START CUT
		if (require.cache) {
			// Try getting the actual exported module
			exported_module = require.cache[options.path || name];

			if (!exported_module) {
				return;
			}

			return exported_module.exports;
		}
		//PROTOBLAST END CUT
	};

	Blast.require('symbol', {
		server   : false,
		versions : {
			chrome    : {max: 37},
			edge      : {max: 0},
			firefox   : {max: 35},
			opera     : {max: 24},
			safari    : {max: 8}
		}
	});

	// Make sure WeakMap is available first!
	Blast.require('weakmap', {
		server   : false,
		versions : {
			chrome    : {max: 35},
			edge      : {max: 0},
			firefox   : {max: 5},
			opera     : {max: 22},
			safari    : {max: 7}
		}
	});

	// Load the inheritance methods
	Blast.require('function_inheritance', {is_extra: false});

	// Load the predefined decorators
	Blast.require('function_decorators', {is_extra: false});

	// Require the scripts
	Names.forEach(function eachName(name) {

		var options = {
			// These are core files, don't add to extra
			is_extra    : false,

			// Core files are already wrapped
			add_wrapper : null
		};

		name = name.toLowerCase();

		if (name == 'jsonpath') {
			options.strict = false;
		}

		Blast.require(name, options);
	});

	// Turn Blast into an event emitter
	Blast.Collection.Object.inject(BlastClass.prototype, Blast.Classes.Informer.prototype);

	Blast.require('string_entities', {add_wrapper: false, is_extra: false});
	Blast.require('function_flow', {add_wrapper: false, is_extra: false});
	Blast.require('setimmediate', {add_wrapper: false, is_extra: false});
	Blast.require('inflections', {add_wrapper: false, is_extra: false});
	Blast.require('date_format', {add_wrapper: false, is_extra: false});
	Blast.require('diacritics', {add_wrapper: false, is_extra: false});
	Blast.require('benchmark', {add_wrapper: false, is_extra: false});
	Blast.require('sorting', {add_wrapper: false, is_extra: false});

	Blast._fn_token_prepare();
	Blast.emit('pre-extra-files');

	if (Blast.isBrowser) {
		Blast.require('browsershims');
		Blast.require('request_browser');
	}

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