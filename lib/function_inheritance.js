module.exports = function BlastInheritance(Blast, Collection) {

	var protoSetProperty,
	    protoSetMethod,
	    protoExtend;

	/**
	 * Make one class inherit from the other
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Function}   newConstructor
	 *
	 * @return   {Function}   newConstructor
	 */
	Blast.defineStatic('Function', 'inherits', function inherits(newConstructor, superConstructor) {

		if (typeof newConstructor !== 'function') {
			throw new Error('Only functions can inherit from another function');
		}

		if (superConstructor) {
			// Set the super value
			Blast.defineValue(newConstructor, 'super', superConstructor);

			// Inherit the prototype content
			newConstructor.prototype = Object.create(superConstructor.prototype, {
				constructor: {
					value: constructor,
					enumerable: false,
					writable: true,
					configurable: true
				}
			});
		}

		// See if `setMethod` is available, if not this means
		// Protoblast was loaded without modifying the native objects
		// So we add it to this extended class' constructor
		if (typeof newConstructor.setMethod !== 'function') {
			Blast.defineValue(newConstructor, 'setProperty', protoSetProperty);
			Blast.defineValue(newConstructor, 'setMethod', protoSetMethod);
			Blast.defineValue(newConstructor, 'extend', protoExtend);
		}

		return newConstructor;
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
			keys = [method.name];
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

			// Now set the method on the prototype
			Blast.defineValue(constructor.prototype, keys[i], method);
		}

		return method;
	});

	/**
	 * Set a getter on the given prototype
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   constructor  Constructor to modify prototype of
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value
	 * @param    {Function}   _setter      Function that sets the value
	 */
	Blast.defineStatic('Function', 'setProperty', function setProperty(constructor, _key, _getter, _setter) {

		var enumerable,
		    existing,
		    getter,
		    setter,
		    target,
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
			keys = [getter.name];
		} else {
			setter = _setter;
			getter = _getter;
			keys = Collection.Array.cast(_key);
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Property must be set to a valid key');
		}

		for (i = 0; i < keys.length; i++) {
			Object.defineProperty(target, keys[i], {
				get: getter,
				set: setter,
				enumerable: enumerable
			});
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

	Blast.definePrototype('Function', 'setProperty', protoSetProperty);
	Blast.definePrototype('Function', 'setMethod', protoSetMethod);
}