module.exports = function BlastStringEntities(Blast, Collection) {

	var HTMLEntities,
	    charMap,
	    key,
	    i;

	// Uncompress the base charmap
	charMap = JSON.parse(Collection.String.decompressFromBase64(require('./string_compressed_entities.js')));

	HTMLEntities = {};

	for (key in charMap) {
		for (i = 0; i < charMap[key].length; i++) {
			HTMLEntities[charMap[key][i]] = key;
		}
	}

	/**
	 * Function to be used for encoding text for safe usage in HTML
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   character   The single character to encode
	 *
	 * @return   {String}   The encoded char
	 */
	var entityEncoder = function entityEncoder(character) {
		return '&#' + character.charCodeAt(0) + ';';
	};

	/**
	 * HTML encode the string, without the use of any map
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.6
	 *
	 * @return   {String}   The encoded string
	 */
	Blast.definePrototype('String', 'encodeHTML', function encodeHtml() {
		return this.replace(/[\u0000-\u0019\u0021-\u0028\u0080-\uffff<>\&]/g, entityEncoder);
	});

	/**
	 * HTML decode the string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {String}   The decoded string
	 */
	Blast.definePrototype('String', 'decodeHTML', function decodeHtml() {

		var result;

		// Decode numeric escapes
		result = this.replace(/&#(x?)(\d+);/g, function(match, p1, code) {
			return String.fromCharCode(code);
		});

		// Decode named escapes
		result = result.replace(/&(\w+);/g, function(match, name) {

			if (HTMLEntities[name]) {
				return HTMLEntities[name];
			}

			// Return the match by default, if no existing spec was found
			return match;
		});

		return result;
	});

};