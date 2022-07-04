var libcrypto;

/**
 * Get the property descriptor of the given object,
 * follow the prototype chain if not found
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Object}    target
 * @param    {String}    key
 *
 * @return   {Object}
 */
Blast.defineStatic('Object', function getPropertyDescriptor(target, key) {

	var proto,
	    config;

	// Get the descriptor
	config = Object.getOwnPropertyDescriptor(target, key);

	if (config) {
		return config;
	}

	// Config wasn't found, look up the prototype chain
	if (typeof target == 'function') {
		proto = target.prototype;
	} else {
		proto = Object.getPrototypeOf(target);
	}

	if (proto) {
		return getPropertyDescriptor(proto, key);
	}

	return;
});

/**
 * Check if the argument is actually an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.5.0
 *
 * @param    {Object}    obj
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function isObject(obj) {
	return !(!obj || typeof obj != 'object');
});

/**
 * Check if the argument is an iterable object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @param    {Object}    obj
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function isIterable(obj) {
	return Obj.isObject(obj) && typeof obj[Symbol.iterator] === 'function';
});

/**
 * Check if the argument is a plain object
 * (created with an object literal or new Object)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.5.0
 *
 * @param    {Object}    obj
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function isPlainObject(obj) {
	return !!(obj && (!obj.constructor || obj.constructor.name == 'Object'));
});

/**
 * Check if the argument is the object form of a primitive
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.8
 *
 * @param    {Object}    obj
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function isPrimitiveObject(obj) {

	var id;

	// If the argument isn't even an object, return false
	if (!obj || typeof obj !== 'object') {
		return false;
	}

	if (obj.constructor) {
		// Get the constructor name
		id = obj.constructor.name;

		// If it's constructed by one of the 3 primitives, return true
		if (id == 'String' || id == 'Number' || id == 'Boolean') {
			return true;
		}
	}

	return false;
});

/**
 * Check if the argument is a primitive
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.1.4
 *
 * @param    {Mixed}   arg
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function isPrimitive(arg) {

	var type = typeof arg;

	if (type == 'string' || type == 'number' || type == 'boolean') {
		return true;
	}

	return false;
});

/**
 * Stringify primitives only
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Mixed}   arg
 *
 * @return   {String}
 */
Blast.defineStatic('Object', function stringifyPrimitive(arg) {

	switch (typeof arg) {
		case 'string':
			return arg;

		case 'number':
			if (isFinite(arg)) {
				return arg;
			}
			break;

		case 'boolean':
			return arg ? 'true' : 'false';
	}

	return '';
});

/**
 * Get the size (length) of any given variable.
 * The return value is always a number, so 0 for invalid arguments
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.3.6
 *
 * @param    {Object}    obj
 * @param    {Boolean}   includeUndefined     True by default (faster)
 *
 * @return   {Number}
 */
Blast.defineStatic('Object', function size(obj, includeUndefined) {

	var type,
	    key,
	    len,
	    val;

	if (!obj) {
		return 0;
	}

	// Use the object's numeric length property if it has one
	if (typeof obj.length === 'number') {
		return obj.length;
	}

	if (Obj.isPlainObject(obj)) {
		len = Object.keys(obj).length;
	} else {

		type = typeof obj;

		if (type === 'number') {
			return obj;
		}

		if (type === 'boolean') {
			return Number(obj);
		}

		if (obj && typeof obj.valueOf === 'function') {
			val = obj.valueOf();
			type = typeof val;

			if (type === 'number') {
				return val;
			}

			if (type === 'boolean') {
				return Number(val);
			}
		}

		if (typeof val !== 'string' && typeof obj.toString === 'function') {
			val = obj.toString();
		}

		if (val && typeof val === 'string' && val.slice(0, 8) !== '[object ') {
			return val.length;
		}
	}

	// Do a (slow) iterate if we have to filter out undefineds
	if (includeUndefined === false) {
		for (key in obj) {
			if (typeof obj[key] === 'undefined') {
				len--;
			}
		}
	}

	return len || 0;
});

/**
 * Calculate the size of a variable
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Mixed}    input
 *
 * @return   {Number}
 */
Blast.defineStatic('Object', function sizeof(input) {
	return calculate_sizeof(input, new WeakMap());
});

/**
 * Calculate the size of a variable
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Mixed}    input
 * @param    {WeakMap}  weak_map
 *
 * @return   {Number}
 */
