var libpath = require('path'),
    fs = require('fs');

/**
 * The server-side FormData class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
var FormData = Fn.inherits('Stream.Combined', '@', function FormData(options) {

	FormData.super.call(this);

	this._values_to_measure = [];
	Object.assign(this, options);
});

/**
 * Add several properties to the prototype
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
FormData.setProperty({
	_overhead_length     : 0,
	_value_length        : 0,
	line_break           : '\r\n',
	default_content_type : 'application/octet-stream'
});

/**
 * Get a 50-character boundary
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
FormData.prepareProperty(function boundary() {
	// 26 dashes + 24 random characters
	return '--------------------------' + Blast.Classes.Crypto.randomHex(12);
});

/**
 * Get the current end boundary
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
FormData.prepareProperty(function boundary_end() {
	return '--' + this.boundary + '--' + this.line_break;
});

/**
 * Append a value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {String}   field
 * @param    {Mixed}    value
 * @param    {Object}   options
 */
FormData.setMethod(function append(field, value, options) {

	// allow filename as single option
	if (typeof options == 'string') {
		options = {filename: options};
	} else if (!options) {
		options = {};
	}

	// Streams can't handle numbers, make it a string
	if (typeof value == 'number') {
		value = ''+value;
	}

	// Do not allow array values:
	// https://github.com/felixge/node-form-data/issues/38
	if (Array.isArray(value)) {
		this._emitError(new Error('Arrays are not supported.'));
		return;
	}

	let header = this._multiPartHeader(field, value, options),
	    footer = this._createMultiPartFooterGenerator();

	append.super.call(this, header);
	append.super.call(this, value);
	append.super.call(this, footer);

	// Pass along options.known_length
	this._trackLength(header, value, options);
});

/**
 * Submit the data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Object}     options
 * @param    {Function}   callback
 */
FormData.setMethod(function submit(options, callback) {

	if (typeof options == 'string' || Blast.Classes.RURL.isUrl(options)) {
		options = {
			url: options
		};
	}

	if (!options.method) {
		options.method = 'post';
	}

	options[options.method] = this;

	return Blast.fetch(options, callback);
});

/**
 * Get the headers
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Object}   user_headers
 *
 * @return   {Object}
 */
FormData.setMethod(function getHeaders(user_headers) {

	var header;

	let form_headers = {
		'content-type': 'multipart/form-data; boundary=' + this.boundary
	};

	for (header in user_headers) {
		form_headers[header.toLowerCase()] = user_headers[header];
	}

	return form_headers;
});

/**
 * Get as a buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Buffer}
 */
FormData.setMethod(function getBuffer() {

	var boundary = this.boundary,
	    entry,
	    data = new Buffer.alloc(0),
	    len = this._streams.length,
	    i;

	// Create the form content. Add Line breaks to the end of data.
	for (i = 0; i < len; i++) {
		entry = this._streams[i];

		if (typeof entry !== 'function') {
			// Add content to the buffer.
			if (Buffer.isBuffer(entry)) {
				data = Buffer.concat([data, entry]);
			} else {
				data = Buffer.concat([data, Buffer.from(entry)]);
			}

			// Add break after content.
			if (typeof entry !== 'string' || entry.substring(2, boundary.length + 2) !== boundary) {
				data = Buffer.concat([data, Buffer.from(this.line_break)]);
			}
		}
	}

	// Add the footer and return the Buffer object.
	return Buffer.concat([data, Buffer.from(this.boundary_end)]);
});

/**
 * Get the length if possible
 * (It does not calculate stream lengths)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Buffer}
 */
FormData.setMethod(function getLengthSync() {

	var known_length = this._overhead_length + this._value_length;

	// Don't get confused, there are 3 "internal" streams for each keyval pair
	// so it basically checks if there is any value added to the form
	if (this._streams.length) {
		known_length += this.boundary_end.length;
	}

	// https://github.com/form-data/form-data/issues/40
	if (!this.hasKnownLength()) {
		// Some async length retrievers are present
		// therefore synchronous length calculation is false.
		// Please use getLength(callback) to get proper length
		this._emitError(new Error('Cannot calculate proper length in synchronous way.'));
	}

	return known_length;
});

/**
 * Do we know all the lengths?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Buffer}
 */
FormData.setMethod(function hasKnownLength() {

	var result = true;

	if (this._values_to_measure.length) {
		result = false;
	}

	return result;
});

/**
 * Get the length asynchronously
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   callback
 */
FormData.setMethod(function getLength(callback) {

	var known_length = this._overhead_length + this._value_length;

	if (this._streams.length) {
		known_length += this.boundary_end.length;
	}

	if (!this._values_to_measure.length) {
		process.nextTick(callback.bind(this, null, known_length));
		return;
	}

	Fn.forEach.parallel(this._values_to_measure, this._lengthRetriever, function done(err, values) {

		if (err) {
			return callback(err);
		}

		let i;

		for (i = 0; i < values.length; i++) {
			known_length += values[i];
		}

		callback(null, known_length);
	});
});

/**
 * Get the length of something
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Mixed}      value
 * @param    {Function}   callback
 */
