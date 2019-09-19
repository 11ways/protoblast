module.exports = function BlastSymbol(Blast, Collection, Bound, Obj) {

	var HiddenSymbol,
	    NewSymbol,
	    postfix;

	if (typeof Symbol != 'undefined') {

		/**
		 * Is this a symbol?
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.7.0
		 * @version  0.7.0
		 *
		 * @return  {Boolean}
		 */
		Blast.defineStatic(Symbol, function isSymbol(value) {
			return typeof value == 'symbol';
		});

		return;
	}

	postfix = Date.now();

	/**
	 * The Symbol class isn't present everywhere
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.11
	 * @version  0.7.0
	 *
	 * @param    {String}   description
	 */
	NewSymbol = Blast.defineClass('Symbol', function Symbol(description) {

		var symbol;

		if (this instanceof Symbol) {
			throw new TypeError('Symbol is not a constructor');
		}

		// Create the actual symbol
		symbol = Object.create(HiddenSymbol.prototype);

		// Make sure the description is a string
		symbol.__description = (description === undefined ? '' : String(description));

		// Create the name to use
		symbol.__name = '@@blastSymbol_' + symbol.__description + (++postfix);

		return symbol;
	}, true);

	/**
	 * Simple indicator that this is our polyfill
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @type    {Boolean}
	 */
	Blast.defineStatic(NewSymbol, 'polyfilled', true);

	/**
	 * Is this a symbol?
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @return  {Boolean}
	 */
	Blast.defineStatic(NewSymbol, function isSymbol(value) {

		if (!value || typeof value != 'string' || value.length < 14) {
			return false;
		}

		if (value[0] == '@' && value.indexOf('@@blastSymbol_') === 0) {
			return true;
		}

		return false;
	});

	/**
	 * Unexposed constructor, used to foil `instanceof` calls
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.11
	 * @version  0.5.11
	 *
	 * @param    {String}   description
	 */
	HiddenSymbol = function Symbol(description) {
		if (this instanceof HiddenSymbol) {
			throw new TypeError('Symbol is not a constructor');
		}

		return NewSymbol(description);
	};

	/**
	 * Convert a symbol to a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.11
	 * @version  0.7.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype(HiddenSymbol, function toString() {
		return this.__name;
	}, true);

	// Add some expected symbols
	Symbol.iterator = Symbol('iterator');

};