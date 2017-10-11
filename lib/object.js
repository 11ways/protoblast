module.exports = function BlastObject(Blast, Collection) {

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
	Blast.defineStatic('Object', 'getPropertyDescriptor', function getPropertyDescriptor(target, key) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.3.7
	 *
	 * @param    {Object}    obj
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Object', 'isPlainObject', function isPlainObject(obj) {

		if (!obj) {
			return false;
		}

		if (!obj.constructor || obj.constructor.name === 'Object') {
			return true;
		}

		return false;
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.3.6
	 *
	 * @param    {Object}    obj
	 * @param    {Boolean}   includeUndefined     True by default (faster)
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Object', 'size', function size(obj, includeUndefined) {

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

		if (Collection.Object.isPlainObject(obj)) {
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
	 * Flatten an object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.2.1
	 *
	 * @param    {Object}    obj            The object to arrayify
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Object', 'dissect', function disect(obj) {

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
	 * Get the value of the given property path,
	 * or set it (but only if the full path exists)
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.9
	 *
	 * @param    {Object}   obj
	 * @param    {String}   pathString   The dot notation path
	 *
	 * @return   {Mixed}
	 */
	Blast.defineStatic('Object', 'path', function path(obj, pathString) {

		var pieces,
		    here,
		    len,
		    i;

		if (typeof pathString !== 'string') {
			if (Array.isArray(pathString)) {
				pieces = pathString;
			} else {
				return;
			}
		} else {
			len = arguments.length;
			if (len == 2) {
				pieces = arguments[1].split('.');
			} else {
				pieces = new Array(len-1);

				for (i = 1; i < len; i++) {
					pieces[i-1] = arguments[i]
				}
			}
		}

		here = obj;

		// Go over every piece in the path
		for (i = 0; i < pieces.length; i++) {
			if (here != null) {
				here = here[pieces[i]];
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
	 * @version  0.1.11
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

			if (key == '') {
				key = here.length;
			}

			// Is this the final piece?
			end = ((i+1) == pieces.length);

			if (end) {

				// Only set the last entry if we don't want to skip it
				if (!skipLastEntry) {
					here[key] = value;
				}
			} else if (typeof here[key] != 'object' || here[key] === null) {
				// If the wanted entry doesn't exist
				// AND the next key is a number, create an array
				if (pieces[i+1] === '' || Number(pieces[i+1]) == pieces[i+1]) {
					here[key] = [];
				} else {
					here[key] = {};
				}
			}

			here = here[key];
		}

		return obj;
	});

/**
	 * Extract form path info
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 *
	 * @param    {String}   str
	 */
	function getFormPathArray(str) {
		var root_name  = /^(.*?)(?:\[|$)/,
		    prop_name  = /(?:\[(.*?)\])/g,
		    properties = [],
		    temp;

		temp = root_name.exec(str);

		// Look for the root name
		if (temp && typeof temp[1] !== 'undefined') {
			properties.push(temp[1]);
		}

		// Look for the sub property names
		while (temp = prop_name.exec(str)) {
			properties.push(temp[1]);
		}

		return properties;
	}

	/**
	 * Get the value of the given property path (in the form format)
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 *
	 * @param    {Object}   obj
	 * @param    {String}   form_path   The form notation path
	 */
	Blast.defineStatic('Object', 'formPath', function formPath(obj, form_path) {
		var path = getFormPathArray(form_path);
		return Collection.Object.path(obj, path);
	});

	/**
	 * Create a path in an object.
	 * Example: my[special][object] would create an object like
	 * {my: {special: {object: {}}}}
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 */
	Blast.defineStatic('Object', 'setFormPath', function setFormPath(obj, form_path, value, skipLastEntry) {
		var path = getFormPathArray(form_path);
		return Collection.Object.setPath(obj, path, value, skipLastEntry);
	});

	/**
	 * See if the given path exists inside an object,
	 * even if that value is undefined
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	Blast.defineStatic('Object', 'isSelfContained', function isSelfContained(obj) {

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
	 * @version  0.3.7
	 *
	 * @param   {Object}   target     The object to inject the extension into
	 * @param   {Object}   extension  The object to inject
	 *
	 * @returns {Object}   Returns the injected target (which it also modifies byref)
	 */
	Blast.defineStatic('Object', 'merge', function merge(target, first, second) {

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
				} else {
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.6
	 * @version  0.3.8
	 *
	 * @param    {Object}     obj     The object to walk over
	 * @param    {Function}   fnc     The function to perform on every entry
	 * @param    {Number}     limit   Optional recursive limit
	 * @param    {Array}      seen    Array to keep track of items already seen
	 */
	Blast.defineStatic('Object', 'walk', function walk(obj, fnc, limit, seen) {

		var key,
		    ret;

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

			if (!obj.hasOwnProperty(key)) {
				continue;
			}

			// Fire the function
			ret = fnc(obj[key], key, obj);

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
						walk(obj[key], fnc, limit - 1, seen);
					}
				}
			}
		}
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author    Jelle De Loecker   <jelle@develry.be>
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
	 * @author    Jelle De Loecker   <jelle@develry.be>
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
	 * @author    Jelle De Loecker   <jelle@develry.be>
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
	 * @author    Jelle De Loecker   <jelle@develry.be>
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
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.3
	 * @version   0.4.0
	 *
	 * @param     {Object|Array}   obj
	 * @param     {Array}          seen
	 *
	 * @return    {String}
	 */
	Blast.defineStatic('Object', 'checksum', function checksum(obj, seen) {

		var split_length,
		    counter,
		    result,
		    length,
		    names,
		    stemp,
		    type,
		    temp,
		    val,
		    key,
		    idx,
		    i;

		type = typeof obj;

		// Make sure primitives are primitive
		if (type == 'object' && obj != null && typeof obj.valueOf == 'function') {

			// Get the value of the object
			temp = obj.valueOf();

			// If the value is different, use that from here on out
			// This handles primitive objects & dates
			if (temp != obj) {
				obj = temp;
				type = typeof obj;
			}
		}

		// Simple primitive checksums
		if (type == 'string') {
			length = obj.length;
			split_length = ~~(obj.length / 2);

			// Make one of the strings longer than the other
			if (split_length > 2) {
				split_length -= 1;
			}

			return 'S' + length + '-' + Blast.Bound.String.checksum(obj, 0, split_length).toString(36) + Blast.Bound.String.checksum(obj, split_length).toString(36);
		} else if (type == 'number') {
			return 'N' + obj;
		} else if (type == 'boolean') {
			return 'B' + Number(obj);
		} else if (type == 'undefined') {
			return 'U';
		} else if (obj == null) {
			return 'L';
		} else if (obj.constructor && obj.constructor.name == 'RegExp') {
			return 'R' + checksum(String(obj));
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

			counter++;

			if (temp) temp += '+';

			// Normalize non-falsy values
			if (val) {
				// Cast object instances of primitives to strings
				if (Blast.Bound.Object.isPrimitiveObject(val)) {
					val = ''+val;
				} else if (typeof val == 'object') {

					// Make sure seen exists
					if (!seen) {
						seen = [obj];
					}

					// Handle objects recursively, but beware of circular references
					if ((idx = seen.indexOf(val)) == -1) {
						seen.push(val);
						val = checksum(val, seen);
					} else {
						val = 'R' + idx;
					}
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
		result += checksum(temp);

		return result;
	});

	/**
	 * Loosely compare 2 variables, ignoring undefined variables
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.3
	 * @version   0.4.0
	 *
	 * @param     {Object}   a
	 * @param     {Object}   b
	 * @param     {Array}    seen
	 *
	 * @return    {Boolean}
	 */
	Blast.defineStatic('Object', 'alike', function alike(a, b, seen) {

		var index_a,
		    index_b,
		    id_a,
		    id_b,
		    key;

		// If they're equals, return true
		if (a === b) {
			return true;
		}

		// If they don't have the same size (minus undefineds) return false
		if (Blast.Bound.Object.size(a, false) != Blast.Bound.Object.size(b, false)) {
			return false;
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

		if (!seen) {
			seen = {
				objects : [],
				ids     : []
			};
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
					// we'll have to do a more expensive check
					if (index_a > -1 || index_b > -1) {
						id_a = null;
						id_b = null;

						if (index_a > -1) {
							id_a = seen.ids[index_a];
						} else {
							index_a = seen.objects.push(a[key]) - 1;
						}

						if (!id_a) {
							id_a = Blast.Bound.Object.checksum(a[key]);
							seen.ids[index_a] = id_a;
						}

						if (index_b > -1) {
							id_b = seen.ids[index_b];
						} else {
							index_b = seen.objects.push(b[key]) - 1;
						}

						if (!id_b) {
							id_b = Blast.Bound.Object.checksum(b[key]);
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
	 * @author    Jelle De Loecker   <jelle@develry.be>
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
	 * @version  0.1.11
	 *
	 * @param    {Object}    obj
	 */
	Blast.defineStatic('Object', 'first', function first(obj) {

		var key;

		if (Array.isArray(obj)) {
			return obj[0];
		} else if (obj && typeof obj == 'object') {
			for (key in obj) {
				return obj[key];
			}
		}

		return obj;
	});

};