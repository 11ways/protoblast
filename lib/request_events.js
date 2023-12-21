const OPTIONS = Symbol('options');

/**
 * The RequestEvents class in the Develry namespace:
 * handling a EventStream with POST support.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Object|RURL}   options
 */
const RequestEvents = Fn.inherits('Informer', 'Develry', function RequestEvents(options) {

	if (options && typeof options == 'object') {
		if (options.timeout != null) {
			options.bomb_timeout = options.timeout;
			options.timeout = null;
		}
	}

	// Store the options for reconnection
	this[OPTIONS] = options;

	// The default `retry` value is 3 seconds
	this.retry = 3000;

	// The id of the last received message
	this.lastEventId = null;

	// Create the initial connection
	createConnection.call(this);
});

/**
 * The CONNECTING state:
 * connecting or reconnecting
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
RequestEvents.setStatic('CONNECTING', 0);

/**
 * The OPEN state:
 * connection has been made
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
RequestEvents.setStatic('OPEN', 1);

/**
 * The CLOSED state:
 * connection has been closed
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
RequestEvents.setStatic('CLOSED', 2);

/**
 * See if the connection has to be retried
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
function createConnection(reconnect = false, previous_error = null) {

	if (this.readyState == RequestEvents.CLOSED) {
		return;
	}

	// Set the readystate
	this.readyState = RequestEvents.CONNECTING;

	if (reconnect) {
		// Do not reconnect if the server sent the "no content" status previously
		if (this.request.statusCode == 204) {
			return;
		}
	}

	// Create the request instance
	this.request = new Classes.Develry.Request();

	// Set the options
	let valid = this.request.setOptions(this[OPTIONS]);

	if (!valid) {
		throw new Error('Invalid request options');
	}

	if (this.lastEventId != null) {
		this.request.headers['Last-Event-ID'] = this.lastEventId;
	}

	// Force the request to emit chunks
	this.request.emit_chunks = true;

	// Do not set a request timeout (on the XHR/REQ instance itself)
	this.request.timeout = false;

	// Set the default timeout to 60 seconds
	if (this.request.data_timeout == null) {
		this.request.data_timeout = 60 * 1000;
	}

	// Listen for the chunks
	addChunkHandler.call(this);

	// Start the request
	startRequest.call(this);
}

/**
 * Start the request
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
function startRequest() {

	// Get the pledge. It will be resolved when the request is done
	let pledge = this.request.start();

	pledge.then(() => {
		setTimeout(() => {
			createConnection.call(this, true);
		}, this.retry);
	});

	pledge.catch(err => {
		setTimeout(() => {
			createConnection.call(this, true, err);
		}, this.retry);
	});
}

/**
 * Add the chunk handler
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
function addChunkHandler() {

	// We'll buffer incomplete chunks here
	let buffer = '';

	// Listen for chunks coming from the Request instance
	this.request.on('chunk', (chunk) => {

		// Set the readystate
		this.readyState = RequestEvents.OPEN;

		if (buffer) {
			buffer = buffer + chunk;
		} else {
			buffer = chunk;
		}

		// Split the buffer on double newlines,
		// which is how the events are delimited
		let parts = buffer.split('\n\n');

		// If there is only 1 part, it's incomplete
		if (parts.length == 1) {
			return;
		}

		// Remember when incomplete data has been found
		let found_incomplete = false;

		// Reset the buffer each time
		buffer = '';

		// Iterate over all the parts/lines
		while (parts.length) {

			// Get the next part to process
			let part = parts.shift();

			// If this is the last part,
			// and it is not simply an empty string,
			// this is an incomplete chunk
			if (parts.length == 0) {

				if (part === '') {
					// Final part of this message is OK!
				} else {
					buffer = part;
					found_incomplete = true;
				}

				break;
			}

			// Split the part up into lines
			let lines = part.trim().split('\n');

			// Prepare the event object
			let event = {};

			// How many times 'data' has been seen
			let seen_data = 0;

			// The event type to emit
			let emit_type = 'message';

			// Iterate over the lines
			for (let line of lines) {

				// Get the index of the first colon
				let index = line.indexOf(':');

				// If there is no colon, skip this line
				if (index == -1) {
					continue;
				}

				// Get the key
				let key = line.slice(0, index).trim();

				// Get the value
				let value = line.slice(index + 1).trimStart();

				// If the value is a `retry` key,
				// we have to set the retry value
				if (key == 'retry') {
					this.retry = Number(value);
					continue;
				}

				// If the value is an `id` key,
				// we have to set the lastEventId value
				if (key == 'id') {
					this.lastEventId = value;
				}

				// If the value is an `event` key,
				// we have to set the emit_type value
				if (key == 'event') {
					emit_type = value;
				}

				// Data has to be handled differently
				// (It can be emitted multiple times per chunk)
				if (key == 'data') {

					// If we've seen data before,
					// a newline should be added
					if (seen_data) {
						event.data += '\n' + value;
					} else {
						event.data = value;
					}

					seen_data++;
				} else {
					// Store the value
					event[key] = value;
				}

				this.emit(emit_type, event);
			}
		}
	});
}

/**
 * Close the connection
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
RequestEvents.setMethod(function close() {

	// Set the readystate
	this.readyState = RequestEvents.CLOSED;

	// Stop the request
	this.request.abort();
});