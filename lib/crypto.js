module.exports = function BlastCrypto(Blast, Collection) {

	'use strict';

	var libcrypto,
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
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Crypto.setStatic(function uid() {

		if (instance == null) {
			instance = new Crypto();
			instance.populate(10);
		}

		return instance.uid();
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
		libcrypto = window.crypto;

		/**
		 * Add random values to array
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.4.1
		 * @version  0.4.1
		 *
		 * @param    {Array}   arr
		 */
		function addRandomValues(arr) {

			var i;

			if (libcrypto) {
				libcrypto.getRandomValues(arr);
			} else {
				for (i = 0; i < arr.length; i++) {
					arr[i] = ~~((Math.random()*250)-125);
				}
			}
		}

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
		 * @version  0.4.1
		 *
		 * @param    {Number}   bytesize
		 * @param    {Function} callback   Optional callback
		 *
		 * @return   {String}
		 */
		Crypto.setStatic(function randomHex(bytesize, callback) {

			var result = 1,
			    arr,
			    i;

			// Create a new target array
			arr = new Int8Array(bytesize);

			addRandomValues(arr);

			for (i = 0; i < arr.length; i++) {
				result *= arr[i];
			}

			result = Math.abs(result).toString(16);

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