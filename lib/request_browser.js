var Request = Blast.Classes.Develry.Request,
    original_send = XMLHttpRequest.prototype.send,
    original_open = XMLHttpRequest.prototype.open,
    START_SYMBOL = Symbol('start');

/**
 * The XMLHttpRequest instance,
 * which is doing the actual browser-side request
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {XMLHttpRequest}
 */
Request.setProperty('xhr', null);

/**
 * The original XHR response instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {Response}
 */
Request.setProperty('xhr_res', null);

/**
 * Allow parsing responses as JSON-Dry by default
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {boolean}
 */
Request.setProperty('allow_json_dry_response', true);

/**
 * Get the current response status
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {number}
 */
Request.setProperty(function status() {
	if (this.xhr) {
		return this.xhr.status;
	}

	if (this.cached_request) {
		return this.cached_request.status;
	}
});

/**
 * Get the current response status message
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {string}
 */
Request.setProperty(function status_message() {
	if (this.xhr) {
		return this.xhr.statusText;
	}

	if (this.cached_request) {
		return this.cached_request.status_message;
	}
});

/**
 * Actually make the request
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 *
 * @return   {Pledge}
 */
Request.setMethod(function _make_request() {

	var that = this,
	    pledge = new Pledge(),
	    method = this.method_info,
	    temp_timeout,
	    response,
	    finished,
	    is_form,
	    timeout,
	    result,
	    error,
	    body = this.body,
	    bomb,
	    type,
	    key,
	    xhr;

	if (this.get) {
		this.url.addQuery(this.get);
	}

	if (this.cache === false) {
		this.url.param('_', this.time_started);
	} else {
		this.url.param('_', null);
	}

	// Create the request
	xhr = new XMLHttpRequest();
	this.xhr = xhr;

	// Allow cancelling the request
	pledge.cancel = function cancel() {
		that.cancelled = true;
		xhr.abort();
	};

	// DNS failures or no available connection will cause this error
	xhr.addEventListener('error', function onError(event) {

		error = new Error('Transfer failed');

		// Simulate a 408 "timeout"
		error.status = error.number = 408;

		Blast.state.reportError(error);

		done();
	}, false);

	// Catch aborts
	xhr.addEventListener('abort', function transferCanceled(event) {

		if (error) {
			return;
		}

		error = new Error('Transfer aborted');
		error.status = error.number = 0;

		done();
	}, false);

	if (this.timeout) {
		timeout = this.timeout;
	} else {
		timeout = Math.max(Blast.state.rtt_timeout + 500, this.max_timeout);
	}

	// Create a timeout checker
	bomb = Fn.timebomb(timeout, function onTimeout() {

		if (error || finished) {
			return;
		}

		if (!Blast.state.connectionHasTimedOut(timeout)) {
			temp_timeout = Blast.state.msUntilTimeout(timeout);

			if (!temp_timeout || temp_timeout < 500) {
				temp_timeout = 500;
			}

			console.log('Timeout of', timeout, 'is not yet considered as a connection timeout, waiting another', temp_timeout, 'ms');
			bomb = Fn.timebomb(temp_timeout, onTimeout);
			return;
		}

		error = new Error('Transfer timeout after ' + timeout + 'ms for ' + that.url);
		error.status = error.number = 408;
		error.timeout = timeout;
		error.request_start = xhr[START_SYMBOL];

		Blast.state.reportError(error);

		try {
			xhr.abort();
		} catch (err) {
			// Ignore
		}

		done();
	});

	// Event fired when we start UPLOADING data
	// This is actually not that useful in retrospect
	//xhr.addEventListener('loadstart', function uploadingData(event) {});

	// We are receiving progress update
	xhr.addEventListener('progress', function receivingProgress(event) {

		if (xhr.readyState < 2) {
			return;
		}

		Blast.state.reportSuccess('progress', event);
	});

	// Listen for ready state changes
	xhr.addEventListener('readystatechange', function onStateChange(event) {

		if (xhr.readyState < 2 || xhr.readyState === 4) {
			return;
		}

		Blast.state.reportSuccess('readystatechange', event);
	});

	// Listen for successful load event
	xhr.addEventListener('load', function transferComplete(event) {

		var download_url,
		    disposition = xhr.getResponseHeader('content-disposition'),
		    filename,
		    reader,
		    anchor;

		response = xhr.response || xhr.responseText;
		that.xhr_res = response;
		type = xhr.getResponseHeader('content-type') || '';
		that.status = xhr.status;
		that.statusText = xhr.statusText;

		if (type && type.indexOf(';') > -1) {
			type = Bound.String.before(type, ';');
		}

		// Intercept file downloads
		if (disposition && (that.download_if_inline || disposition.search('attachment') !== -1)) {

			// Just browse to it if filereader doesn't exist
			if (typeof FileReader == 'undefined') {
				window.location = href;
				return done();
			}

			// Try getting the filename if it's available
			filename = /filename="(.*?)"/.exec(disposition);

			if (filename && filename[1]) {
				filename = filename[1];
			} else {
				filename = that.url.href.split('/').pop() || 'download';
			}

			// We don't need to do the anchor trick on IE
			// (It won't work either, access denied)
			if (navigator.msSaveOrOpenBlob != null) {
				return navigator.msSaveOrOpenBlob(response, filename);
			}

			// Create a blob url
			download_url = URL.createObjectURL(response);

			// Create a temporary anchor for manipulating the filename
			anchor = document.createElement('a');
			document.body.appendChild(anchor);
			anchor.style = 'display: none';
			anchor.href = download_url;

			// Set the filename
			anchor.download = filename;

			// Download the file
			anchor.click();

			window.URL.revokeObjectURL(download_url);
			return done();
		}

		if (typeof FileReader == 'undefined') {
			result = response;
			return done();
		}

		reader = new FileReader();

		reader.onloadend = function onReaderLoadend() {
			result = reader.result;

			if (!type) {
				type = response.type;
			} else if (type != response.type) {
				// Sometimes (on Chrome at least)
				// the type is set to "text/xml", even when we're sending
				// a JSON string. Seems like onloadend is fired too early?
				// Or the data in "response" hasn't been updated yet, at least
			}

			done();
		};

		reader.readAsText(xhr.response);
	}, false);

	// Open the request
	xhr.open(method.name, this.url.href);

	// Set a request if needed
	if (this.timeout != null) {
		xhr.timeout = this.timeout;
	} else if (this.timeout != 0) {
		// If no timeout is given, use a timeout of 60s
		xhr.timeout = 60000;
	}

	// Always get the response as a blob
	xhr.responseType = 'blob';

	// Set the ajax header
	xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');

	for (key in this.headers) {
		xhr.setRequestHeader(key, this.headers[key]);
	}

	if (method.has_body && body) {

		if (body.constructor && body.constructor.name == 'FormData') {
			is_form = true;
		} else if (typeof FormData != 'undefined' && body instanceof FormData) {
			is_form = true;
		}

		if (typeof body == 'object' && !is_form) {
			body = JSON.stringify(body);
			xhr.setRequestHeader('content-type', 'application/json');
		}

		this.serialized_body = body;

		xhr.send(body);
	} else {
		xhr.send();
	}

	// Function that'll cleanup the request
	// & resolve or reject the pledge
	function done() {

		// If it already finished, do nothing
		if (finished) {
			return;
		}

		finished = true;
		that.time_ended = Date.now();

		let parsed = that._parseResponse(result, error);

		if (parsed.error) {
			pledge.reject(parsed.error);
		} else {
			pledge.resolve(parsed.result);
			Blast.state.reportSuccess();
		}
	}

	// Check the connection state
	Blast.state.checkConnection().done(function onCheck(err, result) {

		// If an error already fired, do nothing
		if (error) {
			return;
		}

		if (err) {
			error = err;
		} else if (!result) {
			error = new Error('Connection failed');
		}

		if (error) {
			done();
		}
	});

	return pledge;
});

/**
 * Get a response header
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.10
 */
Request.setMethod(function getResponseHeader(name) {

	if (this.xhr) {
		return this.xhr.getResponseHeader(name);
	}

	if (this.cached_request) {
		return this.cached_request.getResponseHeader(name);
	}
});

/**
 * Get all the response header
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @return   {object}
 */
Request.setMethod(function getAllResponseHeaders() {

	if (this.xhr) {
		return this.xhr.getAllResponseHeaders();
	}

	if (this.cached_request) {
		return this.cached_request.getAllResponseHeaders();
	}
});

/**
 * Hook into the original open method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 *
 * @param    {String}   method
 * @param    {String}   url
 */
XMLHttpRequest.prototype.open = function open(method, url) {
	this.open_method = method;
	this.open_url = url;
	this[START_SYMBOL] = Date.now();
	Blast.emit('xhr_open', this);
	return original_open.apply(this, arguments);
};

/**
 * Hook into the original send method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 */
XMLHttpRequest.prototype.send = function send() {
	this[START_SYMBOL] = Date.now();
	Blast.emit('xhr_send', this);
	return original_send.apply(this, arguments);
};