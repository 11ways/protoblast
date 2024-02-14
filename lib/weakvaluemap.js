const DATA = Symbol('data');

/**
 * The WeakValueMap Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
const WeakValueMap = Fn.inherits(null, function WeakValueMap(entries) {

	// The actual data
	this[DATA] = new Map();

	if (entries) {
		for (const [key, val] of entries) {
			this[DATA].set(key, new WeakRef(val));
		}
	}
});

/**
 * Remove all the values from the map
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
WeakValueMap.setMethod(function clear() {
	this[DATA].clear();
});

/**
 * Delete an entry from the map by its key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
WeakValueMap.setMethod('delete', function _delete(key) {
	let has = this.has(key);
	this[DATA].delete(key);
	return has;
});

/**
 * Check if the map contains a key (that is still referenced)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
WeakValueMap.setMethod(function has(key) {
	return !!this[DATA].get(key)?.deref();
});

/**
 * Get the value for a key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
WeakValueMap.setMethod(function get(key) {

	let ref = this[DATA].get(key);

	if (ref) {

		let val = ref.deref();

		if (val) {
			return val;
		}

		this[DATA].delete(key);
	}
});

/**
 * Set an entry in the map
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
WeakValueMap.setMethod(function set(key, value) {

	if (!value || typeof value != 'object') {
		throw new Error('WeakValueMap can only store objects');
	}

	this[DATA].set(key, new WeakRef(value));
	return this;
});

/**
 * Get an iterator
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.9.0
 */
WeakValueMap.setMethod(function *entries() {
	for (const [key, value] of this[DATA].entries()) {
		const inner = value.deref();

		if (inner) {
			yield [key, inner];
		} else {
			this[DATA].delete(key);
		}
	}
});

/**
 * Get an iterator for the keys
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.8.8
 */
WeakValueMap.setMethod(function *keys() {
	for (const [key, value] of this) {
		yield key;
	}
});

/**
 * Get an iterator for the values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.8.8
 */
WeakValueMap.setMethod(function *values() {
	for (const [key, value] of this) {
		yield value;
	}
});

/**
 * Set the iterable symbol
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.8
 * @version  0.8.8
 */
WeakValueMap.setMethod(Symbol.iterator, function entries() {
	return this.entries();
});