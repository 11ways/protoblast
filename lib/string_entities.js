const REPLACE_FROM_CHARCODE = (match, code) => String.fromCharCode(code),
      REPLACE_FROM_CODEPOINT = (match, code) => String.fromCodePoint(parseInt(code, 16));

let span_in_browser;

const REPLACE_FROM_NAMED = (match, name) => {

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

	if (!span_in_browser) {
		span_in_browser = document.createElement('span');
	}

	span_in_browser.innerHTML = '&' + name + ';';
	return span_in_browser.innerText;
};

const CHARCODE_RX = /&#(\d+);/g,
      CODEPOINT_RX = /&#x([0-9a-zA-Z]+);/g,
      NAMED_RX = /&(\w+);/g;

/**
 * HTML decode the string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.8.1
 *
 * @return   {String}   The decoded string
 */
Blast.definePrototype('String', function decodeHTML() {

	let length = this.length;

	// The shortest HTML entity is 4 characters long, eg: &lt;
	if (length < 4) {
		return this;
	}

	// If there is no ampersand to be found, it doesn't need any decoding
	if (!this.includes('&')) {
		return this;
	}

	let result;

	if (this.includes('&#')) {
		// Decode numeric escapes
		result = this.replace(CHARCODE_RX, REPLACE_FROM_CHARCODE);

		if (result.includes('&#x')) {
			// Decode hexadecimal escapes
			result = result.replace(CODEPOINT_RX, REPLACE_FROM_CODEPOINT);
		}

		// Attempt another early return
		if (result.length < 4 || !result.includes('&')) {
			return result;
		}
	} else {
		result = this;
	}

	// Decode named escapes
	result = result.replace(NAMED_RX, REPLACE_FROM_NAMED);

	return result;
});

// PROTOBLAST START CUT
let HTMLEntities,
    HTMLEntityCodes,
    HTMLEntityCodeMap,
    char_map;

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

	let values,
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
 * See if a string contains characters that need escaping
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.27
 * @version  0.7.27
 *
 * @param    {String}   text
 *
 * @return   {Boolean}
 */
Blast.stringNeedsHtmlEscaping = function stringNeedsHtmlEscaping(text) {

	// Load the entities on-the-fly
	if (HTMLEntities == null) {
		loadEntities();
	}

	const length = text.length;

	let replacement_codes,
	    code_point,
	    code,
	    i;
	
	for (i = 0; i < length; i++) {
		code = text.charCodeAt(i);

		if (code > 31 && code < 256) {
			if (code == CHAR_LT || code == CHAR_GT || code == CHAR_AMP) {
				return true;
			} else if (code == CHAR_BACK || code == CHAR_QUOT) {
				return true;
			} else {
				continue;
			}
		}

		replacement_codes = HTMLEntityCodeMap.get(code);

		if (replacement_codes) {
			return true;
		}

		code_point = text.codePointAt(i);

		if (code == code_point) {
			continue;
		} else {
			return true;
		}
	}

	return false;
};

/**
 * Browser-side implementation of encoding HTML entities
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.8.12
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
				// The char code & the code point are the same,
				// so it's safe to print
				end_index = i + 1;
			} else {

				// The char code & code point differ,
				// so this is some kind of combined character,
				// like an emoji

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
