const defStat = Blast.createStaticDefiner('Function'),
      defProto = Blast.createProtoDefiner('Function'),
      METHODIZED = Symbol('methodized'),
      UNMETHODIZED = Symbol('unmethodized');

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
	'**=' : 'assign_exponentiation',
	'||=' : 'assign_logical_or',
	'&&=' : 'assign_logical_and',
	'??=' : 'assign_nullish',
	'??'  : 'nullish_coalescing',
	'?.'  : 'optional_chaining',
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

const TOKEN_WHITESPACE = 1,
      TOKEN_KEYWORD = 2,
      TOKEN_NAME = 3,
      TOKEN_STRING_DOUBLE = 4,
      TOKEN_STRING_SINGLE = 5,
      TOKEN_STRING_BACK = 6,
      TOKEN_COMMENT_BLOCK = 7,
      TOKEN_COMMENT_INLINE = 8,
      TOKEN_NUMBER = 9,
      TOKEN_PARENS = 10,
      TOKEN_CURLY = 11,
      TOKEN_SQUARE = 12,
      TOKEN_PUNCT = 13,
      TOKEN_REGEXP = 14,
      TOKEN_REGEXP_FLAG = 15,
      TOKEN_INVALID = 16;

/**
 * Create a function with the given variable as name.
 * If a function is given, its name will be changed using Object.defineProperty
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.9.0
 *
 * @param    {string}       name    The name of the function
 * @param    {string|Array} args    Optional argument names to use
 * @param    {Function}     fnc     The function body
 *
 * @return   {Function}
 */
defStat(function create(name, args, fnc) {

	if (typeof args == 'function') {
		fnc = args;
		args = null;
	}

	if (typeof fnc == 'function' && !args) {
		Object.defineProperty(fnc, 'name', {value: name});
		return fnc;
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
		args = Fn.getArgumentNames(fnc).join(', ');
	} else {
		args = '';
	}

	let result = _create(name, args, fnc);

	Blast.defineGet(fnc, 'super', function getSuper() {
		return result.super;
	});

	// Store the new wrapper function on fnc
	fnc.wrapper = result;

	return result;
}, true);

/**
 * Actually create the function
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string}       name    The name of the function
 * @param    {string|Array} args    Optional argument names to use
 * @param    {Function}     fnc     The function body
 *
 * @return   {Function}
 */
function _create(name, args, fnc) {
	let result;
	eval('result = function ' + name + '(' + args + ') {return fnc.apply(this, arguments);}');
	return result;
}

/**
 * Check if the given function name is allowed
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.8
 * @version  0.7.0
 *
 * @param    {string}    name    The name of the function to test
 *
 * @return   {boolean}
 */
