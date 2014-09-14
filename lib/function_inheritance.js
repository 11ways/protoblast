module.exports = function BlastInheritance(Blast, Collection) {

	var protoSetMethod,
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
	 * @version  0.1.3
	 *
	 * @param    {String}     key
	 * @param    {Function}   method
	 *
	 * @return   {Function}   method
	 */
	Blast.defineStatic('Function', 'setMethod', function inherits(constructor, key, method) {

		var existing;

		if (typeof constructor !== 'function') {
			throw new Error('Only functions can get prototype methods');
		}

		if (typeof key === 'function') {
			method = key;
			key = method.name;
		}

		if (typeof key === 'undefined' || !key) {
			throw new Error('Method must be set to a valid key');
		}

		// Get a possible existing value
		existing = constructor.prototype[key];

		// If there already was something here, set it as this method's parent
		if (typeof existing !== 'undefined') {
			Blast.defineValue(method, 'super', existing);
		}

		// Now set the method on the prototype
		Blast.defineValue(constructor.prototype, key, method);

		return method;
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

	Blast.definePrototype('Function', 'setMethod', protoSetMethod);
}