const FUNCTION = Symbol('Function'),
      BACKING = Symbol('Backing'),
      OBJECT = Symbol('Object'),
      MAP = Symbol('Map');

/**
 * The Backed map class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 */
const Backed = Fn.inherits(null, 'Develry', function BackedMap(backing) {
	this.local = new Map();
	this.type = null;
	this.backing = backing;
	this._temp_type = null;
	this._temp_backing = null;
});

/**
 * Undry the given value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @param    {Object}   value
 *
 * @return   {EnumValues}
 */
Backed.setStatic(function unDry(value, custom_method, whenDone) {
	let result = new this(value.backing);
	return result;
});

/**
 * Get the size
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 */
Backed.setProperty(function size() {
	return this.keys().length;
});

/**
 * Set the backing value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 */
Backed.enforceProperty(function backing(new_value, old_value) {

	this.backing = null;
	this.type = null;

	if (!new_value) {
		return;
	}

	if (new_value instanceof Backed) {
		this.type = BACKING;
	} else if (new_value instanceof Map) {
		this.type = MAP;
	} else if (typeof new_value == 'object') {
		this.type = OBJECT;
	} else if (typeof new_value == 'function') {
		this.type = FUNCTION;
	}

	return new_value;
});

/**
 * Create a (shallow) clone of this backed map.
 * Since we don't ever touch the backing itself, we don't have to clone that.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @return   {Backed}
 */
Backed.setMethod(function clone() {
	let result = new this.constructor(this.backing);
	result.local = new Map(this.local);
	return result;
});

/**
 * Create a (shallow) clone of this backed map.
 * Since we don't ever touch the backing itself, we don't have to clone that.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @return   {Backed}
 */
Backed.setMethod(function dryClone(wm, custom_method) {
	return this.clone();
});

/**
 * Simplify the object for Hawkejs
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @param    {WeakMap}   wm
 *
 * @return   {Backed}
 */
Backed.setMethod(function toHawkejs(wm) {

	let values = new Map(),
	    value,
	    keys = this.keys(),
		key;
	
	for (key of keys) {
		value = this.get(key);
		values.set(key, JSON.clone(value, 'toHawkejs', wm));
	}

	return new this.constructor(values);
});

/**
 * Get the current backing type
 * (Meant to return the actual backing type of the FUNCTION type)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @return   {string}
 */
Backed.setMethod(function _getTempType() {

	let type = this._temp_type || this.type;

	if (type === FUNCTION) {
		let values = this.backing();

		if (values) {
			if (values instanceof Map) {
				type = MAP;
			} else if (values instanceof Backed) {
				type = BACKING;
			} else if (typeof values == 'object') {
				type = OBJECT;
			}
		}

		this._temp_backing = values;
	}

	return type;
});

/**
 * Get all the keys
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @return   {string[]}
 */
Backed.setMethod(function keys() {

	let result,
	    type = this._getTempType();
	
	let backing = this._temp_backing || this.backing;

	switch (type) {
		case BACKING:
			result = backing.keys();
			break;
		
		case MAP:
			result = [...backing.keys()];
			break;
		
		case OBJECT:
			result = Object.keys(backing);
			break;
		
		default:
			result = [];
	};

	if (this.local.size) {
		for (let key of this.local.keys()) {
			if (result.indexOf(key) == -1) {
				result.push(key);
			}
		}
	}

	return result;
});

/**
 * Get a value by it's name
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @param    {string}   name
 *
 * @return   {Mixed}
 */
Backed.setMethod(function get(name) {

	if (this.local.has(name)) {
		return this.local.get(name);
	}

	let type = this._getTempType(),
	    backing = this._temp_backing || this.backing;

	if (!type) {
		return;
	}

	let value;

	if (type === BACKING || type === MAP) {
		value = backing.get(name);
	} else if (type === OBJECT) {
		value = backing[name];
	}

	return value;
});

/**
 * Get a key by its value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.6
 * @version  0.8.6
 *
 * @param    {Mixed}   value
 *
 * @return   {Mixed}
 */
Backed.setMethod(function getKey(value) {

	let type = this._getTempType();

	// Remember the temp type!
	this._temp_type = type;

	let entry_value,
	    result,
	    key;

	for (key of this.keys()) {
		entry_value = this.get(key);

		if (entry_value === value) {
			result = key;
			break;
		}
	}

	// Unset the temp type!
	this._temp_type = null;

	return result;
});

/**
 * Set a value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @param    {string}   name
 * @param    {*}        value
 *
 * @return   {*}
 */
Backed.setMethod(function set(name, value) {
	this.local.set(name, value);
	return value;
});

/**
 * Dry the object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @return   {Object}
 */
Backed.setMethod(function toDry() {
	
	let result = {
		backing  : {}
	};

	let type = this._getTempType();
	
	// Remember the temp type!
	this._temp_type = type;

	let value,
	    key;

	for (key of this.keys()) {
		value = this.get(key);
		result.backing[key] = value;
	}

	// Unset the temp type!
	this._temp_type = null;

	return {value: result};
});

/**
 * Iterate over the entries
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.6
 * @version  0.8.6
 *
 * @return   {Object}
 */
Backed.setMethod(function* entries() {

	let value,
	    key;

	for (key of this.keys()) {
		value = this.get(key);
		yield [key, value];
	}
});

/**
 * Iterate over the object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @return   {Object}
 */
Backed.setMethod(Symbol.iterator, function* iterate() {

	let value,
	    key;

	for (key of this.keys()) {
		value = this.get(key);
		yield value;
	}
});

/**
 * Get all the values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.13
 * @version  0.8.13
 *
 * @return   {Object}
 */
Backed.setMethod(function values() {
	return this[Symbol.iterator];
});

/**
 * Get all the values as an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.13
 * @version  0.8.13
 *
 * @return   {Object[]}
 */
Backed.setMethod(function toArray() {

	let result = [],
	    value,
	    key;

	for (key of this.keys()) {
		value = this.get(key);
		result.push(value);
	}

	return result;
});