const defStat = Blast.createStaticDefiner('Number'),
      defProto = Blast.createProtoDefiner('Number');

let binUnits = ['b', 'kib', 'mib', 'gib', 'tib', 'pib', 'eib', 'zib', 'yib'],
    decUnits = ['b', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];

/**
 * Return a random integer that can be at least `min` and at most `max`
 * Defaults to numbers between -1 and 101.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}   min     Optional minimum number (0 by default)
 * @param    {number}   max     Optional maximum number (100 by default)
 *
 * @return   {number}
 */
defStat(function random(min, max) {

	if (typeof max === 'undefined') {

		if (typeof min === 'undefined') {
			max = 100;
		} else {
			max = min;
		}

		min = 0;
	}

	return Math.floor(Math.random()*(max-min+1)+min);
});

/**
 * Clip the given value so the result is at least `lowest`
 * and at most `highest`.
 * Invalid values will be clipped to `lowest`
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {number}   value     The value to clip
 * @param    {number}   lowest    The lowest allowed value
 * @param    {number}   highest   The highest allowed value
 *
 * @return   {number}
 */
defStat(function clip(value, lowest, highest) {

	// Return `lowest` if the value is under the threshold
	// We write the condition this way to cope with `NaN` and `undefined`
	if (!(lowest < value)) {
		return lowest;
	}

	// Return `highest` if the value is over the threshold
	if (!(highest > value)) {
		return highest;
	}

	// The value is in the margin, just return it
	return value;
});

/**
 * Calculate numbers needed to normalize data
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.1
 * @version  0.3.1
 *
 * @param    {Array}   input    Input values
 * @param    {Array}   scale
 *
 * @return   {Object}
 */
defStat(function calculateNormalizeFactors(input, scale) {
	return {
		input_min : Math.min.apply(Math, input),
		input_max : Math.max.apply(Math, input),
		scale_min : Math.min.apply(Math, scale),
		scale_max : Math.max.apply(Math, scale)
	};
});

/**
 * Normalize data using the given scale
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.1
 * @version  0.3.1
 *
 * @param    {Array}   input    Input values
 * @param    {Array}   scale
 *
 * @return   {Array}
 */
defStat(function normalize(input, scale) {

	var result = new Array(input.length),
	    i;

	if (Array.isArray(scale)) {
		scale = Bound.Number.calculateNormalizeFactors(input, scale);
	}

	for (i = 0; i < input.length; i++) {
		result[i] = scale.scale_min + (((input[i] - scale.input_min) * (scale.scale_max - scale.scale_min)) / (scale.input_max - scale.input_min));
	}

	return result;
});

/**
 * Denormalize data using the given scale
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.1
 * @version  0.9.6
 *
 * @param    {Array}   input    Input values
 * @param    {Array}   scale
 *
 * @return   {Array}
 */
defStat(function denormalize(input, scale) {

	var result = new Array(input.length),
	    i;

	for (i = 0; i < input.length; i++) {
		result[i] = input[i] * (scale.input_max - scale.input_min) + scale.input_min;
	}

	return result;
});

/**
 * Determine if something is numeric
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {Mixed}   input
 *
 * @return   {boolean}
 */
defStat(function isNumeric(input) {

	if (typeof input == 'number') {
		return true;
	}

	return !isNaN(parseFloat(input)) && isFinite(input);
});

/**
 * Returns the number as a string with leading zeros to get the
 * desired length
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.5
 *
 * @param    {number}   length    The minimum length for the result
 * @param    {number}   radix     The radix for the string representation
 *
 * @return   {string}   The number as a string with padded zeroes
 */
defProto(function toPaddedString(length, radix) {
	var str = this.toString(radix || 10);
	return Bound.String.multiply('0', length - str.length) + str;
});

/**
 * Humanize a number
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {string}   delimiter
 * @param    {string}   separator
 *
 * @return   {string}
 */
defProto(function humanize(delimiter, separator) {

	var str = this.toString().split('.');

	str[0] = str[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + (delimiter||','));

	return str.join(separator||'.');
});

