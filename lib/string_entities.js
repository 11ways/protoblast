module.exports = function BlastStringEntities(Blast, Collection) {

	var HTMLEntities,
	    charMap,
	    key,
	    i;

	/**
	 * Populate HTMLEntities variable with entities
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.2
	 * @version  0.4.1
	 *
	 * @param    {String}   character   The single character to encode
	 *
	 * @return   {String}   The encoded char
	 */
	function loadEntities() {
		// Uncompress the base charmap
		charMap = require('./string_entities_map.js');

		HTMLEntities = {};

		for (key in charMap) {
			for (i = 0; i < charMap[key].length; i++) {
				HTMLEntities[charMap[key][i]] = key;
			}
		}
	}

	/**
	 * HTML encode the string, without the use of any map
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.4.1
	 *
	 * @return   {String}   The encoded string
	 */
	Blast.definePrototype('String', 'encodeHTML', function encodeHtml() {

		var codepoint,
		    charcode,
		    index = -1;

		return this.replace(/[\u0000-\u0019\u0021-\u0028\u0080-\uffff<>\&]/g, function entityEncoder(character, offset, str) {

			// See if we need to skip this character
			if (offset < index) {
				return '';
			}

			charcode = character.charCodeAt(0);

			if (charcode < 65 || (charcode > 90 && charcode < 97)) {
				return '&#' + charcode + ';';
			}

			codepoint = str.codePointAt(offset);

			if (codepoint != charcode) {
				index = offset + 2;
				return '&#x' + codepoint.toString(16) + ';';
			}

			return '&#' + charcode + ';';
		});
	});

	/**
	 * HTML decode the string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.4.1
	 *
	 * @return   {String}   The decoded string
	 */
	Blast.definePrototype('String', 'decodeHTML', function decodeHtml() {

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

			// On the client side we can use the browser to decode the entities
			if (Blast.isBrowser) {
				if (!span) {
					span = document.createElement('span');
				}

				span.innerHTML = '&' + name + ';';
				return span.innerText;
			}

			// Load the entities on-the-fly
			if (HTMLEntities == null) {
				loadEntities();
			}

			if (HTMLEntities[name]) {
				return HTMLEntities[name];
			}

			// Return the match by default, if no existing spec was found
			return match;
		});

		return result;
	});

};