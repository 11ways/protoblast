const defStat = Blast.createStaticDefiner('Math'),
      Arr = Bound.Array,
      isArray = (input) => Array.isArray(input),
      BMath = Bound.Math;

/**
 * Return the n lowest numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}   amount
 *
 * @return   {Array}
 */
defStat(function lowest(numbers, amount) {

	if (!amount) {
		return Math.min.apply(Math, numbers);
	}

	// Clone the array
	numbers = numbers.slice(0);

	// Sort it from low to high
	Arr.flashsort(numbers);

	// Return the wanted amount of values
	return numbers.slice(0, amount);
});

/**
 * Return the n highest numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {number}   amount
 *
 * @return   {Array}
 */
defStat(function highest(numbers, amount) {

	if (!amount) {
		return Math.max.apply(Math, numbers);
	}

	// Clone the array
	numbers = numbers.slice(0);

	// Sort it from low to high
	Arr.flashsort(numbers);

	// Return the wanted amount of values
	return numbers.slice(numbers.length-amount);
});

/**
 * Clip the given values inside the `numbers` array.
 * This is a Pure Function. Unlike Array#clip, it has no side-effects
 * and returns a new array.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Array}    numbers   The array of numbers
 * @param    {number}   lowest    The lowest allowed value
 * @param    {number}   highest   The highest allowed value
 *
 * @return   {Array}
 */
defStat(function clip(numbers, lowest, highest) {
	return Arr.clip(numbers.slice(0), lowest, highest);
});

/**
 * Return the sum of the given numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @return   {number}
 */
