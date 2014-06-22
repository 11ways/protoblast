module.exports = function BlastInit(modifyPrototype) {

	// Create the Blast object
	var Blast = {},
	    Collection,
	    Globals,
	    Names;

	// See if we can modify class prototypes
	if (typeof modifyPrototype === 'undefined') {
		modifyPrototype = true;
	}

	if (typeof window !== 'undefined') {
		Globals = window;
	} else {
		Globals = global;
	}

	Blast.Globals = Globals;

	// Maybe we can return an existing protoblast collection
	if (Globals.__Protoblast) {
		// If we don't have to modify the prototype, or if it's already done, return the existing collection
		if (!modifyPrototype || (modifyPrototype && Globals.__Protoblast.modifyPrototype)) {
			return Globals.__Protoblast;
		}
	}

	Globals.__Protoblast = Blast;

	Names = [
		'Array',
		'Boolean',
		'Date',
		'Error',
		'Function',
		'JSON',
		'Math',
		'Number',
		'Object',
		'RegExp',
		'String'
	];

	Blast.modifyPrototype = modifyPrototype;

	// Class references go here
	Blast.Classes = {
		Object: Object
	};

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
	 * Define a non-enumerable property
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object}   target   The object to add the property to
	 * @param     {String}   name     The name of the property
	 * @param     {Object}   value    The value of the property
	 */
	Blast.defineProperty(Collection.Object, 'defineValue', {
		value: function defineValue(target, name, value, enumerable) {

			if (typeof enumerable == 'undefined') {
				enumerable = false;
			}

			Object.defineProperty(target, name, {
				value: value,
				enumerable: enumerable,
				configurable: false,
				writeable: false
			});
		}
	});

	Blast.defineValue = Collection.Object.defineValue;

	if (modifyPrototype) {
		Blast.defineValue(Object, 'defineValue', Blast.defineValue);
	}

	/**
	 * Define a prototype value
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
	Blast.definePrototype = function definePrototype(targetClass, name, value, shim) {

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

			if (!targetClass.prototype) {
				targetClass.prototype = {};
			}

			// Only set if it's not a shim, or if it's not there
			if (!shim || !(targetClass.prototype[name] && targetClass.prototype.hasOwnProperty(name))) {
				Blast.defineValue(targetClass.prototype, name, value);
			}
		}

		if (objTarget) {

			if (!objTarget.prototype) {
				objTarget.prototype = {};
			}

			// If this is only a shim, and it already exists on the real class, use that
			if (shim && targetClass.prototype[name]) {
				Blast.defineValue(objTarget.prototype, name, targetClass.prototype[name], true);
			} else {
				Blast.defineValue(objTarget.prototype, name, value, true);
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
	Blast.defineStatic = function definePrototype(targetClass, name, value, shim) {

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
			result = JSON.stringify(variable);
		}

		return result;
	};

	/**
	 * Server side: create client side file
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.1
	 * @version   0.1.1
	 *
	 * @return    {String}
	 */
	Blast.getClientPath = function getClientPath() {

		var template,
		    result,
		    code,
		    temp,
		    id,
		    fs;

		if (Blast.clientPath) {
			return Blast.clientPath;
		}

		// Require fs
		fs = require('fs');

		// Get the main template
		template = fs.readFileSync(__dirname + '/client.js', {encoding: 'utf8'});

		code = '';

		Names.forEach(function(name, index) {

			name = name.toLowerCase();

			temp = fs.readFileSync(__dirname + '/' + name + '.js', {encoding: 'utf8'});

			code += 'require.register("' + name + '.js", function(module, exports, require){\n';
			code += temp;
			code += '});\n';

		});

		id = template.indexOf('//_REGISTER_//');

		template = template.slice(0, id) + code + template.slice(id);

		fs.writeFileSync(__dirname + '/../client-file.js', template);

		Blast.clientPath = __dirname + '/../client-file.js';

		return Blast.clientPath;
	};

	// Require the scripts
	Names.forEach(function(name) {
		name = name.toLowerCase();
		require('./' + name + '.js')(Blast, Collection);
	});

	require('./inflections.js')(Blast, Collection);
	require('./diacritics.js')(Blast, Collection);
	require('./misc.js')(Blast, Collection);

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

	return Blast;
};