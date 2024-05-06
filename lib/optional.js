const VALUE = Symbol('value'),
      LISTENERS = Symbol('listeners'),
      TEARDOWNS = Symbol('teardowns'),
      STATE = Symbol('state'),
      IDLE = 0,
      TEARING_DOWN = 1,
      CHANGING = 2;

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
	return this.setValue(new_value);
});

/**
 * Set a new value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   new_value
 */
Optional.setMethod(function setValue(new_value) {
	this[VALUE] = new_value;
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

/**
 * The observable version of the optional value
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   value
 */
const ObservableOptional = Fn.inherits('Develry.Optional', function ObservableOptional(value) {
	this[VALUE] = value;
	this[LISTENERS] = null;
	this[TEARDOWNS] = null;
	this[STATE] = IDLE;
});

/**
 * Set a new value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   new_value
 */
ObservableOptional.setMethod(function setValue(new_value) {
	try {
		actuallySetValue(this, new_value);
	} finally {
		this[STATE] = IDLE;
	}
});

/**
 * Actually set the value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   new_value
 */
const actuallySetValue = (target, new_value) => {

	// If the value did not change, return
	if (target[VALUE] === new_value) {
		return;
	}

	const old_value = target[VALUE];
	target[VALUE] = new_value;

	// If we're already in the process of changing, return
	if (target[STATE] > IDLE) {
		return;
	}

	target[STATE] = TEARING_DOWN;

	while (target[TEARDOWNS]?.length) {
		target[TEARDOWNS].shift()(new_value, old_value);
	}

	target[STATE] = CHANGING;

	let listeners = target[LISTENERS];

	if (listeners?.size) {

		let teardowns = [],
		    teardown,
		    listener;

		for (listener of listeners) {
			teardown = listener(new_value);

			if (teardown && typeof teardown == 'function') {
				teardowns.push(teardown);
			}
		}

		target[TEARDOWNS] = teardowns;
	}
};

/**
 * Add a listener
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Function}   callback
 */
ObservableOptional.setMethod(function addListener(callback) {

	if (!this[LISTENERS]) {
		this[LISTENERS] = new Set();
	}

	this[LISTENERS].add(callback);
});

/**
 * Remove a listener
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Function}   callback
 */
ObservableOptional.setMethod(function removeListener(callback) {
	
	if (!this[LISTENERS]) {
		return;
	}

	this[LISTENERS].delete(callback);
});