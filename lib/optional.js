const VALUE = Symbol('value'),
      CALLBACKS = Symbol('callbacks');

/**
 * An optional value
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   value
 */
const Optional = Fn.inherits('Develry.Placeholder', function Optional(value) {
	this[VALUE] = value;
	this[CALLBACKS] = [];
});

/**
 * Undry the value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Object}   value
 *
 * @return   {Optional}
 */
Optional.setStatic(function unDry(value) {
	let result = Object.create(this.prototype);
	result[VALUE] = value.value;
	return result;
});

/**
 * Get the current value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {*}
 */
Optional.setProperty(function value() {
	return this[VALUE];
}, function setValue(new_value) {
	this[VALUE] = new_value;

	let callbacks = this[CALLBACKS],
	    i;

	for (i = 0; i < callbacks.length; i++) {
		callbacks[i](new_value);
	}
});

/**
 * Return the serialized json-dry representation
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
Optional.setMethod(function toDry() {

	let value = {
		value: this[VALUE]
	};

	return {
		value: value
	};
});

/**
 * Add a listener
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Function}   callback
 */
Optional.setMethod(function onChange(callback) {
	this[CALLBACKS].push(callback);
});

/**
 * Is there a value present?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {boolean}
 */
Optional.setMethod(function isPresent() {
	return this[VALUE] != null;
});

/**
 * Get the current value if it is present of the given fallback value if it is not
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   fallback
 *
 * @return   {*}
 */
Optional.setMethod(function orElse(fallback) {
	
	if (this.isPresent()) {
		return this[VALUE];
	}

	return fallback;
});

/**
 * This method should return the actual value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {*}
 */
Optional.setMethod(function getResolvedValue() {
	return this[VALUE];
});