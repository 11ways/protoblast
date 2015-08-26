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
module.exports = function BlastInflections(Blast, Collection) {

	var Bound = Blast.Bound,
	    InflectionJS,
	    S;

	InflectionJS = {

		// This is a list of nouns that use the same form for both singular and plural.
		// This list should remain entirely in lower case to correctly match Strings.
		uncountable_words: [
			'equipment', 'information', 'rice', 'money', 'species', 'series',
			'fish', 'sheep', 'moose', 'deer', 'news'
		],

		// These rules translate from the singular form of a noun to its plural form.
		plural_rules: [
			// do not replace if its already a plural word
			[ new RegExp( '(m)en$',      'gi' )],
			[ new RegExp( '(pe)ople$',   'gi' )],
			[ new RegExp( '(child)ren$', 'gi' )],
			[ new RegExp( '([ti])a$',    'gi' )],
			[ new RegExp( '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi' )],
			[ new RegExp( '(hive)s$',           'gi' )],
			[ new RegExp( '(tive)s$',           'gi' )],
			[ new RegExp( '(curve)s$',          'gi' )],
			[ new RegExp( '([lr])ves$',         'gi' )],
			[ new RegExp( '([^fo])ves$',        'gi' )],
			[ new RegExp( '([^aeiouy]|qu)ies$', 'gi' )],
			[ new RegExp( '(s)eries$',          'gi' )],
			[ new RegExp( '(m)ovies$',          'gi' )],
			[ new RegExp( '(x|ch|ss|sh)es$',    'gi' )],
			[ new RegExp( '([m|l])ice$',        'gi' )],
			[ new RegExp( '(bus)es$',           'gi' )],
			[ new RegExp( '(o)es$',             'gi' )],
			[ new RegExp( '(shoe)s$',           'gi' )],
			[ new RegExp( '(cris|ax|test)es$',  'gi' )],
			[ new RegExp( '(octop|vir)i$',      'gi' )],
			[ new RegExp( '(alias|status)es$',  'gi' )],
			[ new RegExp( '^(ox)en',            'gi' )],
			[ new RegExp( '(vert|ind)ices$',    'gi' )],
			[ new RegExp( '(matr)ices$',        'gi' )],
			[ new RegExp( '(quiz)zes$',         'gi' )],

			[ new RegExp( '(m)an$', 'gi' ),                 '$1en' ],
			[ new RegExp( '(pe)rson$', 'gi' ),              '$1ople' ],
			[ new RegExp( '(child)$', 'gi' ),               '$1ren' ],
			[ new RegExp( '^(ox)$', 'gi' ),                 '$1en' ],
			[ new RegExp( '(ax|test)is$', 'gi' ),           '$1es' ],
			[ new RegExp( '(octop|vir)us$', 'gi' ),         '$1i' ],
			[ new RegExp( '(alias|status)$', 'gi' ),        '$1es' ],
			[ new RegExp( '(bu)s$', 'gi' ),                 '$1ses' ],
			[ new RegExp( '(buffal|tomat|potat)o$', 'gi' ), '$1oes' ],
			[ new RegExp( '([ti])um$', 'gi' ),              '$1a' ],
			[ new RegExp( 'sis$', 'gi' ),                   'ses' ],
			[ new RegExp( '(?:([^f])fe|([lr])f)$', 'gi' ),  '$1$2ves' ],
			[ new RegExp( '(hive)$', 'gi' ),                '$1s' ],
			[ new RegExp( '([^aeiouy]|qu)y$', 'gi' ),       '$1ies' ],
			[ new RegExp( '(x|ch|ss|sh)$', 'gi' ),          '$1es' ],
			[ new RegExp( '(matr|vert|ind)ix|ex$', 'gi' ),  '$1ices' ],
			[ new RegExp( '([m|l])ouse$', 'gi' ),           '$1ice' ],
			[ new RegExp( '(quiz)$', 'gi' ),                '$1zes' ],

			[ new RegExp( 's$', 'gi' ), 's' ],
			[ new RegExp( '$', 'gi' ),  's' ]
		],

		// These rules translate from the plural form of a noun to its singular form.
		singular_rules: [
			// do not replace if its already a singular word
			[ new RegExp( '(m)an$',                 'gi' )],
			[ new RegExp( '(pe)rson$',              'gi' )],
			[ new RegExp( '(child)$',               'gi' )],
			[ new RegExp( '^(ox)$',                 'gi' )],
			[ new RegExp( '(ax|test)is$',           'gi' )],
			[ new RegExp( '(octop|vir)us$',         'gi' )],
			[ new RegExp( '(alias|status)$',        'gi' )],
			[ new RegExp( '(bu)s$',                 'gi' )],
			[ new RegExp( '(buffal|tomat|potat)o$', 'gi' )],
			[ new RegExp( '([ti])um$',              'gi' )],
			[ new RegExp( 'sis$',                   'gi' )],
			[ new RegExp( '(?:([^f])fe|([lr])f)$',  'gi' )],
			[ new RegExp( '(hive)$',                'gi' )],
			[ new RegExp( '([^aeiouy]|qu)y$',       'gi' )],
			[ new RegExp( '(x|ch|ss|sh)$',          'gi' )],
			[ new RegExp( '(matr|vert|ind)ix|ex$',  'gi' )],
			[ new RegExp( '([m|l])ouse$',           'gi' )],
			[ new RegExp( '(quiz)$',                'gi' )],

			// original rule
			[ new RegExp( '(m)en$', 'gi' ),                                                       '$1an' ],
			[ new RegExp( '(pe)ople$', 'gi' ),                                                    '$1rson' ],
			[ new RegExp( '(child)ren$', 'gi' ),                                                  '$1' ],
			[ new RegExp( '([ti])a$', 'gi' ),                                                     '$1um' ],
			[ new RegExp( '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi' ), '$1$2sis' ],
			[ new RegExp( '(hive)s$', 'gi' ),                                                     '$1' ],
			[ new RegExp( '(tive)s$', 'gi' ),                                                     '$1' ],
			[ new RegExp( '(curve)s$', 'gi' ),                                                    '$1' ],
			[ new RegExp( '([lr])ves$', 'gi' ),                                                   '$1f' ],
			[ new RegExp( '([^fo])ves$', 'gi' ),                                                  '$1fe' ],
			[ new RegExp( '(m)ovies$', 'gi' ),                                                    '$1ovie' ],
			[ new RegExp( '([^aeiouy]|qu)ies$', 'gi' ),                                           '$1y' ],
			[ new RegExp( '(s)eries$', 'gi' ),                                                    '$1eries' ],
			[ new RegExp( '(x|ch|ss|sh)es$', 'gi' ),                                              '$1' ],
			[ new RegExp( '([m|l])ice$', 'gi' ),                                                  '$1ouse' ],
			[ new RegExp( '(bus)es$', 'gi' ),                                                     '$1' ],
			[ new RegExp( '(o)es$', 'gi' ),                                                       '$1' ],
			[ new RegExp( '(shoe)s$', 'gi' ),                                                     '$1' ],
			[ new RegExp( '(cris|ax|test)es$', 'gi' ),                                            '$1is' ],
			[ new RegExp( '(octop|vir)i$', 'gi' ),                                                '$1us' ],
			[ new RegExp( '(alias|status)es$', 'gi' ),                                            '$1' ],
			[ new RegExp( '^(ox)en', 'gi' ),                                                      '$1' ],
			[ new RegExp( '(vert|ind)ices$', 'gi' ),                                              '$1ex' ],
			[ new RegExp( '(matr)ices$', 'gi' ),                                                  '$1ix' ],
			[ new RegExp( '(quiz)zes$', 'gi' ),                                                   '$1' ],
			[ new RegExp( 'ss$', 'gi' ),                                                          'ss' ],
			[ new RegExp( 's$', 'gi' ),                                                           '' ]
		],

		// This is a list of words that should not be capitalized for title case
		non_titlecased_words: [
			'and', 'or', 'nor', 'a', 'an', 'the', 'so', 'but', 'to', 'of', 'at',
			'by', 'from', 'into', 'on', 'onto', 'off', 'out', 'in', 'over',
			'with', 'for'
		],

		// These are regular expressions used for converting between String formats
		id_suffix: new RegExp('(_ids|_id)$', 'g'),
		underbar: new RegExp('_', 'g'),
		space_or_underbar: new RegExp('[\ _]', 'g'),
		uppercase: new RegExp('([A-Z])', 'g'),
		underbar_prefix: new RegExp('^_'),
		
		/*
			This is a helper method that applies rules based replacement to a String
			Signature:
				InflectionJS.apply_rules(str, rules, skip, override) == String
			Arguments:
				str - String - String to modify and return based on the passed rules
				rules - Array: [RegExp, String] - Regexp to match paired with String to use for replacement
				skip - Array: [String] - Strings to skip if they match
				override - String (optional) - String to return as though this method succeeded (used to conform to APIs)
			Returns:
				String - passed String modified by passed rules
			Examples:
				InflectionJS.apply_rules("cows", InflectionJs.singular_rules) === 'cow'
		*/
		apply_rules: function(str, rules, skip, override) {

			var ignore,
			    i,
			    j;

			if (override) {
				str = override;
			} else {

				ignore = (skip.indexOf(str.toLowerCase()) > -1);

				if (!ignore) {

					j = rules.length;

					for (i = 0; i < j; i++) {
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
		}
	};

	Blast.ready(function getBoundString() {
		S = Blast.Bound.String;
	});

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
	Blast.definePrototype('String', 'pluralize', function pluralize(plural) {
		return InflectionJS.apply_rules(
				this,
				InflectionJS.plural_rules,
				InflectionJS.uncountable_words,
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
	Blast.definePrototype('String', 'singularize', function singularize(singular) {
		return InflectionJS.apply_rules(
				this,
				InflectionJS.singular_rules,
				InflectionJS.uncountable_words,
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
	Blast.definePrototype('String', 'modelName', function modelName(postfix) {

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
	 * Turn a string into a model name, with controller postfix
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'modelClassName', function modelClassName() {

		var result;

		if (Collection.String.prototype.endsWith.call(this, 'Model')) {
			result = this.slice(0, this.length - 5);
		} else {
			result = this;
		}

		result = Collection.String.prototype.modelName.call(result);

		return result + 'Model';
	});

	/**
	 * Turn a string into a controller name
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.4
	 *
	 * @param    {String}   postfix   The string to postfix to the name
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'controllerName', function controllerName(postfix) {

		var str = this,
		    underscores,
		    capitals,
		    lower;

		lower = str.toLowerCase();

		if (lower === 'app') return 'App';
		else if (lower === 'static') return 'Static';

		if (postfix === true) postfix = 'Controller';

		capitals = !!S.capitals(str);
		underscores = !!(str.indexOf('_') > -1);

		// If there already are capitals, underscore the string
		if (capitals) {
			str = S.underscore(str);
			underscores = true;
		}

		// If there still are underscores, or there are no capitals,
		// we need to camelize the string
		if (underscores || !capitals) {
			str = S.camelize(str);
		}

		if (S.endsWith(str, 'Controller')) {
			str = str.slice(0, str.length-10);
		}

		// Do not pluralize 'static'
		if (!S.endsWith(str, 'Static')) {
			str = S.pluralize(str);
		}

		// Append the postfix
		if (postfix) {
			str = S.postfix(str, postfix);
		}

		return str;
	});

	/**
	 * Turn a string into a controller name, with controller postfix
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'controllerClassName', function controllerClassName() {

		var result;

		if (Collection.String.prototype.endsWith.call(this, 'Controller')) {
			result = this.slice(0, this.length - 10);
		} else {
			result = this;
		}

		result = Collection.String.prototype.controllerName.call(result);

		return result + 'Controller';
	});

	/**
	 * Camelize a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Boolean}  lowFirstLetter   The first char is lowercased if true
	 *
	 * @return   {String}   Lower case underscored words will be returned in camel
	 *                      case. Additionally '/' is translated to '::'
	 */
	Blast.definePrototype('String', 'camelize', function camelize(lowFirstLetter) {

		var str = this,
		    str_path,
		    str_arr,
		    initX,
		    i,
		    x;

		// If there are capitals, underscore this first
		if (S.capitals(str)) str = S.underscore(str);

		str_path = str.split('/');

		for (i = 0; i < str_path.length; i++) {

			str_arr = str_path[i].split('_');
			initX = ((lowFirstLetter && i + 1 === str_path.length) ? (1) : (0));

			for (x = initX; x < str_arr.length; x++) {
				str_arr[x] = str_arr[x].charAt(0).toUpperCase() + str_arr[x].substring(1);
			}

			str_path[i] = str_arr.join('');
		}

		str = str_path.join('::');

		return str;
	});

	/**
	 * Underscore a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'underscore', function underscore() {
		
		var str = this,
		    str_path,
		    i;

		str_path = str.split('::');

		for (i = 0; i < str_path.length; i++) {
			str_path[i] = str_path[i].replace(InflectionJS.uppercase, '_$1');
			str_path[i] = str_path[i].replace(InflectionJS.underbar_prefix, '');
		}

		str = str_path.join('/').toLowerCase();

		// Replace strings with underscores
		str = str.replace(/ /g, '_');

		return str;
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
	Blast.definePrototype('String', 'humanize', function humanize(lowFirstLetter) {

		var str = S.underscore(this),
		    ori = str;

		// Remove the trailing _id suffix
		str = str.replace(InflectionJS.id_suffix, '');

		// If the string is empty now, put it back
		if (!str) {
			str = ori;
		}

		str = str.replace(InflectionJS.underbar, ' ').trim();

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
	Blast.definePrototype('String', 'capitalize', function capitalize() {

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
	Blast.definePrototype('String', 'dasherize', function dasherize() {
		var str = this;
		str = str.replace(InflectionJS.space_or_underbar, '-');
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
	Blast.definePrototype('String', 'titleize', function titleize(alwaysCapitalize) {

		// Underscore the string
		var str = S.underscore(this),
		    str_arr,
		    d,
		    i,
		    x;

		// Turn the underscores into spaces
		str = str.replace(InflectionJS.underbar, ' ');

		// Split the string
		str_arr = str.split(' ');

		for (x = 0; x < str_arr.length; x++) {

			d = str_arr[x].split('-');
			
			for (i = 0; i < d.length; i++) {
				if (alwaysCapitalize === true || InflectionJS.non_titlecased_words.indexOf(d[i].toLowerCase()) < 0) {
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
	 * Removes module names leaving only class names (Ruby style)
	 * Example: "Message::Bus::Properties".demodulize() == "Properties"
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('String', 'demodulize', function demodulize() {

		var str     = this,
		    str_arr = str.split('::');

		str = str_arr[str_arr.length - 1];

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
	Blast.definePrototype('String', 'tableize', function tableize() {
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
	Blast.definePrototype('String', 'classify', function classify() {
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
	Blast.definePrototype('String', 'foreign_key', function foreign_key(dropIdUbar) {
		var str = S.demodulize(this);
		str = S.underscore(str);
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
	Blast.definePrototype('String', 'ordinalize', function ordinalize() {

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

	/**
	 * De-pluginify a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'deplugin', function deplugin(str) {

		var s   = this.split('.'),
		    any = false;
		    obj = {plugin: '', item: '', model: '', field: '', name: ''};

		if (typeof s[1] != 'undefined') {
			obj.plugin = obj.model = obj.name = s[0];
			obj.item = obj.field = s[1];
		} else {
			obj.item = obj.field = s[0];
		}

		return obj;
	});

};