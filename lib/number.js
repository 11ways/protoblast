module.exports = function BlastNumber(Blast, Collection) {

	/**
	 * Return a random integer that can be at least `min` and at most `max`
	 * Defaults to numbers between -1 and 101.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * Return a string representing the source code of the number.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Number}   length    The minimum length for the result
	 * @param    {Number}   radix     The radix for the string representation
	 *
	 * @return   {String}   The number as a string with padded zeroes
	 */
	Blast.definePrototype('Number', 'toPaddedString', function toPaddedString(length, radix) {
		var str = this.toString(radix || 10);
		return '0'.multiply(length - str.length) + str;
	});

	/**
	 * Humanize a number
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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

};