function calculate_sizeof(input, weak_map) {

	var bytes,
	    type = typeof input,
	    key;

	if (type == 'string') {
		return input.length * 2;
	} else if (type == 'number') {
		return 8;
	} else if (type == 'boolean') {
		return 4;
	} else if (type == 'symbol') {
		return (input.toString().length - 8) * 2;
	} else if (input == null) {
		return 0;
	}

	// If this has already been seen, skip the actual value
	if (weak_map.get(input)) {
		return 0;
	}

	weak_map.set(input, true);

	if (typeof input[Blast.sizeofSymbol] == 'function') {
		try {
			return input[Blast.sizeofSymbol]();
		} catch (err) {
			// Continue;
		}
	}

	bytes = 0;

	if (Array.isArray(input)) {
		type = 'array';
	} else if (Blast.isNode && Buffer.isBuffer(input)) {
		return input.length;
	}

	for (key in input) {

		// Skip properties coming from the prototype
		if (!Object.hasOwnProperty.call(input, key)) {
			continue;
		}

		// Each entry is a reference to a certain place in the memory,
		// on 64bit devices this will be 8 bytes
		bytes += 8;

		if (type == 'array' && Number(key) > -1) {
			// Don't count array indices
		} else {
			bytes += key.length * 2;
		}

		bytes += calculate_sizeof(input[key], weak_map);
	}

	return bytes;
}

/**
 * Create the symbol for the sizeof method
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.6.0
 * @version   0.6.0
 *
 * @type     {Symbol}
 */
Blast.defineStatic(Blast, 'sizeofSymbol', Symbol('sizeof'));

/**
 * Flatten an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.5.8
 *
 * @param    {Object}         obj              The object to flatten
 * @param    {String|Array}   divider          The divider to use (.)
 * @param    {Boolean}        flatten_arrays   (true)
 *
 * @return   {Object}
 */
Blast.defineStatic('Object', function flatten(obj, divider, flatten_arrays) {
	return flatten_object(obj, divider, 0, flatten_arrays);
});

/**
 * Flatten an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.5.8
 *
 * @param    {Object}         obj       The object to flatten
 * @param    {String|Array}   divider   The divider to use (.)
 * @param    {Number}         level
 * @param    {Boolean}        flatten_arrays   (true)
 *
 * @return   {Object}
 */
function flatten_object(obj, divider, level, flatten_arrays) {

	var divider_start,
	    divider_end,
	    new_key,
	    result = {},
	    temp,
	    key,
	    sub;

	if (level == null) {
		level = 0;
	}

	if (!divider) {
		divider_start = '.';
	} else if (typeof divider == 'string') {
		divider_start = divider;
	} else if (Array.isArray(divider)) {
		divider_start = divider[0];
		divider_end = divider[1];
	}

	if (flatten_arrays == null) {
		flatten_arrays = true;
	}

	for (key in obj) {

		// Only flatten own properties
		if (!obj.hasOwnProperty(key)) continue;

		if (Obj.isPlainObject(obj[key]) || (flatten_arrays && Array.isArray(obj[key]))) {
			temp = flatten_object(obj[key], divider, level + 1, flatten_arrays);

			// Inject the keys of the sub-object into the result
			for (sub in temp) {

				// Again: skip prototype properties
				if (!temp.hasOwnProperty(sub)) continue;

				if (divider_end) {
					new_key = key;

					// The root does not have an end divider:
					// For example: root[child]
					if (level) {
						new_key += divider_end;
					}

					new_key += divider_start + sub;

					// If we're back in the root,
					// make sure it has an ending divider
					if (!level) {
						new_key += divider_end;
					}

				} else {
					new_key = key + divider_start + sub;
				}

				result[new_key] = temp[sub];
			}
		} else if (Obj.isPrimitiveObject(obj[key])) {
			// Convert object form of primitives to their primitive values
			result[key] = obj[key].valueOf();
		} else {
			result[key] = obj[key];
		}
	}

	return result;
}

/**
 * Create a new object for every key-value and wrap them in an array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 *
 * @param    {Object}    obj   The object to arrayify
 *
 * @return   {Array}
 */
Blast.defineStatic('Object', function divide(obj) {

	var list,
	    temp,
	    key;

	if (Array.isArray(obj)) {
		return obj;
	}

	list = [];

	for (key in obj) {
		temp = {};
		temp[key] = obj[key];

		list.push(temp);
	}

	return list;
});

/**
 * Like divide, but key and value both become properties
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.2.1
 *
 * @param    {Object}    obj            The object to arrayify
 *
 * @return   {Array}
 */
Blast.defineStatic('Object', function dissect(obj) {

	var list = [],
	    key;

	if (Collection.Array.likeArray(obj)) {
		for (key = 0; key < obj.length; key++) {
			list[list.length] = {
				key: key,
				value: obj[key]
			};
		}
	} else {
		for (key in obj) {
			list[list.length] = {
				key: key,
				value: obj[key]
			};
		}
	}

	return list;
});

