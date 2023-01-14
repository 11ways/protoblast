const defStat = Blast.createStaticDefiner('Function'),
      defProto = Blast.createProtoDefiner('Function');

let tokenMatches,
    tokenTesters,
    haveCombined,
    combineError;

let keywords = [
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

let operators = {
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
	'|>'  : 'pipeline',
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

let token_patterns = {
	whitespace : /\s+/,
	keyword    : null,
	name       : /[a-zA-Z_\$][a-zA-Z_\$0-9]*/,
	string1    : /"(?:(?:\\\n|\\"|[^"\n]))*?"/,
	string2    : /'(?:(?:\\\n|\\'|[^'\n]))*?'/,
	string3    : /`(?:(?:\\`|.|[\n\r]))*?`/,
	comment1   : /\/\*[\s\S]*?\*\//,
	comment2   : /\/\/.*?(?=\r\n|\r|\n|$)/,
	number     : /\d+(?:\.\d+)?(?:e[+-]?\d+)?/,
	parens     : /[\(\)]/,
	curly      : /[{}]/,
	square     : /[\[\]]/,
	punct      : /[;.:\?\^%<>=!&|+\-,~]/,
	regexp     : /\/(?:(?:\\\/|[^\n\/]))*?\//
};

let rx_regex = /^\/(?:(?:\\\/|[^\n\/]))*?\/(?:[gimuy]*)$/;

let patternNames = {
	string1  : 'string',
	string2  : 'string',
	string3  : 'string',
	comment1 : 'comment',
	comment2 : 'comment',
};

Blast._fn_token_prepare = function BlastReadyFunction() {

	var patterns = [],
	    temp,
	    name,
	    key,
	    i;

	token_patterns.keyword = RegExp('\\b(?:' + keywords.join('|') + ')\\b');
	temp = '';

	for (key in operators) {

		if (temp) {
			temp += '|';
		}

		temp += Bound.RegExp.escape(key);
	}

	token_patterns.punct = RegExp('(?:' + temp + ')');

	for (key in token_patterns) {
		patterns.push(token_patterns[key]);
	}

	try {
		// Create the matches
		tokenMatches = Collection.RegExp.combine.apply(null, patterns);
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
};

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
defStat('create', function create(name, args, fnc) {

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
 * @version  0.7.0
 *
 * @param    {String}    name    The name of the function to test
 *
 * @return   {Boolean}
 */
defStat('isNameAllowed', function isNameAllowed(name) {

	var result;

	// Do a simple space check
	if (name.indexOf(' ') > -1) {
		return false;
	}

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
defStat('getTokenType', function getTokenType(tokenString) {

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
 * @version  0.7.13
 *
 * @param    {String}   sourceCode
 * @param    {Boolean}  addType        Add the type of the token
 * @param    {Boolean}  throwErrors    Throw error when invalid token is found
 *
 * @return   {Array}
 */
defStat('tokenize', function tokenize(sourceCode, addType, throwErrors) {

	let line_nr = 0,
	    tokens = [],
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

	let was_declaring,
	    declaring,
	    assigning,
	    result = [],
	    prev;

	for (i = 0; i < tokens.length; i++) {
		was_declaring = declaring;

		obj = {
			type  : Collection.Function.getTokenType(tokens[i]),
			value : tokens[i],
			line_start : line_nr,
			line_end   : 0,
		};

		if (declaring) {
			if (obj.value == ';') {
				declaring = false;
				assigning = false;
			} else {
				if (assigning && obj.value == ',') {
					assigning = false;
				} else if (obj.value == '=') {
					assigning = true;
				}

				if (obj.type != 'whitespace' && obj.type != 'name') {

					if (assigning) {
						if (obj.type != 'punct' && obj.value != 'this') {
							assigning = false;
						}
					} else if (obj.value != '=' && obj.value != ',') {
						declaring = false;
					}

				}
			}
		}

		if (obj.type == 'keyword') {
			obj.name = obj.value;

			if (obj.value !== 'this') {
				if (obj.value == 'var' || obj.value == 'let' || obj.value == 'const') {
					declaring = true;
				} else {
					declaring = false;
				}
			}

		} else if (operators[tokens[i]]) {
			obj.name = operators[tokens[i]];
		}

		if (obj.value === '/') {
			i = checkTogenizeRegex(i, tokens, obj, prev, was_declaring, assigning);
		}

		// Replace the original string with the object
		result.push(obj);

		if (obj.type == 'whitespace') {
			line_nr += Bound.String.count(obj.value, '\n');
		} else {
			prev = obj;
		}

		obj.line_end = line_nr;
	}

	return result;
});

/**
 * Fix regex literals in tokenized objects
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Number}   index         The current index
 * @param    {Array}    tokens        Array of all the tokens
 * @param    {Object}   obj           The current object
 * @param    {Object}   prev          The previous object
 * @param    {Boolean}  declaring     Are we currently declaring something?
 *
 * @return   {Number}
 */
function checkTogenizeRegex(index, tokens, obj, prev, declaring, assigning) {

	if (prev && (prev.type != 'punct' && prev.type != 'parens')) {
		if (!declaring || ((assigning && prev.type == 'name') || prev.type == 'string' || prev.type == 'number')) {
			return index;
		}
	}

	let matched = false,
	    next = tokens[index + 1],
	    temp = obj.value,
	    str = obj.value,
	    i;

	for (i = index + 1; i < tokens.length; i++) {
		temp += tokens[i];

		if (rx_regex.test(temp)) {
			matched = i;
			str = temp;
		} else {
			// If it matched before, that'll be correct
			if (matched) {
				i = matched;
				break;
			}
		}
	}

	if (str.length > 1) {
		obj.value = str;
		obj.type = obj.name = 'regexp';
		return i;
	}

	return index;
}

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
defStat(function getArgumentNames(fnc) {

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
defProto(function tokenize(addType, throwErrors) {
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
defProto(function getBodySource() {

	// Get the source code of the function
	var src = String(this);

	// Slice it
	return src.slice(src.indexOf('{')+1, -1);
});

// method source code
let method = ''+function (){
	
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
 * @version  0.7.0
 *
 * @param    {String}    name    The name to use for the wrapper
 *
 * @return   {Function}
 */
defProto(function methodize(name) {

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
		name = '_' + Collection.String.prototype.slug.call(name, '_');
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
let unmethod = ''+function () {

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
 * @version  0.7.0
 *
 * @param    {String}    name    The name to use for the wrapper
 *
 * @return   {Function}
 */
defProto(function unmethodize(name) {

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
		name = '_' + Collection.String.prototype.slug.call(name, '_');
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
defProto(function listenTo(event, context) {

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
defProto(function unListen(event, context) {

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
defStat(function tryCatch(fnc, args, context) {
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

/**
 * Is the given variable a Class syntax function?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   fnc
 *
 * @return   {Boolean}
 */
defStat(function isNativeClass(fnc) {

	// Native classes will always be functions, duh
	if (typeof fnc != 'function') {
		return false;
	}

	let descriptor = Object.getOwnPropertyDescriptor(fnc, 'prototype');

	// Native classes have a non-writable prototype property
	// (meaning: can't be overwritten)
	// If that's not the case, it definitely is not a class
	if (!descriptor || descriptor.writable != false) {
		return false;
	}

	// Unfortunately, at this point we can only make sure
	// by checking the source string
	let source = '' + fnc;

	return source.indexOf('class ') === 0;
});