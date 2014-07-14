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
	 * @version  0.1.2
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

		// Get the constructor name
		id = obj.constructor.name;

		// If it's constructed by one of the 3 primitives, return true
		if (id == 'String' || id == 'Number' || id == 'Boolean') {
			return true;
		}

		return false;
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

	var flattenObject = function(ob) {
	var toReturn = {};
	
	for (var i in ob) {
		if (!ob.hasOwnProperty(i)) continue;
		
		if ((typeof ob[i]) == 'object') {
			var flatObject = flattenObject(ob[i]);
			for (var x in flatObject) {
				if (!flatObject.hasOwnProperty(x)) continue;
				
				toReturn[i + '.' + x] = flatObject[x];
			}
		} else {
			toReturn[i] = ob[i];
		}
	}
	return toReturn;
};

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
	 * Get the value of the given property path
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.2
	 *
	 * @param    {Object}   obj
	 * @param    {String}   path   The dot notation path
	 *
	 * @return   {Mixed}
	 */
	Blast.defineStatic('Object', 'path', function path(obj, path) {

		var pieces,
		    result,
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

		var pieces = path.split('.'),
		    result = false,
		    hereType,
		    here,
		    key,
		    end,
		    i;

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
	 * Get an array of the object values
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Object}   obj
	 * @param    {Boolean}  includePrototype   If true, prototypal properties also count
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Object', 'values', function isEmpty(obj, includePrototype) {

		var result = [],
		    key;

		if (!obj) {
			return result;
		}

		for(key in obj) {
			if (includePrototype || obj.hasOwnProperty(key)) {
				result[result.length] = obj[key];
			}
		}

		return result;
	}, true);

	/**
	 * Inject the properties of one object into another target object
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
	 * Map an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}     obj
	 * @param    {Function}   fnc
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Object', 'map', function map(obj, fnc) {

		var mapped = {};

		Collection.Object.each(obj, function mapEach(value, key) {
			mapped[key] = fnc(value, key, obj);
		});

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
	 * See if a key exists in an object or array
	 *
	 * @author    Jelle De Loecker   <jelle@codedor.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object|Array}   target      The object to search in
	 * @param     {String}          property   The key to look for
	 *
	 * @return    {Boolean}
	 */
	Blast.defineStatic('Object', 'hasProperty', function hasProperty(target, property) {

		if (target && (typeof target[property] !== 'undefined' || property in target)) {
			return true;
		}

		return false;
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