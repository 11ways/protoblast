module.exports = function BlastObject(Blast, Collection) {

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Boolean|Number}   tab   If indent should be used
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Object', 'toSource', function toSource(tab) {

		var result = '',
		    passtab,
		    type,
		    key;

		if (tab === true) {
			tab = 1;
		}

		if (tab > 0) {
			passtab = tab + 1;
		} else {
			passtab = tab;
			tab = 0;
		}

		for (key in this) {
			if (this.hasOwnProperty(key)) {

				type = typeof this[key];

				if (!result) {
					result = '({';
				} else {
					result += ',';
				}

				if (tab) {
					result += '\n';
				}

				result += Blast.Bound.String.multiply('\t', tab) + JSON.stringify(key) + ': ';
				result += Blast.uneval(this[key], passtab);
			}
		}

		if (!result) {
			result = '({';
		} else {
			if (tab) {
				result += '\n' + Blast.Bound.String.multiply('\t', tab-1);
			}
		}

		result += '})';

		return result;
	}, true);

	/**
	 * Check if the argument is actually an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}    obj
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Object', 'isObject', function isObject(obj) {

		if (!obj) {
			return false;
		}

		return typeof obj === 'object';
	});

	/**
	 * Check if the argument is a plain object
	 * (created with an object literal or new Object)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}    obj
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Object', 'isPlainObject', function isPlainObject(obj) {

		if (!obj) {
			return false;
		}

		if (obj.constructor.name === 'Object') {
			return true;
		}

		return false;
	});

	/**
	 * Check if the argument is the object form of a primitive
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.8
	 *
	 * @param    {Object}    obj
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Object', 'isPrimitiveObject', function isPrimitiveObject(obj) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {Mixed}   arg
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Object', 'isPrimitive', function isPrimitive(arg) {

		var type = typeof arg;

		if (type == 'string' || type == 'number' || type == 'boolean') {
			return true;
		}

		return false;
	});

	/**
	 * Get the size (length) of any given variable.
	 * The return value is always a number, so 0 for invalid arguments
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Object}    obj
	 * @param    {Boolean}   includeUndefined     True by default (faster)
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Object', 'size', function size(obj, includeUndefined) {

		var type,
		    key,
		    len;

		if (!obj) {
			return 0;
		}

		// Use the object's numeric length property if it has one
		if (typeof obj.length === 'number') {
			return obj.length;
		}

		if (Collection.Object.isPlainObject(obj)) {
			return Object.keys(obj).length;
		}

		type = typeof obj;

		if (type == 'number' || typeof (0+obj) == 'number') {
			return 0+obj;
		}

		if (type == 'boolean') {
			return Number(obj);
		}

		// Get the length of all the enumerable keys
		len = Object.keys(obj).length;

		// Do a (slow) iterate if we have to filter out undefineds
		if (includeUndefined === false) {
			for (key in obj) {
				if (typeof obj[key] === 'undefined') {
					len--;
				}
			}
		}

		return len;
	});

	/**
	 * Flatten an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}    obj            The object to flatten
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Object', 'flatten', function flatten(obj) {

		var result = {},
		    temp,
		    key,
		    sub;

		for (key in obj) {

			// Only flatten own properties
			if (!obj.hasOwnProperty(key)) continue;

			if (Collection.Object.isPlainObject(obj[key])) {
				temp = flatten(obj[key]);

				// Inject the keys of the sub-object into the result
				for (sub in temp) {

					// Again: skip prototype properties
					if (!temp.hasOwnProperty(sub)) continue;

					result[key + '.' + sub] = temp[sub];
				}
			} else if (Collection.Object.isPrimitiveObject(obj[key])) {
				// Convert object form of primitives to their primitive values
				result[key] = obj[key].valueOf();
			} else {
				result[key] = obj[key];
			}
		}

		return result;
	});

	/**
	 * Create a new object for every key-value and wrap them in an array
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}    obj            The object to arrayify
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Object', 'divide', function divide(obj) {

		var list = [],
		    temp,
		    key;

		for (key in obj) {
			temp = {};
			temp[key] = obj[key];

			list[list.length] = temp;
		}

		return list;
	});

	/**
	 * Like divide, but key and value both become properties
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}    obj            The object to arrayify
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Object', 'dissect', function disect(obj) {

		var list = [],
		    key;

		for (key in obj) {
			list[list.length] = {
				key: key,
				value: obj[key]
			};
		}

		return list;
	});

	/**
	 * Get the value of the given property path,
	 * or set it (but only if the full path exists)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.2
	 *
	 * @param    {Object}   obj
	 * @param    {String}   pathString   The dot notation path
	 *
	 * @return   {Mixed}
	 */
	Blast.defineStatic('Object', 'path', function path(obj, pathString) {

		var pieces,
		    result,
		    here,
		    key,
		    end,
		    i;

		if (typeof pathString !== 'string') {
			if (Array.isArray(pathString)) {
				pieces = pathString;
			} else {
				return;
			}
		} else {
			pieces = [];

			for (i = 1; i < arguments.length; i++) {
				pieces = pieces.concat(arguments[i].split('.'));
			}
		}

		here = obj;

		// Go over every piece in the path
		for (i = 0; i < pieces.length; i++) {

			// Get the current key
			key = pieces[i];

			if (here !== null && here !== undefined) {
				here = here[key];

				// Is this the final piece?
				end = ((i+1) == pieces.length);

				if (end) {
					result = here;
				}
			}
		}

		return result;
	});

	/**
	 * Create a path in an object.
	 * Example: my.special.object would create an object like
	 * {my: {special: {object: {}}}}
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 */
	Blast.defineStatic('Object', 'setPath', function setPath(obj, path, value, skipLastEntry) {

		var argLength = arguments.length,
		    pieces,
		    here,
		    key,
		    end,
		    i;

		if (typeof path !== 'string') {
			if (Array.isArray(path)) {
				pieces = path;
			} else {
				return;
			}
		} else {
			pieces = path.split('.');
		}

		// If no default end value is given, use a new object
		// Caution: undefined is also a valid end value,
		// so we check the arguments length for that
		if (typeof value == 'undefined' && argLength < 3) {
			value = {};
		}

		// Set out current position
		here = obj;

		for (i = 0; i < pieces.length; i++) {
			key = pieces[i];

			// Is this the final piece?
			end = ((i+1) == pieces.length);

			if (end) {

				// Only set the last entry if we don't want to skip it
				if (!skipLastEntry) {
					here[key] = value;
				}
			} else if (typeof here[key] != 'object' || here[key] === null) {
				here[key] = {};
			}

			here = here[key];
		}

		return obj;
	});

	/**
	 * See if the given path exists inside an object,
	 * even if that value is undefined
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   obj
	 * @param    {String}   path   The dot notation path
	 *
	 * @return   {Mixed}
	 */
	Blast.defineStatic('Object', 'exists', function exists(obj, path) {

		var pieces,
		    result,
		    hereType,
		    here,
		    key,
		    end,
		    i;

		if (!path) {
			return false;
		}

		result = false;
		pieces = path.split('.');

		// Set the object as the current position
		here = obj;

		// Go over every piece in the path
		for (i = 0; i < pieces.length; i++) {

			// Get the current key
			key = pieces[i];
			hereType = typeof here;

			if (here === null || here === undefined) {
				return false;
			}

			if (here !== null && here !== undefined) {
				
				// Is this the final piece?
				end = ((i+1) == pieces.length);

				if (end) {
					if (here[key] || ((hereType == 'object' || hereType == 'function') && key in here)) {
						result = true;
					}
					break;
				}

				here = here[key];
			}
		}

		return result;
	});

	/**
	 * Determine if the object is empty
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   obj
	 * @param    {Boolean}  includePrototype   If true, prototypal properties also count
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Object', 'isEmpty', function isEmpty(obj, includePrototype) {

		var key;

		if (!obj) {
			return true;
		}

		for(key in obj) {
			if (includePrototype || obj.hasOwnProperty(key)) {
				return false;
			}
		}

		return true;
	});

	/**
	 * Get an array of the object values.
	 * Does not include prototype or non-enumerables by default.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.3
	 *
	 * @param    {Object}   obj                The object to get the values from
	 * @param    {Array}    keys               The order of the keys to use
	 * @param    {Boolean}  includePrototype   If true, prototypal properties also count
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Object', 'values', function values(obj, keys, includePrototype) {

		var skipProtocheck,
		    result,
		    length,
		    key,
		    i;

		// If no object is given, return an empty array
		if (!obj) {
			return result;
		}

		// If no key order is given, use the keys of the object itself
		if (!Array.isArray(keys)) {

			// Remember the prototype value
			includePrototype = keys;

			// Get all the own, enumerable keys
			keys = Object.keys(obj);

			// If we want the prototype, add them
			if (includePrototype) {
				keys = keys.concat(Object.keys(Object.getPrototypeOf(obj)));
			}

			skipProtocheck = true;
		} else if (typeof includePrototype == 'undefined') {
			// When keys have been given, includePrototype defaults to true.
			// Because the user specifically wants that key
			includePrototype = true;
			skipProtocheck = true;
		}

		// Get the amount of keys
		length = keys.length;

		// Prepare the array
		result = new Array(length);

		for (i = 0; i < length; i++) {

			key = keys[i];

			if (skipProtocheck || obj.hasOwnProperty(key)) {
				result[i] = obj[key];
			}
		}

		return result;
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
	Blast.defineStatic('Object', 'assign', function assign(target, first, second) {

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
	Blast.defineStatic('Object', 'inject', function inject(target, first, second) {

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
	 * Convert an array to an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.2
	 *
	 * @param    {Mixed}   source
	 * @param    {Boolean} recursive
	 * @param    {Mixed}   value
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Object', 'objectify', function objectify(source, recursive, value) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}     obj
	 * @param    {Function}   fnc
	 */
	Blast.defineStatic('Object', 'each', function each(obj, fnc) {

		var key;

		for (key in obj) {
			fnc(obj[key], key, obj);
		}
	});

	/**
	 * Walk over an object tree
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.6
	 * @version  0.1.6
	 *
	 * @param    {Object}     obj
	 * @param    {Function}   fnc
	 */
	Blast.defineStatic('Object', 'walk', function walk(obj, fnc, seen) {

		var key;

		if (!seen) {
			seen = [];
		}

		for (key in obj) {

			if (!obj.hasOwnProperty(key)) {
				continue;
			}

			// Fire the function
			fnc(obj[key], key, obj);

			if (typeof obj[key] == 'object' && obj[key] !== null) {

				if (seen.indexOf(obj[key]) == -1) {

					// Add this object to the seen list
					seen.push(obj[key]);

					// Walk this object, too
					walk(obj[key], fnc, seen);
				}
			}
		}
	});

	/**
	 * Map an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.3
	 *
	 * @param    {Object}     obj
	 * @param    {Function}   fnc
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Object', 'map', function map(obj, fnc) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Object}     obj
	 * @param    {Function}   fnc
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Object', 'mapKeys', function mapKeys(obj, fnc) {

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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object|Array}   target   The object to search in
	 * @param     {Object}         value    The value to look for
	 *
	 * @return    {String|Number|Boolean}
	 */
	Blast.defineStatic('Object', 'getValueKey', function getValueKey(target, value) {

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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.2
	 * @version   0.1.2
	 *
	 * @param     {Object|Array}   obj    The object to search in
	 * @param     {String}         expr   The expression to use
	 *
	 * @return    {Array}
	 */
	Blast.defineStatic('Object', 'extract', function extract(obj, expr, arg) {
		var P = new Blast.Classes.JSONPath(expr, arg);
		return P.exec(obj);
	});

	/**
	 * See if a key exists in an object or array
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.6
	 *
	 * @param     {Object|Array}   target      The object to search in
	 * @param     {String}          property   The key to look for
	 *
	 * @return    {Boolean}
	 */
	Blast.defineStatic('Object', 'hasProperty', function hasProperty(target, property) {

		if (target == null || typeof target != 'object' || (typeof target[property] === 'undefined' && !(property in target))) {
			return false;
		}

		return true;
	});

	/**
	 * Look for a value in an object or array
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object|Array}   target   The object to search in
	 * @param     {Object}         value    The value to look for
	 *
	 * @return    {Boolean}
	 */
	Blast.defineStatic('Object', 'hasValue', function hasValue(target, value) {
		return !(Collection.Object.getValueKey(target, value) === false);
	});

	/**
	 * Calculate the checksum for the given value
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.3
	 * @version   0.1.8
	 *
	 * @param     {Object|Array}   obj
	 * @param     {Array}          seen
	 *
	 * @return    {String}
	 */
	Blast.defineStatic('Object', 'checksum', function checksum(obj, seen) {

		var counter,
		    result,
		    names,
		    stemp,
		    type,
		    temp,
		    val,
		    key,
		    idx,
		    i;

		type = typeof obj;

		if (!seen || !Array.isArray(seen)) {
			seen = [obj];
		}

		// Make sure primitives are primitive
		if (type == 'object' && Blast.Bound.Object.isPrimitiveObject(obj)) {
			obj = obj.valueOf();
			type = typeof obj;
		}

		// Simple primitive checksums
		if (type == 'string') {
			return 'S' + obj.length + '-' + Blast.Bound.String.checksum(obj);
		} else if (type == 'number') {
			return 'N' + obj;
		} else if (type == 'boolean') {
			return 'B' + Number(obj);
		}

		if (Array.isArray(obj)) {
			// Clone the array
			obj = obj.slice(0);

			// And sort it alphabetically
			obj.sort();

			// Create the names
			names = Blast.Bound.Array.range(obj.length);

			result = 'A';
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

			// Skip undefined keys
			if (typeof val == 'undefined') {
				continue;
			}

			counter++;

			if (temp) temp += '+';

			if (val) {

				// Cast object instances of primitives to strings
				if (Blast.Bound.Object.isPrimitiveObject(val)) {
					val = ''+val;
				} else if (typeof val == 'object') {
					// Handle objects recursively, but beware of circular references
					if ((idx = seen.indexOf(val)) == -1) {
						stemp = seen.slice(0);
						stemp.push(val);
						temp += checksum(val, stemp);
					} else {
						temp += 'R' + idx;
					}
				} else {
					temp += val;
				}

			} else {
				temp += key + ':' + val;
			}
		}

		// The length is the first part of the checksum,
		// for arrays this is very important as undefineds count
		if (result == 'A') {
			counter = names.length;
		}

		result += counter + '-';

		// Now create another checksum
		result += ~~(temp.length/counter) + '-' + Blast.Bound.String.checksum(temp);

		return result;
	});

	/**
	 * Loosely compare 2 variables, ignoring undefined variables
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.3
	 * @version   0.1.3
	 *
	 * @param     {Object}   a
	 * @param     {Object}   b
	 *
	 * @return    {Boolean}
	 */
	Blast.defineStatic('Object', 'alike', function alike(a, b) {

		// If they're equals, return true
		if (a == b) {
			return true;
		}

		// If they don't have the same size (minus undefineds) return false
		if (Blast.Bound.Object.size(a, false) != Blast.Bound.Object.size(b, false)) {
			return false;
		}

		return Blast.Bound.Object.checksum(a) == Blast.Bound.Object.checksum(b);
	});

	/**
	 * Return the object with all the own properties as if they were enumerable
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.4
	 * @version   0.1.4
	 *
	 * @param     {Object}   obj
	 *
	 * @return    {Object}
	 */
	Blast.defineStatic('Object', 'enumerateOwnProperties', function enumerateOwnProperties(obj) {

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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.4
	 * @version   0.1.4
	 *
	 * @param     {Object}   obj
	 *
	 * @return    {Object}
	 */
	Blast.defineStatic('Object', 'enumerateOwnDescriptors', function enumerateOwnDescriptors(obj) {

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
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object}   obj
	 *
	 * @return    {String}
	 */
	Blast.defineStatic('Object', 'uneval', Blast.uneval);

};