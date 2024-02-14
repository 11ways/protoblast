/**
 * The Seeded Random Number Generator Class:
 * An implementation of a linear congruential generator.
 * Other parameters you can use can be found on Wikipedia:
 * https://en.wikipedia.org/wiki/Linear_congruential_generator
 *
 * The default values are the "Numerical Recipes" one
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @param    {number}   seed
 */
var Seeded = Fn.inherits(function SeededRng(seed) {

	var seed_number;

	if (typeof seed == 'number') {
		seed_number = seed;
	} else {
		seed_number = Number(seed);
	}

	if (isNaN(seed_number)) {

		// If the seed is a string, get the fowler hash
		if (typeof seed == 'string') {
			seed_number = Bound.String.fowler(seed);
		} else {
			seed_number = Math.random();
		}
	}

	this.seed = seed_number;
});

Seeded.setProperty({
	/**
	 * The multiplier
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @type     {number}
	 */
	multiplier: 1664525,

	/**
	 * The increment
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @type     {number}
	 */
	increment: 1013904223,

	/**
	 * The modulo.
	 * The sequence will never be longer than this, and possibly shorter.
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @type     {number}
	 */
	modulo: 4294967296
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @return   {SeededRng}
 */
Seeded.setStatic(function unDry(obj) {
	var result = new Seeded(obj.seed);

	result.modulo = obj.modulo;
	result.multiplier = obj.multiplier;
	result.increment = obj.increment;

	return result;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @return   {Object}
 */
Seeded.setMethod(function toDry() {
	return {
		value: {
			seed         : this.seed,
			modulo       : this.modulo,
			multiplier   : this.multiplier,
			increment    : this.increment
		},
		path: '__Protoblast.Classes.SeededRng'
	};
});

/**
 * Get a number between the given min and max (inclusive)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {number}
 */
Seeded.setMethod(function between(min, max) {

	if (typeof max === 'undefined') {

		if (typeof min === 'undefined') {
			max = 100;
		} else {
			max = min;
		}

		min = 0;
	}

	if (min > max) {
		let tmp = min;
		min = max;
		max = tmp;
	}

	return Math.floor(this.random()*(max-min+1)+min);
});

/**
 * Get the next random number
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.7
 * @version  0.3.7
 *
 * @return   {number}
 */
Seeded.setMethod(function random() {

	var result;

	// Generate the next seed
	this.seed = (this.seed * this.multiplier + this.increment) % this.modulo;

	// Calculate the result
	result = this.seed / this.modulo;

	return result;
});

/**
 * Get an array of random numbers
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.4
 * @version  0.7.4
 *
 * @param    {number}   size      How many bytes to return
 * @param    {Function} callback  Optional callback
 *
 * @return   {Array}
 */
Seeded.setMethod(function randomBytes(size, callback) {

	let result = [];

	while (size--) {
		result.push(~~(this.random() * 256));
	}

	if (callback) {
		callback(null, result);
	}

	return result;
});