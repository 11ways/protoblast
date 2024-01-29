const DATA = Symbol('data');

/**
 * The WeakValueSetMap Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
const WeakValueSetMap = Fn.inherits(null, function WeakValueSetMap(entries) {

	// The actual data
	this[DATA] = new Map();

	if (entries) {
		for (const [key, set] of entries) {
			for (const val of set) {
				this.add(key, val);
			}
		}
	}
});

/**
 * Get the current size of the map:
 * All the non-empty sets that still have references
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setProperty(function size() {

	let to_remove,
	    count = 0;

	for (const [key, set] of this[DATA]) {

		if (!set.size) {
			if (!to_remove) {
				to_remove = [];
			}

			to_remove.push(key);
			continue;
		}

		count++;
	}

	if (to_remove) {
		let key;

		for (key of to_remove) {
			this[DATA].delete(key);
		}
	}

	return count;
});

/**
 * Remove all the values from the map
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod(function clear() {
	this[DATA].clear();
});

/**
 * Delete an entry from the map by its key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod('delete', function _delete(key, value) {

	if (arguments.length == 1) {
		return this[DATA].delete(key);
	}

	let set = this.get(key);

	if (!set) {
		return false;
	}

	let result = set.delete(value);

	if (set.size == 0) {
		this[DATA].delete(key);
	}

	return result;
});

/**
 * Get the set
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {*}   key
 *
 * @return   {WeakValueSet}
 */
WeakValueSetMap.setMethod(function get(key) {
	let set = this[DATA].get(key);

	if (!set) {
		return null;
	}

	if (set.size == 0) {
		this[DATA].delete(key);
		return null;
	}

	return set;
});

/**
 * Check if the map contains a key (that is still referenced)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod(function has(key, value) {

	let set = this[DATA].get(key);

	if (arguments.length == 1) {
		return set.size > 0;
	}

	if (!set) {
		return false;
	}

	return set.has(value);
});

/**
 * Add a value to the set of the given key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {*}   key
 * @param    {*}   value
 *
 * @return   {WeakValueSetMap}
 */
WeakValueSetMap.setMethod(function add(key, value) {

	let set = this[DATA].get(key);

	if (!set) {
		set = new Blast.Classes.WeakValueSet();
		this[DATA].set(key, set);
	}

	set.add(value);

	return this;
});

/**
 * Get an iterator
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod(function *entries() {
	for (const [key, set] of this[DATA].entries()) {
		
		if (set.size == 0) {
			this[DATA].delete(key);
			continue;
		}

		yield [key, set];
	}
});

/**
 * Get an iterator for the keys
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod(function *keys() {
	for (const [key, value] of this) {
		yield key;
	}
});

/**
 * Get an iterator for the values
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod(function *values() {
	for (const [key, value] of this) {
		yield value;
	}
});

/**
 * Set the iterable symbol
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
WeakValueSetMap.setMethod(Symbol.iterator, function entries() {
	return this.entries();
});