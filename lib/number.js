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

};