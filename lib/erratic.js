const SUBSCRIPTIONS = Symbol('subscriptions'),
      INFORM = Symbol('inform'),
      VALUE = Symbol('value');

/**
 * The Erratic Class:
 * An observer-like class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @param    {*}   instructor
 */
const Erratic = Bound.Function.inherits(function Erratic(instructor) {
	this.instructor = instructor;
});

/**
 * Set some empty properties in the prototype
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 */
Erratic.setProperty(VALUE, undefined);
Erratic.setProperty(SUBSCRIPTIONS, undefined);

/**
 * Get the current calculated value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @return   {*}
 */
Erratic.setProperty(function value() {

	if (this[VALUE] !== undefined) {
		return this[VALUE];
	}

	if (this.instructor) {
		return this.instructor();
	}
}, function setValue(new_value) {

	if (typeof new_value == 'function') {
		throw new Error('An Erratic\'s value can not be a function');
	}

	this.instructor = new_value;
	return this[VALUE];
});

/**
 * Set the instructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @return   {*}
 */
Erratic.enforceProperty(function instructor(new_value, old_value) {

	if (typeof new_value == 'function') {
		this[VALUE] = undefined;

		let calculated = new_value.call(this);
		this[INFORM](calculated);

		return new_value;
	}

	this[VALUE] = new_value;
	this[INFORM](new_value);

	// Leave the old function in case the value is unset again
	return old_value || false;
});

/**
 * Get the current value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @return   {*}
 */
Erratic.setMethod(function valueOf() {
	return this.value;
});

/**
 * Get the current string value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @return   {*}
 */
Erratic.setMethod(function toString() {
	return this.value;
});

/**
 * Inform the new value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 */
Erratic.setMethod(INFORM, function inform(value) {

	if (!this[SUBSCRIPTIONS]) {
		return;
	}

	let is_function,
	    listener;

	for ([listener, is_function] of this[SUBSCRIPTIONS]) {
		if (is_function) {
			listener(value);
		} else {
			listener.refresh(value, this);
		}
	}
});

/**
 * Obey the given Erratic instance for changes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @param    {Erratic[]}   instances
 */
Erratic.setMethod(function obey(instances) {

	let instance;

	instances = Bound.Array.cast(instances);

	for (instance of instances) {
		instance.subscribe(this);
	}
});

/**
 * Subscribe for changes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @param    {Function|Erratic}   listener
 */
Erratic.setMethod(function subscribe(listener) {

	let is_function = typeof listener == 'function';

	if (!this[SUBSCRIPTIONS]) {
		this[SUBSCRIPTIONS] = new Map();
	}

	this[SUBSCRIPTIONS].set(listener, is_function);

	// Only inform the listener if it's a function
	if (!is_function) {
		return;
	}

	let value = this.value;

	if (value !== undefined) {
		listener(value);
	}
});

/**
 * Refresh
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 */
Erratic.setMethod(function refresh() {
	this[INFORM](this.value);
});