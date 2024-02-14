/**
 * Copyright (c) 2010 Ryan Schuft (ryan.schuft@gmail.com)
 * Modified by Jelle De Loecker for Protoblast (2013)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
const Rxi = (pattern) => RegExp(pattern, 'gi'),
      Rxg = (pattern) => RegExp(pattern, 'g'),
      Rxia = (pattern) => [Rxi(pattern)],
      Rxiar = (pattern, replacement) => [Rxi(pattern), '$1' + (replacement || '')];

// This is a list of nouns that use the same form for both singular and plural.
// This list should remain entirely in lower case to correctly match Strings.
const UNCOUNTABLE_WORDS = [
	'equipment',
	'information',
	'rice',
	'money',
	'species',
	'series',
	'fish',
	'sheep',
	'moose',
	'deer',
	'news',
];

// These rules translate from the singular form of a noun to its plural form.
const PLURAL_RULES = [
	// do not replace if its already a plural word
	Rxia('(m)en$'),
	Rxia('(pe)ople$'),
	Rxia('(child)ren$'),
	Rxia('([ti])a$'),
	Rxia('((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$'),
	Rxia('(hive)s$'),
	Rxia('(tive)s$'),
	Rxia('(curve)s$'),
	Rxia('([lr])ves$'),
	Rxia('([^fo])ves$'),
	Rxia('([^aeiouy]|qu)ies$'),
	Rxia('(s)eries$'),
	Rxia('(m)ovies$'),
	Rxia('(x|ch|ss|sh)es$'),
	Rxia('([m|l])ice$'),
	Rxia('(bus)es$'),
	Rxia('(o)es$'),
	Rxia('(shoe)s$'),
	Rxia('(cris|ax|test)es$'),
	Rxia('(octop|vir)i$'),
	Rxia('(alias|status)es$'),
	Rxia('^(ox)en'),
	Rxia('(vert|ind)ices$'),
	Rxia('(matr)ices$'),
	Rxia('(quiz)zes$'),

	Rxiar('(m)an$', 'en'),
	Rxiar('(pe)rson$', 'ople'),
	Rxiar('(child)$', 'ren'),
	Rxiar('^(ox)$', 'en'),
	Rxiar('(ax|test)is$', 'es'),
	Rxiar('(octop|vir)us$', 'i'),
	Rxiar('(alias|status)$', 'es'),
	Rxiar('(bu)s$', 'ses'),
	Rxiar('(buffal|tomat|potat)o$', 'oes'),
	Rxiar('([ti])um$', 'a'),
	[Rxi('sis$'), 'ses'],
	Rxiar('(?:([^f])fe|([lr])f)$', '$2ves'),
	Rxiar('(hive)$', 's'),
	Rxiar('([^aeiouy]|qu)y$', 'ies'),
	Rxiar('(x|ch|ss|sh)$', 'es'),
	Rxiar('(matr|vert|ind)ix|ex$', 'ices'),
	Rxiar('([m|l])ouse$', 'ice'),
	Rxiar('(quiz)$', 'zes'),
	Rxiar('(criter)ion$', 'ia'),
	[Rxi('s$'), 's'],
	[Rxi('$'), 's']
];

// These rules translate from the plural form of a noun to its singular form.
const SINGULAR_RULES = [
	// do not replace if its already a singular word
	Rxia('(m)an$'),
	Rxia('(pe)rson$'),
	Rxia('(child)$'),
	Rxia('^(ox)$'),
	Rxia('(ax|test)is$'),
	Rxia('(octop|vir)us$'),
	Rxia('(alias|status)$'),
	Rxia('(bu)s$'),
	Rxia('(buffal|tomat|potat)o$'),
	Rxia('([ti])um$'),
	Rxia('sis$'),
	Rxia('(?:([^f])fe|([lr])f)$'),
	Rxia('(hive)$'),
	Rxia('([^aeiouy]|qu)y$'),
	Rxia('(x|ch|ss|sh)$'),
	Rxia('(matr|vert|ind)ix|ex$'),
	Rxia('([m|l])ouse$'),
	Rxia('(quiz)$'),

	// original rule
	Rxiar('(m)en$', 'an'),
	Rxiar('(pe)ople$', 'rson'),
	Rxiar('(child)ren$'),
	Rxiar('(criteri)a$', 'on'),
	Rxiar('([ti])a$', 'um'),
	Rxiar('((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$', '$2sis'),
	Rxiar('(hive)s$'),
	Rxiar('(tive)s$'),
	Rxiar('(curve)s$'),
	Rxiar('([lr])ves$', 'f'),
	Rxiar('([^fo])ves$', 'fe'),
	Rxiar('(m)ovies$', 'ovie'),
	Rxiar('([^aeiouy]|qu)ies$', 'y'),
	Rxiar('(s)eries$', 'eries'),
	Rxiar('(x|ch|ss|sh)es$'),
	Rxiar('([m|l])ice$', 'ouse'),
	Rxiar('(bus)es$'),
	Rxiar('(o)es$'),
	Rxiar('(shoe)s$'),
	Rxiar('(cris|ax|test)es$', 'is'),
	Rxiar('(octop|vir)i$', 'us'),
	Rxiar('(alias|status)es$'),
	Rxiar('^(ox)en'),
	Rxiar('(vert|ind)ices$', 'ex'),
	Rxiar('(matr)ices$', 'ix'),
	Rxiar('(quiz)zes$'),
	[Rxi('ss$'), 'ss'],
	[Rxi('s$'), ''],
];

// This is a list of words that should not be capitalized for title case
const NON_TITLECASED_WORDS = [
	'and',
	'or',
	'nor',
	'a',
	'an',
	'the',
	'so',
	'but',
	'to',
	'of',
	'at',
	'by',
	'from',
	'into',
	'on',
	'onto',
	'off',
	'out',
	'in',
	'over',
	'with',
	'for',
];

// These are regular expressions used for converting between String formats
const ID_SUFFIX             = Rxg('(_ids|_id)$'),
      UNDERBAR              = Rxg('_'),
      SPACE_OR_UNDERBAR     = Rxg('[\ _]');

/*
	This is a helper method that applies rules based replacement to a String
	Signature:
		applyRules(str, rules, skip, override) == String
	Arguments:
		str - String - String to modify and return based on the passed rules
		rules - Array: [RegExp, String] - Regexp to match paired with String to use for replacement
		skip - Array: [String] - Strings to skip if they match
		override - String (optional) - String to return as though this method succeeded (used to conform to APIs)
	Returns:
		String - passed String modified by passed rules
	Examples:
		applyRules("cows", SINGULAR_RULES) === 'cow'
*/
const applyRules = (str, rules, skip, override) => {

	if (override) {
		str = override;
	} else {

		let ignore = skip.includes(str.toLowerCase());

		if (!ignore) {

			let i = 0,
			    j = rules.length;

			for (; i < j; i++) {
				if (str.match(rules[i][0])){
					if (rules[i][1] !== undefined) {
						str = str.replace(rules[i][0], rules[i][1]);
					}
					break;
				}
			}
		}
	}

	// Make sure we return a useable string
	return '' + str;
};