/**
 * Get all the values of an object as an array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Object}    obj   The object to get the values from
 *
 * @return   {Array}
 */
Blast.defineStatic('Object', function values(obj) {

	var keys = Object.keys(obj),
	    result = new Array(keys.length),
	    i;

	for (i = 0; i < keys.length; i++) {
		result[i] = obj[keys[i]];
	}

	return result;
}, true);

/**
 * Get all the key-values of an object as an array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Object}    obj   The object to get the values from
 *
 * @return   {Array}
 */
Blast.defineStatic('Object', function entries(obj) {

	var keys = Object.keys(obj),
	    result = new Array(keys.length),
	    i;

	for (i = 0; i < keys.length; i++) {
		result[i] = [keys[i], obj[keys[i]]];
	}

	return result;
}, true);

/**
 * Return two arrays with the keys & values in the same order
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @param    {Object}   obj   The object to unzip
 *
 * @return   {Object}   The object containing a `keys` and `values` array
 */
Blast.defineStatic('Object', function unzip(obj) {

	var values = [],
	    keys = Object.keys(obj),
	    i;

	for (i = 0; i < keys.length; i++) {
		values.push(obj[keys[i]]);
	}

	return {
		keys   : keys,
		values : values
	};
});

/**
 * Zip key-values into a new object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @param    {Array}   keys     The keys
 * @param    {Array}   values   The values
 *
 * @return   {Object}
 */
Blast.defineStatic('Object', function zip(keys, values) {

	var result,
	    i;

	if (!values) {
		if (Array.isArray(keys)) {
			if (Array.isArray(keys[0])) {
				return zip(keys[0], keys[1]);
			} else {
				throw new Error('Single array was passed to Object.zip(keys, values)');
			}
		} else if (keys && Array.isArray(keys.keys) && Array.isArray(keys.values)) {
			return zip(keys.keys, keys.values);
		} else {
			throw new Error('Invalid arguments passed to Object.zip(keys, values)');
		}
	}

	result = {};

	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = values[i];
	}

	return result;
});

/**
 * Parse a path and return an array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @param    {String}   path   The dot notation path
 *
 * @return   {Array}
 */
Blast.defineStatic('Object', function parseDotNotationPath(path) {

	if (Array.isArray(path)) {
		return path;
	}

	if (!path || typeof path != 'string') {
		return null;
	}

	return path.split('.');
});

// Aggregate array results
Blast.PATH_AGGREGATE = Symbol('PATH_AGGREGATE');

/**
 * Get the value of the given property path
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.6.3
 *
 * @param    {Symbol}   flag
 * @param    {Object}   obj
 * @param    {String}   path_string   The dot notation path
 *
 * @return   {Mixed}
 */
Blast.defineStatic('Object', function path(_flag, _obj, _path_string) {

	var path_string,
	    pieces,
	    piece,
	    here,
	    flag,
	    skip = 0,
	    obj,
	    len,
	    i;

	if (typeof _flag == 'symbol') {
		skip = 1;
		flag = _flag;
		obj = _obj;
		path_string = _path_string;
	} else {
		path_string = _obj;
		obj = _flag;
		flag = null;
	}

	if (typeof path_string !== 'string') {
		if (Array.isArray(path_string)) {
			pieces = path_string;
		} else {
			return;
		}
	} else {
		len = arguments.length;
		if (len == (2 + skip)) {
			pieces = path_string.split('.');
		} else {
			pieces = new Array(len - (1 + skip));

			for (i = 1 + skip; i < len; i++) {
				pieces[i-1] = arguments[i]
			}
		}
	}

	here = obj;

	if (flag == Blast.PATH_AGGREGATE) {
		for (i = 0; i < pieces.length; i++) {
			piece = pieces[i];

			if (here != null) {
				if (Array.isArray(here)) {
					let arr = here,
					    j;

					here = [];

					for (j = 0; j < arr.length; j++) {
						if (arr[j] != null && arr[j][piece] != null) {
							here.push(arr[j][piece]);
						}
					}
				} else {
					here = here[piece];
				}
			}
		}
	} else {
		// Go over every piece in the path
		for (i = 0; i < pieces.length; i++) {
			piece = pieces[i];

			if (here != null) {
				here = here[piece];
			}
		}
	}

	return here;
});

/**
 * Create a path in an object.
 * Example: my.special.object would create an object like
 * {my: {special: {object: {}}}}
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.5.7
 */
