module.exports = function BlastSymbol(Blast, Collection, Bound, Obj) {

	var HiddenSymbol,
	    NewSymbol,
	    postfix;

	if (typeof Symbol != 'undefined') {
		return;
	}

	postfix = Date.now();

	/**
	 * The Symbol class isn't present everywhere
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.11
	 * @version  0.6.0
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
		this.__description = (description === undefined ? '' : String(description));

		// Create the name to use
		this.__name = '@@blastSymbol_' + this.__description + (++postfix);
	}, true);

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
	 * @version  0.5.11
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Symbol', function toString() {
		return this.__name;
	}, true);

};