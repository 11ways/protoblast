const defStat = Blast.createStaticDefiner('Array'),
      defProto = Blast.createProtoDefiner('Array'),
      Arr = Bound.Array,
      isArray = (input) => Array.isArray(input);

/**
 * Is the given variable an array-like object?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Mixed}   variable
 *
 * @return   {boolean}
 */
defStat(function likeArray(variable) {

	// Return the variable unmodified if it's already an array
	if (isArray(variable)) {
		return true;
	}

	// Convert array-like objects to regular arrays
	if (variable && typeof variable == 'object') {

		// If the variable has a 'length' property, it could be array-like
		if (typeof variable.length == 'number') {
			return true;
		}
	}

	return false;
});

/**
 * Cast a variable to an array.
 * Also turns array-like objects into real arrays, except String objects.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.7.20
 *
 * @param    {Mixed}   variable
 *
 * @return   {Array}
 */
defStat(function cast(variable) {

	// Return the variable unmodified if it's already an array
	if (isArray(variable)) {
		return variable;
	}

	let type = typeof variable;

	// Convert array-like objects to regular arrays
	if (variable && type == 'object') {

		// If the variable has a 'length' property, it could be array-like
		if (typeof variable.length == 'number') {

			// Skip it if it's a String object (not a string primitive)
			// or an HTML element (SELECTs also have a length)
			if (variable.constructor.name !== 'String' && variable.nodeType == null) {
				return Array.prototype.slice.call(variable, 0);
			}
		} else if (typeof variable.size == 'number') {
			if (variable instanceof Map || variable instanceof Set) {
				return Array.from(variable);
			}
		}
	} else if (type == 'undefined') {
		return [];
	}

	// Return the variable wrapped in an array otherwise
	return [variable];
});

/**
 * Create an array containing arithmetic progressions,
 * an implementation of Python's range function
 *
 * @author   Tomasz Jaskowski <http://www.jaskowski.info/>
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}   start   The first value, defaults to 0
 * @param    {number}   stop    The last value, is required
 * @param    {number}   step    The step value, defaults to 1
 *
 * @return   {Array}
 */
defStat(function range(start, stop, step) {

	var result = [],
	    i;

	// If only 1 argument is given, interpret it as the stop parameter
	if (typeof stop == 'undefined') {
		stop = start;
		start = 0;
	} else {

		// Make sure start is a valid number
		if (typeof start != 'number') {
			start = Number(start) || 0;
		}

		// Make sure stop is a valid number
		if (typeof stop != 'number') {
			stop = Number(stop);
		}
	}

	// If no valid step is given, just use a step of 1
	if (typeof step == 'undefined') {
		step = 1;
	} else if (typeof step != 'number') {
		step = Number(step) || 1;
	}

	if (!((step>0 && start>=stop) || (step<0 && start<=stop))) {
		for (i = start; step > 0 ? i < stop : i > stop; i += step) {
			result.push(i);
		}
	}

	return result;
});

/**
 * Get the first value of an array,
 * or the first nr of wanted values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.2
 *
 * @param    {number}   nr   Return the first nr of values in a new array
 *
 * @return   {Mixed}
 */
defProto(function first(nr, page) {

	if (typeof nr === 'number') {

		if (typeof page === 'number') {
			page = nr * page;
			nr = nr + page;
		} else {
			page = 0;
		}

		return this.slice(page, nr);
	}

	return this[0];
});

/**
 * Get the last value of an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.2
 *
 * @param    {number}   nr   Return the first nr of values in a new array
 *
 * @return   {Mixed}
 */
defProto(function last(nr, page) {

	if (typeof nr === 'number') {

		nr = 0-nr;

		if (typeof page === 'number' && page) {
			page = nr * page;
			nr = nr + page;
		} else {
			page = undefined;
		}

		return this.slice(nr, page);
	}

	return this[this.length-1];
});

/**
 * Create the sum of all the values inside the array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {string}     property   The property name to use of all the values
 * @param    {Function}   map        The map function to use
 *
 * @return   {Number|String}
 */
