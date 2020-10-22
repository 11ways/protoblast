module.exports = function BlastCrypto(Blast, Collection) {

	'use strict';

	var public_nanoid_generator,
	    addRandomValues,
	    libcrypto,
	    instance;

	/**
	 * The Crypto class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 */
	var Crypto = Collection.Function.inherits(function Crypto() {

		// Create a random array
		this.random = [];
	});

	/**
	 * Get a UID
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.7.4
	 *
	 * @return   {String}
	 */
	Crypto.setStatic(function uid() {
		return Crypto.publicInstance().uid();
	});

	/**
	 * Get a nanoid
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.4
	 * @version  0.7.4
	 *
	 * @param    {Number}   size
	 *
	 * @return   {String}
	 */
	Crypto.setStatic(function nanoid(size) {
		return Crypto.publicInstance().nanoid(size);
	});

	/**
	 * Get the shared instance
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.4
	 * @version  0.7.4
	 *
	 * @return   {Crypto}
	 */
	Crypto.setStatic(function publicInstance() {

		if (instance == null) {
			instance = new Crypto();
			instance.populate(10);
		}

		return instance;
	});

	/**
	 * Generate a pseudorandom hex string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Number}   bytesize
	 *
	 * @return   {String}
	 */
	Crypto.setStatic(function pseudoHex() {
		return (Math.floor(Math.random() * 100000000000000000)).toString(16);
	});

	/**
	 * Create a random nanoid generator
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.4
	 * @version  0.7.4
	 *
	 * @param    {String}   alphabet
	 * @param    {Number}   default_size
	 * @param    {Object}   random
	 *
	 * @return   {Function}
	 */
	Crypto.setStatic(function createNanoidGenerator(alphabet, default_size, random) {

		let alphabet_length = alphabet.length,
		    mask = (2 << (31 - Math.clz32((alphabet_length - 1) | 1))) - 1,
		    default_step = Math.ceil((1.6 * mask * default_size) / alphabet_length);

		if (!random) {
			random = Crypto.publicInstance();
		}

		return function generateNanoId(size) {

			let step;

			if (!size) {
				size = default_size;
			}

			if (size == default_size) {
				step = default_step;
			} else {
				step = Math.ceil((1.6 * mask * size) / alphabet_length);
			}

			let bytes,
			    id = '',
			    i;

			while (true) {
				bytes = random.randomBytes(step);
				i = step;

				while (i--) {
					id += alphabet[bytes[i] & mask] || '';

					if (id.length === +size) return id;
				}
			}
		}
	});

	/**
	 * Request new random numbers
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Number}   amount
	 */
	Crypto.setMethod(function populate(amount) {

		var that = this,
		    i;

		if (this.random.length > 1000) {
			return;
		}

		if (amount == null) {
			amount = 1;
		}

		for (i = 0; i < amount; i++) {
			Crypto.randomHex(8, function gotHex(err, hex) {
				that.random.push(hex);
			});
		}
	});

	/**
	 * Get a UID
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 */
	Crypto.setMethod(function uid() {

		var result,
		    base,
		    nr;

		// Get a random hex
		base = this.random.shift();

		// If there is no true random hex yet, create a pseudo one
		if (base == null) {
			base = Crypto.pseudoHex().slice(0, 8);
		}

		// Start with the date
		result = Date.now().toString(36);

		// Add the pseudorandom hex
		result += '-' + Crypto.pseudoHex().slice(0, 8);

		// Add the random hex
		result += '-' + base;

		// Request new random numbers for the future
		this.populate();

		return result;
	});

	/**
	 * Generate a random string
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.4
	 * @version  0.7.4
	 *
	 * @param    {Number}   bytesize
	 * @param    {Function} callback
	 *
	 * @return   {Buffer}
	 */
	Crypto.setMethod(function randomBytes(bytesize, callback) {
		return Crypto.randomBytes(bytesize, callback);
	});

	/**
	 * Generate a random string and convert it as Base64
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.4
	 * @version  0.7.4
	 *
	 * @param    {Number}   bytesize
	 * @param    {Function} callback   Optional callback
	 *
	 * @return   {String}
	 */
	Crypto.setMethod(function randomHex(bytesize, callback) {
		return Crypto.randomHex(bytesize, callback);
	});

	/**
	 * Get a nano-id
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.4
	 * @version  0.7.4
	 *
	 * @param    {Number}   length
	 *
	 * @return   {String}
	 */
	Crypto.setMethod(function nanoid(length) {

		if (!public_nanoid_generator) {
			// The default alphabet is like this for gzip reasons ^^
			public_nanoid_generator = Crypto.createNanoidGenerator('ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW', 21);
		}

		return public_nanoid_generator(length);
	});

	if (Blast.isNode) {
		// PROTOBLAST START CUT
		libcrypto = require('crypto');

		/**
		 * Generate a random string
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.1.4
		 * @version  0.1.4
		 *
		 * @param    {Number}   bytesize
		 * @param    {Function} callback
		 *
		 * @return   {Buffer}
		 */
		Crypto.setStatic(function randomBytes(bytesize, callback) {
			return libcrypto.randomBytes(bytesize, callback);
		});

		/**
		 * Generate a random hexadecimal string
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.1.4
		 * @version  0.1.11
		 *
		 * @param    {Number}   bytesize
		 * @param    {Function} callback   Optional callback
		 *
		 * @return   {String}
		 */
		Crypto.setStatic(function randomHex(bytesize, callback) {

			var result;

			if (callback == null) {
				return Crypto.randomBytes(bytesize).toString('hex');
			}

			Crypto.randomBytes(bytesize, function gotRandom(err, buffer) {

				// If an error occured (due to low entropy, probably)
				// schedule it again
				if (err != null) {
					return Crypto.randomHex(bytesize, callback);
				}

				callback(null, buffer.toString('hex'));
			});
		});
		// PROTOBLAST END CUT
	} else {
		libcrypto = Blast.Globals.crypto;

		/**
		 * Add random values to array
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.4.1
		 * @version  0.4.1
		 *
		 * @param    {Array}   arr
		 */
		addRandomValues = function addRandomValues(arr) {

			var i;

			if (libcrypto) {
				libcrypto.getRandomValues(arr);
			} else {
				for (i = 0; i < arr.length; i++) {
					arr[i] = ~~((Math.random()*250)-125);
				}
			}
		};

		/**
		 * Generate a random string
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.1.4
		 * @version  0.4.1
		 *
		 * @param    {Number}   bytesize
		 * @param    {Function} callback
		 *
		 * @return   {Int8Array}
		 */
		Crypto.setStatic(function randomBytes(bytesize, callback) {

			var result;

			// Create a new target array
			result = new Int8Array(bytesize);

			addRandomValues(result);

			if (callback != null) {
				Blast.setImmediate(function callbackRandomBytes() {
					callback(null, result);
				});
			}

			return result;
		});

		/**
		 * Generate a random string and convert it as Base64
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.1.4
		 * @version  0.7.1
		 *
		 * @param    {Number}   bytesize
		 * @param    {Function} callback   Optional callback
		 *
		 * @return   {String}
		 */
		Crypto.setStatic(function randomHex(bytesize, callback) {

			var result = '',
			    arr,
			    nr,
			    i;

			// Create a new target array
			arr = new Int8Array(bytesize);

			addRandomValues(arr);

			for (i = 0; i < arr.length; i++) {
				nr = (Math.abs(arr[i]) + 125).toString(16);

				if (nr.length == 1) {
					nr = '0' + nr;
				}

				result += nr;
			}

			if (callback == null) {
				return result;
			}

			Blast.setImmediate(function returnBase() {
				callback(null, result);
			});
		});
	}

	Blast.defineClass('Crypto', Crypto);
};