let S;

Blast.once('pre-extra-files', function getBoundString() {
	S = Blast.Bound.String;
});

const CHAR_UPPER_A = 0x41
const CHAR_LOWER_A = 0x61
const CHAR_UPPER_Z = 0x5a
const CHAR_LOWER_Z = 0x7a
const CHAR_0 = 0x30
const CHAR_9 = 0x39
const CHAR_MINUS = 0x2d;
const CHAR_SPACE = 0x20;
const CHAR_UNDERSCORE = 0x5f;

/**
 * Is this an upper char number?
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {Number}   char_code
 */
function isUpper(char_code) {
	return CHAR_UPPER_A <= char_code && char_code <= CHAR_UPPER_Z;
}

/**
 * Is this a lower char number?
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {Number}   char_code
 */
function isLower(char_code) {
	return CHAR_LOWER_A <= char_code && char_code <= CHAR_LOWER_Z;
}

/**
 * Is this a digit char number?
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {Number}   char_code
 */
function isDigit(char_code) {
	return CHAR_0 <= char_code && char_code <= CHAR_9;
}

/**
 * Convert the charcode to upper
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {Number}   char_code
 */
function toUpper(char_code) {
	return char_code - 0x20;
}

/**
 * Convert the charcode to upper
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {Number}   char_code
 */
function toLower(char_code) {
	return char_code + 0x20;
}

/**
 * Define something on the string prototype
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.9.0
 *
 * @param    {Function}   fnc
 */
const defString = Blast.createProtoDefiner('String');

/**
 * Pluralize a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {String}   plural   Overrides normal output with said String
 *
 * @return   {String}   Singular English language nouns are returned in plural form
 */