defProto(function sum(property, map) {

	var sumResult,
	    propType,
	    mapType,
	    temp,
	    i;

	// If no map parameter is given, just sum everything as numbers
	if (!property && !map) {

		sumResult = this[0];

		for (i = 1; i < this.length; i++) {
			sumResult += this[i];
		}

		return sumResult;
	}

	// Get the parameter types
	propType = typeof property;

	if (propType == 'function') {
		propType = 'undefined';
		mapType = 'function';
		map = property;
	} else {
		mapType = typeof map;
	}

	// A property name has been given, we'll need to sum that property
	// of all the values
	if (propType == 'string') {

		if (mapType == 'function') {
			// When a map function is given, the property needs to use it
			sumResult = map(this[0][property]);

			for (i = 1; i < this.length; i++) {
				sumResult += map(this[i][property]);
			}
		} else {
			// No map function is given, just sum the property
			sumResult = this[0][property];

			for (i = 1; i < this.length; i++) {
				sumResult += this[i][property];
			}
		}

		return sumResult;
	}

	// Only a map function is given, we'll just map all the values
	if (mapType == 'function') {

		sumResult = map(this[0]);

		for (i = 1; i < this.length; i++) {
			sumResult += map(this[i]);
		}
	} else {
		throw new TypeError('Invalid arguments');
	}

	return sumResult;
});

/**
 * Clip the values inside the array.
 * Invalid values will be clipped to `lowest`
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.3.0
 *
 * @param    {number}   lowest    The lowest allowed value
 * @param    {number}   highest   The highest allowed value
 *
 * @return   {number}
 */
defProto(function clip(lowest, highest) {

	var length = this.length,
	    i;

	// If no lowest is given, infinity is allowed
	if (lowest == null) {
		lowest = -Infinity;
	}

	// If no highest is given, infinity is allowed
	if (highest == null) {
		highest = +Infinity;
	}

	// Iterate over all the elements in the array
	for (i = 0; i < length; i++) {
		if (!(lowest < this[i])) {
			// Value is too low
			this[i] = lowest;
		} else if (!(highest > this[i])) {
			// Value is too high
			this[i] = highest;
		}
	}

	return this;
});

/**
 * Get the closest numeric value inside an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}   goal   The goal we want to get the closest value to
 *
 * @return   {number}
 */
defProto(function closest(goal) {

	var closestVal = null,
	    i;

	for (i = 0; i < this.length; i++) {
		if (closestVal === null || Math.abs(this[i] - goal) < Math.abs(closestVal - goal)) {
			closestVal = this[i];
		}
	}

	return closestVal;
});

/**
 * Get the highest value inside the array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.4.1
 *
 * @param    {string}   path
 *
 * @return   {number}
 */
defProto(function max(path) {

	if (path) {
		return Arr.sortByPath(this.slice(0), -1, path)[0];
	}

	return Math.max.apply(Math, this);
});

/**
 * Get the lowest value inside the array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.4.1
 *
 * @param    {string}   path
 *
 * @return   {number}
 */
defProto(function min(path) {

	if (path) {
		return Arr.sortByPath(this.slice(0), 1, path)[0];
	}

	return Math.min.apply(Math, this);
});

/**
 * Insert item at the given index,
 * modifies the array in-place
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}   index   Where to insert the values
 * @param    {Mixed}    value
 *
 * @return   {Array}    The same array
 */
defProto(function insert(index, value) {

	var args,
	    i;

	// Make sure the array is at least as long up to the wanted index
	if (this.length < (index-1)) {
		this.length = index-1;
	}

	// Keep function optimized by not leaking the `arguments` object
	args = new Array(arguments.length-1);
	for (i = 0; i < args.length; i++) args[i] = arguments[i+1];

	this.splice.apply(this, [index, 0].concat(args));

	return this;
});

/**
 * Include an array (or multiple arrays) at the given index.
 * Impure function.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.11
 *
 * @param    {number}   index   Where to insert the contents of the array
 * @param    {Array}    values  The array of values
 *
 * @return   {Array}
 */