Blast.defineStatic('Object', function setPath(obj, path, value, skipLastEntry, allow_prototype) {

	var argLength = arguments.length,
	    pieces,
	    here,
	    key,
	    end,
	    i;

	pieces = Obj.parseDotNotationPath(path);

	// If no default end value is given, use a new object
	// Caution: undefined is also a valid end value,
	// so we check the arguments length for that
	if (typeof value == 'undefined' && argLength < 3) {
		value = {};
	}

	if (allow_prototype == null) {
		allow_prototype = true;
	}

	// Set out current position
	here = obj;

	for (i = 0; i < pieces.length; i++) {
		key = pieces[i];

		if (key == '') {
			key = here.length;

			if (key == null) {
				key = Obj.getNextIndex(here);
			}
		}

		// Is this the final piece?
		end = ((i+1) == pieces.length);

		if (end) {

			// Only set the last entry if we don't want to skip it
			if (!skipLastEntry) {
				here[key] = value;
			}
		} else {
			if (here[key] == null || (typeof here[key] != 'object' && typeof here[key] != 'function')) {
				// If the wanted entry doesn't exist
				// AND the next key is a number, create an array
				if (pieces[i+1] === '' || Number(pieces[i+1]) == pieces[i+1]) {
					here[key] = [];
				} else {
					here[key] = {};
				}
			}
		}

		if (!allow_prototype && !Object.hasOwnProperty.call(here, key)) {
			return obj;
		}

		here = here[key];
	}

	return obj;
});

/**
 * Get the next index for this object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Object}   obj
 *
 * @return   {Number}
 */
Blast.defineStatic('Object', function getNextIndex(obj) {

	var keys,
	    key = obj.length,
	    max,
	    nr,
	    i;

	if (key != null) {
		return key;
	}

	max = -1;

	keys = Obj.values(obj);

	for (i = 0; i < keys.length; i++) {
		nr = Number(keys[i]);

		if (nr > max) {
			max = nr;
		}
	}

	return max + 1;
});

/**
 * Get the value of the given property path (in the form format)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.11
 * @version  0.5.9
 *
 * @param    {Object}   obj
 * @param    {String}   form_path   The form notation path
 */
Blast.defineStatic('Object', function formPath(obj, form_path) {
	var path = Blast.Classes.RURL.parseFormPath(form_path);
	return Collection.Object.path(obj, path);
});

/**
 * Create a path in an object.
 * Example: my[special][object] would create an object like
 * {my: {special: {object: {}}}}
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.11
 * @version  0.5.9
 */
Blast.defineStatic('Object', function setFormPath(obj, form_path, value, skipLastEntry) {
	var path = Blast.Classes.RURL.parseFormPath(form_path);
	return Collection.Object.setPath(obj, path, value, skipLastEntry);
});

/**
 * See if the given path exists inside an object,
 * even if that value is undefined
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Object}   obj
 * @param    {String}   path   The dot notation path
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function exists(obj, path) {

	var last;

	// Get the path as an array
	if (typeof path == 'string') {
		path = path.split('.');
	}

	// Get the last piece of the path
	last = path.pop();

	if (path.length) {
		obj = Obj.path(obj, path);
	}

	if (!obj) {
		return false;
	}

	return !!obj[last] || last in obj;
});

/**
 * Determine if the object is empty
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 *
 * @param    {Object}   obj
 * @param    {Boolean}  include_prototype   If true, prototypal properties also count
 *
 * @return   {Boolean}
 */
Blast.defineStatic('Object', function isEmpty(obj, include_prototype) {

	if (!obj) {
		return true;
	}

	return !(Object.keys(obj).length || (include_prototype && Object.keys(obj.prototype).length));
});

/**
 * Inject the enumerable properties of one object into another target object
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {Object}   target     The object to inject the extension into
 * @param   {Object}   extension  The object to inject
 *
 * @returns {Object}   Returns the injected target (which it also modifies byref)
 */
Blast.defineStatic('Object', function assign(target, first, second) {

	var length = arguments.length, extension, key, i;

	// Go over every argument, other than the first
	for (i = 1; i <= length; i++) {
		extension = arguments[i];

		// If the given extension isn't valid, continue
		if (!extension) continue;

		// Go over every property of the current object
		for (key in extension) {
			target[key] = extension[key];
		}
	}

	return target;
}, true);

/**
 * Inject all properties of one object into another target object,
 * including non-enumerable ones
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param   {Object}   target     The object to inject the extension into
 * @param   {Object}   extension  The object to inject
 *
 * @returns {Object}   Returns the injected target (which it also modifies byref)
 */
Blast.defineStatic('Object', function inject(target, first, second) {

	var extension,
	    length,
	    config,
	    props,
	    key,
	    i,
	    j;

	length = arguments.length;

	// Go over every argument, other than the first
	for (i = 1; i <= length; i++) {
		extension = arguments[i];

		// If the given extension isn't valid, continue
		if (!extension) continue;

		props = Object.getOwnPropertyNames(extension);

		// Go over every property
		for (j = 0; j < props.length; j++) {
			key = props[j];
			config = Object.getOwnPropertyDescriptor(extension, key);
			Object.defineProperty(target, key, config);
		}
	}

	return target;
});