defStat(function isNameAllowed(name) {

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.9.0
 *
 * @param    {string}    tokenString
 *
 * @return   {string}
 */
defStat(function getTokenType(tokenString) {
	let result = Fn.tokenize(tokenString, true, false);
	return result?.[0]?.type || 'invalid';
});

/**
 * Convert JavaScript sourcecode to tokens
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.9.0
 *
 * @param    {string}   source_code
 * @param    {boolean}  add_type        Add the type of the token
 * @param    {boolean}  throw_errors    Throw error when invalid token is found
 *
 * @return   {Array}
 */
defStat(function tokenize(source_code, add_type, throw_errors) {

	if (typeof source_code !== 'string') {
		source_code = ''+source_code;
	}

	let prev_usable_token,
	    check_next_state,
	    is_punctuation = false,
	    current_state,
	    current_line = 0,
	    string_state = false,
	    prev_token,
	    is_digit = false,
	    end_char,
		has_dot = false,
	    escaped = false,
	    result = [],
	    length = source_code.length,
	    buffer,
	    next,
	    trim,
	    prev,
	    char,
	    i;

	const createBuffer = (state, char) => {
		endState();
		current_state = state;

		buffer = {
			type       : state,
			value      : '',
			line_start : current_line,
			line_end   : current_line,
		};

		pushChar(char);
	};

	const createStringState = (state, char) => {
		createBuffer(state, char);
		end_char = char;
		string_state = true;
	};

	const endState = (last_char) => {
		string_state = false;
		current_state = null;
		end_char = null;
		has_dot = false;

		if (buffer) {
			pushChar(last_char);
			buffer.line_end = current_line;
			result.push(buffer);

			if (buffer.type != TOKEN_WHITESPACE && buffer.type != TOKEN_COMMENT_INLINE && buffer.type != TOKEN_COMMENT_BLOCK) {
				prev_usable_token = buffer;
			}

			prev_token = buffer;
			buffer = null;
		}
	};

	const pushChar = (new_char) => {

		if (new_char != null) {
			buffer.value += new_char;
			char = new_char;

			if (new_char === '\n') {
				current_line++;
			}
		}

		escaped = false;
	};

	const getNextChars = (amount) => {
		let result = char;

		for (let j = 1; j < amount; j++) {
			result += source_code[i + j];
		}

		return result;
	};

	const createOperator = (chars, type) => {
		let skip = chars.length - 1;
		char = chars[skip];
		i += skip;

		createBuffer(TOKEN_PUNCT, chars);
		buffer.name = type;
	};

	const checkPunct = (char) => {
		let chars = getNextChars(4),
		    type = operators[chars];

		if (type) {
			createOperator(chars, type);
			return;
		}

		chars = getNextChars(3);
		type = operators[chars];

		if (type) {
			createOperator(chars, type);
			return;
		}

		chars = getNextChars(2);
		type = operators[chars];

		if (type) {
			createOperator(chars, type);
			return;
		}

		type = operators[char];

		if (type) {
			createOperator(char, type);
			return;
		}
	};

	const hasSlashBeforeEndOfLine = () => {
		let char,
		    j = i + 1;

		while (j < length) {
			char = source_code[j];
			j++;

			if (char === '\\') {
				j++;
				continue;
			}

			if (char === '\n') {
				return false;
			}

			if (char === '/') {
				return true;
			}
		}

		return false;
	};

	const isValidNameChar = (char) => {
		return char == '_' || char == '$' || char.match(/[a-zA-Z0-9]/);
	};

	for (i = 0; i < length; i++) {
		prev = char;
		char = source_code[i];
		trim = char.trim();
		next = source_code[i + 1];
		is_punctuation = false;
		is_digit = false;

		switch (char) {
			case '.':
			case '~':
			case '!':
			case '%':
			case '/':
			case '*':
			case '-':
			case '+':
			case '>':
			case '<':
			case '=':
			case '&':
			case '^':
			case '|':
			case ',':
			case ';':
			case '?':
			case ':':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				is_punctuation = true;
				break;

			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				is_digit = true;
				break;
		}

		if (current_state) {
			check_next_state = false;

			if (current_state == TOKEN_WHITESPACE) {
				if (!trim) {
					pushChar(char);
				} else {
					check_next_state = true;
				}
			} else if (string_state) {

				if (char === '\\' && !escaped) {
					pushChar(char);
					escaped = true;
				} else if (char == end_char && !escaped) {
					endState(char);
				} else {
					pushChar(char);
				}
			} else if (current_state == TOKEN_COMMENT_INLINE) {
				if (char == '\n') {
					check_next_state = true;
				} else {
					pushChar(char);
				}
			} else if (current_state == TOKEN_COMMENT_BLOCK) {
				if (char == '*' && next == '/') {
					i++;
					pushChar(char);
					pushChar(next);
					endState();
				} else {
					pushChar(char);
				}
			} else if (current_state == TOKEN_NAME || current_state == TOKEN_INVALID) {
				if (!trim || is_punctuation) {

					if (keywords.includes(buffer.value)) {
						buffer.type = TOKEN_KEYWORD;
						buffer.name = buffer.value;
					}

					check_next_state = true;
				} else {
					pushChar(char);
				}
			} else if (current_state == TOKEN_REGEXP) {
				if (char == '/' && !escaped) {
					current_state = TOKEN_REGEXP_FLAG
				}

				pushChar(char);
			} else if (current_state == TOKEN_NUMBER) {

				if (char == '.') {
					if (has_dot) {
						check_next_state = true;
					} else {
						pushChar(char);
						has_dot = true;
					}
				} else if (is_digit || char == 'e' || char == 'E') {
					pushChar(char);
				} else if (char == '_' && prev != '_') {
					// Ignore
				} else {
					check_next_state = true;
				}

			} else if (current_state == TOKEN_REGEXP_FLAG) {
				switch (char) {
					case 'g':
					case 'i':
					case 'm':
					case 'u':
					case 'y':
						pushChar(char);
						break;
					
					default:
						check_next_state = true;
				};
			} else {
				check_next_state = true;
			}

			if (!check_next_state) {
				continue;
			}

			endState();
		}

		if (!trim) {
			createBuffer(TOKEN_WHITESPACE, char);
		} else if (char == '"') {
			createStringState(TOKEN_STRING_DOUBLE, char);
		} else if (char == "'") {
			createStringState(TOKEN_STRING_SINGLE, char);
		} else if (char == '`') {
			createStringState(TOKEN_STRING_BACK, char);
		} else if (char == '(' || char == ')') {
			createBuffer(TOKEN_PARENS, char);
		} else if (char == '{' || char == '}') {
			createBuffer(TOKEN_CURLY, char);
		} else if (char == '[' || char == ']') {
			createBuffer(TOKEN_SQUARE, char);
		} else if (is_digit) {
			createBuffer(TOKEN_NUMBER, char);

			// It technically isn't valid JavaScript either,
			// But it is even more wrong when 'a.0.1.b' is considered a number
			if (prev_usable_token?.value === '.' || prev_usable_token?.value === '?.') {
				endState();
			}
		} else {

			if (char == '/') {
				if (next == '/') {
					i++;
					createBuffer(TOKEN_COMMENT_INLINE, '//');
					continue;
				} else if (next == '*') {
					i++;
					char = '*'; // For next iteration's prev
					createBuffer(TOKEN_COMMENT_BLOCK, '/*');
					continue;
				} else if (prev_usable_token?.type != TOKEN_NAME && prev_usable_token?.type != TOKEN_NUMBER && hasSlashBeforeEndOfLine()) {
					createBuffer(TOKEN_REGEXP, char);
					continue;
				}
			}

			if (is_punctuation) {
				checkPunct(char);
			} else if (isValidNameChar(char)) {
				createBuffer(TOKEN_NAME, char);
			} else {
				createBuffer(TOKEN_INVALID, char);
			}
		}
	}

	endState();

	let mapper;

	if (add_type) {
		mapper = entry => {
			switch (entry.type) {
				case TOKEN_WHITESPACE:
					entry.type = 'whitespace';
					break;

				case TOKEN_KEYWORD:
					entry.type = 'keyword';
					break;

				case TOKEN_NAME:
					entry.type = 'name';
					break;

				case TOKEN_STRING_DOUBLE:
				case TOKEN_STRING_SINGLE:
				case TOKEN_STRING_BACK:
					entry.type = 'string';
					break;

				case TOKEN_COMMENT_INLINE:
				case TOKEN_COMMENT_BLOCK:
					entry.type = 'comment';
					break;

				case TOKEN_NUMBER:
					entry.type = 'number';
					break;

				case TOKEN_PARENS:
					entry.type = 'parens';
					break;

				case TOKEN_CURLY:
					entry.type = 'curly';
					break;

				case TOKEN_SQUARE:
					entry.type = 'square';
					break;

				case TOKEN_PUNCT:
					entry.type = 'punct';
					break;

				case TOKEN_REGEXP:
				case TOKEN_REGEXP_FLAG:
					entry.type = 'regexp';
					break;
				
				case TOKEN_INVALID:
					entry.type = 'invalid';
					break;
			}

			return entry;
		};
	} else {
		mapper = entry => entry.value;
	}

	return result.map(mapper);
});

/**
 * Get the name of a function's arguments
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
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

	tokens = Fn.tokenize(fnc, true);

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {boolean}  addType        Add the type of the token
 * @param    {boolean}  throwErrors    Throw error when invalid token is found
 *
 * @return   {Array}
 */
defProto(function tokenize(addType, throwErrors) {
	return Fn.tokenize(''+this, addType, throwErrors);
});

/**
 * Get a function's body source
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @return   {string}
 */
defProto(function getBodySource() {

	// Get the source code of the function
	var src = String(this);

	// Slice it
	return src.slice(src.indexOf('{')+1, -1);
});

/**
 * Create a function that will call the given function with 'this'
 * as the first argument.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.9.0
 *
 * @param    {string}    name    The name to use for the wrapper
 *
 * @return   {Function}
 */
defProto(function methodize(name) {

	if (this[METHODIZED]) {
		return this[METHODIZED];
	}

	let original_function = this;

	if (typeof name == 'undefined') {
		name = original_function.name;
	}

	let methodized_function = Fn.create(name, function methodized(...args) {
		return original_function.call(this, this, ...args);
	});

	Blast.defineProperty(original_function, METHODIZED, {
		value: methodized_function,
	});

	// Make sure a methodized function doesn't get methodized
	Blast.defineProperty(methodized_function, METHODIZED, {value: methodized_function});

	// Add the unmethodized function
	Blast.defineProperty(methodized_function, UNMETHODIZED, {value: original_function});

	return methodized_function;
});

/**
 * Create a function that will call the given function with
 * the first argument as the context
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.9.0
 *
 * @param    {string}    name    The name to use for the wrapper
 *
 * @return   {Function}
 */
defProto(function unmethodize(name) {

	if (this[UNMETHODIZED]) {
		return this[UNMETHODIZED];
	}

	let original_function = this;

	if (typeof name == 'undefined') {
		name = original_function.name;
	}

	let unmethodized_function = Fn.create(name, function unmethodized(self, ...args) {
		return original_function.apply(self, args);
	});

	Blast.defineProperty(original_function, UNMETHODIZED, {
		value: unmethodized_function,
	});

	// Make sure an unmethodized function doesn't get unmethodized
	Blast.defineProperty(unmethodized_function, UNMETHODIZED, {value: unmethodized_function});

	// Add the methodized function
	Blast.defineProperty(unmethodized_function, METHODIZED, {value: original_function});

	return unmethodized_function;
});

/**
 * Execute a function in a try/catch statement.
 * This should be done in a separate function like this because
 * try/catch breaks optimization.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   fnc
 *
 * @return   {boolean}
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