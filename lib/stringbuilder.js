var LENGTH = Symbol('LENGTH'),
    BUFFER = Symbol('BUFFER');

/**
 * The StringBuilder class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {String}   str
 */
var SB = Collection.Function.inherits(null, 'Develry', function StringBuilder(str) {

	this[BUFFER] = [];
	this[LENGTH] = 0;

	if (str != null) {
		this.append(str);
	}
});

/**
 * Get the current length
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {Number}
 */
SB.setProperty(function length() {
	return this[LENGTH];
});

/**
 * Clone the builder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {StringBuilder}
 */
SB.setMethod(function clone() {

	var result = new SB();
	result[BUFFER] = this[BUFFER].slice(0);
	result[LENGTH] = this[LENGTH];

	return result;
});

/**
 * Append a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   str
 */
SB.setMethod(function append(str) {

	if (arguments.length > 0) {
		str = String(str);
	}

	this[BUFFER].push(str);
	this[LENGTH] += str.length;

	return this;
});

/**
 * Append a newline
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
SB.setMethod(function appendLine(str) {

	if (str != null && str != '') {
		this.append(str);
	}

	return this.append('\n');
});

/**
 * Prepend a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   str
 */
SB.setMethod(function prepend(str) {

	if (arguments.length > 0) {
		str = String(str);
	}

	this[BUFFER].unshift(str);
	this[LENGTH] += str.length;

	return this;
});

/**
 * Deletes the string from the specified begin_index to end_index
 * (End index is exclusive)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Number}   start
 * @param    {Number}   end
 */
SB.setMethod('delete', function _delete(start, end) {
	this.cut(start, end);
	return this;
});

/**
 * Cut and return the string from the specified begin_index to end_index
 * (End index is exclusive)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Number}   start
 * @param    {Number}   end
 */
SB.setMethod(function cut(start, end) {

	var line_end = -1,
	    buffer = this[BUFFER],
	    line_nr,
	    result = '',
	    index = -1,
	    line,
	    len,
	    lb,
	    le,
	    i;

	for (line_nr = 0; line_nr < buffer.length; line_nr++) {
		line = buffer[line_nr];
		len = line.length;

		if (len == 0) {
			continue;
		}

		line_end += line.length;

		if (start > line_end) {
			index = line_end;
			continue;
		}

		lb = null;
		le = null;

		for (i = 0; i < line.length; i++) {
			index++;

			if (index === start) {
				lb = i;
				result += line[i];
			}

			if (index >= end) {
				if (index == end) {
					le = i;
				}
			} else if (index > start) {
				result += line[i];
			}

			if (le != null) {
				buffer[line_nr] = line.slice(0, lb) + line.slice(le);
			}

			// Reached end of the line
			if (i == (line.length - 1)) {

				if (le != null) {
					buffer[line_nr] = line.slice(0, lb) + line.slice(le);
				} else {
					buffer[line_nr] = line.slice(0, lb);
				}

				start = index + 1;

				if (start >= end) {
					le = true;
					break;
				}
			}

			if (le != null) {
				break;
			}
		}

		if (le != null && index >= end) {
			break;
		}
	}

	return result;
});

/**
 * Get the total string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {String}
 */
SB.setMethod(function toString() {
	return this[BUFFER].join('');
});

/**
 * Clear the builder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
SB.setMethod(function clear() {

	this[LENGTH] = 0;
	this[BUFFER].length = 0;

	return this;
});