/**
 * Is this a self contained object?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param   {Object}   obj     The object to test
 *
 * @returns {Boolean}
 */
Blast.defineStatic('Object', function isSelfContained(obj) {

	var id;

	// Null or primitives are, obviously, self contained
	if (!obj || typeof obj != 'object') {
		return true;
	}

	if (obj.constructor) {
		// Get the constructor name
		id = obj.constructor.name;

		switch (id) {
			case 'String':
			case 'Number':
			case 'Boolean':
			case 'RegExp':
			case 'Date':
				return true;
		}
	}

	return false;
});

/**
 * Merge objects
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.9
 * @version  0.5.1
 *
 * @param   {Object}   target     The object to inject the extension into
 * @param   {Object}   extension  The object to inject
 *
 * @returns {Object}   Returns the injected target (which it also modifies byref)
 */
Blast.defineStatic('Object', function merge(target, first, second) {

	var length = arguments.length, extension, key, i, j;

	// Go over every argument, other than the first
	for (i = 1; i <= length; i++) {
		extension = arguments[i];

		// If the given extension isn't valid, continue
		if (!extension) continue;

		if (Array.isArray(extension)) {
			if (!Array.isArray(target)) {
				target = [];
			}

			for (j = 0; j < extension.length; j++) {
				target.push(extension[j]);
			}

			continue;
		}

		// Go over every property of the current object
		for (key in extension) {
			if (!target[key]) {
				if (Collection.Object.isSelfContained(extension[key])) {
					// Null, primitives, dates, ...
					target[key] = extension[key];
				} else if (Array.isArray(extension[key])) {
					target[key] = extension[key].slice(0);
				} else {
					target[key] = Collection.Object.assign({}, extension[key]);
				}
			} else if (target.hasOwnProperty == null || target.hasOwnProperty(key)) {
				if (Collection.Object.isSelfContained(extension[key])) {
					target[key] = extension[key];
				} else {

					if (target[key] && typeof target[key] == 'object') {
						merge(target[key], extension[key]);
					} else {
						target[key] = Collection.Object.assign(extension[key]);
					}
				}
			}
		}
	}

	return target;
});

/**
 * Convert an array to an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.2
 *
 * @param    {Mixed}   source
 * @param    {Boolean} recursive
 * @param    {Mixed}   value
 *
 * @return   {Object}
 */
Blast.defineStatic('Object', function objectify(source, recursive, value) {

	var result = {},
	    temp,
	    type,
	    key,
	    i;

	if (typeof value == 'undefined') {
		value = true;
	}

	// Convert object form of primitives to their primitive states
	if (Collection.Object.isPrimitiveObject(source)) {
		source = source.valueOf();
	}

	if (Array.isArray(source)) {
		for (i = 0; i < source.length; i++) {

			if (typeof source[i] !== 'object') {
				result[source[i]] = value;
			} else if (Array.isArray(source[i])) {
				Collection.Object.assign(result, Object.objectify(source[i], recursive, value));
			} else {
				Collection.Object.assign(result, source[i]);
			}
		}
	} else if (Collection.Object.isObject(source)) {
		Collection.Object.assign(result, source);
	} else {
		if (typeof source !== 'boolean' && (source || typeof source !== 'undefined')) {
			result[source] = value;
		}
	}

	if (!recursive) {
		return result;
	}

	for (key in result) {
		type = typeof result[key];

		if (type == 'object') {
			result[key] = Collection.Object.objectify(result[key], true, value);
		}
	}

	return result;
});

/**
 * Iterate over an object's properties
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.7.0
 *
 * @param    {Object}     obj
 * @param    {Function}   fnc
 */
Blast.defineStatic('Object', function each(obj, fnc) {

	var key;

	for (key in obj) {

		if (Symbol.polyfilled && Symbol.isSymbol(key)) {
			continue;
		}

		fnc(obj[key], key, obj);
	}

});

/**
 * Walk over an object tree
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.6
 * @version  0.7.0
 *
 * @param    {Object}     obj     The object to walk over
 * @param    {Function}   fnc     The function to perform on every entry
 * @param    {Number}     limit   Optional recursive limit
 * @param    {Array}      seen    Array to keep track of items already seen
 */
