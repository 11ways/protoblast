const defStat = Blast.createStaticDefiner('Object'),
      Str = Bound.String,
      Arr = Bound.Array;

let libcrypto;

/**
 * Get the property descriptor of the given object,
 * follow the prototype chain if not found
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Object}    target
 * @param    {string}    key
 *
 * @return   {Object}
 */
defStat(function getPropertyDescriptor(target, key) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.5.0
 *
 * @param    {Object}    obj
 *
 * @return   {boolean}
 */
defStat(function isObject(obj) {
	return !(!obj || typeof obj != 'object');
});

/**
 * Check if the argument is an iterable object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @param    {Object}    obj
 *
 * @return   {boolean}
 */
defStat(function isIterable(obj) {
	return Obj.isObject(obj) && typeof obj[Symbol.iterator] === 'function';
});

/**
 * Check if the argument is a plain object
 * (created with an object literal or new Object)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.5.0
 *
 * @param    {Object}    obj
 *
 * @return   {boolean}
 */
defStat(function isPlainObject(obj) {
	return !!(obj && (!obj.constructor || obj.constructor.name == 'Object'));
});

/**
 * Check if the argument is the object form of a primitive
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.8
 *
 * @param    {Object}    obj
 *
 * @return   {boolean}
 */
defStat(function isPrimitiveObject(obj) {

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
 * Check if the value is a primitive.
 * Returns true for primitive values which include `undefined`, `null`, `boolean`,
 * `string`, `number`, `bigint`, and `symbol`.
 *
 * Despite `typeof null` returning "object",
 * it's considered a primitive value and this function accounts for that.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.8.14
 *
 * @param    {Mixed}   arg
 *
 * @return   {boolean}
 */
defStat(function isPrimitive(arg) {

	if (arg == null) {
		return true;
	}

	let type = typeof arg;

	return type != 'object' && type != 'function';
});

/**
 * Stringify (useful) primitives only
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Mixed}   arg
 *
 * @return   {string}
 */
defStat(function stringifyPrimitive(arg) {

	switch (typeof arg) {
		case 'string':
			return arg;

		case 'number':
			if (isFinite(arg)) {
				return arg+'';
			}
			break;

		case 'bigint':
			return arg+'';

		case 'boolean':
			return arg ? 'true' : 'false';
	}

	return '';
});

/**
 * Get the size (length) of any given variable.
 * The return value is always a number, so 0 for invalid arguments
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.3.6
 *
 * @param    {Object}    obj
 * @param    {boolean}   includeUndefined     True by default (faster)
 *
 * @return   {number}
 */
defStat(function size(obj, includeUndefined) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Mixed}    input
 *
 * @return   {number}
 */
defStat(function sizeof(input) {
	return calculate_sizeof(input, new WeakMap());
});

/**
 * Calculate the size of a variable
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Mixed}    input
 * @param    {WeakMap}  weak_map
 *
 * @return   {number}
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

	if (typeof input[SIZEOF] == 'function') {
		try {
			return input[SIZEOF]();
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
		if (!Object.hasOwn(input, key)) {
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
 * Symbol for aggregating array results
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @type     {symbol}
 */
const PATH_AGGREGATE = Blast.defineValue(Blast, 'PATH_AGGREGATE', Symbol('PATH_AGGREGATE'));

/**
 * Create the symbol for the sizeof method
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.6.0
 * @version   0.6.0
 *
 * @type     {symbol}
 */
const SIZEOF = Blast.defineValue(Blast, 'sizeofSymbol', Symbol('sizeof'));

/**
 * Create the alike comparer symbol
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.5.11
 * @version   0.5.11
 *
 * @type     {symbol}
 */
const ALIKE = Blast.defineValue(Blast, 'alikeSymbol', Symbol('alike'));

/**
 * Create the checksum symbol
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.6.5
 * @version   0.6.5
 *
 * @type     {symbol}
 */
const CHECKSUM = Blast.defineValue(Blast, 'checksumSymbol', Symbol('toChecksum'));

// Set it on some objects
Blast[CHECKSUM] = 'Protoblast';
Blast.Bound[CHECKSUM] = 'Blast.Bound';
Blast.Classes[CHECKSUM] = 'Blast.Classes';
Blast.Collection[CHECKSUM] = 'Blast.Collection';

/**
 * Flatten an object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.5.8
 *
 * @param    {Object}         obj              The object to flatten
 * @param    {string|Array}   divider          The divider to use (.)
 * @param    {boolean}        flatten_arrays   (true)
 *
 * @return   {Object}
 */
defStat(function flatten(obj, divider, flatten_arrays) {
	return flatten_object(obj, divider, 0, flatten_arrays);
});

/**
 * Flatten an object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.5.8
 *
 * @param    {Object}         obj       The object to flatten
 * @param    {string|Array}   divider   The divider to use (.)
 * @param    {number}         level
 * @param    {boolean}        flatten_arrays   (true)
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.5.0
 *
 * @param    {Object}    obj   The object to arrayify
 *
 * @return   {Array}
 */
defStat(function divide(obj) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.2.1
 *
 * @param    {Object}    obj            The object to arrayify
 *
 * @return   {Array}
 */
defStat(function dissect(obj) {

	var list = [],
	    key;

	if (Arr.likeArray(obj)) {
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
 * Parse a path and return an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @param    {string}   path   The dot notation path
 *
 * @return   {Array}
 */
defStat(function parseDotNotationPath(path) {

	if (Array.isArray(path)) {
		return path;
	}

	if (!path || typeof path != 'string') {
		return null;
	}

	return path.split('.');
});

/**
 * Get the value of the given property path
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.6.3
 *
 * @param    {symbol}   flag
 * @param    {Object}   obj
 * @param    {string}   path_string   The dot notation path
 *
 * @return   {Mixed}
 */
defStat(function path(_flag, _obj, _path_string) {

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

	if (flag == PATH_AGGREGATE) {
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.9.2
 */
defStat(function setPath(obj, path, value, skip_last_entry, allow_prototype, create_arrays = false) {

	let key,
	    end,
	    i;

	let pieces = Obj.parseDotNotationPath(path);

	// If no default end value is given, use a new object
	// Caution: undefined is also a valid end value,
	// so we check the arguments length for that
	if (typeof value == 'undefined' && arguments.length < 3) {
		value = {};
	}

	if (allow_prototype == null) {
		allow_prototype = true;
	}

	// Set out current position
	let here = obj;

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
			if (!skip_last_entry) {
				here[key] = value;
			}
		} else {
			if (here[key] == null || (typeof here[key] != 'object' && typeof here[key] != 'function')) {
				// If the wanted entry doesn't exist
				// AND the next key is a number, create an array
				if (create_arrays && (pieces[i+1] === '' || Number(pieces[i+1]) == pieces[i+1])) {
					here[key] = [];
				} else {
					here[key] = {};
				}
			}
		}

		if (!allow_prototype && !Object.hasOwn(here, key)) {
			return obj;
		}

		here = here[key];
	}

	return obj;
});

/**
 * Get the next index for this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Object}   obj
 *
 * @return   {number}
 */
defStat(function getNextIndex(obj) {

	var keys,
	    key = obj.length,
	    max,
	    nr,
	    i;

	if (key != null) {
		return key;
	}

	max = -1;

	keys = Object.values(obj);

	for (i = 0; i < keys.length; i++) {
		nr = Number(keys[i]);

		if (nr > max) {
			max = nr;
		}
	}

	return max + 1;
});

/**
 * Create a path in an object.
 * Example: my[special][object] would create an object like
 * {my: {special: {object: {}}}}
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.11
 * @version  0.9.2
 */
defStat(function setFormPath(obj, form_path, value, skip_last_entry, allow_prototype, create_arrays = true) {
	let path = Classes.RURL.parseFormPath(form_path);
	return Obj.setPath(obj, path, value, skip_last_entry, allow_prototype, create_arrays);
});

/**
 * See if the given path exists inside an object,
 * even if that value is undefined
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.4.1
 *
 * @param    {Object}   obj
 * @param    {string}   path   The dot notation path
 *
 * @return   {boolean}
 */
defStat(function exists(obj, path) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.5.0
 *
 * @param    {Object}   obj
 * @param    {boolean}  include_prototype   If true, prototypal properties also count
 *
 * @return   {boolean}
 */
defStat(function isEmpty(obj, include_prototype) {

	if (!obj) {
		return true;
	}

	return !(Object.keys(obj).length || (include_prototype && Object.keys(obj.prototype).length));
});

/**
 * Inject all properties of one object into another target object,
 * including non-enumerable ones
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param   {Object}   target     The object to inject the extension into
 * @param   {Object}   extension  The object to inject
 *
 * @returns {Object}   Returns the injected target (which it also modifies byref)
 */
defStat(function inject(target, first, second) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param   {Object}   obj     The object to test
 *
 * @returns {boolean}
 */
defStat(function isSelfContained(obj) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.9
 * @version  0.5.1
 *
 * @param   {Object}   target     The object to inject the extension into
 * @param   {Object}   extension  The object to inject
 *
 * @returns {Object}   Returns the injected target (which it also modifies byref)
 */
defStat(function merge(target, first, second) {

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
				if (Obj.isSelfContained(extension[key])) {
					// Null, primitives, dates, ...
					target[key] = extension[key];
				} else if (Array.isArray(extension[key])) {
					target[key] = extension[key].slice(0);
				} else {
					target[key] = Object.assign({}, extension[key]);
				}
			} else if (target.hasOwnProperty == null || target.hasOwnProperty(key)) {
				if (Obj.isSelfContained(extension[key])) {
					target[key] = extension[key];
				} else {

					if (target[key] && typeof target[key] == 'object') {
						merge(target[key], extension[key]);
					} else {
						target[key] = Object.assign(extension[key]);
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.2
 *
 * @param    {Mixed}   source
 * @param    {boolean} recursive
 * @param    {Mixed}   value
 *
 * @return   {Object}
 */
defStat(function objectify(source, recursive, value) {

	var result = {},
	    temp,
	    type,
	    key,
	    i;

	if (typeof value == 'undefined') {
		value = true;
	}

	// Convert object form of primitives to their primitive states
	if (Obj.isPrimitiveObject(source)) {
		source = source.valueOf();
	}

	if (Array.isArray(source)) {
		for (i = 0; i < source.length; i++) {

			if (typeof source[i] !== 'object') {
				result[source[i]] = value;
			} else if (Array.isArray(source[i])) {
				Object.assign(result, Object.objectify(source[i], recursive, value));
			} else {
				Object.assign(result, source[i]);
			}
		}
	} else if (Obj.isObject(source)) {
		Object.assign(result, source);
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
			result[key] = Obj.objectify(result[key], true, value);
		}
	}

	return result;
});

/**
 * Iterate over an object's properties
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.7.0
 *
 * @param    {Object}     obj
 * @param    {Function}   fnc
 */
defStat(function each(obj, fnc) {

	let key;

	for (key in obj) {
		fnc(obj[key], key, obj);
	}
});

/**
 * Walk over an object tree
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.6
 * @version  0.7.0
 *
 * @param    {Object}     obj     The object to walk over
 * @param    {Function}   fnc     The function to perform on every entry
 * @param    {number}     limit   Optional recursive limit
 * @param    {Array}      seen    Array to keep track of items already seen
 */
defStat(function walk(obj, fnc, limit, seen, wm) {

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

		if (!Object.hasOwn(obj, key)) {
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.1.3
 *
 * @param    {Object}     obj
 * @param    {Function}   fnc
 *
 * @return   {Object}
 */
defStat(function map(obj, fnc) {

	var isFunction = typeof fnc === 'function',
	    mapped = {};

	Obj.each(obj, function mapEach(value, key) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Object}     obj
 * @param    {Function}   fnc
 *
 * @return   {Object}
 */
defStat(function mapKeys(obj, fnc) {

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
		Obj.each(obj, mapEach);
	}

	return mapped;
});

/**
 * Get the key of a value in an array or object.
 * If the value is not found a false is returned (not -1 for arrays)
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.0
 * @version   0.1.0
 *
 * @param     {Object|Array}   target   The object to search in
 * @param     {Object}         value    The value to look for
 *
 * @return    {string|Number|boolean}
 */
defStat(function getValueKey(target, value) {

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
 * See if a key exists in an object or array
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.0
 * @version   0.1.6
 *
 * @param     {Object|Array}   target      The object to search in
 * @param     {string}          property   The key to look for
 *
 * @return    {boolean}
 */
defStat(function hasProperty(target, property) {

	if (target == null || typeof target != 'object' || (typeof target[property] === 'undefined' && !(property in target))) {
		return false;
	}

	return true;
});

/**
 * Look for a value in an object or array
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.0
 * @version   0.1.0
 *
 * @param     {Object|Array}   target   The object to search in
 * @param     {Object}         value    The value to look for
 *
 * @return    {boolean}
 */
defStat(function hasValue(target, value) {
	return !(Obj.getValueKey(target, value) === false);
});

/**
 * Calculate the checksum for the given value
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.3
 * @version   0.7.0
 *
 * @param     {Object|Array}   obj            The object to checksum
 * @param     {boolean}        sort_arrays    Sort arrays before checksumming? (true)
 *
 * @return    {string}
 */
defStat(function checksum(obj, sort_arrays) {

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
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.3
 * @version   0.8.14
 *
 * @param     {Object|Array}   obj            The object to checksum
 * @param     {boolean}        sort_arrays    Sort arrays before checksumming? (true)
 *
 * @return    {string}
 */
function _checksum(obj, sort_arrays, seen, level) {

	let type = typeof obj,
	    value_of,
	    is_class_instance,
	    has_different_value;

	// Make sure primitives are primitive
	if (type == 'object' && obj != null) {
		let custom_type = typeof obj[CHECKSUM];

		if (custom_type == 'string') {
			return obj[CHECKSUM];
		} else if (custom_type == 'function') {
			let checksum = obj[CHECKSUM]();

			if (typeof checksum == 'string' && checksum.length < 32) {
				return checksum;
			}

			return _checksum(checksum, sort_arrays, seen, level + 1);
		} else if (typeof obj.valueOf == 'function') {
			// Get the value of the object
			value_of = obj.valueOf();
			has_different_value = value_of !== obj;

			// If the value is different, use that from here on out
			// This handles primitive objects & dates
			if (has_different_value) {

				// Test for String, Number of Boolean instances
				if (Obj.isPrimitiveObject(obj)) {
					obj = value_of;
					type = typeof obj;
					is_class_instance = false;
				} else {
					if (obj.constructor?.name == 'Date') {
						// Things like dates should not be handled as JUST numbers
						type = 'date';
						obj = value_of;
					}

					is_class_instance = true;
				}
			}
		}
	}

	let ident;

	if (type == 'function') {
		type = 'string';
		obj = String(obj);
		ident = 'F';
	} else {
		ident = 'S';
	}

	// Simple primitive checksums
	if (type == 'string') {
		let length = obj.length;
		let split_length = ~~(obj.length / 2);

		// Make one of the strings longer than the other
		if (split_length > 2) {
			split_length -= 1;
		}

		return ident + length + '-' + Str.checksum(obj, 0, split_length).toString(36) + Str.checksum(obj, split_length).toString(36);
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

	let result,
	    names;

	if (Array.isArray(obj)) {
		// Clone the array
		obj = obj.slice(0);

		// And sort it alphabetically
		if (sort_arrays) {
			Arr.safesort(obj);
		}

		// Create the names
		names = Arr.range(obj.length);

		result = 'A';
	} else if (Blast.isNode && Buffer.isBuffer(obj)) {

		if (!libcrypto) {
			libcrypto = require('crypto');
		}

		return 'BUF' + libcrypto.createHash('md5').update(obj).digest('hex');
	} else {

		if (is_class_instance == null) {
			is_class_instance = !Obj.isPlainObject(obj);
			value_of = obj.valueOf?.();
		}

		if (is_class_instance) {

			let serialized,
			    had_error;

			if (typeof obj.toDry == 'function') {
				try {
					serialized = obj.toDry();
					had_error = false;
				} catch (err) {
					had_error = true;
				}
			}
			
			if ((had_error || had_error == null) && typeof obj.toJSON == 'function') {
				try {
					serialized = obj.toJSON();
					had_error = false;
				} catch (err) {
					had_error = true;
				}
			}

			// Let the result start with a C and the checksum of the constructor name
			result = 'C' + Str.checksum(obj.constructor.name).toString(36);

			if ((had_error || had_error == null)) {
				// Get all the keys of the object and sort them alphabetically
				names = Object.getOwnPropertyNames(obj).sort();
			}
			
			if (!names || !names.length) {

				let serialized_checksum = _checksum(serialized, sort_arrays, seen, level + 1);

				// The serialized checksum will always start with 'A2-S'
				return result + '-' + serialized_checksum;
			}
		} else {
			result = 'O';

			// Get all the keys of the object and sort them alphabetically
			names = Object.getOwnPropertyNames(obj).sort();
		}
	}

	let counter = 0,
	   temp = '',
	   val,
	   key,
	   i;

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
				let idx = seen.indexOf(val);

				// Handle objects recursively, but beware of circular references
				if (idx == -1) {
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
 * Loosely compare 2 variables, ignoring undefined variables
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.3
 * @version   0.8.15
 *
 * @param     {Object}   a
 * @param     {Object}   b
 * @param     {Array}    seen
 *
 * @return    {boolean}
 */
defStat(function alike(a, b, seen) {

	// If they're equals, return true
	if (a === b) {
		return true;
	}

	let type_a = a === null ? 'null' : typeof a,
	    type_b = b === null ? 'null' : typeof b;

	// Make sure the first value is an object
	if (type_a == 'object' || type_b == 'object' && type_a != type_b) {
		let temp;

		if (type_a == 'object') {
			temp = a;
			a = b;
			b = temp;
		} else {
			temp = b;
			b = a;
			a = temp;
		}
	}

	if (!seen) {
		seen = {
			objects : [],
			ids     : []
		};
	}

	if (a && typeof a[ALIKE] == 'function') {
		return a[ALIKE](b, seen);
	}

	if (b && typeof b[ALIKE] == 'function') {
		return b[ALIKE](a, seen);
	}

	if (a && typeof a.equals == 'function') {
		try {
			let result = a.equals(b);

			if (typeof result == 'boolean') {
				return result;
			}
		} catch (err) {
			// Ignore
		}
	}

	if (b && typeof b.equals == 'function') {
		try {
			let result = b.equals(a);

			if (typeof result == 'boolean') {
				return result;
			}
		} catch (err) {
			// Ignore
		}
	}

	// Both types should match
	if (type_a != type_b) {
		return false;
	}

	// From this point on, both values should be objects
	if (type_a !== 'object') {
		return false;
	}

	// If they don't have the same size (minus undefineds) return false
	if (Obj.size(a, false) != Obj.size(b, false)) {
		return false;
	}

	let key;

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

	let index_a,
	    index_b,
	    id_a,
	    id_b;

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
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.4
 * @version   0.1.4
 *
 * @param     {Object}   obj
 *
 * @return    {Object}
 */
defStat(function enumerateOwnProperties(obj) {

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
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.1.4
 * @version   0.1.4
 *
 * @param     {Object}   obj
 *
 * @return    {Object}
 */
defStat(function enumerateOwnDescriptors(obj) {

	var result = {},
	    keys = Object.getOwnPropertyNames(obj),
	    i;

	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
	}

	return result;
});

/**
 * Get the first entry of an object or array
 * If it is neither, just return the value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.11
 * @version  0.5.4
 *
 * @param    {Object}    obj
 */
defStat(function first(obj) {

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