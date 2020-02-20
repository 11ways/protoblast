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

	if (str != null) {
		this.buffer = String(str);
	} else {
		this.buffer = '';
	}
});

/**
 * Get the current length
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {Number}
 */
SB.setProperty(function length() {
	return this.buffer.length;
});

/**
 * Clone the builder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {StringBuilder}
 */
SB.setMethod(function clone() {

	var result = new SB();
	result.buffer = this.buffer;

	return result;
});

/**
 * Append a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {String}   str
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
 * @param    {String}   str
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
 * @param    {Number}   start
 * @param    {Number}   end
 */
SB.setMethod('delete', function _delete(start, end) {

	this.buffer = this.buffer.slice(0, start) + this.buffer.slice(end);

	return this;
});

/**
 * Get the char at the given index
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Number}   index
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
 * @param    {Number}   start
 * @param    {Number}   end
 */
SB.setMethod(function cut(start, end) {

	var result = this.buffer.slice(start, end);

	this.delete(start, end);

	return result;
});

/**
 * Get the total string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {String}
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