Blast.defineStatic('Object', function walk(obj, fnc, limit, seen, wm) {

	var count,
	    key,
	    ret;

	if (wm == null) {
		wm = new WeakMap();
	}

	if (typeof limit != 'number') {
		if (Array.isArray(limit)) {
			seen = limit;
			limit = null;
		}
	}

	if (!seen) {
		seen = [];
	}

	if (limit == null || limit === false) {
		limit = Infinity;
	}

	for (key in obj) {

		if (!Object.hasOwnProperty.call(obj, key)) {
			continue;
		}

		if (Symbol.polyfilled && Symbol.isSymbol(key)) {
			continue;
		}

		// Fire the function
		if (fnc != null) {
			ret = fnc(obj[key], key, obj);
		}

		// If explicit false is returned,
		// don't recursively walk this object
		if (ret === false) {
			continue;
		}

		if (typeof obj[key] == 'object' && obj[key] !== null) {

			if (seen.indexOf(obj[key]) == -1) {

				// Add this object to the seen list
				seen.push(obj[key]);

				// Walk this object, too
				if (limit > 0) {
					walk(obj[key], fnc, limit - 1, seen, wm);
				}
			} else {
				count = wm.get(obj[key]);

				if (!count) {
					count = 1;
				} else {
					count++;
				}

				wm.set(obj[key], count);
			}
		}
	}

	return {
		seen : seen,
		wm   : wm
	};
});

/**
 * Map an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.3
 *
 * @param    {Object}     obj
 * @param    {Function}   fnc
 *
 * @return   {Object}
 */
Blast.defineStatic('Object', function map(obj, fnc) {

	var isFunction = typeof fnc === 'function',
	    mapped = {};

	Collection.Object.each(obj, function mapEach(value, key) {

		if (isFunction) {
			mapped[key] = fnc(value, key, obj);
		} else {
			mapped[key] = fnc;
		}
	});

	return mapped;
});

/**
 * Like Object.map, but the emphasis is on keys.
 * If obj is an array, its values will be passed as keys and its index
 * as the possible value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Object}     obj
 * @param    {Function}   fnc
 *
 * @return   {Object}
 */
Blast.defineStatic('Object', function mapKeys(obj, fnc) {

	var isFunction = typeof fnc === 'function',
	    mapped = {},
	    keys;

	function mapEach(possibleValue, key) {
		if (isFunction) {
			mapped[key] = fnc(key, possibleValue, obj);
		} else {
			mapped[key] = fnc;
		}
	}

	if (Array.isArray(obj)) {
		obj.forEach(function(name, index) {
			mapEach(index, name);
		});
	} else {
		Collection.Object.each(obj, mapEach);
	}

	return mapped;
});

/**
 * Get the key of a value in an array or object.
 * If the value is not found a false is returned (not -1 for arrays)
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.0
 * @version   0.1.0
 *
 * @param     {Object|Array}   target   The object to search in
 * @param     {Object}         value    The value to look for
 *
 * @return    {String|Number|Boolean}
 */
Blast.defineStatic('Object', function getValueKey(target, value) {

	var result, key;

	if (target) {

		if (Array.isArray(target)) {
			result = target.indexOf(value);

			if (result > -1) {
				return result;
			}
		} else {
			for (key in target) {
				if (target[key] == value) {
					return key;
				}
			}
		}
	}

	return false;
});

/**
 * Extract data from objects using JSONPath
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.2
 * @version   0.1.2
 *
 * @param     {Object|Array}   obj    The object to search in
 * @param     {String}         expr   The expression to use
 *
 * @return    {Array}
 */
Blast.defineStatic('Object', function extract(obj, expr, arg) {
	var P = new Blast.Classes.JSONPath(expr, arg);
	return P.exec(obj);
});

/**
 * See if a key exists in an object or array
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.0
 * @version   0.1.6
 *
 * @param     {Object|Array}   target      The object to search in
 * @param     {String}          property   The key to look for
 *
 * @return    {Boolean}
 */
Blast.defineStatic('Object', function hasProperty(target, property) {

	if (target == null || typeof target != 'object' || (typeof target[property] === 'undefined' && !(property in target))) {
		return false;
	}

	return true;
});

/**
 * Look for a value in an object or array
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.0
 * @version   0.1.0
 *
 * @param     {Object|Array}   target   The object to search in
 * @param     {Object}         value    The value to look for
 *
 * @return    {Boolean}
 */
Blast.defineStatic('Object', function hasValue(target, value) {
	return !(Collection.Object.getValueKey(target, value) === false);
});

/**
 * Create the checksum symbol
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.6.5
 * @version   0.6.5
 *
 * @type     {Symbol}
 */
Blast.checksumSymbol = Symbol('toChecksum');

// Set it on some objects
Blast[Blast.checksumSymbol] = 'Protoblast';
Blast.Bound[Blast.checksumSymbol] = 'Blast.Bound';
Blast.Classes[Blast.checksumSymbol] = 'Blast.Classes';
Blast.Collection[Blast.checksumSymbol] = 'Blast.Collection';