defProto(function include(_index, values) {

	var allValues,
	    index,
	    i;

	if (arguments.length == 1 || _index == null || typeof _index != 'number') {
		index = this.length;
		i = 1;
	} else {
		index = _index;
		i = 2;
	}

	if (this.length < index-1) {
		this.length = index;
	}

	// Start with all the values of the first array
	if (isArray(arguments[i-1])) {
		allValues = arguments[i-1].slice();
	} else {
		allValues = [arguments[i-1]];
	}

	// Now add all the other arrays
	for (; i < arguments.length; i++) {
		allValues = allValues.concat(arguments[i]);
	}

	// And finally: splice them in
	this.splice.apply(this, [index, 0].concat(allValues));

	return this;
});

/**
 * Flatten the array by returning a single-dimensional copy.
 * Pure function.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.9.0
 *
 * @param    {number}   limit   Recursive limit
 *
 * @return   {Array}
 */
defProto(function flatten(limit) {

	var result,
	    temp,
	    i;

	if (typeof limit !== 'number') {
		limit = Infinity;
	}

	result = [];

	for (i = 0; i < this.length; i++) {

		if (isArray(this[i]) && limit && limit > 0) {

			// Clone the array
			temp = this[i].slice();

			// Add the array
			result.push(...flatten.call(temp, limit-1));
		} else {
			result.push(this[i]);
		}
	}

	return result;
});

/**
 * Get all the unique values and return them as a new array.
 * Object contents will NOT be take into account.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.6.4
 *
 * @param    {string}   path   Path to use to check for uniqueness
 * @param    {Function} cast   Function used to cast values
 *
 * @return   {Array}    A new array with only unique values
 */
defProto(function unique(path, cast) {

	var result = [],
	    check = [],
	    entry,
	    i;

	if (typeof path == 'function') {
		cast = path;
		path = null;
	}

	// Create an array to check cast values
	check = [];

	for (i = 0; i < this.length; i++) {

		if (path == null) {
			entry = this[i];
		} else {
			entry = Obj.path(this[i], path);
		}

		if (cast) {
			entry = cast(entry);
		}

		if (check.indexOf(entry) === -1) {
			result.push(this[i]);
			check.push(entry);
		}
	}

	return result;
});

/**
 * Get the shared value between the 2 arrays
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.1.4
 *
 * @param    {Array}     arr            The array to test against
 * @param    {Function}  cast_function  Function to use to cast values
 *
 * @return   {Array}
 */
defProto(function shared(arr, cast_function) {

	// Make sure the given value to match against is an array
	arr = Arr.cast(arr);

	// Go over every item in the array, and return the ones they have in common
	return this.filter(function(value) {

		var test, i;

		// Cast the value if a cast function is given
		value = cast_function ? cast_function(value) : value;

		// Go over every item in the second array
		for (i = 0; i < arr.length; i++) {

			// Also cast that value
			test = cast_function ? cast_function(arr[i]) : arr[i];

			// If the values match, add this value to the array
			if (value == test) {
				return true;
			}
		}

		return false;
	});
});

/**
 * Get the values from the first array that are not in the second array,
 * basically: remove all the values in the second array from the first one
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Array}     arr            The array to test agains
 * @param    {Function}  cast_function  Function to use to cast values
 *
 * @return   {Array}
 */
defProto(function subtract(arr, cast_function) {

	// Make sure the given value to match against is an array
	if (!isArray(arr)) {
		arr = [arr];
	}
	
	// Go over every item in the array,
	// and return the ones that are not in the second array
	return this.filter(function(value, index) {

		var test, i;

		// Cast the value if a cast function is given
		value = cast_function ? cast_function(value) : value;

		// Go over every item in the second array
		for (i = 0; i < arr.length; i++) {

			// Also cast that value
			test = cast_function ? cast_function(arr[i]) : arr[i];

			// If the values match, we should NOT add this
			if (value == test) {
				return false;
			}
		}

		return true;
	});
});

/**
 * Get all the values that are either in the first or in the second array,
 * but not in both
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.9.0
 *
 * @param    {Array}     arr            The array to test against
 * @param    {Function}  cast_function  Function to use to cast values
 *
 * @return   {Array}
 */
defProto(function exclusive(arr, cast_function) {

	// Get all the shared values
	let shared = Arr.shared(this, arr);

	// Return the merged differences between the 2
	return Arr.subtract(this, shared).concat(Arr.subtract(arr, shared));
});

