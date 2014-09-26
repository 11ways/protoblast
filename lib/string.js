module.exports = function BlastString(Blast, Collection) {

	'use strict';

	var hashLengths = {
		'md5': 32,
		'sha1': 40
	};

	/**
	 * Serialize the given parameter to valid HTML attributes
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}    obj   The object to serialize
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'serializeAttributes', function serializeAttributes(obj) {

		var result = '',
		    val,
		    key;

		obj = Collection.Object.objectify(obj);

		for (key in obj) {

			// Add a space to separate values
			if (result) result += ' ';

			val = String(obj[key]).replace('"', '&quot;');

			result += key + '="' + val + '"';
		}

		return result;
	});

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'toSource', function toSource() {
		return '(new String(' + JSON.stringify(this) + '))';
	}, true);

	/**
	 * Return a non-negative integer that is the UTF-16 encoded code point
	 * value of the wanted characters (even those above 0x10000)
	 *
	 * Adapted from Paul Miller's es6-shim
	 * and Mathias Bynen's codePointAt polyfill
	 *
	 * @author   Paul Miller   <http://paulmillr.com>
	 * @author   Mathias Bynens   <http://mathiasbynens.be/>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Number}   pos   Position of element in string
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('String', 'codePointAt', function codePointAt(pos) {

		var length,
		    second,
		    first,
		    str;

		if (this === null) {
			throw new TypeError('Can\'t convert ' + this + ' to object');
		}

		// Make sure this is a string
		if (typeof this === 'string') {
			str = this;
		} else {
			str = String(this);
		}

		length = this.length;

		// Make sure pos is a number
		if (typeof pos !== 'number') {
			pos = Number(pos) || 0;
		}

		// Return undefined if an invalid position has been given
		if (pos < 0 || pos > length) {
			return;
		}

		// Get the charcode of the position
		first = str.charCodeAt(pos);

		// Now set for the position of the next char
		pos += 1;

		if (pos === length || first < 0xD800 || first > 0xDBFF) {
			return first;
		}

		// We need to inspect the next char, too
		second = str.charCodeAt(pos);

		if (second < 0xDC00 || second > 0xDFFF) {
			return first;
		}

		return ((first - 0xD800) * 1024) + (second - 0xDC00) + 0x10000;
	}, true);

	/**
	 * Get a unicode-escaped representation of this string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'escapeUnicode', function escapeUnicode() {

		var length = this.length,
		    result = '',
		    temp,
		    tlen,
		    i;

		if (length === 0) {
			return result;
		}

		for (i = 0; i < length; i++) {

			// Get the hex value of the charcode
			temp = this.charCodeAt(i).toString(16);

			// Make sure it's 4 characters long
			temp = Blast.Bound.String.multiply('0', 4-temp.length) + temp;

			result += '\\u' + temp.toUpperCase();
		}

		return result;
	});

	/**
	 * Return the string after the given needle
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   needle   The string to look for
	 * @param    {Boolean}  first    Get from the first or last
	 *
	 * @return   {String}   The string after the needle
	 */
	Blast.definePrototype('String', 'after', function after(needle, first) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   needle   The string to look for
	 *
	 * @return   {String}   The string after the needle
	 */
	Blast.definePrototype('String', 'afterLast', function afterLast(needle) {
		return this.after(needle, false);
	});

	/**
	 * Return the string before the given needle
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   needle   The string to look for
	 * @param    {Boolean}  first    Get from the first or last
	 *
	 * @return   {String}   The string without any tags
	 */
	Blast.definePrototype('String', 'before', function before(needle, first) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   needle   The string to look for
	 *
	 * @return   {String}   The string after the needle
	 */
	Blast.definePrototype('String', 'beforeLast', function beforeLast(needle) {
		return this.before(needle, false);
	});

	/**
	 * Remove HTML tags from the string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {String}   The string without any tags
	 */
	Blast.definePrototype('String', 'stripTags', function stripTags() {
		return this.replace(/(<([^>]+)>)/ig, '');
	});

	/**
	 * Sluggify the string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @return   {String}   The sluggifier string
	 */
	Blast.definePrototype('String', 'slug', function slug(separator) {

		var result;

		// Get the separator to use, defaults to hyphen
		separator = separator || '-';

		// Convert to lowercase
		result = this.toLowerCase();
		
		// Replace non-words with placeholders
		result = result.replace(/[^\w ]+/g, '=');

		// Replace spaces and placeholders with the separator
		result = result.replace(/ +|=+/g, separator);

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @param    {String}   open   The open tag
	 * @param    {String}   close  The close tag
	 *
	 * @return   {Array}    An array of objects
	 */
	Blast.definePrototype('String', 'dissect', function dissect(open, close) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   length      The maximum length of the string
	 * @param    {Boolean}  word        Cut off at a word border
	 * @param    {String}   ellipsis    How to indicate it's been cut
	 *
	 * @return   {String}   The truncated string
	 */
	Blast.definePrototype('String', 'truncate', function truncate(length, word, ellipsis) {

		var simpleCut,
		    index;
		
		if (this.length <= length) {
			return this.toString();
		}

		if (typeof ellipsis === 'undefined') {
			ellipsis = '...';
		} else if (typeof ellipsis !== 'string') {
			ellipsis = '';
		}

		// Get the simple cut
		simpleCut = this.substr(0, length - ellipsis.length);

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
	 * Replace every occurence of needle in the string without using regexes
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   needle        The string to look for
	 * @param    {String}   replacement
	 *
	 * @return   {String}   The string after the replacement
	 */
	Blast.definePrototype('String', 'replaceAll', function replaceAll(needle, replacement) {

		var count,
		    str,
		    len,
		    i;

		count = this.match(new RegExp(needle, 'g'));

		if (!count) {
			return this;
		}

		str = this;
		len = count.length;

		for (i = 0; i < len; i++) {
			str = str.replace(needle, replacement);
		}

		return str;
	});

	/**
	 * Count the number of capital letters in the string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @return   {Number}   The number of capitals in the string
	 */
	Blast.definePrototype('String', 'capitals', function capitals() {
		return this.replace(/[^A-Z]/g, '').length;
	});

	/**
	 * Count the given word in the string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.2
	 *
	 * @return   {Number}   The number of times the string appears
	 */
	Blast.definePrototype('String', 'count', function count(word) {

		var result,
		    pos;

		// When the string is less than 500 characters long, use a loop
		if (this.length < 500) {

			result = 0;
			pos = 0;

			while(true) {
				pos = this.indexOf(word, pos);
				if (pos >= 0) {
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
	 * See if a string starts with the given word
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   str
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'startsWith', function startsWith(str) {
		return this.slice(0, str.length) == str;
	});

	/**
	 * See if a string ends with the given word
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   str
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'endsWith', function endsWith(str) {
		return this.slice(-str.length) == str;
	});

	/**
	 * Add a postfix to a string if it isn't present yet
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.4
	 *
	 * @param    {String}   postfixString   The string to append
	 *
	 * @return   {String}   The string with the postfix added to it
	 */
	Blast.definePrototype('String', 'postfix', function postfix(postfixString) {

		var str = ''+this;

		// If the given postfix isn't a string, return
		if (typeof postfixString != 'string') return str;

		// Append the postfix if it isn't present yet
		if (!Blast.Bound.String.endsWith(str, postfixString)) str += postfixString;

		return str;
	});

	/**
	 * See if a string is a valid hexadecimal number
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'isHex', function isHex() {
		return !isNaN(Number('0x'+this));
	});

	/**
	 * Replace all spaces with underscores
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'despace', function despace() {
		return this.replace(/ /g, '_');
	});

	/**
	 * Multiply a string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {Number}   number   The amount of times to multiply the string
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'multiply', function multiply(number) {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'isObjectId', function isObjectId() {
		return this.length == 24 && Blast.Bound.String.isHex(this);
	});

	/**
	 * See if a string is a valid hash
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   hashType
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'isHash', function isHash(hashType) {

		var isHex = Blast.Bound.String.isHex(this);

		if (!hashType) {
			return isHex;
		} else {
			return isHex && this.length == hashLengths[hashType];
		}
	});

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
	 * @version  0.1.0
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('String', 'placeholders', function placeholders() {

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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.2
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
			params = Blast.Bound.String.placeholders(this);

			for (i = 0; i < params.length; i++) {

				regex = new RegExp('(:' + params[i] + ')(?:\\W|$)', 'g');
				
				value = Blast.Bound.Object.path(values, params[i]);

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

};