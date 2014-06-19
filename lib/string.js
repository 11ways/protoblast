module.exports = function BlastString(Blast, Collection) {

	// Generate the crc32 table
	var crc32table = (function() {
		var value, pos, i;
		var table = [];

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
	 * Hash a (small) string very fast
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('String', 'numberHash', function hash() {

		var str = this,
		    res = 0,
		    len = str.length,
		    i   = -1;

		while (++i < len) {
			res = res * 31 + str.charCodeAt(i);
		}

		return res;
	});

	/**
	 * Generate a checksum (crc32 hash)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'checksum', function checksum() {

		var str = this,
		    crc = 0 ^ (-1),
		    i;

		for (i = 0; i < str.length; i++ ) {
			crc = (crc >>> 8) ^ crc32table[(crc ^ str.charCodeAt(i)) & 0xFF];
		}

		return (crc ^ (-1)) >>> 0;
	});

	/**
	 * Get all the placeholders inside a string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('String', 'placeholders', function placeholders() {

		var regex  = /:(.*?)(?:\/|$)/g,
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   values
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'fillPlaceholders', function fillPlaceholders(values) {

		var result = ''+this,
		    params,
		    value,
		    regex,
		    match,
		    repl,
		    ori,
		    i;

		if (values && typeof values == 'object') {
			params = this.placeholders();

			for (i = 0; i < params.length; i++) {

				regex = new RegExp('(:' + params[i] + ')(?:\\/|$)', 'g');
				value = Blast.Object.path(values, params[i]);

				if (value || value === 0) {

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
	Blast.definePrototype('String', 'score', function score(word, fuzziness) {

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
		    fuzzyFactor;
		
		// Cache fuzzyFactor for speed increase
		if (fuzziness) fuzzyFactor = 1 - fuzziness;

		// Walk through word and add up scores.
		// Code duplication occurs to prevent checking fuzziness inside for loop
		if (fuzziness) {
			for (var i = 0; i < wordLength; ++i) {

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
			for (var i = 0; i < wordLength; ++i) {
			
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

};