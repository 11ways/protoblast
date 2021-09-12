const Str = Bound.String;

/**
 * The StringBuilder class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.13
 *
 * @param    {string}   str
 */
var SB = Fn.inherits(null, 'Develry', function StringBuilder(str) {

	if (str != null) {
		this.buffer = String(str);
	} else {
		this.buffer = '';
	}

	// Strings can be moved into limbo instead of being deleted
	this.limbo = '';
});

/**
 * Get the current length
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {number}
 */
SB.setProperty(function length() {
	return this.buffer.length;
});

/**
 * Clone the builder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.13
 *
 * @return   {StringBuilder}
 */
SB.setMethod(function clone() {

	var result = new SB();
	result.buffer = this.buffer;
	result.limbo = this.limbo;

	return result;
});

/**
 * Append a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {string}   str
 */
SB.setMethod(function append(str) {

	this.buffer += str;

	return this;
});

/**
 * Append a newline
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
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
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {string}   str
 */
SB.setMethod(function prepend(str) {

	this.buffer = str + this.buffer;

	return this;
});

/**
 * Deletes the string from the specified begin_index to end_index
 * (End index is exclusive)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   start
 * @param    {number}   end
 *
 * @return   {StringBuilder}
 */
SB.setMethod('delete', function _delete(start, end) {

	if (start != end) {
		this.buffer = this.buffer.slice(0, start) + this.buffer.slice(end);
	}

	return this;
});

/**
 * Get the char at the given index
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   index
 *
 * @return   {string}
 */
SB.setMethod(function charAt(index) {
	return this.buffer[index];
});

/**
 * Cut and return the string from the specified begin_index to end_index
 * (End index is exclusive)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   start
 * @param    {number}   end
 *
 * @return   {string}
 */
SB.setMethod(function cut(start, end) {

	if (start == end) {
		return '';
	}

	let result = this.buffer.slice(start, end);

	this.delete(start, end);

	return result;
});

/**
 * Move a piece of the string to limbo
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @param    {number}   start
 * @param    {number}   end
 *
 * @return   {string}
 */
SB.setMethod(function banish(start, end) {

	let result = this.cut(start, end);

	if (result !== '') {
		this.limbo += result;
	}

	return result;
});

/**
 * Reverse the string we're working with
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.13
 *
 * @return   {StringBuilder}
 */
SB.setMethod(function reverse() {
	this.buffer = Str.reverse(this.buffer);

	if (this.limbo) {
		this.limbo = Str.reverse(this.limbo);
	}

	return this;
});

/**
 * Get the total string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {string}
 */
SB.setMethod(function toString() {
	return this.buffer;
});

/**
 * Clear the builder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 */
SB.setMethod(function clear() {

	this.buffer = '';

	return this;
});