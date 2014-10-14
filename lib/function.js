module.exports = function BlastFunction(Blast, Collection) {

	var tokenPatterns,
	    tokenMatches,
	    tokenTesters,
	    patternNames,
	    haveCombined,
	    combineError;

	tokenPatterns = {
		whitespace : /\s+/,
		keyword    : /\b(?:var|let|for|if|else|in|class|function|typeof|return|with|case|break|switch|export|new|while|do|throw|catch|true|false)\b/,
		name       : /[a-zA-Z_\$][a-zA-Z_\$0-9]*/,
		string1    : /"(?:(?:\\\n|\\"|[^"\n]))*?"/,
		string2    : /'(?:(?:\\\n|\\'|[^'\n]))*?'/,
		comment1   : /\/\*[\s\S]*?\*\//,
		comment2   : /\/\/.*?\n/,
		number     : /\d+(?:\.\d+)?(?:e[+-]?\d+)?/,
		parens     : /[\(\)]/,
		curly      : /[{}]/,
		square     : /[\[\]]/,
		punct      : /[;.:\?\^%<>=!&|+\-,~]/,
		regexp     : /\/(?:(?:\\\/|[^\n\/]))*?\//
	};

	patternNames = {
		string1: 'string',
		string2: 'string',
		comment1: 'comment',
		comment2: 'comment'
	};

	Blast.ready(function BlastReadyFunction() {

		var patternName;

		try {
			// Create the matches
			tokenMatches = Collection.RegExp.combine.apply(null, Collection.Object.values(tokenPatterns));
		} catch (err) {
			combineError = err;
			return;
		}

		// Create the testers
		tokenTesters = {};

		for (patternName in tokenPatterns) {
			tokenTesters[patternName] = new RegExp('^' + Collection.RegExp.prototype.getPattern.call(tokenPatterns[patternName]) + '$');
		}

		haveCombined = true;
	});

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
	 * Get the type of the given token
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}    tokenString
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('Function', 'getTokenType', function getTokenType(tokenString) {

		var patternName;

		if (!haveCombined) {
			throw combineError;
		}

		for (patternName in tokenPatterns) {
			if (tokenTesters[patternName].test(tokenString)) {

				if (patternNames[patternName]) {
					return patternNames[patternName];
				}

				return patternName;
			}
		}

		return 'invalid';
	});

	/**
	 * Convert JavaScript sourcecode to tokens
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   sourceCode
	 * @param    {Boolean}  addType        Add the type of the token
	 * @param    {Boolean}  throwErrors    Throw error when invalid token is found
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Function', 'tokenize', function tokenize(sourceCode, addType, throwErrors) {

		var tokens = [],
		    obj,
		    i;

		if (!haveCombined) {
			throw combineError;
		}

		if (typeof sourceCode !== 'string') {
			sourceCode = ''+sourceCode;
		}

		sourceCode = sourceCode.split(tokenMatches);

		for (i = 0; i < sourceCode.length; i++) {

			// Every uneven match should be used
			if (i % 2) {
				tokens.push(sourceCode[i]);
			} else if (sourceCode[i] !== '') {

				// If an even match contains something, it's invalid
				if (throwErrors) {
					throw new Error('Invalid token: ' + JSON.stringify(e));
				}

				tokens.push(sourceCode[i]);
			}
		}

		if (!addType) {
			return tokens;
		}

		for (i = 0; i < tokens.length; i++) {

			obj = {
				type: Collection.Function.getTokenType(tokens[i]),
				value: tokens[i]
			};

			// Replace the original string with the object
			tokens[i] = obj;
		}

		return tokens;
	});

	/**
	 * Function's should really have a name property,
	 * this is not yet implemented in IE9, IE10 or IE11
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Function', 'name', 'get', function name() {

		var fncName;

		// Turn the function into a string and extract the name using a regex
		fncName = this.toString().match(/^\s*function\s*(\S*)\s*\(/);

		// If no name is found, use an empty string
		if (!fncName || !fncName[1]) {
			fncName = '';
		} else {
			fncName = fncName[1];
		}

		// Store the name property on the function itself
		this.name = fncName;

		// Return the name
		return fncName;
	}, true);

	/**
	 * Return a string representing the source code of the function.
	 * Also attempts to return native code references,
	 * or at least non-error causing functions.
	 *
	 * Overwrites existing method in Firefox.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Function', 'toSource', function toSource() {

		// Get a string representation of the function
		var str = this.toString();

		// If this is native code, just return the name
		if (str.slice(-17) == '{ [native code] }') {
			if (Blast.Globals[this.name] === this) {
				return this.name;
			} else {
				return '(function ' + this.name + '(){throw new Error("Could not uneval native code!")})';
			}
		}

		return '(' + str + ')';
	});

	/**
	 * Convert this function sourcecode to tokens
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Boolean}  addType        Add the type of the token
	 * @param    {Boolean}  throwErrors    Throw error when invalid token is found
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Function', 'tokenize', function tokenize(addType, throwErrors) {
		return Collection.Function.tokenize(''+this, addType, throwErrors);
	});

	/**
	 * Get a function's body source
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Function', 'getBodySource', function getBodySource() {

		// Get the source code of the function
		var src = String(this);

		// Slice it
		return src.slice(src.indexOf('{')+1, -1);
	});

	// method source code
	var method = ''+function (){
		
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

	// Remove the 'function' part and leave only the body
	method = method.slice(method.indexOf('('));

	/**
	 * Create a function that will call the given function with 'this'
	 * as the first argument.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}    name    The name to use for the wrapper
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'methodize', function methodize(name) {

		var fnc, sourcecode;

		if (this._methodized) return this._methodized;

		fnc = this;

		if (typeof name == 'undefined') {
			name = fnc.name;
		}

		// Get the sourcecode
		sourcecode = 'function ' + name + method;

		eval('Blast.defineProperty(fnc, "_methodized", {value:' + sourcecode + '});');

		// Make sure a methodized function doesn't get methodized
		Blast.defineProperty(fnc._methodized, '_methodized', {value: fnc._methodized});

		// Add the unmethodized function
		Blast.defineProperty(fnc, '_unmethodized', {value: fnc});

		return this._methodized;
	});

	// Unmethod source code
	var unmethod = ''+function () {

		var args = [],
		    i;

		for (i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		return fnc.apply(arguments[0], args);
	};

	// Remove the 'function' part and leave only the body
	unmethod = unmethod.slice(unmethod.indexOf('('));

	/**
	 * Create a function that will call the given function with
	 * the first argument as the context
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}    name    The name to use for the wrapper
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'unmethodize', function unmethodize(name) {

		var fnc, sourcecode;

		if (this._unmethodized) return this._unmethodized;

		fnc = this;

		if (typeof name == 'undefined') {
			name = fnc.name;
		}

		// Get the sourcecode
		sourcecode = 'function ' + name + unmethod;

		eval('Blast.defineProperty(fnc, "_unmethodized", {value:' + sourcecode + '});');

		// Make sure an unmethodized function doesn't get unmethodized
		Blast.defineProperty(fnc._unmethodized, '_unmethodized', {value: fnc._unmethodized});

		// Add the methodized function
		Blast.defineProperty(fnc, '_methodized', {value: fnc});

		return this._unmethodized;
	});

	/**
	 * Create a function that already contains pre-filled-in arguments
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'curry', function curry() {

		var curryArgs,
		    curried,
		    name,
		    fnc,
		    i;

		// If no arguments are given, return the same function
		if (arguments.length === 0) {
			return this;
		}

		fnc = this;

		// Keep function optimized by not leaking the `arguments` object
		curryArgs = new Array(arguments.length);
		for (i = 0; i < curryArgs.length; i++) curryArgs[i] = arguments[i];

		curriedSource = function () {

			var args,
			    i;

			// Clone the pre-filled arguments
			args = curryArgs.slice(0);

			// Add the new arguments
			for (i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}

			// Apply the original function, with the curent context
			return fnc.apply(this, args);
		};

		name = fnc.name || '';

		// Get the sourcecode
		sourcecode = 'function ' + name + String(curriedSource).slice(9);

		eval('curried = ' + sourcecode);

		return curried;
	});

	/**
	 * Execute a function in a try/catch statement.
	 * This should be done in a separate function like this because
	 * try/catch breaks optimization.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fnc
	 * @param    {Array}      args
	 *
	 * @return   {Error}
	 */
	Blast.defineStatic('Function', 'tryCatch', function tryCatch(fnc, args, context) {
		try {
			if (context) {
				return fnc.apply(context, args);
			} else {
				return fnc.apply(void 0, args);
			}
		} catch (err) {
			return err;
		}
	});
};