defString(function pluralize(plural) {
	return applyRules(
			this,
			PLURAL_RULES,
			UNCOUNTABLE_WORDS,
			plural
	);
});

/**
 * Singularize a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   singular   Overrides normal output with said String
 *
 * @return   {String}   Plural English language nouns are returned in singular form
 */
defString(function singularize(singular) {
	return applyRules(
			this,
			SINGULAR_RULES,
			UNCOUNTABLE_WORDS,
			singular
	);
});

/**
 * Turn a string into a model name
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.9
 *
 * @param    {String}   postfix   The string to postfix to the name
 *
 * @return   {String}
 */
defString(function modelName(postfix) {

	var str = this,
	    underscores,
	    capitals;

	if (str.toLowerCase() == 'app') return 'App';
	if (postfix === true) postfix = 'Model';

	capitals = !!S.capitals(str);

	// If there already are capitals, underscore the string
	if (capitals) {
		str = S.underscore(str);
		underscores = true;
	} else {
		underscores = !!(str.indexOf('_') > -1);
	}

	// If there still are underscores, or there are no capitals,
	// we need to camelize the string
	if (underscores || !capitals) {
		str = S.camelize(str);
	}

	if (S.endsWith(str, 'Model')) {
		str = str.slice(0, str.length-5);
	}

	str = S.singularize(str);

	// Append the postfix
	if (postfix) {
		str = S.postfix(str, postfix);
	}

	return str;
});

/**
 * Camelize a string
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.7.26
 *
 * @param    {Boolean}  lower_first_letter   The first char is lowercased if true
 *
 * @return   {String}
 */
defString(function camelize(lower_first_letter) {

	let first_char = this.charCodeAt(0),
	    char_code,
	    changed = false,
	    length = this.length,
	    i;

	if (lower_first_letter) {
		if (isUpper(first_char)) {
			changed = true;
			first_char = toLower(first_char);
		}
	} else {
		if (isLower(first_char)) {
			changed = true;
			first_char = toUpper(first_char);
		}
	}

	const transformed = [first_char];

	for (i = 1; i < length; i++) {
		char_code = this.charCodeAt(i);

		if (char_code === CHAR_UNDERSCORE || char_code === CHAR_SPACE || char_code === CHAR_MINUS) {
			changed = true;
			char_code = this.charCodeAt(++i);

			if (isLower(char_code)) {
				char_code = toUpper(char_code);
			}
		}

		transformed.push(char_code);
	}

	if (!changed) {
		return this;
	}

	return String.fromCharCode(...transformed);
});

/**
 * Turn a camelized string into something else
 *
 * @author   Jacob Gillespie    <jacobwgillespie@gmail.com>
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {String}  separator
 *
 * @return   {String}
 */
defString(function decamelize(separator) {

	let first_char = this.charCodeAt(0),
	    char_code,
	    changed = false,
	    length = this.length,
	    i;
	
	let separator_code;

	if (separator) {
		separator_code = separator.charCodeAt(0);
	}

	if (separator_code == null) {
		separator_code = CHAR_UNDERSCORE;
	}

	if (isUpper(first_char)) {
		changed = true;
		first_char = toLower(first_char);
	}

	const transformed = [first_char];

	for (i = 1; i < length; i++) {
		char_code = this.charCodeAt(i);

		if (isUpper(char_code)) {
			changed = true;
			transformed.push(separator_code);
			char_code = toLower(char_code);
		}

		transformed.push(char_code);
	}

	if (!changed) {
		return this;
	}

	return String.fromCharCode(...transformed);
});

/**
 * Underscore a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.7.0
 *
 * @return   {String}
 */
defString(function underscore() {

	var previous_underscore = true, // Act as if it already starts with an underscore
	    result = '',
	    length = this.length,
	    code,
	    char,
	    i;

	for (i = 0; i < length; i++) {
		char = this[i];
		code = char.charCodeAt();

		// 95 = underscore
		if (code == 95) {
			if (!previous_underscore) {
				result += char;
				previous_underscore = true;
			}

			continue;
		}

		/*
			A whitespace (\s) in a regular expression matches any one of the
			characters: space, formfeed (\f), newline (\n), return (\r),
			tab (\t), vertical tab (\v), non-breaking space (\xA0),
			as well as the Unicode characters \u00A0 \u2028 \u2029.

			\t     =  9
			\n     = 10
			\v     = 11
			\f     = 12
			\r     = 13
			       = 32
			\xA0   = 160
			\u2028 = 8232
			\u2029 = 8233

			// We also add dashed
			-      = 45
		*/

		if ((code >= 9 && code <= 13) || code == 32 || code == 45 || code == 16 || code == 8232 || code == 8233) {
			if (!previous_underscore) {
				result += '_';
				previous_underscore = true;
			}

			continue;
		}

		// Uppercase?
		if (code >= 65 && code <= 90) {
			if (previous_underscore) {
				// Do nothing
			} else {
				result += '_';
			}

			result += char.toLowerCase();
		} else {
			result += char;
		}

		previous_underscore = false;

	}

	return result;
});

