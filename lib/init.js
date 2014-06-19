module.exports = function BlastInit(modifyPrototype) {

	// Create the Blast object
	var Blast = {},
	    Collection,
	    Globals;

	// See if we can modify class prototypes
	if (typeof modifyPrototype === 'undefined') {
		modifyPrototype = true;
	}

	if (typeof window !== 'undefined') {
		Globals = window;
	} else {
		Globals = global;
	}

	// Maybe we can return an existing protoblast collection
	if (Globals.__Protoblast) {
		// If we don't have to modify the prototype, or if it's already done, return the existing collection
		if (!modifyPrototype || (modifyPrototype && Globals.__Protoblast.modifyPrototype)) {
			return Globals.__Protoblast;
		}
	}

	Blast.modifyPrototype = modifyPrototype;

	// Class references
	Blast.Classes = {
		Function: Function,
		Array: Array,
		Object: Object,
		String: String,
		RegExp: RegExp,
		Number: Number,
		Date: Date
	};

	// All definitions will also be set on these objects
	Blast.Collection = {
		Function: {},
		Array: {},
		Object: {},
		String: {},
		RegExp: {},
		Number: {},
		Date: {}
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
				Blast.Classes[className] = {};
			}

			objTarget = Collection[className];
			targetClass = Blast.Classes[className];
		}

		if (Blast.modifyPrototype) {

			if (!targetClass.prototype) {
				targetClass.prototype = {};
			}

			// Only set if it's not a shim, or if it's not there
			if (!shim || !targetClass.prototype[name]) {
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
				Blast.Classes[className] = {};
			}

			objTarget = Collection[className];
			targetClass = Blast.Classes[className];
		}

		if (Blast.modifyPrototype) {
			Blast.defineValue(targetClass, name, value);

			// Only set if it's not a shim, or if it's not there
			if (!shim || !targetClass.prototype[name]) {
				Blast.defineValue(targetClass.prototype, name, value);
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


	// Require the scripts
	require('./function.js')(Blast, Collection);
	require('./object.js')(Blast, Collection);
	require('./string.js')(Blast, Collection);
	require('./date.js')(Blast, Collection);
	require('./array.js')(Blast, Collection);

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