defStat(function sum(arr) {

	var numbers,
	    result,
	    i;

	if (isArray(arr)) {
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @return   {number}
 */
defStat(function mean(arr) {

	var numbers,
	    i;

	if (isArray(arr)) {
		numbers = arr;
	} else {
		// Don't leak the arguments object
		numbers = new Array(arguments.length);
		for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
	}

	return BMath.sum(numbers) / numbers.length;
});

/**
 * Standardize the numbers:
 * Calculate (in units of standard deviation) how far
 * each value is below or above the mean.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Array}   arr
 *
 * @return   {Array}
 */
defStat(function standardize(arr) {

	var deviations,
	    numbers,
	    length,
	    dev,
	    i;

	if (isArray(arr)) {
		numbers = arr;
	} else {
		// Don't leak arguments!
		numbers = new Array(arguments.length);
		for (i = 0; i < numbers.length; i++) {
			numbers[i] = arguments[i];
		}
	}

	deviations = BMath.deviation(numbers);
	dev = BMath.standardDeviation(numbers);
	length = deviations.length;

	for (i = 0; i < length; i++) {
		deviations[i] = deviations[i] / dev;
	}

	return deviations;
});

/**
 * Return the variance of the given numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.3
 *
 * @param    {Array}   arr
 * @param    {boolean} _bias
 *
 * @return   {number}
 */
defStat(function variance(arr, _bias) {

	var deviations,
	    numbers,
	    length,
	    bias,
	    i;

	bias = 0;

	if (isArray(arr)) {
		if (_bias) bias = 1;
		numbers = arr;
	} else {
		// Don't leak arguments!
		numbers = new Array(arguments.length);
		for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
	}

	length = numbers.length;
	deviations = BMath.deviation(numbers);

	for (i = 0; i < length; i++) {
		deviations[i] = Math.pow(deviations[i], 2);
	}

	return Bound.Array.sum(deviations) / (length - bias);
});

/**
 * Calculate the covariance of 2 set of numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Array}   arrA
 * @param    {Array}   arrB
 *
 * @return   {number}
 */
defStat(function covariance(arrA, arrB) {

	var length,
	    meanA,
	    meanB,
	    total,
	    i;

	total = 0;
	meanA = BMath.mean(arrA);
	meanB = BMath.mean(arrB);
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Array}   arrX
 * @param    {Array}   arrY
 *
 * @return   {number}
 */
defStat(function pearson(arrX, arrY) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Array}   arrX
 * @param    {Array}   arrY
 *
 * @return   {number}
 */
defStat(function spearman(arrX, arrY) {

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

	sortX = Arr.flashsort(arrX.slice(0, min));
	sortY = Arr.flashsort(arrY.slice(0, min));

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {Array}     arr        An array of numbers
 *
 * @return   {Array}
 */
defStat(function deviation(arr) {

	var numbers,
	    length,
	    mean,
	    dev,
	    i;

	if (isArray(arr)) {
		numbers = arr;
	} else {
		// Don't leak arguments!
		numbers = new Array(arguments.length);
		for (i = 0; i < numbers.length; i++) numbers[i] = arguments[i];
	}

	length = numbers.length;
	mean = BMath.mean(numbers);
	dev = new Array(length);

	for (i = 0; i < length; i++) {
		dev[i] = numbers[i] - mean;
	}

	return dev;
});

/**
 * Return the standard deviation of the given numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.3
 *
 * @param    {Array}     arr        An array of numbers
 * @param    {boolean}   _bias      Defaults to true
 * @param    {boolean}   relative   Return a percentage?
 *
 * @return   {number}
 */
defStat(function standardDeviation(arr, _bias, relative) {

	var numbers,
	    bias,
	    dev;

	if (isArray(arr)) {
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
	dev = Math.sqrt(BMath.variance(numbers, bias));

	if (relative) {
		dev = (dev / BMath.mean(numbers)) * 100;
	}

	return dev;
});

/**
 * Return the median of the given numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.3
 *
 * @return   {number}
 */
defStat(function median(arr) {

	var numbers,
	    half,
	    len,
	    i;

	if (isArray(arr)) {
		numbers = arr.slice();
		len = numbers.length;
	} else {
		len = arguments.length;
		// Keep function optimized by not leaking the `arguments` object
		numbers = new Array(len);
		for (i = 0; i < len; i++) numbers[i] = arguments[i];
	}

	// Sort the numbers using flashsort
	Bound.Array.flashsort(numbers);

	// Get the halfway point
	half = ~~(len/2);

	if (len % 2) {
		return numbers[half];
	} else {
		return (numbers[half-1] + numbers[half]) / 2;
	}
});

/**
 * In Quad easing
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   t    current time
 * @param    {number}   b    start value
 * @param    {number}   c    change in value
 * @param    {number}   d    duration
 *
 * @return   {number}
 */
defStat(function easeInQuad(t, b, c, d) {
	t /= d;
	return c*t*t + b;
});

/**
 * Out Quad easing
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   t    current time
 * @param    {number}   b    start value
 * @param    {number}   c    change in value
 * @param    {number}   d    duration
 *
 * @return   {number}
 */
defStat(function easeOutQuad(t, b, c, d) {
	t /= d;
	return -c * t*(t-2) + b;
});

/**
 * In/Out Quad easing
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {number}   t    current time
 * @param    {number}   b    start value
 * @param    {number}   c    change in value
 * @param    {number}   d    duration
 *
 * @return   {number}
 */
defStat(function easeInOutQuad(t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t + b;
	t--;
	return -c/2 * (t*(t-2) - 1) + b;
});

/**
 * In Quart easing
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   t    current time
 * @param    {number}   b    start value
 * @param    {number}   c    change in value
 * @param    {number}   d    duration
 *
 * @return   {number}
 */
defStat(function easeInQuart(t, b, c, d) {
	t /= d;
	return c*t*t*t*t + b;
});

/**
 * Out Quart easing
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   t    current time
 * @param    {number}   b    start value
 * @param    {number}   c    change in value
 * @param    {number}   d    duration
 *
 * @return   {number}
 */
defStat(function easeOutQuart(t, b, c, d) {
	t /= d;
	t--;
	return -c * (t*t*t*t - 1) + b;
});

/**
 * In/Out Quart easing:
 * Accelerate to the halfway point, then decelerate
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   t    current time
 * @param    {number}   b    start value
 * @param    {number}   c    change in value
 * @param    {number}   d    duration
 *
 * @return   {number}
 */
defStat(function easeInOutQuart(t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t*t*t + b;
	t -= 2;
	return -c/2 * (t*t*t*t - 2) + b;
});

/**
 * See if the 2 given ranges overlap
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.5
 * @version  0.1.5
 *
 * @param    {number}   a1
 * @param    {number}   b1
 * @param    {number}   a2
 * @param    {number}   b2
 *
 * @return   {boolean}
 */
defStat(function overlaps(a1, b1, a2, b2) {

	if (isArray(a1)) {
		b2 = b1[1];
		a2 = b1[0];
		b1 = a1[1];
		a1 = a1[0];
	}

	return Math.max(a1, a2) <= Math.min(b1, b2);
});

/**
 * Apply a low-pass filter
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.8
 * @version  0.1.8
 *
 * @param    {Array}             input    The input array of numbers
 * @param    {Number|Function}   alpha    The alpha smoothing value [0.15]
 * @param    {number}            first    The first value to use [input[0]]
 *
 * @return   {Array}
 */
defStat(function lowpass(input, alpha, first) {

	var output = [],
	    afnc,
	    prev,
	    i;

	// If no alpha smoothing value is given, use 0.15
	if (alpha == null) {
		alpha = 0.15;
	} else {
		// Is the alpha a function?
		if (typeof alpha == 'function') {
			afnc = alpha;
		}
	}

	// If no first value is given, use the first value of the input array
	if (first == null) {
		prev = input[0];
	} else {
		prev = first;
	}

	// Start smoothing the numbers
	for (i = 0; i < input.length; i++) {

		if (afnc != null) {
			alpha = afnc(prev, input[i], i);
		}

		// Calculate the new value
		output[i] = prev + alpha * (input[i] - prev);

		// Set the value for the next iteration
		prev = output[i];
	}

	return output;
});

/**
 * Interpolate numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.8
 * @version  0.1.8
 *
 * @param    {Array}    input        The input array of numbers
 * @param    {number}   newlength    The new length of the array
 *
 * @return   {Array}
 */
defStat(function interpolate(input, newlength) {

	var output = [],
	    factor = (input.length - 1) / (newlength - 1),
	    atpoint,
	    before,
	    after,
	    tmp,
	    i;

	// Copy first value
	output[0] = input[0];

	for (i = 1; i < newlength - 1; i++) {
		tmp = i * factor;
		before = Math.floor(tmp);
		after = Math.ceil(tmp);
		atpoint = tmp - before;

		output[i] = input[before] + (input[after] - input[before]) * atpoint;
	}

	output[newlength - 1] = input[input.length - 1];

	return output;
});

/**
 * Plot values & dates
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.8
 * @version  0.1.8
 *
 * @param    {Array}    values       The input values
 * @param    {Array}    dates        The dates to which the values match
 * @param    {string}   unit         The unit of time to plot to [day]
 *
 * @return   {Object}   Object containing `dates` and `values`
 */
defStat(function plotdate(values, dates, unit) {

	var ovalues = [],
	    odates = [],
	    prevdate,
	    prevval,
	    difdate,
	    evals,
	    tdate,
	    edate,
	    edif,
	    temp,
	    date,
	    val,
	    i,
	    j;

	if (!unit) {
		unit = 'day';
	}

	ovalues[0] = values[0];
	odates[0] = dates[0];

	for (i = 1; i < values.length; i++) {

		// Get previous values
		prevval = values[i-1];
		prevdate = dates[i-1];

		// Get current values
		val = values[i];
		date = dates[i];

		// Get the difference between the 2 dates in their given unit
		// This could be days or hours, doesn't really matter
		difdate = Date.difference(unit, prevdate, date, true);

		temp = [prevval, val];

		// Calculate the med vals
		if (difdate > 1) {
			temp = Math.interpolate(temp, difdate + 1);
		} else if (difdate < 1) {
			// Average multiple points for the same unit
			evals = [prevval, val];

			// See if any of the following values are also of the same unit
			while (true) {
				edate = dates[i+1];

				if (!edate) {
					break;
				}

				// Get the difference of the current date and the next i+1 date
				edif = Date.difference(unit, date, edate, true);

				if (edif >= 1) {
					break;
				}

				evals.push(values[i+1]);

				// Make sure this entry isn't repeated
				i++;
			}

			//temp[1] = Math.median(evals);
			ovalues[ovalues.length-1] = Math.median(evals);
			continue;
		}

		tdate = prevdate.clone().startOf(unit);

		for (j = 1; j < temp.length; j++) {
			odates.push(tdate.clone().add(j, unit));
			ovalues.push(temp[j]);
		}
	}

	return {dates: odates, values: ovalues};
});

/**
 * Remove outliers from the given array, return a new one
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.1
 * @version  0.3.8
 *
 * @param    {Array}    arr       The input array
 * @param    {boolean}  clip      Clip outliers to highest or lowest value
 *
 * @return   {Array}
 */
defStat(function removeOutliers(arr, clip) {

	var filtered_values,
	    max_value,
	    min_value,
	    result,
	    values,
	    length,
	    index,
	    iqr,
	    q1,
	    q3,
	    x,
	    i;

	// Get the length of the input array
	length = arr.length;

	// Clone the array to determine max and min values
	values = arr.slice(0);

	// And create a new array
	result = [];

	// Sort the numbers
	Bound.Array.flashsort(values);

	// Get the first index
	index = length / 4;

	// If it's not an integer, we need to do some averaging
	if (~~index != index) {
		index = ~~index;
		q1 = (values[index] + values[index + 1]) / 2;
	} else {
		q1 = values[index];
	}

	// Get the next index
	index = length * (3 / 4);

	// If it's not an integer, we need to do some averaging
	if (~~index != index) {
		index = ~~index;
		q3 = (values[index] + values[index - 1]) / 2;
	} else {
		q3 = values[index];
	}

	iqr = q3 - q1;

	// Then find min and max values
	max_value = q3 + iqr * 1.5;
	min_value = q1 - iqr * 1.5;

	for (i = 0; i < length; i++) {
		x = arr[i];

		if (x > max_value) {
			if (clip) {
				x = max_value;
			} else {
				continue;
			}
		} else if (x < min_value) {
			if (clip) {
				x = min_value;
			} else {
				continue;
			}
		}

		result.push(x);
	}

	return result;
});

/**
 * Decimal adjustment of a number.
 *
 * @param   {string}   type     The type of adjustment
 * @param   {number}   value    The number
 * @param   {Integer}  exp      The exponent (the 10 logarithm of the adjustment base)
 *
 * @return  {number}   The adjusted value.
 */
function decimalAdjust(type, value, exp) {
	// If the exp is undefined or zero...
	if (typeof exp === 'undefined' || +exp === 0) {
		return Math[type](value);
	}
	value = +value;
	exp = +exp;
	// If the value is not a number or the exp is not an integer...
	if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
		return NaN;
	}
	// Shift
	value = value.toString().split('e');
	value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
	// Shift back
	value = value.toString().split('e');
	return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

/**
 * Correct rounding
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.6
 * @version  0.3.6
 *
 * @param    {number}   value
 * @param    {number}   exp
 *
 * @return   {number}
 */
defStat(function round10(value, exp) {
	return decimalAdjust('round', value, exp);
});

/**
 * Correct flooring
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.6
 * @version  0.3.6
 *
 * @param    {number}   value
 * @param    {number}   exp
 *
 * @return   {number}
 */
defStat(function floor10(value, exp) {
	return decimalAdjust('floor', value, exp);
});

/**
 * Correct ceiling
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.6
 * @version  0.3.6
 *
 * @param    {number}   value
 * @param    {number}   exp
 *
 * @return   {number}
 */
defStat(function ceil10(value, exp) {
	return decimalAdjust('ceil', value, exp);
});

/**
 * Convert degrees to radians
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param    {number}   degrees
 *
 * @return   {number}
 */
defStat(function degreesToRadians(degrees) {
	return degrees * (Math.PI/180);
});

/**
 * Calculate distance between 2 positions
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param    {number}   lat1
 * @param    {number}   lon1
 * @param    {number}   lat2
 * @param    {number}   lon2
 *
 * @return   {number}   The distance in meters
 */
defStat(function calculateDistance(lat1, lon1, lat2, lon2) {

	var rad_lat1,
	    rad_lat2,
	    distance,
	    d_lat,
	    d_lon,
	    a;

	rad_lat1 = BMath.degreesToRadians(lat1);
	rad_lat2 = BMath.degreesToRadians(lat2);
	d_lat = BMath.degreesToRadians(lat2 - lat1);
	d_lon = BMath.degreesToRadians(lon2 - lon1);

	a = Math.pow(Math.sin(d_lat / 2), 2) + Math.cos(rad_lat1) * Math.cos(rad_lat2) * Math.pow(Math.sin(d_lon / 2), 2);

	// 6371 is the radius of the earth in km
	distance = 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 1000;

	return distance;
});

/**
 * Create and return a new SeededRng
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param    {number}   seed
 *
 * @return   {SeededRng}
 */
defStat(function createSeededRng(seed) {
	return new Classes.SeededRng(seed);
});