/**
 * Remove certain elements from an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Mixed}   delete_value   The value to remove from the array
 */
defProto(function clean(delete_value) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === delete_value) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
});

/**
 * Do a topological sort in-place
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.18
 * @version  0.8.18
 *
 * @param    {string}   id_path
 * @param    {string}   dependency_path
 *
 * @return   {Array}
 */
defProto(function sortTopological(id_path, dependency_path) {

	let get_dependencies,
	    get_id;

	if (id_path.indexOf('.') > -1) {
		get_id = (obj) => Obj.path(obj, id_path);
	} else {
		get_id = (obj) => obj[id_path];
	}

	if (dependency_path.indexOf('.') > -1) {
		get_dependencies = (obj) => {
			let result = Obj.path(obj, dependency_path);

			if (!result) {
				return null;
			}

			return Arr.cast(result);
		}
	} else {
		get_dependencies = (obj) => obj[dependency_path] ? Arr.cast(obj[dependency_path]) : null;
	}

	let dependencies,
	    length = this.length,
	    values = [],
	    value,
	    entry,
	    id,
	    i;

	for (i = 0; i < length; i++) {
		value = this[i];
		id = get_id(value);
		dependencies = get_dependencies(value);

		values.push({
			id,
			dependencies,
			value: value,
		});
	}

	let seen = new Set(),
	    sorted = [],
	    queue = [];

	let do_push = (entry, do_queue = true) => {
		seen.add(entry.id);
		sorted.push(entry.value);

		// Now try to clear the queue
		while (do_queue && queue.length) {
			let index_to_remove = [];

			// Prevent any infinite loop
			do_queue = false;

			for (let i = 0; i < queue.length; i++) {
				let item = queue[i];

				if (item.dependencies.every(dep => seen.has(dep))) {
					do_push(item, false);
					index_to_remove.push(i);

					// Let the while loop iterate at least 1 more time
					// now that a new item has been resolved, potentially
					// resolving an earlier queued item
					do_queue = true;
					break;
				}
			}

			for (let i = index_to_remove.length - 1; i >= 0; i--) {
				queue.splice(index_to_remove[i], 1);
			}
		}
	};

	for (i = 0; i < length; i++) {
		entry = values[i];

		if (!entry.dependencies?.length) {
			do_push(entry);
			continue;
		}

		if (entry.dependencies.every(dep => seen.has(dep))) {
			do_push(entry);
			continue;
		}

		queue.push(entry);
	}

	if (queue.length) {
		// Sort the queue by the amount of dependencies.
		// This is just a last resort to make the circular dependencies
		// a bit more logical
		queue.sort((a, b) => {
			return a.dependencies.length - b.dependencies.length;
		});
	}

	// Add the remaining queue items
	while (queue.length) {
		do_push(queue.shift());
	}

	// Replace the original array elements
	for (let i = 0; i < sorted.length; i++) {
		this[i] = sorted[i];
	}

	return this;
});

// Sort type symbols
Blast.arrayPath = Symbol('array_path');

/**
 * Sort by given paths.
 * Modifies the array in-place.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.5
 * @version  0.6.3
 *
 * @param    {symbol}   _flag    Use certain sort flag?
 * @param    {number}   _order   Sort order: 1 for ascending, -1 for descending
 * @param    {string}   _paths   One path, an array of paths, of multiple arguments
 *
 * @return   {Array}
 */
defProto(function sortByPath(_flag, _order, _paths) {

	var paths,
	    path,
	    flag,
	    len,
	    i = 0;

	paths = [];

	if (typeof _flag == 'symbol') {
		flag = _flag;
		i = 1;
	}

	for (; i < arguments.length; i++) {
		if (isArray(arguments[i])) {
			paths = paths.concat(arguments[i]);
		} else {
			paths.push(arguments[i]);
		}
	}

	len = paths.length;

	this.sort(function doSort(a, b) {

		var alpha,
		    beta,
		    ord;

		ord = -1;

		for (i = 0; i < len; i++) {
			path = paths[i];

			// Allow changing of direction
			if (typeof path == 'number') {
				ord = path;
				continue;
			}

			if (flag) {
				alpha = Obj.path(flag, a, path);
				beta = Obj.path(flag, b, path);

				if (isArray(alpha)) {
					alpha = alpha[alpha.length - 1];
				}

				if (isArray(beta)) {
					beta = beta[beta.length - 1];
				}

			} else {
				alpha = Obj.path(a, path);
				beta = Obj.path(b, path);
			}

			if (alpha < beta) {
				return 0 - ord;
			} else if (alpha > beta) {
				return ord;
			} else if (alpha === beta) {
				// Ignore
			} else {
				if (alpha == null) {
					return 0 - ord;
				} else if (beta == null) {
					return ord;
				}
			}
		}

		return 0;
	});

	return this;
});

