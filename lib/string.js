const defStat = Blast.createStaticDefiner('String'),
      defProto = Blast.createProtoDefiner('String');

const Str = Bound.String;
const checksum_cache = Blast.string_checksum_cache = new Blast.Classes.Develry.LruCache(1024);
let astral_rx = /\ud83c[\udffb-\udfff](?=\ud83c[\udffb-\udfff])|(?:[^\ud800-\udfff][\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]?|[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g;
let hashLengths = {
	'md5': 32,
	'sha1': 40
};

/**
 * See if a the string only exists out of letters
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.10
 * @version  0.8.10
 *
 * @param    {String}   character
 *
 * @return   {Boolean}
 */
defStat(function isLetter(character) {

	let upper = character.toUpperCase(),
	    lower = character.toLowerCase();
	
	if (upper === lower) {
		return false;
	}

	let code = character.codePointAt(0);

	if (code > 127) {
		return false;
	}

	return true;
});

/**
 * Decode the given string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.4
 * @version  0.7.0
 *
 * @param    {Object}    value      The string to decode
 * @param    {RegExp}    separator  The value separator
 *
 * @return   {Object}
 */
defStat(function decodeAttributes(value, separator) {

	var result = {},
	    pieces,
	    index,
	    pair,
	    key,
	    val,
	    i;

	if (value == null) {
		return result;
	}

	if (separator == null) {
		let tokens = Str.tokenizeHTML(value, {state: Blast.HTML_TOKENIZER_STATES.TAG_CONTENT}),
		    token;

		for (i = 0; i < tokens.length; i++) {
			token = tokens[i];

			if (token.type == 'attribute') {
				if (key) {
					result[key] = val;
				}

				key = token.value;
				val = undefined;
			} else if (token.type == 'equals') {
				continue;
			} else if (token.type == 'identifier' || token.type == 'string') {
				val = token.value;
			} else if (token.type == 'string_open' || token.type == 'string_close') {
				continue;
			}
		}

		if (key) {
			result[key] = val;
		}

		return result;
	}

	if (typeof separator == 'string') {
		separator = Bound.RegExp.interpret(separator);
	} else if (!separator) {
		separator = /, */;
	}

	pieces = value.split(separator)

	for (i = 0; i < pieces.length; i++) {
		pair = pieces[i];

		if (!pair) {
			continue;
		}

		index = pair.indexOf('=');

		// Skip pieces that aren't key-vals separated by a equal sign
		if (index < 0) {
			key = pair;
			val = undefined;
		} else {
			// Get the key, trim it now
			key = pair.substr(0, index).trim();

			// The value will be trimmed later
			val = pair.substr(index + 1, pair.length);
			val = Collection.String.decodeJSONURI(val);
		}

		result[key] = val;
	}

	return result;
});

/**
 * Decode a uri encoded component.
 * Return the given value should it fail
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {String}   value
 *
 * @return   {String}
 */
defStat(function decodeURI(value) {
	try {
		return decodeURIComponent(value);
	} catch (err) {
		return value;
	}
});

/**
 * Encode a string to uri safe values
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {String}   value
 *
 * @return   {String}
 */
defStat(function encodeURI(value) {
	return encodeURIComponent(value);
});

/**
 * Decode a uri encoded component and try to JSON decode it, too
 * Return the given value should it fail
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.0
 *
 * @param    {String}   value
 *
 * @return   {Mixed}
 */
defStat(function decodeJSONURI(value) {

	value = Collection.String.decodeURI(value).trim();

	let first = value[0];

	if (first == '[' || first == '{' || first == '"') {

		try {
			return JSON.parse(value);
		} catch (err) {
			return value;
		}
	}

	return value;
});

/**
 * Decode a cookie string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.3.4
 *
 * @param    {String}   value
 *
 * @return   {Object}
 */
defStat(function decodeCookies(value) {
	return Str.decodeAttributes(value, /; */);
});

/**
 * Encode a single cookie
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.3.9
 *
 * @param    {String}   name
 * @param    {Mixed}    value
 * @param    {Object}   options
 *
 * @return   {String}
 */
defStat(function encodeCookie(name, value, options) {

	var header,
	    arr,
	    key;

	switch (typeof value) {

		case 'string':
			value = encodeURIComponent(value);
			break;

		case 'boolean':
		case 'number':
			break;

		default:
			value = encodeURIComponent(JSON.stringify(value));
	}

	// Create the basic header string
	header = name + '=' + value;

	if (options != null) {

		if (options.expires == Infinity || String(options.expires).toLowerCase() == 'never') {
			options.maxAge = Infinity;
		}

		if (options.maxAge) {

			if (options.maxAge == Infinity) {
				options.maxAge = Math.pow(63,8);
			}

			options.expires = new Date(Date.now() + options.maxAge);
		}

		// We don't use encodeURIComponent because it also encodes slashes
		if (options.path) header += '; path=' + encodeURI(options.path);
		if (options.expires) header += '; expires=' + options.expires.toUTCString();
		if (options.domain) header += '; domain=' + encodeURI(options.domain);
		if (options.secure) header += '; secure';
		if (options.httpOnly) header += '; httponly';
	}

	return header;
});

/**
 * Safely parse a quoted string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string}   input
 *
 * @return   {string}
 */
defStat(function parseQuoted(input) {

	const quote = input[0],
	      length = input.length;

	if (input[length - 1] != quote) {
		throw new Error('Unmatched quotes');
	}

	if (quote != '"') {
		input = input.slice(1, -1);

		// If the input includes a double quote,
		// it has an escaped quote somewhere.
		if (input.includes('"')) {
			input = input.replaceAll('"', '\\' + '"');
		}

		if (quote == '`' && input.includes('\n')) {
			input = input.replaceAll('\n', '\\n');
		}

		input = '"' + input + '"';
	}

	if (input.includes('\t')) {
		input = input.replaceAll('\t', '\\t');
	}

	return JSON.parse(input);
});

/**
 * Return the string after the given needle
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.5.5
 *
 * @param    {String}   needle   The string to look for
 * @param    {Boolean}  first    Get from the first or last
 *
 * @return   {String}   The string after the needle
 */
defProto(function after(needle, first) {

	var count,
	    arr,
	    id;

	if (this == null) {
		throw new Error('Attempted to perform String#after on invalid context');
	}

	if (typeof first === 'undefined') {
		first = true;
	}

	if (first === true || first === 1) {
		id = this.indexOf(needle);
	} else if (first === false || first === 0 || first === -1) { // Last
		id = this.lastIndexOf(needle);
	} else if (typeof first === 'number') {

		// Use the count variable for readability
		count = first;

		// Return everything after a specific numbered occurence
		arr = this.split(needle);

		if (arr.length <= count) {
			return '';
		}

		return arr.splice(count).join(needle);
	} else {
		return '';
	}

	if (id === -1) {
		return '';
	}

	return this.substr(id + needle.length);
});

/**
 * Return the string after the last occurence of the given needle
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {String}   needle   The string to look for
 *
 * @return   {String}   The string after the needle
 */
defProto(function afterLast(needle) {
	return Collection.String.prototype.after.call(this, needle, false);
});

/**
 * Return the string before the given needle
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   needle   The string to look for
 * @param    {Boolean}  first    Get from the first or last
 *
 * @return   {String}   The string without any tags
 */
defProto(function before(needle, first) {

	var count,
	    arr,
	    id;
	
	if (typeof first === 'undefined') {
		first = true;
	}

	if (first === true || first === 1) {
		id = this.indexOf(needle);
	} else if (first === false || first === 0 || first === -1) { // Last
		id = this.lastIndexOf(needle);
	} else if (typeof first === 'number') {

		// Use the count variable for readability
		count = first;

		// Return everything before a specific numbered occurence
		arr = this.split(needle);

		if (arr.length <= count) {
			return '';
		}

		return arr.splice(0, count).join(needle);
	} else {
		return '';
	}

	if (id === -1) {
		return '';
	}

	return this.substr(0, id);
});

/**
 * Return the string before the last occurence of the given needle
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {String}   needle   The string to look for
 *
 * @return   {String}   The string after the needle
 */
defProto(function beforeLast(needle) {
	return Collection.String.prototype.before.call(this, needle, false);
});

/**
 * Split the string at the first occurence only (and append the rest)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.9.0
 *
 * @param    {String}   separator
 *
 * @return   {Array}    The resulting splits
 */
defProto(function splitOnce(separator) {

	let index = this.indexOf(separator);

	if (index == -1) {
		return [''+this];
	}

	return [
		this.substr(0, index),
		this.substr(index+1)
	];
});

/**
 * Split the string a limited amount of times (and append the rest)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {String}   separator
 * @param    {Number}   limit
 *
 * @return   {Array}    The resulting splits
 */
defProto(function splitLimit(separator, limit) {

	var result = [],
	    index  = this.indexOf(separator),
	    count  = 0,
	    last   = 0;

	do {
		count++;
		result.push(this.substr(last, index-last));

		last = index + 1;
		index = this.indexOf(separator, last);
	} while (index > -1 && count < limit);

	result.push(this.substr(last))

	return result;
});

const NORMALIZE_TAG_REGEX = /<\/?([^\s\/>]+)/,
      STATE = {
		PLAINTEXT     : Symbol('plaintext'),
		HTML          : Symbol('html'),
		COMMENT       : Symbol('comment'),
		TAG_NAME      : Symbol('tag_name'),
		WHITESPACE    : Symbol('whitespace'),
		TAG_CONTENT   : Symbol('tag_content'),
		ATTR_NAME     : Symbol('attribute_name'),
		ATTR_VAL      : Symbol('attribute_value'),
		SCRIPT        : Symbol('script'),
		STRING_D      : Symbol('string_double'),
		STRING_S      : Symbol('string_single'),
		ATTR_IDENT    : Symbol('identifier')
	};

Blast.REPLACE_BR_NEWLINE = Symbol('REPLACE_BR_NEWLINE');
Blast.REPLACE_OPEN_TAG_NEWLINE = Symbol('REPLACE_OPEN_TAG_NEWLINE');
Blast.HTML_TOKENIZER_STATES = STATE;

/**
 * Get the tag name
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @param    {String}   tag_buffer
 *
 * @return   {String}   The lowercase tag name
 */
function getNormalizedTag(tag_buffer) {
	var match = NORMALIZE_TAG_REGEX.exec(tag_buffer);
	return match ? match[1].toLowerCase() : null;
}

/**
 * Tokenize HTML
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @author   Eric Norris
 * @since    0.6.5
 * @version  0.8.18
 *
 * @param    {String}   source
 * @param    {Object}   options
 *
 * @return   {Array}    The tokens
 */
defStat(function tokenizeHTML(source, options) {

	if (source == null) {
		throw new Error('The `source` argument has to be a valid string');
	}

	let current,
	    tag_buffer    = '',
	    result        = [],
	    length        = source.length,
	    depth         = 0,
	    state         = STATE.PLAINTEXT,
	    last_tag      = '',
	    line_nr       = 0,
	    block_indexes_arr,
	    ordered_blocks,
	    block_indexes,
	    prev_state,
	    do_blocks = false,
	    closing,
	    blocks,
	    block,
	    piece,
	    open,
	    temp,
	    char,
	    end,
	    key,
	    i,
	    j;

	function pushResult(token) {
		token.line_start = line_nr;
		result.push(token);

		line_nr += Str.count(token.value, '\n');
		token.line_end = line_nr;
	}

	let skip_empty_custom_tokens = false;

	if (options && options.skip_empty_custom_tokens) {
		skip_empty_custom_tokens = true;
	}

	function createToken(type, value) {

		if (current) {
			// When working with custom blocks, empty tokens can be made
			// We don't want these
			// For now, skipping these is optional for backwards compatibility
			// reasons, for 0.8 & up it should be the default behaviour
			if (!skip_empty_custom_tokens || current.value !== '') {
				pushResult(current);
			}
		}

		if (type === null) {
			current = null;
		} else {

			if (value == null) {
				value = '';
			}

			current = {
				type       : type,
				line_start : 0,
				line_end   : 0,
				value      : value,
			};
		}

		return current;
	}

	if (options) {

		if (options.state) {
			state = options.state;
		}

		if (options.blocks) {
			blocks = options.blocks;
			ordered_blocks = blocks;

			// Ordered blocks are MUCH preferred,
			// especially if there is the danger of overlapping open tags
			// (Since simple objects do not guarantee an order)
			if (Array.isArray(ordered_blocks)) {
				blocks = {};

				for (i = 0; i < ordered_blocks.length; i++) {
					block = ordered_blocks[i];
					blocks[block.name] = block;
				}
			} else {
				ordered_blocks = [];

				for (key in blocks) {
					block = blocks[key];
					block.name = key;
					ordered_blocks.push(block);
				}
			}

			// Get all indexes in advance, so we don't need to check every char
			// to see if it matches a custom block
			// This will probably find MORE indexes than expected,
			// because of nested open keys. These will be ignored
			for (i = 0; i < ordered_blocks.length; i++) {
				block = ordered_blocks[i];
				key = block.name;
				open = Str.allIndexesOf(source, block.open);

				if (open.length) {
					do_blocks = true;

					if (!block_indexes) {
						block_indexes = {};
						block_indexes_arr = [];
					}

					for (j = 0; j < open.length; j++) {

						// If this already matched another block opener,
						// then don't overwrite it
						if (block_indexes[open[j]] != null) {
							continue;
						}

						// See if this block is allowed to span multiple lines
						if (block.multiline === false) {
							end = source.indexOf(block.close, open[j]);

							if (end == -1) {
								end = source.length - 1;
							}

							let newline_index = source.slice(open[j], end).indexOf('\n');

							if (newline_index > -1) {
								continue;
							}
						}

						block_indexes[open[j]] = key;
						block_indexes_arr.push(open[j]);
					}
				}
			}

			if (do_blocks) {
				Bound.Array.flashsort(block_indexes_arr);
				block_indexes_arr = Bound.Array.unique(block_indexes_arr);
			}
		}
	}

	for (i = 0; i < length; i++) {
		char = source[i];

		if (do_blocks && (key = block_indexes[i])) {
			block = blocks[key];

			if (block.forbidden && block.forbidden[state]) {
				throw new Error('Unexpected ' + key + ' block at char ' + i);
			}

			end = source.indexOf(block.close, i);

			if (end == -1) {
				end = source.length;
			} else {
				end += block.close.length;
			}

			// Remove all block indexes that happen before this end
			// (This removes the index that started this block
			// + any possible nested blocks, which isn't allowed)
			while (block_indexes_arr[0] <= end) {
				block_indexes_arr.shift();
			}

			piece = source.slice(i, end);

			if (block.strip_delimiter) {
				piece = piece.slice(block.open.length);

				// End delimiters can be optional
				if (piece.slice(-block.close.length) == block.close) {
					piece = piece.slice(0, -block.close.length);
				}
			}

			// Remember the current token type
			if (current) {
				temp = current.type;
			} else {
				temp = null;
			}

			createToken(key, piece);

			if (state == STATE.HTML && tag_buffer == '<' && block.can_replace && block.can_replace.includes(STATE.TAG_NAME)) {
				state = STATE.TAG_NAME;
			}

			if (state === STATE.ATTR_VAL) {
				state = STATE.TAG_CONTENT;
				createToken(null);
			} else if (current) {
				createToken(temp);
			}

			i = end - 1;
			continue;
		}

		if (state === STATE.SCRIPT) {
			if (!current) {
				createToken('text');
			}

			if (char == '<') {
				if (source.substr(i+1, 7) == '/script') {
					state = STATE.PLAINTEXT;
					tag_buffer = '';
					closing = true;
				}
			}

			// Is the state still script?
			if (state === STATE.SCRIPT) {
				current.value += char;
				continue;
			}
		}

		if (state === STATE.COMMENT) {
			if (char == '-' && source.substr(i, 3) == '-->') {
				current.value += '-->';
				createToken(null);
				i += 2;
				state = STATE.PLAINTEXT;
				continue;
			}

			current.value += char;
			continue;
		}

		if (state === STATE.ATTR_VAL) {

			if (!char.trim()) {

				// Ignore whitespace right after the equals sign
				if (current.type == 'equals') {
					continue;
				}

				state = STATE.TAG_CONTENT;
				createToken(null);
			} else if (char == '"') {
				state = STATE.STRING_D;
				createToken('string_open', char);
				createToken('string');
			} else if (char == "'") {
				state = STATE.STRING_S;
				createToken('string_open', char);
				createToken('string');
			} else {
				state = STATE.ATTR_IDENT;
				createToken('identifier', char);
			}

			continue;
		}

		if (state === STATE.STRING_D) {

			if (char == '<' || char == '>') {
				continue;
			}

			if (char === '"') {
				createToken('string_close', char);
				createToken(null);
				state = STATE.TAG_CONTENT;
				continue;
			}

			current.value += char;

			continue;
		}

		if (state === STATE.STRING_S) {

			if (char == '<' || char == '>') {
				continue;
			}

			if (char === "'") {
				createToken('string_close', char);
				createToken(null);
				state = STATE.TAG_CONTENT;
				continue;
			}

			current.value += char;

			continue;
		}

		if (state === STATE.ATTR_IDENT) {

			if (!char.trim() || char == '>' || char == '"' || char == "'" || char == '`' || char == '=' || char == '<') {
				// Ignore spaces right after the =
				state = STATE.TAG_CONTENT;
				createToken(null);
				i--;
			} else {
				current.value += char;
			}

			continue;
		}

		if (state === STATE.PLAINTEXT) {
			if (char == '<' && source[i + 1] && source[i + 1].trim()) {

				if (source.substr(i, 4) == '<!--') {
					state = STATE.COMMENT;
					createToken('comment', char);
					tag_buffer = '';
					continue;
				}

				state = STATE.HTML;
				tag_buffer += char;

				createToken('open_bracket', '<');

				if (source.substr(i, 2) == '</') {
					char = source[++i];
					createToken('forward_slash', '/');
					closing = true;
				} else {
					closing = false;
				}

				createToken(null);
				last_tag = '';
			} else {
				if (!current) {
					createToken('text');
				}

				// Anything until the next bracket is plain text!
				end = source.indexOf('<', i + 1);

				if (end == -1) {
					end = source.length;
				}

				// If there are custom block definitions (and there are
				// still custom blocks coming up) then don't include these
				// as plain text!
				if (do_blocks && block_indexes_arr.length) {
					if (block_indexes_arr[0] < end) {
						end = block_indexes_arr[0];
					}
				}

				//current.value += char;
				current.value += source.slice(i, end);
				i = end - 1;
			}

			continue;
		}

		if (state === STATE.COMMENT) {
			if (char == '>') {
				if (tag_buffer.slice(-2) == '--') {
					// Close the comment
					state = STATE.PLAINTEXT;
					createToken(null);
				}

				tag_buffer = '';
			} else {
				current.value += char;
				tag_buffer += char;
			}

			continue;
		}

		if (state === STATE.TAG_NAME || state === STATE.TAG_CONTENT) {

			// Handle self-closing tags without whitespace, like <br/>
			if (state === STATE.TAG_NAME && char === '/') {
				state = STATE.TAG_CONTENT;
			}

			if (!char.trim()) {
				if (!current || current.type != 'whitespace') {
					createToken('whitespace', char);
					if (state === STATE.TAG_NAME) {
						state = STATE.TAG_CONTENT;
					}
				} else {
					current.value += char;
				}
			} else if (char == '>') {

				if (depth) {
					depth--;
					continue;
				}

				createToken('close_bracket', '>');
				tag_buffer = '';

				if (!closing && last_tag.toLowerCase() == 'script') {
					state = STATE.SCRIPT;
				} else {
					state = STATE.PLAINTEXT;
				}

				createToken(null);
			} else if (char == '<') {
				depth++;
			} else if (state === STATE.TAG_NAME) {
				current.value += char;
				last_tag += char;
			} else {

				// Handle unclosed tags
				if (depth && source[i + 1] != '>') {
					createToken('close_bracket', '>');
					tag_buffer = '';
					i -= 2;
					depth--;
					createToken(null);

					if (!closing && last_tag.toLowerCase() == 'script') {
						state = STATE.SCRIPT;
					} else {
						state = STATE.PLAINTEXT;
					}

					continue;
				}

				// Ignore self-closing slashes
				if (char == '/') {
					createToken('forward_slash', '/');
					continue;
				}

				state = STATE.ATTR_NAME;

				createToken('attribute', char);
			}

			continue;
		}

		if (state === STATE.ATTR_NAME && !depth) {
			if (!char.trim() || char == '>') {
				i--;
				state = STATE.TAG_CONTENT;
				continue;
			}

			if (char == '=') {
				createToken('equals', '=');
				state = STATE.ATTR_VAL;
				continue;
			}

			if (char != '<') {
				current.value += char;
				continue;
			}
		}

		if (tag_buffer === '<') {
			if (char == '!' && source.substr(i, 2) == '!-') {
				state = STATE.COMMENT;
				createToken('comment', char);
			} else {
				state = STATE.TAG_NAME;
				last_tag = char;
				createToken('tag_name', char);
			}
		} else {
			tag_buffer += char;
		}
	}

	// Don't forget the last token
	if (current) {
		pushResult(current);
	}

	return result;
});

/**
 * Remove HTML tags from the string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.6.5
 *
 * @param    {Array}           allowed_tags
 * @param    {Symbol|String}   tag_replacement
 *
 * @return   {String}   The string without any tags
 */
defProto(function stripTags(allowed_tags, tag_replacement) {

	var allowed,
	    output = '',
	    tokens,
	    token,
	    state,
	    map,
	    buf,
	    tag,
	    i;

	if (allowed_tags == null) {
		allowed_tags = Blast.REPLACE_BR_NEWLINE;
	}

	if (allowed_tags) {
		if (allowed_tags === Blast.REPLACE_BR_NEWLINE) {
			allowed_tags = null;
			map = new Map();
			map.set('br', '\n');
		} else {
			let type = typeof allowed_tags;

			if (type === 'object') {
				if (Array.isArray(allowed_tags)) {
					map = new Map();

					for (i = 0; i < allowed_tags.length; i++) {
						map.set(allowed_tags[i], true);
					}
				} else {
					map = new Map(Object.entries(allowed_tags));
				}
			} else if (type === 'string') {
				map = new Map();
				map.set(allowed_tags, true);
			}
		}
	}

	tag_replacement = tag_replacement || '';

	// Tokenize the input
	tokens = Str.tokenizeHTML(this);

	for (i = 0; i < tokens.length; i++) {
		token = tokens[i];

		if (token.type == 'comment') {
			continue;
		}

		if (state == STATE.HTML) {
			buf += token.value;

			if (token.type == 'close_bracket') {
				state = null;

				if (map) {
					tag = getNormalizedTag(buf);
					allowed = map.get(tag);

					// If allowed is explicitly true, it's allowed
					if (allowed === true) {
						output += buf;
					} else if (allowed) {
						output += allowed;
					} else {
						if (allowed_tags === Blast.REPLACE_OPEN_TAG_NEWLINE && buf[1] != '/') {
							output += '\n';
						}

						output += tag_replacement;
					}
				} else {
					if (allowed_tags === Blast.REPLACE_OPEN_TAG_NEWLINE && buf[1] != '/') {
						output += '\n';
					}

					output += tag_replacement;
				}
			}

		} else if (token.type == 'open_bracket') {
			state = STATE.HTML;
			buf = token.value;
		} else {
			output += token.value;
		}
	}

	return output;
});

/**
 * Sluggify the string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.3
 * @version  0.7.13
 *
 * @return   {String}   The sluggifier string
 */
defProto(function slug(separator) {

	var result;

	// Get the separator to use, defaults to hyphen
	separator = separator || '-';

	// Convert to lowercase
	result = this.toLowerCase();

	// Romanize the string (remove diacritics)
	result = Collection.String.prototype.romanize.call(result);

	// Decode HTML
	result = Collection.String.prototype.decodeHTML.call(result);

	// Replace non-words with placeholders
	result = result.replace(/[^\w ]+/g, '=');

	// Replace spaces and placeholders with the separator
	result = result.replace(/\s+|=+|_+/g, separator);

	// Truncate repeats of the separator
	result = result.replace(RegExp('\\' + separator + '+', 'g'), separator);

	// Make sure the first char isn't the separator
	if (result[0] == separator) {
		result = result.slice(1);
	}

	if (result[result.length-1] == separator) {
		result = result.slice(0, result.length-1);
	}

	return result;
});

/**
 * Dissect a string into parts inside the given delimiters
 * and outside of it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {String}   open   The open tag
 * @param    {String}   close  The close tag
 *
 * @return   {Array}    An array of objects
 */
defProto(function dissect(open, close) {

	var closeLen = close.length,
	    openLen = open.length,
	    result = [],
	    lineCount = 0,
	    str = this,
	    length,
	    isOpen,
	    obj,
	    cur,
	    i;

	length = str.length;

	for (i = 0; i < length; i++) {

		cur = str[i];

		if (cur == '\n') {
			lineCount++;
		}

		// If the tag is open
		if (isOpen) {
			if (str.substr(i, closeLen) == close) {
				i += (closeLen - 1);
				isOpen = false;
				obj.lineEnd = lineCount;
			} else {
				obj.content += cur;
			}

			continue;
		}

		// See if a tag is being opened
		if (str.substr(i, openLen) == open) {

			if (obj && obj.type == 'normal') {
				obj.lineEnd = lineCount;
			}

			obj = {type: 'inside', lineStart: lineCount, lineEnd: undefined, content: ''};
			result.push(obj);

			isOpen = true;
			i += (openLen - 1);

			continue;
		}

		// No tag is open, no tag is being opened
		if (!obj || obj.type != 'normal') {
			obj = {type: 'normal', lineStart: lineCount, lineEnd: undefined, content: ''};
			result.push(obj);
		}

		obj.content += cur;
	}

	if (length > 0) obj.lineEnd = lineCount;

	return result;
});

/**
 * Truncate a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.6.5
 *
 * @param    {Number}   length      The maximum length of the string
 * @param    {Boolean}  word        Cut off at a word border
 * @param    {String}   ellipsis    How to indicate it's been cut
 *
 * @return   {String}   The truncated string
 */
defProto(function truncate(length, word, ellipsis) {

	var simpleCut,
	    index,
	    e_len,
	    len = Str.countCharacters(this);

	if (len <= length) {
		return this.toString();
	}

	if (typeof ellipsis === 'undefined') {
		ellipsis = '…';
	} else if (typeof ellipsis !== 'string') {
		ellipsis = '';
	}

	e_len = Str.countCharacters(ellipsis);

	// Get the simple cut
	simpleCut = Str.substrCharacters(this, 0, length - e_len);

	if (typeof word === 'undefined' || word) {
		// Get the last position of a word boundary
		index = Math.max(simpleCut.lastIndexOf(' '), simpleCut.lastIndexOf('.'), simpleCut.lastIndexOf('!'), simpleCut.lastIndexOf('?'));

		// If a word boundary was found near the end of the string...
		if (index !== -1 && index >= (length - 15)) {
			simpleCut = simpleCut.substr(0, index);
		}
	}

	return simpleCut + ellipsis;
});

/**
 * Count the number of capital letters in the string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @return   {Number}   The number of capitals in the string
 */
defProto(function capitals() {
	return this.replace(/[^A-Z]/g, '').length;
});

/**
 * Count the given word in the string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.6.5
 *
 * @return   {Number}   The number of times the string appears
 */
defProto(function count(word) {

	var result,
	    len,
	    pos;

	if (word == null || word === '') {
		return Str.countCharacters(this);
	}

	len = this.length;

	// When the string is less than 500 characters long, use a loop
	if (len < 500) {

		result = 0;
		pos = 0;

		while(true) {
			pos = this.indexOf(word, pos);
			if (pos >= 0 && pos < len) {
				result++;
				pos++;
			} else {
				break;
			}
		}

		return result;
	}

	// If it's longer, use a regex
	result = this.match(new RegExp(word, 'g'));

	if (!result) {
		return 0;
	} else {
		return result.length;
	}
});

/**
 * Get all indexes of the given needle
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.6
 * @version  0.6.6
 *
 * @param    {String}   needle
 *
 * @return   {Array}    All the indexes
 */
defProto(function allIndexesOf(needle) {

	var result = [],
	    i = -1;

	while ((i = this.indexOf(needle, i + 1)) != -1) {
		result.push(i);
	}

	return result;
});

/**
 * See if a string starts with the given word
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.5
 *
 * @param    {String}   str
 *
 * @return   {Boolean}
 */
defProto(function startsWith(str) {
	return this.slice(0, str.length) == str;
}, true);

/**
 * See if a string starts with any of the given strings
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Array}   strings
 *
 * @return   {Boolean}
 */
defProto(function startsWithAny(strings) {

	var i;

	if (!Array.isArray(strings)) {
		return this.startsWith(strings);
	}

	for (i = 0; i < strings.length; i++) {
		if (this.startsWith(strings[i])) {
			return true;
		}
	}

	return false;
});

/**
 * See if a string ends with the given word
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.5
 *
 * @param    {String}   str
 *
 * @return   {Boolean}
 */
defProto(function endsWith(str) {

	if (str === '') {
		return true;
	}

	return this.slice(-str.length) == str;
}, true);

/**
 * See if a string ends with any of the given strings
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Array}   strings
 *
 * @return   {Boolean}
 */
defProto(function endsWithAny(strings) {

	var i;

	if (!Array.isArray(strings)) {
		return this.endsWith(strings);
	}

	for (i = 0; i < strings.length; i++) {
		if (this.endsWith(strings[i])) {
			return true;
		}
	}

	return false;
});

/**
 * Add a postfix to a string if it isn't present yet
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.4
 *
 * @param    {String}   postfixString   The string to append
 *
 * @return   {String}   The string with the postfix added to it
 */
defProto(function postfix(postfixString) {

	var str = ''+this;

	// If the given postfix isn't a string, return
	if (typeof postfixString != 'string') return str;

	// Append the postfix if it isn't present yet
	if (!Str.endsWith(str, postfixString)) str += postfixString;

	return str;
});

/**
 * See if a string is a valid hexadecimal number
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {Boolean}
 */
defProto(function isHex() {
	return !isNaN(Number('0x'+this));
});

/**
 * Replace all spaces with underscores
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {String}
 */
defProto(function despace() {
	return this.replace(/ /g, '_');
});

/**
 * Multiply a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Number}   number   The amount of times to multiply the string
 *
 * @return   {String}
 */
defProto(function multiply(number) {

	var str = '',
	    self = ''+this,
	    i;

	if (!number) {
		number = 0;
	}

	for (i = 0; i < number; i++) {
		str += self;
	}

	return str;
});

/**
 * Determine if the string can be a valid ObjectId
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {Boolean}
 */
defProto(function isObjectId() {
	return this.length == 24 && Str.isHex(this);
});

/**
 * See if a string is a valid hash
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   hashType
 *
 * @return   {Boolean}
 */
defProto(function isHash(hashType) {

	var isHex = Str.isHex(this);

	if (!hashType) {
		return isHex;
	} else {
		return isHex && this.length == hashLengths[hashType];
	}
});

// Generate the crc32 table
const crc32table = (function() {
	let value, pos, i;
	let table = [];

	for (pos = 0; pos < 256; ++pos) {
		value = pos;
		for (i = 0; i < 8; ++i) {
			value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
		}
		table[pos] = value >>> 0;
	}

	return table;
})();

/**
 * JavaScript implementation of the `String.hashCode`
 * method from Java
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.10
 *
 * @return   {Number}
 */
defProto(function numberHash() {

	var str = this,
	    res = 0,
	    len = str.length,
	    i   = -1;

	while (++i < len) {
		res = ((res << 5) - res) + str.charCodeAt(i);
		res |= 0;
	}

	return res;
});

/**
 * Generate a checksum (crc32 hash)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.8.1
 *
 * @param    {Number}   start
 * @param    {Number}   end
 *
 * @return   {String}
 */
defProto(function checksum(start, end) {

	let length = this.length,
	    key;

	if (start || end) {

		if (start == null) {
			start = 0;
		}

		if (end == null) {
			end = length;
		}

		key = this.slice(start, end);
		length = key.length;
	} else {
		key = ''+this;
	}

	let result;

	if (length < 10240) {
		result = checksum_cache.get(key);
	}

	if (result != null) {
		return result;
	}

	let crc = -1,
	    i;

	for (i = 0; i < length; i++ ) {
		crc = (crc >>> 8) ^ crc32table[(crc ^ key.charCodeAt(i)) & 0xFF];
	}

	result = (crc ^ (-1)) >>> 0;

	if (length < 10240) {
		checksum_cache.set(key, result);
	}

	return result;
});

/**
 * Generate a fnv-1a hash (32bit implementation)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.5.0
 *
 * @return   {Number}
 */
defProto(function fowler() {

	var strToByteArray,
	    strToHashLen,
	    byteToHash,
	    byteArray,
	    hash,
	    i;

	strToHashLen = this.length;

	// Start value containing offset
	hash = 2166136261;

	for (i = 0; i < strToHashLen; i++) {
		hash ^= this.charCodeAt(i);
		hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
	}

	return hash >>> 0;
});

/**
 * Get all the placeholders inside a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {Array}
 */
defProto(function placeholders() {

	var regex  = /:(\w*)/g,
	    result = [],
	    match;

	while (match = regex.exec(this)) {
		if (typeof match[1] !== 'undefined') {
			result.push(match[1]);
		}
	}

	return result;
});

/**
 * Replace all the placeholders inside a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {Object}   values
 * @param    {Boolean}  remove_used   Remove used entries from values object
 *
 * @return   {String}
 */
defProto(function fillPlaceholders(values, remove_used) {

	var result = ''+this,
	    do_remove,
	    params,
	    value,
	    regex,
	    match,
	    repl,
	    ori,
	    i;

	if (remove_used) {
		do_remove = [];
	}

	if (values && typeof values == 'object') {
		params = Str.placeholders(this);

		for (i = 0; i < params.length; i++) {

			regex = new RegExp('(:' + params[i] + ')(?:\\W|$)', 'g');
			value = Obj.path(values, params[i]);

			if (value || value === 0) {

				if (remove_used) {
					do_remove.push(params[i]);
				}

				while (match = regex.exec(result)) {

					// Get the original value
					ori = match[0];

					// Generate the replacement
					repl = ori.replace(match[1], value);

					// Replace the original with the replacement in the string
					result = result.replace(ori, repl);
				}
			}
		}
	}

	if (remove_used) {
		for (i = 0; i < do_remove.length; i++) {
			delete values[do_remove[i]];
		}
	}

	return result;
});

/**
 * Get all the assignments
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Array}
 */
defProto(function assignments() {

	var pattern  = /\{([^{]+?)\}/g,
	    result = [],
	    match;

	while (match = pattern.exec(this)) {
		if (match[1] != null) {
			result.push(match[1]);
		}
	}

	return result;
});

/**
 * Assign values inside the string with the given parameters
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.0
 *
 * @param    {Object}   values
 *
 * @return   {String}
 */
defProto(function assign(_values, remove_used, cast) {

	var pattern,
	    result = ''+this,
	    values,
	    match,
	    val;

	if (_values == null) {
		return result;
	}

	pattern = /\{([^{]+?)\}/g;

	if (typeof _values == 'object') {
		values = _values;
	} else {
		values = [values];
	}

	while (match = pattern.exec(this)) {
		val = values[match[1]];

		if (val && typeof val == 'object') {
			// If only the default toString is available,
			// get the "first" entry of the object
			if (val.toString == Object.prototype.toString) {
				val = Obj.first(val);
			} else {
				val = String(val);
			}
		}

		if (val != null) {

			if (cast) {
				val = cast(val);
			}

			result = result.replace(match[0], val);

			if (remove_used) {
				delete values[match[1]];
			}
		}
	}

	return result;
});

/*!
 * string_score.js: String Scoring Algorithm 0.1.20 
 *
 * http://joshaven.com/string_score
 * https://github.com/joshaven/string_score
 *
 * Copyright (C) 2009-2011 Joshaven Potter <yourtech@gmail.com>
 * Special thanks to all of the contributors listed here https://github.com/joshaven/string_score
 * MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Tue Mar 1 2011
 * Updated: Tue Jun 11 2013
*/

/**
 * Scores a string against another string.
 *  'Hello World'.score('he');     //=> 0.5931818181818181
 *  'Hello World'.score('Hello');  //=> 0.7318181818181818
 */
defProto(function score(word, fuzziness) {

	// If the string is equal to the word, perfect match.
	if (this == word) return 1;

	//if it's not a perfect match and is empty return 0
	if (word == '') return 0;

	var runningScore = 0,
	    charScore,
	    finalScore,
	    string = this,
	    lString = string.toLowerCase(),
	    strLength = string.length,
	    lWord = word.toLowerCase(),
	    wordLength = word.length,
	    idxOf,
	    startAt = 0,
	    fuzzies = 1,
	    fuzzyFactor,
	    i;
	
	// Cache fuzzyFactor for speed increase
	if (fuzziness) fuzzyFactor = 1 - fuzziness;

	// Walk through word and add up scores.
	// Code duplication occurs to prevent checking fuzziness inside for loop
	if (fuzziness) {
		for (i = 0; i < wordLength; ++i) {

			// Find next first case-insensitive match of a character.
			idxOf = lString.indexOf(lWord[i], startAt);
			
			if (-1 === idxOf) {
				fuzzies += fuzzyFactor;
				continue;
			} else if (startAt === idxOf) {
				// Consecutive letter & start-of-string Bonus
				charScore = 0.7;
			} else {
				charScore = 0.1;

				// Acronym Bonus
				// Weighing Logic: Typing the first character of an acronym is as if you
				// preceded it with two perfect character matches.
				if (string[idxOf - 1] === ' ') charScore += 0.8;
			}
			
			// Same case bonus.
			if (string[idxOf] === word[i]) charScore += 0.1; 
			
			// Update scores and startAt position for next round of indexOf
			runningScore += charScore;
			startAt = idxOf + 1;
		}
	} else {
		for (i = 0; i < wordLength; ++i) {
		
			idxOf = lString.indexOf(lWord[i], startAt);
			
			if (-1 === idxOf) {
				return 0;
			} else if (startAt === idxOf) {
				charScore = 0.7;
			} else {
				charScore = 0.1;
				if (string[idxOf - 1] === ' ') charScore += 0.8;
			}

			if (string[idxOf] === word[i]) charScore += 0.1; 
			
			runningScore += charScore;
			startAt = idxOf + 1;
		}
	}

	// Reduce penalty for longer strings.
	finalScore = 0.5 * (runningScore / strLength  + runningScore / wordLength) / fuzzies;
	
	if ((lWord[0] === lString[0]) && (finalScore < 0.85)) {
		finalScore += 0.15;
	}

	return finalScore;
});

var whitespace_regex = /^\s*$/;

/**
 * Is this an empty or whitespace string?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.9
 * @version  0.5.9
 *
 * @return   {Boolean}
 */
defProto(function isEmptyWhitespace() {

	var len = this.length,
	    i;

	if (!len) {
		return true;
	}

	return whitespace_regex.test(this);
});

/**
 * Is this an empty or whitespace string, with all HTML tags removed?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.9
 * @version  0.5.9
 *
 * @return   {Boolean}
 */
defProto(function isEmptyWhitespaceHTML() {

	var str;

	if (Str.isEmptyWhitespace(this)) {
		return true;
	}

	if (~this.indexOf('<') && ~this.indexOf('>')) {
		str = Str.stripTags(this);
		return Str.isEmptyWhitespace(str);
	}

	return false;
});

/**
 * Is this string uppercased?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @return   {Boolean}
 */
defProto(function isUpperCase() {
	return this == this.toUpperCase() && this != this.toLowerCase();
});

/**
 * Is this string lowercased?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @return   {Boolean}
 */
defProto(function isLowerCase() {
	return this == this.toLowerCase() && this != this.toUpperCase();
});

/**
 * Count the real amount of characters in this string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @return   {Number}
 */
defProto(function countCharacters() {
	var match = this.match(astral_rx);
	return match === null ? 0 : match.length;
});

/**
 * Perform a substr on the actual characters
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @param    {Number}   begin
 * @param    {Number}   length
 *
 * @return   {String}
 */
defProto(function substrCharacters(begin, length) {

	var str_len = Str.countCharacters(this),
	    match,
	    end;

	// Normalize begin index
	if (typeof begin != 'number') {
		begin = Number(begin) || 0;
	}

	if (begin >= str_len) {
		return '';
	}

	if (begin < 0) {
		begin += str_len;
	}

	if (length == null) {
		end = str_len;
	} else {
		if (typeof length != 'number') {
			length = Number(length) || 0;
		}

		end = length >= 0 ? length + begin : begin;
	}

	match = this.match(astral_rx);

	return match === null ? '' : match.slice(begin, end).join('');
});

/**
 * Perform a substring on the actual characters
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.5
 * @version  0.6.5
 *
 * @param    {Number}   begin
 * @param    {Number}   end
 *
 * @return   {String}
 */
defProto(function substringCharacters(begin, end) {

	var match;

	if (typeof begin !== 'number' || begin < 0) {
		begin = 0;
	}

	if (typeof end == 'number' && end < 0) {
		end = 0;
	}

	match = this.match(astral_rx);

	return match === null ? '' : match.slice(begin, end).join('');
});

/**
 * Split this string into an array of its individual characters,
 * without breaking up astral symbols
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Array}
 */
defProto(function splitCharacters() {
	return this.match(astral_rx) || [];
});

/**
 * Dedent a piece of text
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.2
 * @version  0.7.2
 *
 * @return   {String}
 */
defProto(function dedent() {

	let text = this;

	let length,
	    lines = text.split('\n'),
	    trims = [],
	    count,
	    line,
	    i;

	for (i = 0; i < lines.length; i++) {
		line = lines[i];
		length = line.trimLeft().length;

		if (length == 0) {
			trims.push(Infinity);
		} else {
			trims.push(line.length - length);
		}
	}

	let min = Bound.Array.min(trims);

	for (i = 0; i < lines.length; i++) {
		line = lines[i];
		count = trims[i];

		if (count) {
			line = line.slice(min);
			lines[i] = line;
		}
	}

	return lines.join('\n');
});

/**
 * Reverse a string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @return   {string}
 */
defProto(function reverse() {
	return Str.splitCharacters(this).reverse().join('');
});