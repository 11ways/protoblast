/**
 * The Combined stream class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.8.4
 */
const Combined = Fn.inherits('Stream', function Combined(options) {
	Object.assign(this, options);
	this._streams = [];
});

/**
 * Add several properties to the prototype
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setProperty({
	writable                : false,
	readable                : true,
	max_data_size           : 2 * 1024 * 1024,
	data_size               : 0,
	pause_stream            : true,
	_released               : false,
	_current_stream         : null,
	_inside_loop            : false,
	_pending_next           : false,
	_max_data_size_exceeded : false
});

/**
 * Is this a possible stream?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Boolean}
 */
function possibleStream(arg) {
	var type = typeof arg;

	return (type !== 'function')
		&& (type !== 'string')
		&& (type !== 'boolean')
		&& (type !== 'number')
		&& (!Buffer.isBuffer(arg));
}

/**
 * Append a stream or buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Stream}   stream
 */
Combined.setMethod(function append(stream) {

	var is_stream = possibleStream(stream);

	if (is_stream) {
		if (!(stream instanceof Blast.Classes.Stream.Delayed)) {
			let delayed = new Blast.Classes.Stream.Delayed(stream, {
				max_data_size: Infinity,
				pause_stream : this.pause_stream
			});

			stream.on('data', this._checkDataSize.bind(this));
			stream = delayed;
		}

		this._handleErrors(stream);

		if (this.pause_stream) {
			stream.pause();
		}
	}

	this._streams.push(stream);

	return this;
});

/**
 * Resume the stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function resume() {

	if (!this._released) {
		this._released = true;
		this.writable = true;
		this._getNext();
	}

	if (this.pause_stream) {
		if (this._current_stream && typeof this._current_stream.resume == 'function') {
			this._current_stream.resume();
		}
	}

	this.emit('resume');
});

/**
 * Write to the stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function write(data) {
	this.emit('data', data);
});

/**
 * End the stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function end() {
	this._reset('end');
});

/**
 * Destroy the stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function destroy() {
	this._reset('close');
});

/**
 * Pause the stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function pause() {

	if (this._current_stream && typeof this._current_stream.pause == 'function') {
		this._current_stream.pause();
	}

	this.emit('pause');
});

/**
 * Pipe this stream into another stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function pipe() {
	var result = pipe.super.apply(this, arguments);
	this.resume();
	return result;
});

/**
 * Reset the stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _reset(event) {
	this.writable = false;
	this._streams = [];
	this._current_stream = null;

	if (event != null) {
		this.emit(event);
	}
});

/**
 * Check if the max data size has been exceeded
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _checkDataSize() {

	this._updateDataSize();

	if (this._max_data_size_exceeded) {
		return;
	}

	if (this.data_size <= this.max_data_size) {
		return;
	}

	this._max_data_size_exceeded = true;

	let message = 'Stream.Combined#max_data_size of ' + this.max_data_size + ' bytes exceeded.'

	this._emitError(new Error(message));
});

/**
 * Update the current data size
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _updateDataSize() {

	var stream,
	    i;

	this.data_size = 0;

	for (i = 0; i < this._streams.length; i++) {
		stream = this._streams[i];

		if (!stream.data_size) {
			continue;
		}

		this.data_size += stream.data_size;
	}

	if (this._current_stream && this._current_stream.data_size) {
		this.data_size += this._current_stream.data_size;
	}
});

/**
 * Get the next stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _getNext() {
	this._current_stream = null;

	if (this._inside_loop) {
		this._pending_next = true;
		return;
	}

	this._inside_loop = true;

	try {
		do {
			this._pending_next = false;
			this._realGetNext();
		} while (this._pending_next)
	} finally {
		this._inside_loop = false;
	}
});

/**
 * Get the next stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _realGetNext() {

	var stream = this._streams.shift();

	if (stream == null) {
		this.end();
		return;
	}

	if (typeof stream != 'function') {
		this._setCurrentStream(stream);
		return;
	}

	let getStream = stream;
	const that = this;

	getStream(function gotStream(stream) {
		let is_stream = possibleStream(stream);

		if (is_stream) {
			stream.on('data', that._checkDataSize.bind(that));
			that._handleErrors(stream);
		}

		that._setCurrentStream(stream);
	});
});

/**
 * Handle the next given stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _setCurrentStream(stream) {

	var is_stream = possibleStream(stream);

	this._current_stream = stream;

	if (is_stream) {
		stream.on('end', this._getNext.bind(this));
		stream.pipe(this, {end: false});
		return;
	}

	// It's not a stream, so it's probably a buffer or another value
	this.write(stream);
	this._getNext();
});

/**
 * Handle possible errors on the given stream
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _handleErrors(stream) {

	const that = this;

	stream.on('error', function onError(err) {
		that._emitError(err);
	});
});

/**
 * Emit an error
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Combined.setMethod(function _emitError(err) {
	this._reset();
	this.emit('error', err);
});