/**
 * Calculate the checksum for the given value
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.3
 * @version   0.7.0
 *
 * @param     {Object|Array}   obj            The object to checksum
 * @param     {Boolean}        sort_arrays    Sort arrays before checksumming? (true)
 *
 * @return    {String}
 */
Blast.defineStatic('Object', function checksum(obj, sort_arrays) {

	var result,
	    seen = [];

	if (typeof sort_arrays != 'boolean') {
		sort_arrays = true;
	}

	if (typeof obj == 'object' && obj) {
		seen.push(obj);
	}

	try {
		result = _checksum(obj, sort_arrays, seen, 0);
	} catch (err) {
		console.error('Failed to checksum', obj);
		throw err;
	}

	return result;
});

/**
 * The actual function that does the checksuming
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.3
 * @version   0.7.0
 *
 * @param     {Object|Array}   obj            The object to checksum
 * @param     {Boolean}        sort_arrays    Sort arrays before checksumming? (true)
 *
 * @return    {String}
 */
function _checksum(obj, sort_arrays, seen, level) {

	var split_length,
	    custom_type,
	    counter,
	    result,
	    length,
	    names,
	    ident,
	    type,
	    temp,
	    val,
	    key,
	    idx,
	    i;

	type = typeof obj;

	// Make sure primitives are primitive
	if (type == 'object' && obj != null) {
		custom_type = typeof obj[Blast.checksumSymbol];

		if (custom_type == 'string') {
			return obj[Blast.checksumSymbol];
		} else if (custom_type == 'function') {
			return _checksum(obj[Blast.checksumSymbol](), sort_arrays, seen, level + 1);
		} else if (typeof obj.valueOf == 'function') {
			// Get the value of the object
			temp = obj.valueOf();

			// If the value is different, use that from here on out
			// This handles primitive objects & dates
			if (temp != obj) {

				// Test for String, Number of Boolean instances
				if (Obj.isPrimitiveObject(obj)) {
					obj = temp;
					type = typeof obj;
				} else {
					// Things like dates should not be handled as JUST numbers
					type = 'date';
					obj = temp;
				}
			}
		}
	}

	if (type == 'function') {
		type = 'string';
		obj = String(obj);
		ident = 'F';
	} else {
		ident = 'S';
	}

	// Simple primitive checksums
	if (type == 'string') {
		length = obj.length;
		split_length = ~~(obj.length / 2);

		// Make one of the strings longer than the other
		if (split_length > 2) {
			split_length -= 1;
		}

		return ident + length + '-' + Bound.String.checksum(obj, 0, split_length).toString(36) + Bound.String.checksum(obj, split_length).toString(36);
	} else if (type == 'number') {
		return 'N' + obj;
	} else if (type == 'boolean') {
		return 'B' + Number(obj);
	} else if (type == 'undefined') {
		return 'U';
	} else if (type == 'date') {
		return 'D' + obj;
	} else if (obj == null) {
		return 'L';
	} else if (obj.constructor && obj.constructor.name == 'RegExp') {
		return 'R' + _checksum(String(obj));
	}

	if (Array.isArray(obj)) {
		// Clone the array
		obj = obj.slice(0);

		// And sort it alphabetically
		if (sort_arrays) {
			Bound.Array.safesort(obj);
		}

		// Create the names
		names = Bound.Array.range(obj.length);

		result = 'A';
	} else if (Blast.isNode && Buffer.isBuffer(obj)) {

		if (!libcrypto) {
			libcrypto = require('crypto');
		}

		return 'BUF' + libcrypto.createHash('md5').update(obj).digest('hex');
	} else {
		// Get all the keys of the object and sort them alphabetically
		names = Object.getOwnPropertyNames(obj).sort();

		result = 'O';
	}

	// Prepare the temp
	temp = '';
	counter = 0;

	for (i = 0; i < names.length; i++) {
		key = names[i];
		val = obj[key];

		counter++;

		if (temp) temp += '+';

		// Normalize non-falsy values
		if (val) {
			// Cast object instances of primitives to strings
			if (Obj.isPrimitiveObject(val)) {
				val = ''+val;
			} else if (typeof val == 'object') {

				// Handle objects recursively, but beware of circular references
				if ((idx = seen.indexOf(val)) == -1) {
					seen.push(val);
					val = _checksum(val, sort_arrays, seen, level + 1);
				} else {
					val = 'R' + idx;
				}
			} else if (typeof val == 'symbol') {
				val = val.toString();
			}
		}

		temp += key + ':' + val;
	}

	// The length is the first part of the checksum
	if (result == 'A') {
		counter = names.length;
	}

	result += counter + '-';

	// Now create another checksum
	result += _checksum(temp);

	return result;
};

