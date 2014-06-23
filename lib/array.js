module.exports = function BlastArray(Blast, Collection) {

	/**
	 * Cast a variable to an array.
	 * Also turns array-like objects into real arrays, except String objects.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
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
			if (variable.length || 'length' in variable) {

				// Skip it if it's a String object (not a string primitive)
				if (variable.constructor.name !== 'String') {
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
	 * Return a string representing the source code of the array.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * Get the first value of an array
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	Blast.definePrototype('Array', 'first', function first() {
		return this[0];
	});

	/**
	 * Get the last value of an array
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	Blast.definePrototype('Array', 'last', function last() {
		return this[this.length-1];
	});

	/**
	 * Insert item at the given index,
	 * modifies the array in-place
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   index   Where to insert the values
	 * @param    {Mixed}    value
	 *
	 * @return   {Array}    Thesame array
	 */
	Blast.definePrototype('Array', 'insert', function insert(index, value) {

		this.splice.apply(this, [index, 0].concat(
			Array.prototype.slice.call(arguments, 1))
		);

		return this;
	});

	/**
	 * Get the shared value between the 2 arrays
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Array}     arr            The array to test agains
	 * @param    {Function}  CastFunction   Function to use to cast values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'shared', function shared(arr, CastFunction) {

		// Make sure the given value to match against is an array
		if (!Array.isArray(arr)) {
			arr = [arr];
		}
		
		// Go over every item in the array, and return the ones they have in common
		return this.filter(function(value) {

			var test, i;

			// Cast the value if a cast function is given
			value = CastFunction ? CastFunction(value) : value;

			// Go over every item in the second array
			for (i = 0; i < arr.length; i++) {

				// Also cast that value
				test = CastFunction ? CastFunction(arr[i]) : arr[i];

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Array}     arr            The array to test agains
	 * @param    {Function}  CastFunction   Function to use to cast values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'subtract', function subtract(arr, CastFunction) {

		// Make sure the given value to match against is an array
		if (!Array.isArray(arr)) {
			arr = [arr];
		}
		
		// Go over every item in the array,
		// and return the ones that are not in the second array
		return this.filter(function(value, index) {

			var test, i;

			// Cast the value if a cast function is given
			value = CastFunction ? CastFunction(value) : value;

			// Go over every item in the second array
			for (i = 0; i < arr.length; i++) {

				// Also cast that value
				test = CastFunction ? CastFunction(arr[i]) : arr[i];

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {Array}     arr            The array to test agains
	 * @param    {Function}  CastFunction   Function to use to cast values
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', 'exclusive', function exclusive(arr, CastFunction) {

		// Get all the shared values
		var shared = this.shared(arr);

		// Return the merged differences between the 2
		return Collection.Array.prototype.subtract.call(this, shared).concat(arr.subtract(shared));
	});

	/**
	 * Remove certain elements from an array
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 */
	Blast.definePrototype('Array', 'clean', function clean(deleteValue) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === deleteValue) {
				this.splice(i, 1);
				i--;
			}
		}
		return this;
	});

};