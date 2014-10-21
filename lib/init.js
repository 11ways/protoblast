module.exports = function BlastInit(modifyPrototype) {

	var BlastClass,
	    Collection,
	    Globals,
	    Names,
	    Blast,
	    key;

	BlastClass = function BlastClass(){};
	Blast = new BlastClass();

	Blast.isBrowser = false;
	Blast.isNode = false;
	Blast.__init = BlastInit;

	// See if we can modify class prototypes
	if (typeof modifyPrototype === 'undefined') {
		modifyPrototype = true;
	}

	if (typeof window !== 'undefined') {
		Globals = window;
		Blast.isBrowser = true;
	} else {
		Globals = global;
		Blast.isNode = true;
	}

	Blast.Globals = Globals;

	// Maybe we can return an existing protoblast collection
	if (Globals.__Protoblast) {
		// If we don't have to modify the prototype, or if it's already done, return the existing collection
		if (!modifyPrototype || (modifyPrototype && Globals.__Protoblast.modifyPrototype)) {
			return Globals.__Protoblast;
		} else {
			Blast = Globals.__Protoblast;
		}
	}

	Globals.__Protoblast = Blast;

	Names = [
		'Array',
		'Boolean',
		'Date',
		'Error',
		'Function',
		'Iterator',
		'Informer',
		'Deck',
		'JSON',
		'JSONPath',
		'Math',
		'Number',
		'Object',
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
	Blast.Collection = {
		Object: {}
	};

	Collection = Blast.Collection;

	Blast.Bound = {};

	/**
	 * Add the defineProperty method if it doesn't exist yet,
	 * this will only support .value setters
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.4
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
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
	 * Define a class constructor
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.2
	 * @version   0.1.2
	 */
	Blast.defineClass = function defineClass(className, constructor, shim) {

		var objTarget;

		if (shim && Globals[className]) {
			Blast.Classes[className] = Globals[className];
		} else {
			Blast.Classes[className] = constructor;

			if (Blast.modifyPrototype) {
				Globals[className] = constructor;
			}
		}
	};

	/**
	 * Define a global
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.3
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
		}

		if (Blast.modifyPrototype) {

			if (!targetClass.prototype) {
				targetClass.prototype = {};
			}

			// Only set if it's not a shim, or if it's not there
			if (!shim || !(targetClass.prototype[name] && targetClass.prototype.hasOwnProperty(name))) {
				definer(targetClass.prototype, name, value);
			}
		}

		if (objTarget) {

			if (!objTarget.prototype) {
				objTarget.prototype = {};
			}

			// If this is only a shim, and it already exists on the real class, use that
			if (shim && targetClass.prototype && targetClass.prototype[name]) {
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {Object}   value    The value of the property
	 * @param     {Boolean}  shim     Only set value if it's not already there
	 */
	Blast.defineStatic = function defineStatic(targetClass, name, value, shim) {

		var objTarget,
		    className;

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
		}

		if (Blast.modifyPrototype) {
			
			// Only set if it's not a shim, or if it's not there
			if (!shim || !targetClass[name]) {
				Blast.defineValue(targetClass, name, value);
			}
		}

		if (objTarget) {
			// If this is only a shim, and it already exists on the real class, use that
			if (shim && targetClass[name]) {
				Blast.defineValue(objTarget, name, targetClass[name], true);
			} else {
				Blast.defineValue(objTarget, name, value, true);
			}
		}
	};

	/**
	 * Return a string representing the source code of the given variable.
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.1
	 * @version   0.1.1
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
			'function_flow',
			'function_inheritance',
			'benchmark',
			'misc',
			'string_compression',
			'string_compressed_entities',
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

		fs.writeFileSync(cpath, template);

		return cpath;
	};

	var whenReady = [];

	/**
	 * Execute function after Blast has been completely defined.
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.2
	 * @version   0.1.2
	 *
	 * @param     {Function}   fnc
	 */
	Blast.ready = function ready(fnc) {
		if (whenReady) {
			whenReady.push(fnc);
		} else {
			fnc();
		}
	};

	// Load the inheritance methods
	require('./function_inheritance.js')(Blast, Collection);

	// Require the scripts
	Names.forEach(function(name) {
		name = name.toLowerCase();
		require('./' + name + '.js')(Blast, Collection);
	});

	// Turn Blast into an event emitter
	Blast.Collection.Object.inject(BlastClass.prototype, Blast.Classes.Informer.prototype);

	require('./string_compression.js')(Blast, Collection);
	require('./string_entities.js')(Blast, Collection);
	require('./function_flow.js')(Blast, Collection);
	require('./setimmediate.js')(Blast, Collection);
	require('./inflections.js')(Blast, Collection);
	require('./diacritics.js')(Blast, Collection);
	require('./benchmark.js')(Blast, Collection);
	require('./sorting.js')(Blast, Collection);
	require('./misc.js')(Blast, Collection);

	if (Blast.isBrowser) {
		require('./browsershims.js')(Blast, Collection);
	}

	// Now create bound methods, which are about 0,000129 ms slower
	Collection.Object.each(Collection, function(StaticClass, className) {

		// Make sure the bound collection object exists
		if (!Blast.Bound[className]) {
			Blast.Bound[className] = {};
		}

		// Add all the static functions as-is
		Collection.Object.each(StaticClass, function(StaticFunction, functionName) {
			Blast.Bound[className][functionName] = StaticFunction;
		});

		// Add all the prototype functions (if no static version exists already)
		Collection.Object.each(StaticClass.prototype, function(PrototypeFunction, functionName) {
			Blast.Bound[className][functionName] = Collection.Function.prototype.unmethodize.call(PrototypeFunction, functionName);
		});
	});

	for (var i = 0; i < whenReady.length; i++) {
		whenReady[i]();
	}

	whenReady = false;

	return Blast;
};