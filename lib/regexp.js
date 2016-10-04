module.exports = function BlastRegExp(Blast, Collection) {

	/**
	 * Escape a string so it can be used inside a regular expression.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}   str
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('RegExp', 'escape', function escape(str) {
		return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	});

	/**
	 * Create a regular expression from a string.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.3.2
	 *
	 * @param    {String}   pattern
	 * @param    {String}   flags
	 *
	 * @return   {RegExp}
	 */
	Blast.defineStatic('RegExp', 'interpret', function interpret(pattern, flags) {

		var split = pattern.match(/^\/(.*?)\/([gim]*)$/);

		if (split) {
			// The input contains modifiers, use them
			return new RegExp(split[1], flags || split[2]);
		} else {
			// There are no delimiters
			return new RegExp(pattern, flags);
		}
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
	Blast.defineStatic('RegExp', 'combine', function combine() {

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
	 * Return a string representing the source code of the regular expression.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('RegExp', 'toSource', function toSource() {
		return this.toString();
	}, true);

	/**
	 * Return the pattern.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('RegExp', 'getPattern', function getPattern() {

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
	Blast.definePrototype('RegExp', 'getFlags', function getFlags() {

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
	Blast.definePrototype('RegExp', 'execAll', function execAll(str) {

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

};