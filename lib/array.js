module.exports = function BlastArray(Blast, Collection) {

	/**
	 * Is the given variable an array-like object?
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.1
	 * @version  0.2.1
	 *
	 * @param    {Mixed}   variable
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Array', 'likeArray', function likeArray(variable) {

		// Return the variable unmodified if it's already an array
		if (Array.isArray(variable)) {
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.10
	 *
	 * @param    {Mixed}   variable
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Array', 'cast', function cast(variable) {

		var type;

		// Return the variable unmodified if it's already an array
		if (Array.isArray(variable)) {
			return variable;
		}

		type = typeof variable;

		// Convert array-like objects to regular arrays
		if (variable && type == 'object') {

			// If the variable has a 'length' property, it could be array-like
			if (typeof variable.length == 'number') {

				// Skip it if it's a String object (not a string primitive)
				// or an HTML element (SELECTs also have a length)
				if (variable.constructor.name !== 'String' && variable.nodeType == null) {
					return Array.prototype.slice.call(variable, 0);
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   start   The first value, defaults to 0
	 * @param    {Number}   stop    The last value, is required
	 * @param    {Number}   step    The step value, defaults to 1
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Array', 'range', function range(start, stop, step) {

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
	 * Return a string representing the source code of the array.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Boolean|Number}   tab   If indent should be used
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Array', 'toSource', function toSource(tab) {

		var result,
		    passtab,
		    i;

		if (tab === true) {
			tab = 1;
		}

		if (tab > 0) {
			passtab = tab + 1;
		} else {
			passtab = tab;
			tab = 0;
		}


		for (i = 0; i < this.length; i++) {
			if (!result) {
				result = '[';
			} else {
				result += ',';
			}

			if (tab) {
				result += '\n' + Blast.Bound.String.multiply('\t', tab);
			}

			result += Blast.uneval(this[i], passtab);
		}

		if (!result) {
			result = '[';
		} else if (tab) {
			result += '\n' + Blast.Bound.String.multiply('\t', tab-1);
		}

		result += ']';

		return result;
	}, true);

	/**
	 * Fill all the elements of the array from a start index
	 * to an end index with a static value
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Mixed}   value    Value to fill an array with
	 * @param    {Number}  start    Start index (0)
	 * @param    {Number}  end      End index (this.length)
	 */
	Blast.definePrototype('Array', 'fill', function fill(value, start, end) {

		var length = this.length,
		    rStart,
		    rEnd;

		if (typeof start === 'undefined') {
			rStart = 0;
		} else {
			rStart = ~~start || 0;
		}

		if (typeof end === 'undefined') {
			rEnd = length;
		} else {
			rEnd = ~~end || 0;
		}

		// Normalize the start index
		if (rStart < 0) {
			rStart = Math.max(length + rStart, 0);
		} else {
			rStart = rStart < length ? rStart : length;
		}

		// Normalize the end index
		if (rEnd < 0) {
			rEnd = Math.max(length + rEnd, 0);
		} else {
			rEnd = rEnd < length? rEnd : length;
		}

		// Do the actual filling
		for (; rStart < rEnd; rStart++) {
			this[rStart] = value;
		}

		return this;
	}, true);

	/**
	 * Move an array element from one array position to another
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Number}  oldIndex
	 * @param    {Number}  newIndex
	 */
	Blast.definePrototype('Array', 'move', function move(oldIndex, newIndex) {

		var length = this.length,
		    k;

		if (typeof oldIndex == 'number') {
			while (oldIndex < 0) oldIndex += length;
		} else {
			oldIndex = this.indexOf(oldIndex);
		}

		if (typeof newIndex == 'number') {
			while (newIndex < 0) newIndex += length;
		} else {
			newIndex = this.indexOf(newIndex);
		}

		// Move nothing if certain elements were not found
		if (oldIndex == -1 || newIndex == -1) {
			return this;
		}

		if (newIndex >= length) {
			k = newIndex - length;
			while ((k--) + 1) {
				this.push(undefined);
			}
		}

		this.splice(newIndex, 0, this.splice(oldIndex, 1)[0]);

		return this;
	});

	/**
	 * Get the first value of an array,
	 * or the first nr of wanted values
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.2
	 *
	 * @param    {Number}   nr   Return the first nr of values in a new array
	 *
	 * @return   {Mixed}
	 */
	Blast.definePrototype('Array', 'first', function first(nr, page) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.2
	 *
	 * @param    {Number}   nr   Return the first nr of values in a new array
	 *
	 * @return   {Mixed}
	 */
	Blast.definePrototype('Array', 'last', function last(nr, page) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}     property   The property name to use of all the values
	 * @param    {Function}   map        The map function to use
	 *
	 * @return   {Number|String}
	 */
	Blast.definePrototype('Array', 'sum', function sum(property, map) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Number}   lowest    The lowest allowed value
	 * @param    {Number}   highest   The highest allowed value
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Array', 'clip', function clip(lowest, highest) {

		var length = this.length,
		    i;

		for (i = 0; i < length; i++) {
			if (!(lowest < this[i])) {
				this[i] = lowest;
			} else if (!(highest > this[i])) {
				this[i] = highest;
			}
		}

		return this;
	});

	/**
	 * Get the closest numeric value inside an array
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   goal   The goal we want to get the closest value to
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Array', 'closest', function closest(goal) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Array', 'max', function max() {
		return Math.max.apply(Math, this);
	});

	/**
	 * Get the lowest value inside the array
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Array', 'min', function min() {
		return Math.min.apply(Math, this);
	});

	/**
	 * Insert item at the given index,
	 * modifies the array in-place
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   index   Where to insert the values
	 * @param    {Mixed}    value
	 *
	 * @return   {Array}    The same array
	 */
	Blast.definePrototype('Array', 'insert', function insert(index, value) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.11
	 *
	 * @param    {Number}   index   Where to insert the contents of the array
	 * @param    {Array}    values  The array of values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'include', function include(_index, values) {

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
		if (Array.isArray(arguments[i-1])) {
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Number}   limit   Recursive limit
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'flatten', function flatten(limit) {

		var result,
		    temp,
		    i;

		if (typeof limit !== 'number') {
			limit = Infinity;
		}

		result = [];

		for (i = 0; i < this.length; i++) {

			if (Array.isArray(this[i]) && limit && limit > 0) {

				// Clone the array
				temp = this[i].slice();

				// Add the array
				Collection.Array.prototype.include.call(result, i, flatten.call(temp, limit-1));
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.5
	 *
	 * @param    {String}   path   Path to use to check for uniqueness
	 *
	 * @return   {Array}    A new array with only unique values
	 */
	Blast.definePrototype('Array', 'unique', function unique(path) {

		var result = [],
		    check,
		    temp,
		    i;

		if (path == null) {
			for (i = 0; i < this.length; i++) {
				// If the value isn't in the result yet, add it
				if (result.indexOf(this[i]) === -1) {
					result.push(this[i]);
				}
			}
		} else {

			// Create an array to keep path values
			check = [];

			for (i = 0; i < this.length; i++) {
				temp = Blast.Bound.Object.path(this[i], path);

				if (check.indexOf(temp) === -1) {
					result.push(this[i]);
					check.push(temp);
				}
			}
		}

		return result;
	});

	/**
	 * Get the shared value between the 2 arrays
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.4
	 *
	 * @param    {Array}     arr            The array to test against
	 * @param    {Function}  cast_function  Function to use to cast values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'shared', function shared(arr, cast_function) {

		// Make sure the given value to match against is an array
		arr = Collection.Array.cast(arr);

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Array}     arr            The array to test agains
	 * @param    {Function}  cast_function  Function to use to cast values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'subtract', function subtract(arr, cast_function) {

		// Make sure the given value to match against is an array
		if (!Array.isArray(arr)) {
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

	var reEmployArgs = /^(?:\$(\d+))|(?:(\$i))|(?:(\$\$\+))|(?:(\$\$\-))|(?:(\$\$))$/;

	/**
	 * Apply the given `fnc` function with the `args` array,
	 * but `forEach` value that is in `this` array.
	 *
	 * Arg substitution is:
	 * - $0, $1, ...  for values in the current element (All is cast to array)
	 * - $$           for the complete, un-cast value
	 * - $i           for the current index
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Array}            args    The args to apply to the function
	 * @param    {Object}           _obj    The context to get the function from
	 * @param    {String|Function}  _fnc    The function to use (or string)
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'employ', function employ(args, _obj, _fnc) {

		var arrayLength,
		    argsLength,
		    context,
		    result,
		    cargs,
		    temp,
		    key,
		    map,
		    fnc,
		    el,
		    i;

		// Make sure the args is an array
		args = Collection.Array.cast(args);

		arrayLength = this.length;
		argsLength = args.length;
		map = {};

		// Passed functions with no context will get called using null
		if (typeof _obj === 'function') {
			fnc = _obj;
			context = null;
		} else {
			// Passed objects become the calling context
			context = _obj;

			// If the last arg is a string, we need to get that function
			// from the passed context
			if (typeof _fnc === 'string') {
				fnc = context[_fnc];
			} else {
				fnc = _fnc;
			}
		}

		// Create a new array that will be returned as the result
		result = new Array(arrayLength);

		// See where we can substitute arguments
		for (i = 0; i < argsLength; i++) {

			if (typeof args[i] !== 'string') {
				continue;
			}

			// Look for string arg replacement tokens
			temp = reEmployArgs.exec(args[i]);

			if (!temp) {
				continue;
			}

			if (temp[1]) {
				// Map the argument number `i` to the number `temp[1]` inside array
				map[i] = parseInt(temp[1]);
			} else {
				map[i] = temp[0];
			}
		}

		for (i = 0; i < arrayLength; i++) {

			// Always create a shallow clone of the args array
			cargs = args.slice(0);

			// Replace all the placeholders
			for (key in map) {

				if (typeof map[key] == 'string') {

					switch (map[key]) {

						// The entire element, non-cast
						case '$$':
							cargs[key] = this[i];
							break;

						// The previous element
						case '$$-':
							cargs[key] = this[i-1];
							break;

						// The next element
						case '$$+':
							cargs[key] = this[i+1];
							break;

						// The index
						case '$i':
							cargs[key] = i;
							break;
					}
				} else {
					// Get the current element
					el = Collection.Array.cast(this[i]);

					cargs[key] = el[map[key]];
				}
			}

			// Call the actual function, try to use call when possible
			switch (argsLength) {

				case 1:
					result[i] = fnc.call(context, cargs[0]);
					break;

				case 2:
					result[i] = fnc.call(context, cargs[0], cargs[1]);
					break;

				case 3:
					result[i] = fnc.call(context, cargs[0], cargs[1], cargs[2]);
					break;

				default:
					result[i] = fnc.apply(context, cargs);
			}
		}

		return result;
	});

	/**
	 * Get all the values that are either in the first or in the second array,
	 * but not in both
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.10
	 *
	 * @param    {Array}     arr            The array to test against
	 * @param    {Function}  cast_function  Function to use to cast values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'exclusive', function exclusive(arr, cast_function) {

		// Get all the shared values
		var shared = Collection.Array.prototype.shared.call(this, arr);

		// Return the merged differences between the 2
		return Collection.Array.prototype.subtract.call(this, shared).concat(Collection.Array.prototype.subtract.call(arr, shared));
	});

	/**
	 * Remove certain elements from an array
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {Mixed}   delete_value   The value to remove from the array
	 */
	Blast.definePrototype('Array', 'clean', function clean(delete_value) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === delete_value) {
				this.splice(i, 1);
				i--;
			}
		}
		return this;
	});

	/**
	 * Sort by given paths.
	 * Modifies the array in-place.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.5
	 * @version  0.1.5
	 *
	 * @param    {Number}   _order   Sort order: 1 for ascending, -1 for descending
	 * @param    {String}   _paths   One path, an array of paths, of multiple arguments
	 *
	 * @param    {Array}
	 */
	Blast.definePrototype('Array', 'sortByPath', function sortByPath(_order, _paths) {

		var paths,
		    path,
		    len,
		    ord,
		    O,
		    i;

		if (typeof _order == 'number') {
			ord = _order;
		} else {
			ord = -1;
		}

		paths = [];

		for (i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == 'string') {
				paths.push(arguments[i]);
			} else if (Array.isArray(arguments[i])) {
				paths = paths.concat(arguments[i]);
			}
		}

		O = Blast.Bound.Object;
		len = paths.length;

		this.sort(function doSort(a, b) {

			var alpha,
			    beta;

			for (i = 0; i < len; i++) {
				path = paths[i];

				alpha = O.path(a, path);
				beta = O.path(b, path);

				if (alpha < beta) {
					return 0 - ord;
				} else if (alpha > beta) {
					return ord;
				}
			}

			return 0;
		});

		return this;
	});

	/**
	 * Create an iterator for this array
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Iterator}
	 */
	Blast.definePrototype('Array', 'createIterator', function createIterator() {
		return new Blast.Classes.Iterator(this);
	});

};