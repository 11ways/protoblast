const REF_SET = Symbol('refs'),
      REF_MAP = Symbol('ref_map');

/**
 * The WeakValueSetMap Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
const WeakValueSet = Fn.inherits(Set, function WeakValueSet(entries) {

	// Keep track of values to their refs
	this[REF_MAP] = new WeakMap();

	// The actual set of WeakRefs
	this[REF_SET] = new Set();

	if (entries) {
		for (const val of entries) {
			this.add(val);
		}
	}
});

/**
 * Get the current size of the set
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setProperty(function size() {

	let to_remove,
	    count = 0,
	    ref;

	for (ref of this[REF_SET]) {

		if (!ref.deref()) {
			if (!to_remove) {
				to_remove = [];
			}

			to_remove.push(ref);
			continue;
		}

		count++;
	}

	if (to_remove) {
		for (ref of to_remove) {
			this[REF_SET].delete(ref);
		}
	}

	return count;
});

/**
 * Remove all the values from the set
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setMethod(function clear() {
	this[REF_MAP] = new WeakMap();
	this[REF_SET].clear();
});

/**
 * Delete an entry from the set
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setMethod('delete', function _delete(value) {
	let ref = this[REF_MAP].get(value);

	if (!ref) {
		return false;
	}

	this[REF_MAP].delete(value);

	return this[REF_SET].delete(ref);
});

/**
 * Check if the set contains a value (that is still referenced)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setMethod(function has(value) {

	let ref = this[REF_MAP].get(value);

	if (!ref) {
		return false;
	}

	let result = ref.deref();

	if (result) {
		return true;
	}

	this[REF_SET].delete(ref);

	return false;
});

/**
* Add a value to the set
*
* @author   Jelle De Loecker <jelle@elevenways.be>
* @since    0.9.0
* @version  0.9.0
*/
WeakValueSet.setMethod(function add(value) {

	if (!value || typeof value != 'object') {
		throw new Error('WeakValueSet can only store objects');
	}

	if (this.has(value)) {
		return this;
	}

	let ref = new WeakRef(value);

	this[REF_MAP].set(value, ref);
	this[REF_SET].add(ref);

	return this;
});

/**
 * Get an iterator
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setMethod(['keys', 'entries', 'values'], function *entries() {
	for (const ref of this[REF_SET]) {
		const inner = ref.deref();

		if (inner) {
			yield inner;
		} else {
			this[REF_SET].delete(ref);
		}
	}
});

/**
 * Executes a provided function once for each value in this set
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setMethod(function forEach(callback, context) {
	for (const value of this) {
		callback.call(context, value, value, this);
	}
});

/**
 * Set the iterable symbol
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSet.setMethod(Symbol.iterator, function entries() {
	return this.entries();
});