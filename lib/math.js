module.exports = function BlastMath(Blast, Collection) {

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
		Collection.Array.prototype.flashsort.call(numbers);

		// Return the wanted amount of values
		return numbers.slice(0, amount);
	});

	/**
	 * Return the n highest numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
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
		Collection.Array.prototype.flashsort.call(numbers);

		// Return the wanted amount of values
		return numbers.slice(numbers.length-amount);
	});

	/**
	 * Clip the given values inside the `numbers` array.
	 * This is a Pure Function. Unlike Array#clip, it has no side-effects
	 * and returns a new array.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Array}    numbers   The array of numbers
	 * @param    {Number}   lowest    The lowest allowed value
	 * @param    {Number}   highest   The highest allowed value
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Math', 'clip', function clip(numbers, lowest, highest) {
		return Blast.Bound.Array.clip(numbers.slice(0), lowest, highest);
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
			// Don't leak the arguments object
			numbers = new Array(arguments.length);
			for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
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

		var numbers,
		    i;

		if (Array.isArray(arr)) {
			numbers = arr;
		} else {
			// Don't leak the arguments object
			numbers = new Array(arguments.length);
			for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
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
			for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
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
			for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
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
	 * @param    {Array}   arrX
	 * @param    {Array}   arrY
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

		if (den == 0) return 0;

		return num/den;
	});

	/**
	 * Calculate the spearman correlation score between two set of numbers
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Array}   arrX
	 * @param    {Array}   arrY
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'spearman', function spearman(arrX, arrY) {

		var sigma  = 0,
		    rankHX = [],
		    rankHY = [],
		    rankX  = [],
		    rankY  = [],
		    sortX,
		    sortY,
		    min,
		    i;

		// Use the least number of available items
		min = Math.min(arrX.length, arrY.length);

		sortX = Collection.Array.prototype.flashsort.call(arrX.slice(0, min));
		sortY = Collection.Array.prototype.flashsort.call(arrY.slice(0, min));

		for (i = 0; i < min; i++) {
			rankHX[sortX[i]] = i+1;
			rankHY[sortY[i]] = i+1;
		}

		for (i = 0; i < min; i++) {
			rankX[i] = rankHX[arrX[i]];
			rankY[i] = rankHY[arrY[i]];
			sigma += Math.pow((rankX[i] - rankY[i]), 2);
		}

		return 1 - ((6 * sigma) / (min*((min*min)-1)));
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
			for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
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
			// Keep function optimized by not leaking the `arguments` object
			numbers = new Array(arguments.length);
			for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];

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
	 * @version  0.1.3
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'median', function median(arr) {

		var numbers,
		    half,
		    len;

		if (Array.isArray(arr)) {
			numbers = arr.slice();
			len = numbers.length;
		} else {
			len = arguments.length;
			// Keep function optimized by not leaking the `arguments` object
			numbers = new Array(len);
			for (i = 0; i < len; i++) numbers[i] = arguments[i];
		}

		// Sort the numbers using flashsort
		Blast.Bound.Array.flashsort(numbers);

		// Get the halfway point
		half = ~~(len/2);

		if (len % 2) {
			return numbers[half];
		} else {
			return (numbers[half-1] + numbers[half]) / 2;
		}
	});

	/**
	 * In/Out Quad easing
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Number}   t    current time
	 * @param    {Number}   b    start value
	 * @param    {Number}   c    change in value
	 * @param    {Number}   d    duration
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Math', 'easeInOutQuad', function easeInOutQuad(t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t + b;
		t--;
		return -c/2 * (t*(t-2) - 1) + b;
	});

};