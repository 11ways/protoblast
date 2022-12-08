/**
 * HTML decode the string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.4.1
 *
 * @return   {String}   The decoded string
 */
Blast.definePrototype('String', function decodeHTML() {

	var result,
	    span;

	// Decode numeric escapes
	result = this.replace(/&#(\d+);/g, function(match, code) {
		return String.fromCharCode(code);
	});

	// Decode hexadecimal escapes
	result = result.replace(/&#x([0-9a-zA-Z]+);/g, function(match, code) {
		return String.fromCodePoint(parseInt(code, 16));
	});

	// Decode named escapes
	result = result.replace(/&(\w+);/g, function(match, name) {

		// PROTOBLAST START CUT
		// Use the HTML Entities map on the server side
		if (!Blast.isBrowser) {
			// Load the entities on-the-fly
			if (HTMLEntities == null) {
				loadEntities();
			}

			if (HTMLEntities[name]) {
				return HTMLEntities[name];
			}

			// Return the match by default, if no existing spec was found
			return match;
		}
		// PROTOBLAST END CUT

		if (!span) {
			span = document.createElement('span');
		}

		span.innerHTML = '&' + name + ';';
		return span.innerText;
	});

	return result;
});

// PROTOBLAST START CUT
let HTMLEntities,
    HTMLEntityCodes,
    HTMLEntityCodeMap,
    non_ascii_rx = /(?:[\u0100-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
    char_map,
    base_rx = /[<>&'"]/g,
    xml_rx;

/**
 * Populate HTMLEntities variable with entities
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.3.2
 * @version  0.7.5
 *
 * @param    {String}   character   The single character to encode
 *
 * @return   {String}   The encoded char
 */
function loadEntities() {

	// Uncompress the base charmap
	char_map = require('./string_entities_map.js');

	let named_chars = '',
	    values,
	    value,
	    code,
	    key,
	    i;

	HTMLEntities = {};
	HTMLEntityCodes = {};
	HTMLEntityCodeMap = new Map();

	for (key in char_map) {
		values = char_map[key];

		if (values[0] !== false && key.length == 1) {
			code = key.charCodeAt(0);

			if (code > 31 && code < 256) {
				// Do not add to the named chars
			} else {
				named_chars += '\\' + key;
			}
		}

		let skip_code = false;

		for (i = 0; i < values.length; i++) {
			value = values[i];

			if (value === false) {
				skip_code = true;
				continue;
			}

			HTMLEntities[value] = key;

			if (skip_code) {
				continue;
			}

			if (HTMLEntityCodes[key.charCodeAt(0)]) {
				continue;
			}

			let codes = [];
			HTMLEntityCodes[key.charCodeAt(0)] = codes;
			HTMLEntityCodeMap.set(key.charCodeAt(0), codes);
			for (let i = 0; i < value.length; i++) {
				codes.push(value.charCodeAt(i));
			}
		}
	}

	xml_rx = RegExp('[' + named_chars + ']', 'g');
}

/**
 * Replace a single character
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @param    {String}   character   The single character to encode
 *
 * @return   {String}   The encoded char
 */
function singleCharReplacer(char) {

	let code = char.codePointAt(0);

	if (code) {
		code = code.toString(16);
	}

	return '&#x' + code + ';';
}

/**
 * Replace the given character with a named entity
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @param    {String}   character   The single character to encode
 *
 * @return   {String}   The encoded char
 */
function namedReplace(char) {
	return '&' + char_map[char][0] + ';';
}

/**
 * Replace the base XML entities (inside HTML)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @param    {String}   character   The single character to encode
 *
 * @return   {String}   The encoded char
 */
function baseReplace(char) {
	switch (char) {
		case '<': return '&lt;';
		case '>': return '&gt;';
		case '&': return '&amp;';
		case '\'': return '&apos;';
		case '"': return '&quot;';
	}
}

/**
 * Replace only the dangerous XML entities
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @param    {String}   character   The single character to encode
 *
 * @return   {String}   The encoded char
 */
function baseDangerousReplace(char) {
	switch (char) {
		case '<': return '&lt;';
		case '>': return '&gt;';
		case '&': return '&amp;';
		default : return char;
	}
}

const CHAR_RETURN = 13;
const CHAR_QUOT = 34;
const CHAR_HASH = 35;
const CHAR_AMP = 38;
const CHAR_SQUOT = 39;
const CHAR_SEMI = 59;
const CHAR_LT = 60;
const CHAR_GT = 62;
const CHAR_BACK = 92;
const CHAR_X = 120;

/**
 * Browser-side implementation of encoding HTML entities
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.7.26
 *
 * @param    {Boolean}  replace_more   Replace more characters (inside attributes)
 *
 * @return   {String}   The encoded string
 */
Blast.definePrototype('String', function encodeHTML(replace_more) {

	// Load the entities on-the-fly
	if (HTMLEntities == null) {
		loadEntities();
	}

	const length = this.length;

	let start_index = 0,
	    end_index = 0,
	    code_string,
	    code_point,
	    char_code,
		replaced,
	    changed = false,
	    pieces = [],
	    codes,
	    i,
	    j;

	for (i = 0; i < length; i++) {
		char_code = this.charCodeAt(i);

		if (char_code > 31 && char_code < 256) {
			if (char_code == CHAR_LT || char_code == CHAR_GT || char_code == CHAR_AMP) {
				// Has to be replaced
			} else if (replace_more && (char_code == CHAR_BACK || char_code == CHAR_QUOT)) {
				// Also has to be replaced!
			} else {
				end_index = i + 1;
				continue;
			}
		}

		codes = HTMLEntityCodeMap.get(char_code);

		if (codes) {
			replaced = '&';

			if (start_index != end_index) {
				pieces.push(this.slice(start_index, end_index));
			}

			changed = true;
			for (j = 0; j < codes.length; j++) {
				replaced += String.fromCharCode(codes[j])
			}
			replaced += ';';

			pieces.push(replaced);
			start_index = end_index = i + 1;

		} else {
			code_point = this.codePointAt(i);

			if (char_code == code_point) {
				end_index = i;
			} else {
				i++;
				changed = true;
				code_string = code_point.toString(16);

				if (start_index != end_index) {
					pieces.push(this.slice(start_index, end_index));
				}

				replaced = '&#x' + code_string + ';';
				pieces.push(replaced);
				start_index = end_index = i + 1;
			}
		}
	}

	if (!changed) {
		return this;
	}

	pieces.push(this.slice(start_index, end_index));

	return pieces.join('');
});

return;
// PROTOBLAST END CUT

/**
 * Browser-side implementation of encoding HTML entities
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.5
 * @version  0.7.5
 *
 * @return   {String}   The encoded string
 */
Blast.definePrototype('String', function encodeHTML() {

	let i = document.createElement('i');
	i.textContent = this;

	return i.innerHTML;
});