FormData.setMethod(function _lengthRetriever(value, key, callback) {

	if (value.hasOwnProperty('fd')) {
		if (value.end != undefined && value.end != Infinity && value.start != undefined) {
			callback(null, value.end + 1 - (value.start ? value.start : 0));
		} else {
			// Fetch the filesize
			fs.stat(value.path, function gotStat(err, stat) {

				if (err) {
					return callback(err);
				}

				// update final size based on the range options
				let size = stat.size - (value.start ? value.start : 0);

				callback(null, size);
			});
		}
	} else if (value.hasOwnProperty('httpVersion')) {
		// HTTP response

		callback(null, +value.headers['content-length']);
	} else if (value.hasOwnProperty('httpModule')) {
		// or request stream http://github.com/mikeal/request

		// wait till response come back
		value.on('response', function onResponse(response) {
			value.pause();
			callback(null, +response.headers['content-length']);
		});

		value.resume();
	} else {
		callback(new Error('Unknown stream'));
	}
});

/**
 * Create a multipart header
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {String}   field
 * @param    {Mixed}    value
 * @param    {Object}   options
 */
FormData.setMethod(function _multiPartHeader(field, value, options) {

	// custom header specified (as string)?
	// it becomes responsible for boundary
	// (e.g. to handle extra CRLFs on .NET servers)
	if (typeof options.header == 'string') {
		return options.header;
	}

	let disposition = this._getContentDisposition(value, options),
	    type        = this._getContentType(value, options);

	let contents = '';

	let headers = {
		// add custom disposition as third element or keep it two elements if not
		'Content-Disposition': ['form-data', 'name=' + JSON.stringify(field) + ''].concat(disposition || []),

		// if no content type. allow it to be empty array
		'Content-Type': [].concat(type || [])
	};

	if (typeof options.header == 'object') {
		headers = Object.assign({}, options.header, headers);
	}

	let header,
	    key;

	for (key in headers) {
		header = headers[key];

		if (header == null) {
			continue;
		}

		// Convert all headers to arrays
		if (!Array.isArray(header)) {
			header = [header];
		}

		// Add non-empty headers
		if (header.length) {
			contents += key + ': ' + header.join('; ') + this.line_break;
		}
	}

	return '--' + this.boundary + this.line_break + contents + this.line_break;
});

/**
 * Track the length
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {String}   header
 * @param    {Mixed}    value
 * @param    {Object}   options
 */
FormData.setMethod(function _trackLength(header, value, options) {

	let value_length = 0;

	// used w/ getLengthSync(), when length is known.
	// e.g. for streaming directly from a remote server,
	// w/ a known file a size, and not wanting to wait for
	// incoming file to finish to get its size.
	if (options.knownLength != null) {
		value_length += +options.knownLength;
	} else if (options.known_length != null) {
		value_length += +options.known_length;
	} else if (Buffer.isBuffer(value)) {
		value_length = value.length;
	} else if (typeof value === 'string') {
		value_length = Buffer.byteLength(value);
	}

	this._value_length += value_length;

	// @check why add CRLF? does this account for custom/multiple CRLFs?
	// (Original form-data repo also did not know)
	this._overhead_length += Buffer.byteLength(header) + this.line_break.length;

	// empty or either doesn't have path or not an http response
	if (!value || ( !value.path && !(value.readable && value.hasOwnProperty('httpVersion')) )) {
		return;
	}

	// no need to bother with the length
	if (!options.knownLength && !options.known_length) {
		this._values_to_measure.push(value);
	}
});

/**
 * Create a function that will create a footer when needed
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Function}
 */
FormData.setMethod(function _createMultiPartFooterGenerator() {

	const that = this;

	return function generateFooter(next) {
		let footer = that.line_break,
		    last_part = (that._streams.length === 0);

		if (last_part) {
			footer += that.boundary_end;
		}

		next(footer);
	};
});

/**
 * Get the content disposition
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Object}   value
 * @param    {Object}   options
 *
 * @return   {String}
 */
FormData.setMethod(function _getContentDisposition(value, options) {

	var filename;

	if (typeof options.filepath == 'string') {
		filename = libpath.normalize(options.filepath).replace(/\\/g, '/');
	} else if (options.filename || value.name || value.path) {
		// custom filename take precedence
		// formidable and the browser add a name property
		// fs- and request- streams have path property
		filename = libpath.basename(options.filename || value.name || value.path);
	} else if (value.readable && value.hasOwnProperty('httpVersion')) {
		// or try http response
		filename = libpath.basename(value.client._httpMessage.path || '');
	}

	if (filename) {
		return 'filename=' + JSON.stringify(filename);
	}
});

/**
 * Get the type of content
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Object}   value
 * @param    {Object}   options
 *
 * @return   {String}
 */
FormData.setMethod(function _getContentType(value, options) {

	// use custom content-type above all
	var type = options.content_type;

	// @TODO: attempt a mime lookup?

	// or if it's http-reponse
	if (!type && value.readable && value.hasOwnProperty('httpVersion')) {
		type = value.headers['content-type'];
	}

	// fallback to the default content type if `value` is not simple value
	if (!type && typeof value == 'object') {
		type = this.default_content_type;
	}

	return type;
});