/**
 * Make a string readable for humans
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Boolean}  lowFirstLetter   The first char is lowercased if true
 *
 * @return   {String}
 */
defString(function humanize(lowFirstLetter) {

	var str = S.underscore(this),
	    ori = str;

	// Remove the trailing _id suffix
	str = str.replace(ID_SUFFIX, '');

	// If the string is empty now, put it back
	if (!str) {
		str = ori;
	}

	str = str.replace(UNDERBAR, ' ').trim();

	if (!lowFirstLetter) {
		str = S.capitalize(str);
	}

	return str;
});

/**
 * Return the string with only the first letter being uppercased
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {String}
 */
defString(function capitalize() {

	// Lowercase the complete string
	var str = this.toLowerCase();

	// Only uppercase the first char
	str = str.substring(0, 1).toUpperCase() + str.substring(1);

	return str;
});

/**
 * Replace spaces or underscores with dashes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {String}
 */
defString(function dasherize() {
	var str = this;
	str = str.replace(SPACE_OR_UNDERBAR, '-');
	return str;
});

/**
 * Capitalizes words as you would for a book title
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.6
 *
 * @param    {Boolean}   alwaysCapitalize
 *
 * @return   {String}
 */
defString(function titleize(alwaysCapitalize) {

	// Underscore the string
	var str = S.underscore(this),
	    str_arr,
	    d,
	    i,
	    x;

	// Turn the underscores into spaces
	str = str.replace(UNDERBAR, ' ');

	// Split the string
	str_arr = str.split(' ');

	for (x = 0; x < str_arr.length; x++) {

		d = str_arr[x].split('-');
		
		for (i = 0; i < d.length; i++) {
			if (alwaysCapitalize === true || NON_TITLECASED_WORDS.indexOf(d[i].toLowerCase()) < 0) {
				d[i] = S.capitalize(d[i]);
			}
		}

		str_arr[x] = d.join('-');
	}

	str = str_arr.join(' ');
	str = str.substring(0, 1).toUpperCase() + str.substring(1);

	return str;
});

/**
 * Renders strings into their underscored plural form
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {String}
 */
defString(function tableize() {
	var str = S.underscore(this);
	str = S.pluralize(str);
	return str;
});

/**
 * Turn strings into their camel cased singular form
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {String}
 */
defString(function classify() {
	var str = S.camelize(this);
	str = S.singularize(str);
	return str;
});

/**
 * Turn a strings into an underscored foreign key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Boolean}   dropIdUbar   Remove the underscore before the id postfix
 *
 * @return   {String}
 */
defString(function foreign_key(dropIdUbar) {
	let str = S.underscore(this);
	str += ((dropIdUbar) ? ('') : ('_')) + 'id';
	return str;
});

/**
 * Renders all found numbers their sequence like "22nd"
 * Example: "the 1 pitch".ordinalize() == "the 1st pitch"
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @return   {String}
 */
defString(function ordinalize() {

	var str     = this,
	    str_arr = str.split(' '),
	    suf,
	    ltd,
	    ld,
	    x,
	    i;

	for (x = 0; x < str_arr.length; x++) {

		i = parseInt(str_arr[x]);

		if (!isNaN(i)) {

			ltd = str_arr[x].substring(str_arr[x].length - 2);
			ld = str_arr[x].substring(str_arr[x].length - 1);

			suf = 'th';

			if (ltd != '11' && ltd != '12' && ltd != '13') {
				if (ld === '1') {
					suf = 'st';
				} else if (ld === '2') {
					suf = 'nd';
				} else if (ld === '3') {
					suf = 'rd';
				}
			}

			str_arr[x] += suf;
		}
	}

	str = str_arr.join(' ');

	return str;
});