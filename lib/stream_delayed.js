/**
 * The Delayed stream class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.8.4
 */
const Delayed = Fn.inherits('Stream', function Delayed(source, options) {
	this._buffered_events = [];

	if (options) {
		Object.assign(this, options);
	}

	this.setSource(source);
});

/**
 * Add several properties to the prototype
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setProperty({
	source                  : null,
	data_size               : 0,
	max_data_size           : 1024 * 1024,
	pause_stream            : true,
	_max_data_size_exceeded : false,
	_released               : false
});

/**
 * Is this stream readable?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @type     {boolean}
 */
Delayed.setProperty(function readable() {
	return this.source.readable;
});

/**
 * Set the source stream
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.9.6
 *
 * @param    {Stream}   source
 */
Delayed.setMethod(function setSource(source) {

	if (this.source != null) {
		throw new Error('This DelayedStream already has a source');
	}

	this.source = source;

	const that = this;

	let real_emit = source.emit;

	source.emit = function emit() {
		let args = Array.prototype.slice.apply(arguments);
		that._handleEmit(args);
		return real_emit.apply(source, args);
	}

	source.on('error', (err) => {
		this.emit('error', err);
	});

	if (this.pause_stream) {
		source.pause();
	}
});

/**
 * Set the encoding
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function setEncoding() {
	return this.source.setEncoding.apply(this.source, arguments);
});

/**
 * Resume the stream
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function resume() {

	if (!this._released) {
		this.release();
	}

	if (typeof this.source.resume == 'function') {
		this.source.resume();
	}
});

/**
 * Pause the stream
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function pause() {
	this.source.pause();
});

/**
 * Emits and clears all events that have been buffered up so far.
 * This does not resume the underlaying source,
 * use #resume() instead
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function release() {

	var event_args;

	this._released = true;

	while (this._buffered_events.length) {
		event_args = this._buffered_events.shift();
		this.emit.apply(this, event_args);
	}
});

/**
 * Pipe this stream into another stream
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function pipe() {
	var result = pipe.super.apply(this, arguments);
	this.resume();
	return result;
});

/**
 * Handle emits coming from the source stream
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function _handleEmit(args) {

	if (this._released) {
		this.emit.apply(this, args);
		return;
	}

	if (args[0] === 'data') {
		this.data_size += args[1].length;
		this._checkIfMaxDataSizeExceeded();
	}

	this._buffered_events.push(args);
});

/**
 * Check if the max data size has been exceeded
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Delayed.setMethod(function _checkIfMaxDataSizeExceeded() {

	if (this._max_data_size_exceeded) {
		return;
	}

	if (this.data_size <= this.max_data_size) {
		return;
	}

	this._max_data_size_exceeded = true;

	let message = 'Stream.Delayed#max_data_size of ' + this.max_data_size + ' bytes exceeded.'

	this.emit('error', new Error(message));
});