/**
 * Search the array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.8
 * @version  0.7.18
 *
 * @param    {string}   path
 * @param    {Mixed}    value
 *
 * @return   {Mixed}
 */
defProto(function findByPath(path, value) {
	return Arr.findAllByPath(this, path, value)[0];
});

/**
 * Search the array and return all values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.18
 * @version  0.7.18
 *
 * @param    {string}   path
 * @param    {Mixed}    value
 *
 * @return   {Array}
 */
defProto(function findAllByPath(path, value) {

	let entries,
	    results,
	    entry,
	    i;

	const length = this.length;

	// If path is an object, it contains multiple filters
	if (path && typeof path == 'object') {
		let key;

		// Do all keys in the path
		for (key in path) {
			entries = [];

			// Iterate over all entries
			for (i = 0; i < length; i++) {
				entry = Obj.path(this[i], key);

				// If it matches, add it to the entries array
				if (entry == path[key]) {
					entries.push(this[i]);
				}
			}

			// If nothing was found, return early
			if (!entries.length) {
				break;
			}

			if (results) {
				results = Arr.shared(results, entries);
			} else {
				results = entries;
			}

			// If the results still is empty we can return already
			if (!results.length) {
				break;
			}
		}

		return results || [];
	}

	results = [];

	for (i = 0; i < length; i++) {
		entry = Obj.path(this[i], path);

		if (entry == value) {
			results.push(this[i]);
		}
	}

	return results;
});

/**
 * Modify the path in place
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.1
 * @version  0.4.1
 *
 * @param    {number}   path   The path to modify
 * @param    {string}   fnc    The modifier function
 *
 * @return   {Array}
 */
defProto(function modifyByPath(path, fnc) {

	var pieces,
	    entry,
	    end,
	    val,
	    i;

	pieces = Obj.parseDotNotationPath(path);

	if (!pieces) {
		return;
	}

	end = pieces.pop();

	for (i = 0; i < this.length; i++) {
		// Get the object that contains the entry
		entry = Obj.path(this[i], pieces);

		// Skip undefined values
		if (!entry || entry[end] == null) {
			continue;
		}

		val = fnc.call(entry, entry[end], i);

		if (val !== undefined) {
			entry[end] = val;
		}
	}

	return this;
});

/**
 * Shuffle the array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param    {Object}   rng   An object that has a `random` method
 *
 * @return   {Array}
 */
defProto(function shuffle(rng) {

	var counter = this.length,
	    index,
	    temp;

	if (rng == null) {
		rng = Math;
	}

	// While there are elements in the array
	while (counter > 0) {

		// Pick a random index
		index = Math.floor(rng.random() * counter);

		// Decrease counter by 1
		counter--;

		// And swap the last element with it
		temp = this[counter];
		this[counter] = this[index];
		this[index] = temp;
	}

	return this;
});

/**
 * Get all elements after the given needle
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.5
 * @version  0.5.5
 *
 * @param    {Mixed}   needle
 *
 * @return   {Array}
 */
defProto(function after(needle) {

	var index = this.indexOf(needle);

	if (index == -1) {
		return [];
	}

	return this.slice(index + 1);
});

/**
 * Get the element at the given index, but roll over if needed
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.7.24
 *
 * @param    {number}   index
 *
 * @return   {*}
 */
defProto(function atLoop(index) {

	if (index > 0) {
		const length = this.length;

		if (index >= length) {
			index = index % length;
		}
	}

	return this.at(index);
});