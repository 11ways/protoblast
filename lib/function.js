module.exports = function BlastFunction(Blast, Collection) {

	/**
	 * Create a function with the given variable as name
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}    name    The name of the function
	 * @param    {Function}  fnc     The function body
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'create', function create(name, fnc) {

		var result;

		eval('result = function ' + name + '(){return fnc.apply(this, arguments);}');

		return result;
	}, true);

	/**
	 * Create a function that will call the given function with 'this'
	 * as the first argument.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Function}  fnc     The function body
	 * @param    {String}    name    The name to use for the wrapper
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'methodize', function methodize(name) {

		var fnc, method, sourcecode;

		if (this._methodized) return this._methodized;

		fnc = this;

		method = function() {
			
			var args = [this],
			    len = arguments.length,
			    i;

			// Push all the arguments the old fashioned way,
			// this is the fastest method
			for (i = 0; i < len; i++) {
				args.push(arguments[i]);
			}
			
			return fnc.apply(this, args);
		};

		if (typeof name == 'undefined') {
			name = fnc.name;
		}

		// Get the sourcecode
		sourcecode = 'function ' + name + String(method).slice(9);

		eval('this._methodized = ' + sourcecode);

		// Make sure a methodized function doesn't get methodized
		this._methodized._methodized = this._methodized;

		// Add the unmethodized function
		this._unmethodized = fnc;

		return this._methodized;
	});

	/**
	 * Create a function that will call the given function with
	 * the first argument as the context
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Function}  fnc     The function body
	 * @param    {String}    name    The name to use for the wrapper
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'unmethodize', function unmethodize(name) {

		var fnc, unmethod, sourcecode;

		if (this._unmethodized) return this._unmethodized;

		fnc = this;

		unmethod = function() {

			var args = [],
			    i;

			for (i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}

			return fnc.apply(arguments[0], args);
		};

		if (typeof name == 'undefined') {
			name = fnc.name;
		}

		// Get the sourcecode
		sourcecode = 'function ' + name + String(unmethod).slice(9);

		eval('this._unmethodized = ' + sourcecode);

		// Make sure a methodized function doesn't get methodized
		this._unmethodized._unmethodized = this._unmethodized;

		// Add the unmethodized function
		this._methodized = fnc;

		return this._unmethodized;
	});

};