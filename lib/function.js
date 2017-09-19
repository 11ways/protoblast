module.exports = function BlastFunction(Blast, Collection) {

	var tokenPatterns,
	    tokenMatches,
	    tokenTesters,
	    patternNames,
	    haveCombined,
	    combineError;

	tokenPatterns = {
		whitespace : /\s+/,
		keyword    : /\b(?:var|const|let|for|if|else|in|class|function|typeof|return|with|case|break|switch|export|new|while|do|throw|catch|true|false|continue|null|undefined|try)\b/,
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.4.0
	 *
	 * @param    {String}       name    The name of the function
	 * @param    {String|Array} args    Optional argument names to use
	 * @param    {Function}     fnc     The function body
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'create', function create(name, args, fnc) {

		var result,
		    args,
		    i;

		if (typeof args == 'function') {
			fnc = args;
			args = null;
		}

		if (args) {
			if (typeof args != 'string') {
				if (Array.isArray(args)) {
					args = args.join(', ');
				} else {
					throw new TypeError('The arguments parameter needs to be a string or array');
				}
			}
		} else if (fnc.length) {
			args = Collection.Function.getArgumentNames(fnc).join(', ');
		} else {
			args = '';
		}

		eval('result = function ' + name + '(' + args + ') {return fnc.apply(this, arguments);}');

		// Store the new wrapper function on fnc
		fnc.wrapper = result;

		return result;
	}, true);

	/**
	 * Check if the given function name is allowed
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.8
	 * @version  0.3.8
	 *
	 * @param    {String}    name    The name of the function to test
	 *
	 * @return   {Boolean}
	 */
	Blast.defineStatic('Function', 'isNameAllowed', function isNameAllowed(name) {

		var result;

		try {
			eval('result = function ' + name + '() {};');
		} catch (err) {
			return false;
		}

		return true;
	});

	/**
	 * Get the type of the given token
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * Get the name of a function's arguments
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.8
	 * @version  0.3.8
	 *
	 * @param    {Function|String}   fnc
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Function', 'getArgumentNames', function getArgumentNames(fnc) {

		var result = [],
		    started,
		    tokens,
		    token,
		    i;

		tokens = Collection.Function.tokenize(fnc, true);

		for (i = 0; i < tokens.length; i++) {
			token = tokens[i];

			if (!started) {
				if (token.type == 'parens' && token.value == '(') {
					started = true;
				} else {
					continue;
				}
			} else {
				if (token.type == 'parens' && token.value == ')') {
					break;
				}

				if (token.type == 'name') {
					result.push(token.value);
				}
			}
		}

		return result;
	});

	/**
	 * Function's should really have a name property,
	 * this is not yet implemented in IE9, IE10 or IE11.
	 * Because this is so important to Protoblast,
	 * it's always added to the prototype.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.defineGet(Function.prototype, 'name', function name() {

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
	});

	/**
	 * Return a string representing the source code of the function.
	 * Also attempts to return native code references,
	 * or at least non-error causing functions.
	 *
	 * Overwrites existing method in Firefox.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
		
		return m_fnc.apply(this, args);
	};

	// Remove the 'function' part and leave only the body
	method = method.slice(method.indexOf('('));

	/**
	 * Create a function that will call the given function with 'this'
	 * as the first argument.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.3.9
	 *
	 * @param    {String}    name    The name to use for the wrapper
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'methodize', function methodize(name) {

		var sourcecode,
		    m_fnc;

		if (this._methodized) return this._methodized;

		m_fnc = this;

		if (typeof name == 'undefined') {
			name = m_fnc.name;
		}

		// Add an underscore should anyone ever use this name
		if (name == 'm_fnc') {
			name = '_m_fnc';
		}

		if (!Collection.Function.isNameAllowed(name)) {
			name = '_' + name;
		}

		// Get the sourcecode
		sourcecode = 'function ' + name + method;

		eval('Blast.defineProperty(m_fnc, "_methodized", {value:' + sourcecode + '});');

		// Make sure a methodized function doesn't get methodized
		Blast.defineProperty(m_fnc._methodized, '_methodized', {value: m_fnc._methodized});

		// Add the unmethodized function
		Blast.defineProperty(m_fnc._methodized, '_unmethodized', {value: m_fnc});

		return this._methodized;
	});

	// Unmethod source code
	var unmethod = ''+function () {

		var args = [],
		    i;

		for (i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		return u_fnc.apply(arguments[0], args);
	};

	// Remove the 'function' part and leave only the body
	unmethod = unmethod.slice(unmethod.indexOf('('));

	/**
	 * Create a function that will call the given function with
	 * the first argument as the context
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.3.9
	 *
	 * @param    {String}    name    The name to use for the wrapper
	 *
	 * @return   {Function}
	 */
	Blast.definePrototype('Function', 'unmethodize', function unmethodize(name) {

		var sourcecode,
		    u_fnc;

		if (this._unmethodized) return this._unmethodized;

		u_fnc = this;

		if (typeof name == 'undefined') {
			name = u_fnc.name;
		}

		// Add an underscore should anyone ever use this name
		if (name == 'u_fnc') {
			name = '_u_fnc';
		}

		if (!Collection.Function.isNameAllowed(name)) {
			name = '_' + name;
		}

		// Get the sourcecode
		sourcecode = 'function ' + name + unmethod;

		eval('Blast.defineProperty(u_fnc, "_unmethodized", {value:' + sourcecode + '});');

		// Make sure an unmethodized function doesn't get unmethodized
		Blast.defineProperty(u_fnc._unmethodized, '_unmethodized', {value: u_fnc._unmethodized});

		// Add the methodized function
		Blast.defineProperty(u_fnc._unmethodized, '_methodized', {value: u_fnc});

		return this._unmethodized;
	});

	/**
	 * Create a function that already contains pre-filled-in arguments
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * Make this function listen to the event on the given object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.9
	 * @version  0.1.9
	 *
	 * @param    {String}    event    The name of the event to listen to
	 * @param    {Object}    context
	 */
	Blast.definePrototype('Function', 'listenTo', function listenTo(event, context) {

		var method;

		if (!context) {
			return false;
		}

		if (context.addEventListener) {
			method = 'addEventListener';
		} else if (context.addListener) {
			method = 'addListener';
		} else if (context.listen) {
			method = 'listen';
		} else {
			method = 'on';
		}

		if (typeof context[method] != 'function') {
			return false;
		}

		context[method](event, this);

		return true;
	});

	/**
	 * Remove this event as a listener from the object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.9
	 * @version  0.1.9
	 *
	 * @param    {String}    event    The name of the event to unlisten
	 * @param    {Object}    context
	 */
	Blast.definePrototype('Function', 'unListen', function unListen(event, context) {

		var method;

		if (!context) {
			return false;
		}

		if (context.removeEventListener) {
			method = 'removeEventListener';
		} else if (context.removeListener) {
			method = 'removeListener';
		} else {
			method = 'off';
		}

		if (typeof context[method] != 'function') {
			return false;
		}

		context[method](event, this);

		return true;
	});

	/**
	 * Execute a function in a try/catch statement.
	 * This should be done in a separate function like this because
	 * try/catch breaks optimization.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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