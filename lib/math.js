module.exports = function BlastMath(Blast, Collection) {

	/**
	 * Sorter function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	function sortLowToHigh(a, b) {
		return a-b;
	}

	/**
	 * Clone an array for calculating the median
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	function cloneForMedian(arr) {
		arr = arr.slice(0);
		arr.sort(sortLowToHigh);
		return arr;
	}

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('Math', 'toSource', function toSource() {
		return 'Math';
	}, true);

	/**
	 * Return the n lowest numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   amount
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Math', 'lowest', function lowest(numbers, amount) {

		var result,
		    i;

		if (!amount) {
			return Math.min.apply(Math, numbers);
		}

		// Clone the array
		numbers = numbers.slice(0);

		// Sort it from low to high
		numbers.sort(sortLowToHigh);

		// Return the wanted amount of values
		return numbers.slice(0, amount);
	});

	/**
	 * Return the n highest numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   amount
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Math', 'highest', function highest(numbers, amount) {

		var result,
		    i;

		if (!amount) {
			return Math.max.apply(Math, numbers);
		}

		// Clone the array
		numbers = numbers.slice(0);

		// Sort it from low to high
		numbers.sort(sortLowToHigh);

		// Return the wanted amount of values
		return numbers.slice(0, amount).reverse();
	});

	/**
	 * Return the sum of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'sum', function sum(arr) {
		
		var numbers,
		    result,
		    i;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			numbers = Array.prototype.slice.call(arguments, 0);
		}

		result = 0;

		for (i = 0; i < numbers.length; i++) {
			result += numbers[i];
		}

		return result;
	});

	/**
	 * Return the mean/average of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'mean', function mean(arr) {
		
		var numbers;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			numbers = Array.prototype.slice.call(arguments, 0);
		}

		return Blast.Bound.Math.sum(numbers) / numbers.length;
	});

	/**
	 * Return the variance of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'variance', function variance(arr) {
		
		var deviations,
		    numbers,
		    mean,
		    i;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			numbers = Array.prototype.slice.call(arguments, 0);
		}

		mean = Blast.Bound.Math.mean(numbers);
		deviations = [];

		// Get the deviations from the mean
		for (i = 0; i < numbers.length; i++) {
			deviations.push(Math.pow(numbers[i] - mean, 2));
		}

		// Now return the mean value of that list, which is the variance
		return Blast.Bound.Math.mean(deviations);
	});

	/**
	 * Return the standard deviation of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Array}     arr        An array of numbers
	 * @param    {Boolean}   relative   Return a percentage?
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'deviation', function deviation(arr, relative) {
		
		var numbers,
		    dev;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			numbers = Array.prototype.slice.call(arguments, 0);
			relative = false;
		}

		// Now return the mean value of that list, which is the variance
		dev = Math.sqrt(Blast.Bound.Math.variance(numbers));

		if (relative) {
			dev = (dev / Blast.Bound.Math.mean(numbers)) * 100;
		}

		return dev;
	});

	/**
	 * Return the median of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'median', function median(arr) {
		
		var numbers,
		    half,
		    len;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			numbers = Array.prototype.slice.call(arguments, 0);
		}

		// Get a sorted clone of the array
		numbers = cloneForMedian(numbers);

		// Get the amount of values
		len = numbers.length;

		// Get the halfway point
		half = ~~(len/2);

		if (len % 2) {
			return numbers[half];
		} else {
			return (numbers[half-1] + numbers[half]) / 2;
		}
	});

};