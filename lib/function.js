module.exports = function BlastFunction(Blast, Collection) {

	var token_patterns,
	    tokenMatches,
	    tokenTesters,
	    patternNames,
	    haveCombined,
	    combineError,
	    operators,
	    keywords;

	keywords = [
		'async', 'await',
		'break',
		'case', 'catch', 'class', 'const', 'continue',
		'debugger', 'default', 'delete', 'do',
		'else', 'enum', 'export',
		'false', 'finally', 'for', 'function',
		'if', 'in', 'instanceof',
		'let',
		'new', 'null',
		'return',
		'switch',
		'this', 'throw', 'true', 'try', 'typeof',
		'var', 'void',
		'while', 'with',
		'yield'
	];

	operators = {
		'>>>=': 'assign_unsigned_right_shift',
		'>>=' : 'assign_right_shift',
		'<<=' : 'assign_left_shift',
		'...' : 'spread',
		'|='  : 'assign_bitwise_or',
		'^='  : 'assign_bitwise_xor',
		'&='  : 'assign_bitwise_and',
		'+='  : 'assign_plus',
		'-='  : 'assign_minus',
		'*='  : 'assign_multiply',
		'/='  : 'assign_divide',
		'%='  : 'assign_mod',
		';'   : 'semicolon',
		','   : 'comma',
		'?'   : 'hook',
		':'   : 'colon',
		'||'  : 'or',
		'&&'  : 'and',
		'|'   : 'bitwise_or',
		'^'   : 'bitwise_xor',
		'&'   : 'bitwise_and',
		'===' : 'strict_eq',
		'=='  : 'eq',
		'=>'  : 'arrow_function',
		'='   : 'assign',
		'!==' : 'strict_ne',
		'!='  : 'ne',
		'<<'  : 'lsh',
		'<='  : 'le',
		'<'   : 'lt',
		'>>>' : 'unsigned_right_shift',
		'>>'  : 'right_shift',
		'>='  : 'ge',
		'>'   : 'gt',
		'++'  : 'increment',
		'--'  : 'decrement',
		'**'  : 'exponentiation',
		'+'   : 'plus',
		'-'   : 'minus',
		'*'   : 'multiply',
		'/'   : 'divide',
		'%'   : 'mod',
		'!'   : 'not',
		'~'   : 'bitwise_not',
		'.'   : 'dot'
	};

	token_patterns = {
		whitespace : /\s+/,
		keyword    : null,
		name       : /[a-zA-Z_\$][a-zA-Z_\$0-9]*/,
		string1    : /"(?:(?:\\\n|\\"|[^"\n]))*?"/,
		string2    : /'(?:(?:\\\n|\\'|[^'\n]))*?'/,
		string3    : /`(?:(?:\\`|.|[\n\r]))*?`/,
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
		string1  : 'string',
		string2  : 'string',
		string3  : 'string',
		comment1 : 'comment',
		comment2 : 'comment',
	};

	Blast.ready(function BlastReadyFunction() {

		var temp,
		    name,
		    key,
		    i;

		token_patterns.keyword = RegExp('\\b(?:' + keywords.join('|') + ')\\b');
		temp = '';

		for (key in operators) {

			if (temp) {
				temp += '|';
			}

			temp += Blast.Bound.RegExp.escape(key);
		}

		token_patterns.punct = RegExp('(?:' + temp + ')');

		try {
			// Create the matches
			tokenMatches = Collection.RegExp.combine.apply(null, Collection.Object.values(token_patterns));
		} catch (err) {
			combineError = err;
			return;
		}

		// Create the testers
		tokenTesters = {};

		for (name in token_patterns) {
			tokenTesters[name] = new RegExp('^' + Collection.RegExp.prototype.getPattern.call(token_patterns[name]) + '$');
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

		for (patternName in token_patterns) {
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
				type  : Collection.Function.getTokenType(tokens[i]),
				value : tokens[i],
			};

			if (obj.type == 'keyword') {
				obj.name = obj.value;
			} else if (operators[tokens[i]]) {
				obj.name = operators[tokens[i]];
			}

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