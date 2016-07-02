module.exports = function BlastNumber(Blast, Collection) {

	var binUnits,
	    decUnits;

	binUnits = ['b', 'kib', 'mib', 'gib', 'tib', 'pib', 'eib', 'zib', 'yib'];
	decUnits = ['b', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];

	/**
	 * Return a random integer that can be at least `min` and at most `max`
	 * Defaults to numbers between -1 and 101.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   min     Optional minimum number (0 by default)
	 * @param    {Number}   max     Optional maximum number (100 by default)
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Number', 'random', function random(min, max) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Number}   value     The value to clip
	 * @param    {Number}   lowest    The lowest allowed value
	 * @param    {Number}   highest   The highest allowed value
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Number', 'clip', function clip(value, lowest, highest) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.1
	 * @version  0.3.1
	 *
	 * @param    {Array}   input    Input values
	 * @param    {Array}   scale
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Number', 'calculateNormalizeFactors', function calculateNormalizeFactors(input, scale) {
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.1
	 * @version  0.3.1
	 *
	 * @param    {Array}   input    Input values
	 * @param    {Array}   scale
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Number', 'normalize', function normalize(input, scale) {

		var result = new Array(input.length),
		    i;

		if (Array.isArray(scale)) {
			scale = Blast.Bound.Number.calculateNormalizeFactors(input, scale);
		}

		for (i = 0; i < input.length; i++) {
			result[i] = scale.scale_min + (((input[i] - scale.input_min) * (scale.scale_max - scale.scale_min)) / (scale.input_max - scale.input_min));
		}

		return result;
	});

	/**
	 * Denormalize data using the given scale
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.1
	 * @version  0.3.1
	 *
	 * @param    {Array}   input    Input values
	 * @param    {Array}   scale
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Number', 'denormalize', function denormalize(input, scale) {

		var result = new Array(input.length),
		    i;

		for (i = 0; i < input.length; i++) {
			result[i] = input * (scale.input_max - scale.input_min) + scale.input_min;
		}

		return result;
	});

	/**
	 * Return a string representing the source code of the number.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Number', 'toSource', function toSource() {
		return '(new Number(' + this + '))';
	}, true);

	/**
	 * Returns the number as a string with leading zeros to get the
	 * desired length
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.5
	 *
	 * @param    {Number}   length    The minimum length for the result
	 * @param    {Number}   radix     The radix for the string representation
	 *
	 * @return   {String}   The number as a string with padded zeroes
	 */
	Blast.definePrototype('Number', 'toPaddedString', function toPaddedString(length, radix) {
		var str = this.toString(radix || 10);
		return Blast.Bound.String.multiply('0', length - str.length) + str;
	});

	/**
	 * Humanize a number
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   delimiter
	 * @param    {String}   separator
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Number', 'humanize', function humanize(delimiter, separator) {

		var str = this.toString().split('.');

		str[0] = str[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + (delimiter||','));

		return str.join(separator||'.');
	});

	/**
	 * Clip the current value so the result is at least `lowest`
	 * and at most `highest`
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
	Blast.definePrototype('Number', 'clip', function clip(lowest, highest) {
		return Collection.Number.clip(this, lowest, highest);
	});

	/**
	 * Convert a number to the given byte
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.9
	 * @version  0.1.9
	 *
	 * @param    {String}   from     From which unit (bytes by default)
	 * @param    {String}   to       To which unit
	 * @param    {Number}   decimal  toFixed value (1 by default)
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Number', 'toByte', function toByte(from, to, decimal) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.0
	 * @version  0.3.0
	 *
	 * @param    {Number}   position   Which bit to get
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Number', 'bitAt', function bitAt(position) {
		return Number((this >> position) % 2 != 0);
	});
};