/**
 * Create the alike comparer symbol
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.5.11
 * @version   0.5.11
 *
 * @type     {Symbol}
 */
Blast.defineStatic(Blast, 'alikeSymbol', Symbol('alike'));

/**
 * Loosely compare 2 variables, ignoring undefined variables
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.3
 * @version   0.5.11
 *
 * @param     {Object}   a
 * @param     {Object}   b
 * @param     {Array}    seen
 *
 * @return    {Boolean}
 */
Blast.defineStatic('Object', function alike(a, b, seen) {

	var index_a,
	    index_b,
	    type_a,
	    type_b,
	    id_a,
	    id_b,
	    key;

	// If they're equals, return true
	if (a === b) {
		return true;
	}

	// If they don't have the same size (minus undefineds) return false
	if (Obj.size(a, false) != Obj.size(b, false)) {
		return false;
	}

	type_a = a === null ? 'null' : typeof a;
	type_b = b === null ? 'null' : typeof b;

	// Both types should match
	if (type_a != type_b) {
		return false;
	}

	// From this point on, both values should be objects
	if (type_a !== 'object') {
		return false;
	}

	if (Blast.isNode && Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
		return a.equals(b);
	}

	if (!seen) {
		seen = {
			objects : [],
			ids     : []
		};
	}

	if (typeof a[Blast.alikeSymbol] == 'function') {
		return a[Blast.alikeSymbol](b, seen);
	}

	if (typeof b[Blast.alikeSymbol] == 'function') {
		return b[Blast.alikeSymbol](a, seen);
	}

	// Do primitive values first
	for (key in a) {

		// Skip entries that are identical
		if (a[key] === b[key]) {
			continue;
		}

		switch (typeof a[key]) {
			case 'number':
			case 'string':
			case 'boolean':
				if (a[key] !== b[key]) {
					return false;
				}
				break;
		}
	}

	for (key in a) {

		// Skip entries that are identical
		if (a[key] === b[key]) {
			continue;
		}

		switch (typeof a[key]) {
			case 'number':
			case 'string':
			case 'boolean':
				continue;

			default:

				index_a = seen.objects.indexOf(a[key]);
				index_b = seen.objects.indexOf(b[key]);

				// If any of the 2 objects have been seen before,
				// we'll have to do a more expensive check (for recursiveness)
				if (index_a > -1 || index_b > -1) {
					id_a = null;
					id_b = null;

					if (index_a > -1) {
						id_a = seen.ids[index_a];
					} else {
						index_a = seen.objects.push(a[key]) - 1;
					}

					if (!id_a) {
						id_a = Obj.checksum(a[key], false);
						seen.ids[index_a] = id_a;
					}

					if (index_b > -1) {
						id_b = seen.ids[index_b];
					} else {
						index_b = seen.objects.push(b[key]) - 1;
					}

					if (!id_b) {
						id_b = Obj.checksum(b[key], false);
						seen.ids[index_b] = id_b;
					}

					return id_a == id_b;
				} else {
					// Both elements haven't been seen before
					seen.objects.push(a[key]);
					seen.objects.push(b[key]);
				}

				if (!alike(a[key], b[key], seen)) {
					return false;
				}
		}
	}

	return true;
});

/**
 * Return the object with all the own properties as if they were enumerable
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.4
 * @version   0.1.4
 *
 * @param     {Object}   obj
 *
 * @return    {Object}
 */
Blast.defineStatic('Object', function enumerateOwnProperties(obj) {

	var result = {},
	    keys = Object.getOwnPropertyNames(obj),
	    i;

	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = obj[keys[i]];
	}

	return result;
});

/**
 * Return the object with all the own descriptors as if they were enumerable
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.4
 * @version   0.1.4
 *
 * @param     {Object}   obj
 *
 * @return    {Object}
 */
Blast.defineStatic('Object', function enumerateOwnDescriptors(obj) {

	var result = {},
	    keys = Object.getOwnPropertyNames(obj),
	    i;

	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
	}

	return result;
});

/**
 * Uneval
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.1.0
 * @version   0.1.0
 *
 * @param     {Object}   obj
 *
 * @return    {String}
 */
Blast.defineStatic('Object', 'uneval', Blast.uneval);

/**
 * Get the first entry of an object or array
 * If it is neither, just return the value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.11
 * @version  0.5.4
 *
 * @param    {Object}    obj
 */
Blast.defineStatic('Object', function first(obj) {

	var key;

	if (Array.isArray(obj)) {
		return obj[0];
	} else if (obj && typeof obj == 'object') {
		for (key in obj) {
			return obj[key];
		}

		return;
	}

	return obj;
});