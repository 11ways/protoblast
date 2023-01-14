const defStat = Blast.createStaticDefiner('RegExp'),
      defProto = Blast.createProtoDefiner('RegExp');

/**
 * Determine if a variable is a date object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 */
defStat(function isRegExp(variable) {
	return Object.prototype.toString.call(variable) === '[object RegExp]';
});

/**
 * Escape a string so it can be used inside a regular expression.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.7.0
 *
 * @param    {String}   str
 *
 * @return   {String}
 */
defStat(function escape(str) {
	return String(str).replace(/([.\\+*?\[\^\]$(){}=!<>|:\-\/])/g, '\\$1');
});

/**
 * Create a regular expression from a string.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.6.5
 *
 * @param    {String}   pattern
 * @param    {String}   flags
 *
 * @return   {RegExp}
 */
defStat(function interpret(pattern, flags) {

	var split;

	if (pattern && typeof pattern == 'object') {
		pattern = String(pattern);
	}

	split = pattern.match(/^\/(.*?)\/([gimuy]*)$/);

	if (flags == null) {
		flags = undefined;
	}

	if (split) {

		if (flags == null) {
			flags = split[2] || undefined;
		}

		// The input contains modifiers, use them
		return new RegExp(split[1], flags);
	} else {
		// There are no delimiters
		return new RegExp(pattern, flags);
	}
});

/**
 * Interpret a wildcard string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {String}   str
 * @param    {String}   flags
 *
 * @return   {RegExp}
 */
defStat(function interpretWildcard(str, flags) {
	var pattern = Collection.RegExp.escape(str).replace(/\\\*/g, '.*').replace(/\\\?/g, '.');

	if (!flags) {
		flags = 'g';
	} else if (flags.indexOf('g') == -1) {
		flags += 'g';
	}

	return Collection.RegExp.interpret(pattern, flags);
});

/**
 * Combine regular expressions together.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @return   {RegExp}
 */
defStat(function combine() {

	var source,
	    arg,
	    i;

	for (i = 0; i < arguments.length; i++) {

		arg = arguments[i];

		// Make sure the argument is a valid regex
		if (typeof arg == 'string') {
			arg = Collection.RegExp.interpret(arg);
		}

		if (!arg || arg.constructor.name !== 'RegExp') {
			continue;
		}

		if (!source) {
			source = '(';
		} else {
			source += '|';
		}

		source += '(?:' + Collection.RegExp.prototype.getPattern.call(arg) + ')';
	}

	source += ')';

	return new RegExp(source);
});

/**
 * Calculate the bytesize of a regular expression
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {Number}
 */
defProto(Blast.sizeofSymbol, function calculateSizeof() {

	var result = 16;

	if (this.source) {
		result += this.source.length * 2;
	}

	return result;
});

/**
 * Return the pattern.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {String}
 */
defProto(function getPattern() {

	var source = this.toString(),
	    split = source.match(/^\/(.*?)\/([gim]*)$/);

	if (split) {
		// The input contains modifiers, return only the pattern
		return split[1];
	} else {
		// There are no delimiters
		return source;
	}
});

/**
 * Return the flags.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {String}
 */
defProto(function getFlags() {

	var source = this.toString(),
	    split = source.match(/^\/(.*?)\/([gim]*)$/);

	if (split) {
		// The input contains modifiers, return only the pattern
		return split[2];
	} else {
		// There are no flags
		return '';
	}
});

/**
 * Execute and return all the matches
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.1.3
 *
 * @return   {Array}
 */
defProto(function execAll(str) {

	var result = [],
	    match;

	// Look for 'g' flag!

	do {
		match = this.exec(str);

		if (match) {
			result.push(match);
		}
	} while (match);

	return result;
});