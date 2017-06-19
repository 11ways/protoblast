module.exports = function BlastSeededRandom(Blast, Collection) {

	/**
	 * The Seeded Random Number Generator Class:
	 * An implementation of a linear congruential generator.
	 * Other parameters you can use can be found on Wikipedia:
	 * https://en.wikipedia.org/wiki/Linear_congruential_generator
	 *
	 * The default values are the "Numerical Recipes" one
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @param    {Number}   seed
	 */
	var Seeded = Collection.Function.inherits(function SeededRng(seed) {

		if (typeof seed != 'number') {
			seed = Number(seed);
		}

		if (isNaN(seed)) {
			seed = Math.random();
		}

		this.seed = seed;
	});

	/**
	 * The multiplier
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @type     {Number}
	 */
	Seeded.setProperty('multiplier', 1664525);

	/**
	 * The increment
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @type     {Number}
	 */
	Seeded.setProperty('increment', 1013904223);

	/**
	 * The modulo.
	 * The sequence will never be longer than this, and possibly shorter.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @type     {Number}
	 */
	Seeded.setProperty('modulo', 4294967296);

	/**
	 * unDry an object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * Get the next random number
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.7
	 * @version  0.3.7
	 *
	 * @return   {Number}
	 */
	Seeded.setMethod(function random() {

		var result;

		// Generate the next seed
		this.seed = (this.seed * this.multiplier + this.increment) % this.modulo;

		// Calculate the result
		result = this.seed / this.modulo;

		return result;
	});

};