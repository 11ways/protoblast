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
	 * Standardize the numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Array}   arr
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Math', 'standardize', function standardize(arr) {
		
		var deviations,
		    numbers,
		    length,
		    dev,
		    i;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			// Don't leak arguments!
			numbers = new Array(arguments.length);
			for (i = 0; i < args.length; ++i) numbers[i] = arguments[i];
		}

		deviations = Blast.Bound.Math.deviation(numbers);
		dev = Blast.Bound.Math.standardDeviation(numbers);
		length = deviations.length;

		for (i = 0; i < length; i++) {
			deviations[i] = deviations[i] / dev;
		}

		return deviations;
	});

	/**
	 * Return the variance of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.3
	 *
	 * @param    {Array}   arr
	 * @param    {Boolean} _bias
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'variance', function variance(arr, _bias) {
		
		var deviations,
		    numbers,
		    length,
		    bias,
		    i;

		bias = 0;

		if (Array.isArray(arr)) {
			if (_bias) bias = 1;
			numbers = arr;
		} else {
			// Don't leak arguments!
			numbers = new Array(arguments.length);
			for (i = 0; i < numbers.length; ++i) numbers[i] = arguments[i];
		}

		length = numbers.length;
		deviations = Blast.Bound.Math.deviation(numbers);

		for (i = 0; i < length; i++) {
			deviations[i] = Math.pow(deviations[i], 2);
		}

		return Blast.Bound.Array.sum(deviations) / (length - bias);
	});

	/**
	 * Calculate the covariance of 2 set of numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Array}   arrA
	 * @param    {Array}   arrB
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'covariance', function variance(arrA, arrB) {

		var length,
		    meanA,
		    meanB,
		    total,
		    i;

		total = 0;
		meanA = Blast.Bound.Math.mean(arrA);
		meanB = Blast.Bound.Math.mean(arrB);
		length = arrA.length;

		for (i = 0; i < length; i++) {
			total += (arrA[i] - meanA) * (arrB[i] - meanB);
		}

		return 1 / (length - 1) * total;
	});

	/**
	 * Calculate the pearson correlation score between two set of numbers
	 *
	 * @author   Matt West <matt.west@kojilabs.com>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Array}   arrA
	 * @param    {Array}   arrB
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'pearson', function pearson(arrX, arrY) {

		var sumXS = 0,
		    sumYS = 0,
		    sumX  = 0,
		    sumY  = 0,
		    sumP  = 0,
		    num,
		    den,
		    min,
		    x,
		    y,
		    i;

		// Use the least number of available items
		min = Math.min(arrX.length, arrY.length);

		for (i = 0; i < min; i++) {
			x = arrX[i];
			y = arrY[i];

			sumX += x;
			sumY += y;
			sumXS += Math.pow(x, 2);
			sumYS += Math.pow(y, 2);
			sumP += x * y;
		}

		num = sumP - (sumX * sumY / min);
		den = Math.sqrt((sumXS - Math.pow(sumX, 2) / min) * (sumYS - Math.pow(sumY, 2) / min));

		return num/den;
	});

	/**
	 * Return the deviation of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Array}     arr        An array of numbers
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Math', 'deviation', function deviation(arr) {

		var numbers,
		    length,
		    mean,
		    dev,
		    i;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			// Don't leak arguments!
			numbers = new Array(arguments.length);
			for (i = 0; i < numbers.length; ++i) numbers[i] = arguments[i];
		}

		length = numbers.length;
		mean = Blast.Bound.Math.mean(numbers);
		dev = new Array(length);

		for (i = 0; i < length; i++) {
			dev[i] = numbers[i] - mean;
		}

		return dev;
	});

	/**
	 * Return the standard deviation of the given numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.3
	 *
	 * @param    {Array}     arr        An array of numbers
	 * @param    {Boolean}   _bias      Defaults to true
	 * @param    {Boolean}   relative   Return a percentage?
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'standardDeviation', function standardDeviation(arr, _bias, relative) {

		var numbers,
		    bias,
		    dev;

		if (Array.isArray(arr)) {
			numbers = arr;
			if (typeof _bias == 'undefined') {
				bias = true;
			} else {
				bias = _bias;
			}
		} else {
			// Don't leak arguments!
			numbers = new Array(arguments.length);
			for (i = 0; i < numbers.length; ++i) numbers[i] = arguments[i];
			relative = false;
			bias = true;
		}

		// Now return the mean value of that list, which is the variance
		dev = Math.sqrt(Blast.Bound.Math.variance(numbers, bias));

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