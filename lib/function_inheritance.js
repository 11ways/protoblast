module.exports = function BlastInheritance(Blast, Collection) {

	var protoPrepareStaticProperty,
	    protoSetStaticProperty,
	    protoPrepareProperty,
	    protoSetProperty,
	    protoSetStatic,
	    protoSetMethod,
	    staticChain,
	    protoExtend;

	/**
	 * Add a static method/property to the staticChain.
	 * This way, inherited classes can inherit static functions, too
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   newConstructor
	 * @param    {String}     key
	 * @param    {Object}     descriptor
	 */
	function addToStaticChain(newConstructor, key, descriptor) {

		var chain;

		if (newConstructor.staticChain) {
			chain = newConstructor.staticChain;
		} else {
			chain = {};
			Blast.defineValue(newConstructor, 'staticChain', chain);
		}

		chain[key] = descriptor;
	}

	/**
	 * Make one class inherit from the other
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {Function}   newConstructor
	 *
	 * @return   {Function}   newConstructor
	 */
	Blast.defineStatic('Function', 'inherits', function inherits(_newConstructor, _superConstructor) {

		var superConstructor = _superConstructor,
		    newConstructor = _newConstructor,
		    multiple,
		    names,
		    proto,
		    chain,
		    key,
		    i;

		if (typeof newConstructor === 'string') {
			names = [];

			// Get all the names
			for (i = 0; i < arguments.length; i++) {
				if (typeof arguments[i] === 'string') {
					names.push(arguments[i]);
				} else {
					newConstructor = arguments[i];
					break;
				}
			}
		};

		if (Array.isArray(newConstructor)) {
			names = newConstructor;
			newConstructor = _superConstructor;
		}

		if (Array.isArray(names)) {

			for (i = 0; i < names.length; i++) {

				// If one of the classes isn't available, schedule it for later
				if (typeof Blast.Globals[names[i]] !== 'function' && typeof Blast.Classes[names[i]] !== 'function') {
					Blast.once({type: 'extended', descendant: names[i]}, function whenClassAvailable() {

						var oldProto = newConstructor.prototype,
						    arr,
						    i;

						inherits(names, newConstructor);

						if (!oldProto.waitingForClass || !oldProto.hasOwnProperty('waitingForClass')) return;

						for (i = 0; i < oldProto.waitingMethods.length; i++) {
							arr = oldProto.waitingMethods[i];
							newConstructor.setMethod(arr[0], arr[1]);
						}

						for (i = 0; i < oldProto.waitingProperties.length; i++) {
							arr = oldProto.waitingProperties[i];
							Object.defineProperty(newConstructor.prototype, arr[0], arr[1]);
						}
					});

					// Set this on the current prototype
					newConstructor.prototype.waitingForClass = true;
					newConstructor.prototype.waitingMethods = [];
					newConstructor.prototype.waitingProperties = [];

					return newConstructor;
				}
			}

			// Everything is available, iterate again
			for (i = 0; i < names.length; i++) {

				if (typeof Blast.Classes[names[i]] === 'function') {
					superConstructor = Blast.Classes[names[i]];
				} else {
					superConstructor = Blast.Globals[names[i]];
				}

				inherits(newConstructor, superConstructor);
			}

			return newConstructor;
		}

		if (typeof newConstructor !== 'function') {
			throw new Error('Only functions can inherit from another function');
		}

		if (superConstructor) {

			if (superConstructor.staticChain) {
				chain = superConstructor.staticChain;

				for (key in chain) {
					Object.defineProperty(newConstructor, key, chain[key]);
				}

				if (newConstructor.staticChain) {
					Collection.Object.inject(newConstructor.staticChain, chain);
				} else {
					newConstructor.staticChain = Object.create(chain);
				}
			}

			// See if newConstructor has already inherited something.
			// In that case this becomes multiple inheritance.
			multiple = typeof newConstructor.super === 'function';

			// Set the super value
			Blast.defineValue(newConstructor, 'super', superConstructor);

			// In multiple inheritance the current and new prototypes must be used
			if (multiple) {
				proto = Object.create(newConstructor.prototype);
				Collection.Object.inject(proto, superConstructor.prototype);
			} else {
				proto = superConstructor.prototype;
			}

			// Inherit the prototype content
			newConstructor.prototype = Object.create(proto, {
				constructor: {
					value: newConstructor,
					enumerable: false,
					writable: true,
					configurable: true
				}
			});
		} else {
			superConstructor = Function;
		}

		// See if `setMethod` is available, if not this means
		// Protoblast was loaded without modifying the native objects
		// So we add it to this extended class' constructor
		if (typeof newConstructor.setMethod !== 'function') {
			Blast.defineValue(newConstructor, 'prepareStaticProperty', protoPrepareStaticProperty);
			Blast.defineValue(newConstructor, 'setStaticProperty', protoSetStaticProperty);
			Blast.defineValue(newConstructor, 'prepareProperty', protoPrepareProperty);
			Blast.defineValue(newConstructor, 'setProperty', protoSetProperty);
			Blast.defineValue(newConstructor, 'setStatic', protoSetStatic);
			Blast.defineValue(newConstructor, 'setMethod', protoSetMethod);
			Blast.defineValue(newConstructor, 'extend', protoExtend);
		}

		// Store the new class in Blast
		Blast.Classes[newConstructor.name] = newConstructor;

		if (Blast.emit) {
			Blast.emit({type: 'extended', ancestor: superConstructor.name, descendant: newConstructor.name});
		}

		return newConstructor;
	});

	/**
	 * Set a static method on the given constructor.
	 * Can also be used to set a static property. This won't fire an error
	 * when not given a function, unlike setMethod
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   target       Target object/function to use
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _value       The value to set
	 */
	Blast.defineStatic('Function', 'setStatic', function setStatic(target, _key, _value) {

		var enumerable,
		    descriptor,
		    target,
		    value,
		    keys,
		    i;

		enumerable = false;

		if (typeof _key === 'function') {
			value = _key;
			keys = Collection.Array.cast(value.name || undefined);
		} else {
			keys = Collection.Array.cast(_key);
			value = _value;
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Static property must be set to a valid key');
		}

		descriptor = {value: value, enumerable: enumerable};

		for (i = 0; i < keys.length; i++) {
			addToStaticChain(target, keys[i], descriptor);
			Object.defineProperty(target, keys[i], descriptor);
		}
	});

	/**
	 * Set a static getter property
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   target       Target object/function to use
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value OR value
	 * @param    {Function}   _setter      Function that sets the value
	 */
	Blast.defineStatic('Function', 'setStaticProperty', function setStaticProperty(target, _key, _getter, _setter) {

		var enumerable,
		    existing,
		    getter,
		    setter,
		    config,
		    proto,
		    keys,
		    i;

		enumerable = false;

		if (typeof _key === 'function') {
			setter = _getter;
			getter = _key;
			keys = Collection.Array.cast(getter.name || undefined);
		} else {
			setter = _setter;
			getter = _getter;
			keys = Collection.Array.cast(_key);
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Static property must be set to a valid key');
		}

		if (typeof getter == 'function') {
			config = {
				get: getter,
				set: setter,
				enumerable: enumerable
			};
		} else {
			config = {
				value: getter,
				enumerable: enumerable
			};
		}

		for (i = 0; i < keys.length; i++) {
			addToStaticChain(target, keys[i], config);
			Object.defineProperty(target, keys[i], config);
		}
	});

	/**
	 * Set a prototype method on the given constructor
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {Function}   constructor  Constructor to modify prototype of
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _method      The method to set
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'setMethod', function setMethod(constructor, _key, _method) {

		var existing,
		    method,
		    keys,
		    i;

		if (typeof constructor !== 'function') {
			throw new Error('Only functions can get prototype methods');
		}

		if (typeof _key === 'function') {
			method = _key;
			keys = Collection.Array.cast(method.name || undefined);
		} else {
			method = _method;
			keys = Collection.Array.cast(_key);
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Method must be set to a valid key');
		}

		for (i = 0; i < keys.length; i++) {

			// Set a super reference only for the first given method
			if (i == 0) {
				// Get a possible existing value
				existing = constructor.prototype[keys[0]];

				// If there already was something here, set it as this method's parent
				if (typeof existing !== 'undefined') {
					Blast.defineValue(method, 'super', existing);
				}
			}

			// If this constructor is waiting on another class
			if (constructor.prototype.waitingForClass && constructor.prototype.hasOwnProperty('waitingForClass')) {
				constructor.prototype.waitingMethods.push([keys, method]);
				constructor.prototype[keys[i]] = method;
				continue;
			}

			// Now set the method on the prototype
			Blast.defineValue(constructor.prototype, keys[i], method);
		}

		return method;
	});

	/**
	 * Set a getter on the given prototype, or a simple value
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   constructor  Constructor to modify prototype of
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value OR value
	 * @param    {Function}   _setter      Function that sets the value
	 */
	Blast.defineStatic('Function', 'setProperty', function setProperty(constructor, _key, _getter, _setter) {

		var enumerable,
		    existing,
		    getter,
		    setter,
		    target,
		    config,
		    proto,
		    keys,
		    i;

		if (typeof constructor == 'function') {
			target = constructor.prototype;
			proto = true;
			enumerable = false;
		} else {
			target = constructor;
			enumerable = true;
		}

		if (typeof _key === 'function') {
			setter = _getter;
			getter = _key;
			keys = Collection.Array.cast(getter.name || undefined);
		} else {
			setter = _setter;
			getter = _getter;
			keys = Collection.Array.cast(_key);
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Property must be set to a valid key');
		}

		if (typeof getter == 'function') {
			config = {
				get: getter,
				set: setter,
				enumerable: enumerable
			};
		} else {
			config = {
				value: getter,
				enumerable: enumerable,
				writable: true
			};
		}

		for (i = 0; i < keys.length; i++) {

			// If the target is still waiting on another class to extend
			if (target.waitingForClass && target.hasOwnProperty('waitingForClass')) {
				target.waitingProperties.push([keys[i], config]);
			}

			Object.defineProperty(target, keys[i], config);
		}
	});

	/**
	 * Prepare a property:
	 * the getter will supply the value on first get
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   target       Target object or function
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value
	 */
	Blast.defineStatic('Function', 'prepareProperty', function prepareProperty(target, _key, _getter, _enumerable) {

		var enumerable,
		    descriptor,
		    definer,
		    getter,
		    target,
		    config,
		    keys,
		    i;

		if (typeof _key === 'function') {
			enumerable = _getter;
			getter = _key;
			keys = Collection.Array.cast(getter.name || undefined);
		} else {
			enumerable = _enumerable;
			getter = _getter;
			keys = Collection.Array.cast(_key);
		}

		if (typeof enumerable == 'undefined') {
			enumerable = false;
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Property must be set to a valid key');
		}

		if (typeof getter !== 'function') {
			throw new Error('Getter must be a valid function');
		}

		// The function that redefined the value property
		definer = function definer(overrideValue) {

			// Get the initial value
			if (arguments.length === 0) {
				overrideValue = getter.call(this);
			}

			// Override the property
			for (i = 0; i < keys.length; i++) {
				Object.defineProperty(this, keys[i], {
					value: overrideValue,
					enumerable: enumerable
				});
			}

			return overrideValue;
		};

		// Set the definer function as a configurable property
		// (It'll overwrite itself on first call)
		descriptor = {
			get: definer,
			set: definer,
			enumerable: enumerable,
			configurable: true
		};

		for (i = 0; i < keys.length; i++) {

			if (typeof target === 'function') {
				addToStaticChain(target, keys[i], descriptor);
			}

			// If the target is still waiting on another class to extend
			if (target.waitingForClass && target.hasOwnProperty('waitingForClass')) {
				target.waitingProperties.push([target, keys[i], descriptor]);
			}

			Object.defineProperty(target, keys[i], descriptor);
		}
	});

	/**
	 * Inherit from the function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Function}   newConstructor
	 *
	 * @return   {Function}   newConstructor
	 */
	protoExtend = function extend(newConstructor) {
		return Blast.Collection.Function.inherits(newConstructor, this);
	};

	Blast.definePrototype('Function', 'extend', protoExtend);

	/**
	 * Set a static method/property
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   value       The value to set
	 */
	protoSetStatic = function setStatic(key, value) {
		return Blast.Collection.Function.setStatic(this, key, value);
	};

	/**
	 * Set a static getter property
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   getter      Function that returns a value OR value
	 * @param    {Function}   setter      Function that sets the value
	 */
	protoSetStaticProperty = function setStaticProperty(key, getter, setter) {
		return Blast.Collection.Function.setStaticProperty(this, key, getter, setter);
	};

	/**
	 * Set a prototype method
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}     key
	 * @param    {Function}   method
	 */
	protoSetMethod = function setMethod(key, method) {
		return Blast.Collection.Function.setMethod(this, key, method);
	};

	/**
	 * Set a prototype property
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key
	 * @param    {Function}   getter
	 * @param    {Function}   setter
	 */
	protoSetProperty = function setProperty(key, getter, setter) {
		return Blast.Collection.Function.setProperty(this, key, getter, setter);
	};

	/**
	 * Prepare a property:
	 * the getter will supply the value on first get
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   getter      Function that returns a value
	 */
	protoPrepareProperty = function prepareProperty(key, getter) {
		return Blast.Collection.Function.prepareProperty(this.prototype, key, getter);
	};

	/**
	 * Prepare a static property:
	 * the getter will supply the value on first get
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   getter      Function that returns a value
	 */
	protoPrepareStaticProperty = function prepareStaticProperty(key, getter) {
		return Blast.Collection.Function.prepareProperty(this, key, getter);
	};

	Blast.definePrototype('Function', 'prepareStaticProperty', protoPrepareStaticProperty);
	Blast.definePrototype('Function', 'setStaticProperty', protoSetStaticProperty);
	Blast.definePrototype('Function', 'prepareProperty', protoPrepareProperty);
	Blast.definePrototype('Function', 'setProperty', protoSetProperty);
	Blast.definePrototype('Function', 'setStatic', protoSetStatic);
	Blast.definePrototype('Function', 'setMethod', protoSetMethod);
};