/**
 * Clip the current value so the result is at least `lowest`
 * and at most `highest`
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @param    {number}   lowest    The lowest allowed value
 * @param    {number}   highest   The highest allowed value
 *
 * @return   {number}
 */
defProto(function clip(lowest, highest) {
	return Collection.Number.clip(this, lowest, highest);
});

/**
 * Convert a number to the given byte
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.9
 * @version  0.1.9
 *
 * @param    {string}   from     From which unit (bytes by default)
 * @param    {string}   to       To which unit
 * @param    {number}   decimal  toFixed value (1 by default)
 *
 * @return   {number}
 */
defProto(function toByte(from, to, decimal) {

	var fromBase,
	    toBase,
	    fromId,
	    start,
	    toId,
	    val;

	if (typeof to != 'string') {
		decimal = to;
		to = from;
		from = null;
	}

	if (typeof from != 'string') {
		from = 'b';
	} else {
		from = from.toLowerCase();
	}

	if (typeof to != 'string') {
		to = 'b';
	} else {
		to = to.toLowerCase();
	}

	if (typeof decimal == 'undefined') {
		decimal = 1;
	}

	fromId = binUnits.indexOf(from);

	if (fromId > -1) {
		fromBase = 1024;
	} else {
		fromId = decUnits.indexOf(from);
		fromBase = 1000;
	}

	toId = binUnits.indexOf(to);

	if (toId > -1) {
		toBase = 1024;
	} else {
		toId = decUnits.indexOf(to);
		toBase = 1000;
	}

	// Convert `from` value to bytes
	start = this * Math.pow(fromBase, fromId);

	val = start / Math.pow(toBase, toId);

	if (decimal != null) {
		val = val * Math.pow(10, decimal);
		val = Math.round(val);
		val = val / Math.pow(10, decimal);
	}

	return val;
});

/**
 * Return the bit at the specified position
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {number}   position   Which bit to get
 *
 * @return   {number}
 */
defProto(function bitAt(position) {
	return Number((this >> position) % 2 != 0);
});

/**
 * A more precise toFixed
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.6
 * @version  0.3.6
 *
 * @param    {number}   precision
 *
 * @return   {string}
 */
defProto(function toFixed10(precision) {
	return Collection.Math.round10(this, -precision).toFixed(precision);
});

/**
 * Format money
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.6
 * @version  0.3.6
 *
 * @param    {number}   decimal_count
 * @param    {string}   decimal_separator
 * @param    {string}   thousand_separator
 *
 * @return   {string}
 */
defProto(function formatMoney(decimal_count, decimal_separator, thousand_separator) {

	var number_without_decimals,
	    separated_middle,
	    leading_number,
	    spacing_start,
	    decimals,
	    prefix,
	    result,
	    temp;

	if (decimal_count == null) {
		decimal_count = 2;
	}

	if (decimal_separator == null) {
		decimal_separator = '.';
	}

	if (thousand_separator == null) {
		thousand_separator = ',';
	}

	// If this is negative, add a minus prefix
	prefix = this < 0 ? '-' : '';

	number_without_decimals = String(Math.floor(Math.abs(this) || 0));

	// Find out where the first space goes
	if (number_without_decimals.length > 3) {
		spacing_start = number_without_decimals.length % 3;
	} else {
		spacing_start = 0;
	}

	if (spacing_start) {
		leading_number = number_without_decimals.substr(0, spacing_start) + thousand_separator;
	} else {
		leading_number = '';
	}

	separated_middle = number_without_decimals.substr(spacing_start).replace(/(\d{3})(?=\d)/g, '$1' + thousand_separator);

	if (decimal_count) {

		// Round the number FIRST
		// (subtracting the number_without_decimals could result in floating point errors)
		temp = Collection.Math.round10(this, -decimal_count);

		// Now the number_without_decimals can be subtracted
		temp = Math.abs(temp - number_without_decimals);

		// Get the fixed string
		temp = temp.toFixed(decimal_count);

		decimals = decimal_separator + temp.slice(2);
	} else {
		decimals = '';
	}

	result = prefix + leading_number + separated_middle + decimals;

	return result;
});