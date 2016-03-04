module.exports = function BlastString(Blast, Collection) {

	'use strict';

	var hashLengths = {
		'md5': 32,
		'sha1': 40
	};

	/**
	 * Serialize the given parameter to valid HTML attributes
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	Blast.defineStatic('String', 'decodeURI', function decodeURI(value) {
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
	Blast.defineStatic('String', 'encodeURI', function encodeURI(value) {
		return encodeURIComponent(value);
	});

	/**
	 * Decode a uri encoded component and try to JSON decode it, too
	 * Return the given value should it fail
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}   value
	 *
	 * @return   {Mixed}
	 */
	Blast.defineStatic('String', 'decodeJSONURI', function decodeJSONURI(value) {

		value = Collection.String.decodeURI(value);

		try {
			return JSON.parse(value);
		} catch (err) {
			return value.trim();
		}
	});

	/**
	 * Decode a cookie string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}   value
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('String', 'decodeCookies', function decodeCookies(value) {

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

		pieces = value.split(/; */)

		for (i = 0; i < pieces.length; i++) {
			pair = pieces[i];
			index = pair.indexOf('=');

			// Skip pieces that aren't key-vals separated by a equal sign
			if (index < 0) {
				continue;
			}

			// Get the key, trim it now
			key = pair.substr(0, index).trim();

			// The value will be trimmed later
			val = pair.substr(index + 1, pair.length);

			result[key] = Collection.String.decodeJSONURI(val);
		}

		return result;
	});

	/**
	 * Encode a single cookie
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.6
	 *
	 * @param    {String}   name
	 * @param    {Mixed}    value
	 * @param    {Object}   options
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'encodeCookie', function encodeCookie(name, value, options) {

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

			if (options.path) header += '; path=' + options.path;
			if (options.expires) header += '; expires=' + options.expires.toUTCString();
			if (options.domain) header += '; domain=' + options.domain;
			if (options.secure) header += '; secure';
			if (options.httpOnly) header += '; httponly';
		}

		return header;
	});

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'toSource', function toSource() {
		return '(new String(' + JSON.stringify(this) + '))';
	}, true);

	/**
	 * Trim left
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'trimLeft', function trimLeft() {
		return this.replace(/^[\s\uFEFF]+/g, '');
	}, true);

	/**
	 * Trim right
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'trimRight', function trimRight() {
		return this.replace(/[\s\uFEFF]+$/g, '');
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @param    {String}   needle   The string to look for
	 *
	 * @return   {String}   The string after the needle
	 */
	Blast.definePrototype('String', 'afterLast', function afterLast(needle) {
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @param    {String}   needle   The string to look for
	 *
	 * @return   {String}   The string after the needle
	 */
	Blast.definePrototype('String', 'beforeLast', function beforeLast(needle) {
		return Collection.String.prototype.before.call(this, needle, false);
	});

	/**
	 * Remove HTML tags from the string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {String}   The string without any tags
	 */
	Blast.definePrototype('String', 'stripTags', function stripTags() {
		return String.prototype.replace.call(this, /(<([^>]+)>)/ig, '');
	});

	/**
	 * Sluggify the string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.11
	 *
	 * @return   {String}   The sluggifier string
	 */
	Blast.definePrototype('String', 'slug', function slug(separator) {

		var result;

		// Get the separator to use, defaults to hyphen
		separator = separator || '-';

		// Convert to lowercase
		result = this.toLowerCase();

		// Romanize the string (remove diacritics)
		result = Blast.Bound.String.romanize(result);

		// Decode HTML
		result = Blast.Bound.String.decodeHTML(result);

		// Replace non-words with placeholders
		result = result.replace(/[^\w ]+/g, '=');

		// Replace spaces and placeholders with the separator
		result = result.replace(/ +|=+/g, separator);

		// Truncate repeats of the separator
		result = result.replace(Blast.Bound.RegExp.interpret('/\\' + separator + '+/g'), separator);

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * Truncate an HTML string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 *
	 * @param    {Number}   length      The maximum length of the string
	 * @param    {Boolean}  word        Cut off at a word border
	 * @param    {String}   ellipsis    How to indicate it's been cut
	 *
	 * @return   {String}   The truncated string
	 */
	Blast.definePrototype('String', 'truncateHTML', function truncateHTML(length, word, ellipsis) {

		var tag_length = 0,
		    temp,
		    i;

		// Extract all the tags from the input string
		temp = this.substr(0, length).match(/<(\/?)(.*?)>/g);

		// Get the sum of the length of all the tags
		for (i = 0; i < temp.length; i++) {
			tag_length += temp[i].length;
		}

		// Truncate the input string
		temp = Blast.Bound.String.truncate(this, length + tag_length, word, ellipsis);

		// Now fix the html
		return Blast.Bound.String.fixHTML(temp);
	});

	/**
	 * Close open HTML tags
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 *
	 * @return   {String}   The fixed HTML
	 */
	Blast.definePrototype('String', 'fixHTML', function fixHTML() {

		var open_tags,
		    tag_name,
		    output,
		    input,
		    regex,
		    tags,
		    temp,
		    tag,
		    i;

		open_tags = [];

		input = this;
		tags = Blast.Bound.RegExp.execAll(/<(\/?)(.*?)>/ig, input);

		for (i = 0; i < tags.length; i++) {
			tag = tags[i];
			tag_name = tag[2].replace(/\//g, '');

			// If it's a close tag ...
			if (tag[1]) {
				temp = open_tags.lastIndexOf(tag_name);

				// See if this actually closes something present
				if (temp > -1) {
					open_tags.splice(temp, 1);
				} else {
					// Maybe remove this close tag?
				}
			} else {

				// Ignore self closing tags
				switch (tag_name) {

					case 'br':
					case 'li':
						break;

					default:
						open_tags.push(tag_name);

				}
			}
		}

		for (i = 0; i < open_tags.length; i++) {
			input += '</' + open_tags[i] + '>';
		}

		return input;
	});

	/**
	 * Replace every occurence of needle in the string without using regexes
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * Generate a fnv1-a hash
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'fowler', function fowler() {

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
			hash *= 16777619;
		}

		return hash;
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.2.0
	 *
	 * @param    {Object}   values
	 * @param    {Boolean}  remove_used   Remove used entries from values object
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'fillPlaceholders', function fillPlaceholders(values, remove_used) {

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
			params = Blast.Bound.String.placeholders(this);

			for (i = 0; i < params.length; i++) {

				regex = new RegExp('(:' + params[i] + ')(?:\\W|$)', 'g');
				value = Blast.Bound.Object.path(values, params[i]);

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
	Blast.definePrototype('String', 'assignments', function assignments() {

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
	 * @version  0.1.4
	 *
	 * @param    {Object}   values
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'assign', function assign(_values) {

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
			if (val != null) {
				result = result.replace(match[0], val)
			}
		}

		return result;
	});

	/**
	 * Remove dots from an acronym
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.5
	 * @version  0.1.5
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'normalizeAcronyms', function normalizeAcronyms() {

		var result = this,
		    ranges = [],
		    adjust = 0,
		    start,
		    last,
		    temp,
		    str,
		    end,
		    cur,
		    r,
		    i;

		str = this;
		r = /\W[A-Z](?=\.[A-Z]\.?)/g;

		// Look for all the accronyms first
		while (temp = r.exec(str)) {

			// Start a new accronym group
			if (start == null) {
				start = temp.index;
			} else {

				// If this match starts where the last ended, it's part of the same group
				if (temp.index != last) {
					// This accronym has ended!
					ranges.push([start, last]);

					// Create the new group
					start = temp.index;
				}
			}

			last = temp.index + temp[0].length;
		}

		// Save the last range
		if (start) {
			ranges.push([start, last]);
		}

		for (i = 0; i < ranges.length; i++) {

			// Skip the non-word in front of the first char
			start = (ranges[i][0] + 1) - adjust;

			// Get the end
			end = ranges[i][1] - adjust;

			// There will probably be another part behind this
			if (/[A-Z]/.exec(str[end+1])) {
				if (str[end+2] == '.') {
					end += 2;
				} else if (str[end+2] == ' ') {
					end += 1;
				}
			}

			// And maybe another at the end of the string
			if (str.length == end+2 && /[A-Z]/.exec(str[end+1])) {
				end += 2;
			}

			// Construct the new begining
			temp = result.slice(0, start) + result.slice(start, end).replace(/\./g, '');

			// Calculate the new adjustment
			adjust += end - temp.length-1;

			// If the next char is a point and a space, we can skip the point
			if (result[end] == '.') {

				if (result.length <= (end+1) || result[end+1] == ' ') {
					end += 1;
					adjust += 1;
				}
			}

			// construct the result
			result = temp + result.slice(end);
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