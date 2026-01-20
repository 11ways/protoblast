const RESPONSE = Symbol('response');

let dns_cache,
    Request = Blast.Classes.Develry.Request,
    https,
    http,
    zlib,
    dns;

if (Blast.isNW) {
	https = nw.require('https');
	http  = nw.require('http');
	zlib  = nw.require('zlib');
	dns   = nw.require('dns');
} else {
	https = require('https');
	http  = require('http');
	zlib  = require('zlib');
	dns = require('dns');
}

/**
 * Server-side DNS lookup with caching
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.9.6
 */
Request.setStatic(function lookup(hostname, options, callback) {

	let attempt = 0,
	    pledge;

	if (!dns_cache) {
		dns_cache = new Blast.Classes.Develry.Cache({
			max_age : 60 * 1000,
		});
	}

	if (typeof options == 'function') {
		callback = options;
		options = {};
	}

	let key = Blast.Bound.Object.checksum([hostname, options]),
	    result;

	if (dns_cache.has(key)) {
		result = dns_cache.get(key);
		return resolve(result);
	}

	pledge = new Classes.Pledge.Swift();
	dns_cache.set(key, pledge);

	dns.lookup(hostname, options, function handleDnsResponse(...response) {

		let err = response[0];

		if (err) {			
			if (attempt < 10) {
				attempt++;

				// Only log after several retries to avoid spam
				if (attempt >= 5) {
					console.warn('DNS lookup retry', attempt, 'for', hostname);
				}

				return setTimeout(() => {
					dns.lookup(hostname, options, handleDnsResponse);
				}, 10);
			}
		}

		dns_cache.set(key, response);
		resolve(response);
	});

	function resolve(result) {

		// If it's an array, we can callback
		if (Blast.Classes.Array.isArray(result)) {
			return Blast.setImmediate(() => {
				callback(...result);

				if (pledge) {
					pledge.resolve(result);
				}
			});
		}

		// If not, it's thennable and we need to wait for it
		Blast.Classes.Pledge.done(result, (err, result) => {
			callback(...result);
		});
	}
});

/**
 * The ClientRequest instance:
 * the Node.js outgoing request
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {ClientRequest}
 */
Request.setProperty('outgoing_req', null);

/**
 * The IncomingMessage instance:
 * the Node.js response to the ClientRequest
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {IncomingMessage}
 */
Request.setProperty('incoming_res', null);

/**
 * Do not allow parsing responses as JSON-Dry by default
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {boolean}
 */
Request.setProperty('allow_json_dry_response', false);

/**
 * Get the current response status
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.22
 *
 * @type     {number}
 */
Request.setProperty(function status() {
	if (this.incoming_res?.statusCode) {
		return this.incoming_res.statusCode;
	}

	if (this.cached_request?.status) {
		return this.cached_request.status;
	}

	if (this.error?.status) {
		return this.error.status;
	}
});

/**
 * Get the current response status message
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {string}
 */
Request.setProperty(function status_message() {
	if (this.incoming_res) {
		return this.incoming_res.statusMessage;
	}

	if (this.cached_request) {
		return this.cached_request.status_message;
	}
});

/**
 * Actually make a request
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.9.6
 */
Request.setMethod(function _make_request(options) {

	var that = this,
	    body_data,
	    protocol,
	    finished,
	    is_form,
	    origin,
	    config,
	    pledge = new Classes.Pledge.Swift(),
	    method = this.method_info,
	    body = this.body,
	    url;

	if (!options) {
		options = {};
	}

	if (options.url) {
		url = options.url;
	} else {
		url = this.url;

		if (this.get) {
			url.addQuery(this.get);
		}
	}

	const is_https = url.protocol == 'https:';

	config = {
		host    : url.hostname,
		path    : url.pathname + url.search,
		port    : url.port,
		headers : this.headers,
		method  : method.method,
		lookup  : dns ? Request.lookup : undefined,
		rejectUnauthorized : this.rejectUnauthorized,
	};

	let agent_pool = this.agent_pool,
	    agent = this.agent;

	if (typeof agent == 'string') {
		agent_pool = agent;
		agent = null;
	}

	if (!agent) {

		if (agent_pool !== false) {
			agent_pool = Classes.Develry.AgentPool.get(this.agent_pool);
		}
		
		if (agent_pool) {
			if (is_https) {
				agent = agent_pool.https_agent;
			} else {
				agent = agent_pool.http_agent;
			}
		}
	}

	if (agent) {
		config.agent = agent;
	}

	if (is_https) {
		protocol = https;
	} else {
		protocol = http;
	}

	if (method.has_body && body) {
		if (typeof body == 'object') {
			if (body.constructor && body.constructor.name == 'FormData') {
				is_form = true;
			} else {
				body = JSON.stringify(body);
				this.setHeader('content-type', 'application/json');
			}
		} else {
			body = String(body);
		}

		if (!is_form) {
			this.setHeader('content-length', Buffer.byteLength(body, 'utf8'));
		}
	} else {
		body = undefined;
	}

	if (!is_form) {
		this.serialized_body = body;
	}

	let data_timeout,
	    timeout;

	if (this.timeout) {
		data_timeout = timeout = this.timeout;
	} else if (this.timeout !== false) {
		data_timeout = timeout = this.max_timeout;
	}

	if (this.data_timeout != null) {
		data_timeout = this.data_timeout;
	}

	// Create a timeout checker
	let bomb = Fn.timebomb(data_timeout, function onTimeout() {

		if (finished) {
			return;
		}

		let error = new Error('Transfer timeout after ' + timeout + 'ms for ' + that.url);
		error.status = error.number = 408;
		error.timeout = timeout;
		error.request_start = that.outgoing_req;
		that.error = error;

		done(error);
	});

	// Create the request
	this.outgoing_req = protocol.request(config, (res) => {

		if (bomb.exploded) {
			return;
		}

		bomb.defuse();

		this.incoming_res = res;

		var output,
		    gzip,
		    body = '',
		    body_size = 0;

		// Set the request options on the response object
		res.request_options = config;

		// Follow redirects if there are any
		if (this.status > 299 && this.status < 400) {

			// Increase the redirect count
			that.redirect_count++;

			// Check if we've exceeded the maximum number of redirects
			if (that.redirect_count > that.max_redirects) {
				let error = new Error('Maximum redirect limit (' + that.max_redirects + ') exceeded');
				error.status = error.number = 310;
				error.redirect_count = that.redirect_count;
				that.error = error;
				return done(error);
			}

			// Override the URL to request
			options.url = Blast.Classes.RURL.parse(res.headers['location'], url.protocol + '//' + config.host);

			// Set the previous URL as the referrer
			that.setHeader('referrer', url.href);

			return pledge.resolve(that._make_request(options));
		}

		// If an error occurs, call the callback with it
		res.on('error', function gotResponseError(err) {
			done(err);
		});

		// If the response is gzipped, unzip it
		if (res.headers['content-encoding'] == 'gzip') {
			gzip = zlib.createGunzip();
			gzip.on('error', function gotGunzipError(err) {
				done(err);
			});
			res.pipe(gzip);
			output = gzip;
		} else {
			output = res;
		}

		if (that.get_stream) {
			return done(null, output);
		}

		// Listen for data to stream in
		output.on('data', function gotData(data) {

			// Track the response body size
			body_size += data.length;

			// Check if we've exceeded the maximum response size
			if (that.max_response_size && body_size > that.max_response_size) {
				let error = new Error('Response body too large (exceeded ' + that.max_response_size + ' bytes)');
				error.status = error.number = 413;
				error.body_size = body_size;
				that.error = error;

				// Destroy the response stream to stop further data
				res.destroy();
				if (gzip) {
					gzip.destroy();
				}

				done(error);
				return;
			}

			let text = data.toString('utf-8');
			body += text;

			if (that.emit_chunks) {
				that.emit('chunk', text);
			}

			bomb.reset();
		});

		output.on('end', function ended() {
			let parsed = that._parseResponse(body);
			done(parsed.error, parsed.result);
		});
	});

	// Listen for request errors
	this.outgoing_req.on('error', function onRequestError(err) {

		// Handle keep-alive errors (where the server closes a socket
		// just as we want to re-use it)
		if (err.code === 'ECONNRESET' && that.outgoing_req.reusedSocket) {
			that.retries++;

			// Check if we've exceeded the maximum number of retries
			if (that.retries > that.max_retries) {
				let error = new Error('Maximum retry limit (' + that.max_retries + ') exceeded after ECONNRESET');
				error.status = error.number = 503;
				error.retries = that.retries;
				error.original_error = err;
				that.error = error;
				done(error);
				return;
			}

			pledge.resolve(that._make_request(options));
			return;
		}

		done(err);
	});

	if (body != null) {
		if (is_form) {
			handleFormData(body, this.outgoing_req);
		} else {
			this.outgoing_req.write(body);
		}
	}

	// Initiate the request
	if (!is_form) {
		this.outgoing_req.end();
	}

	function done(err, response) {

		if (finished) {
			return;
		}

		finished = true;
		that.time_ended = Date.now();

		if (err) {
			pledge.reject(err);
		} else {
			pledge.resolve(response);
		}
	}

	this[RESPONSE] = pledge;

	return pledge;
});

/**
 * Get the response
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.17
 * @version  0.8.17
 */
Request.setMethod(function getResponse() {
	return this[RESPONSE];
});

/**
 * Get a response header
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @param    {string}
 *
 * @return   {string|undefined}
 */
Request.setMethod(function getResponseHeader(name) {

	if (this.incoming_res) {
		return this.incoming_res.headers[name];
	}

	if (this.cached_request) {
		return this.cached_request.getResponseHeader(name);
	}
});

/**
 * Get all the response header
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @return   {Object}
 */
Request.setMethod(function getAllResponseHeaders() {

	if (this.incoming_res) {
		return this.incoming_res.headers;
	}

	if (this.cached_request) {
		return this.cached_request.getAllResponseHeaders();
	}
});

/**
 * Close the connection
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
Request.setMethod(function abort() {

	this.cancelled = true;

	if (this.outgoing_req) {
		return this.outgoing_req.abort();
	}
});

/**
 * Handle server-side form data submission
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @return   {Buffer}
 */
function handleFormData(body, req, done) {

	let boundary = body.boundary || body.getBoundary();

	req.setHeader('content-type', 'multipart/form-data; boundary=' + boundary);

	body.getLength(function gotLength(err, length) {

		if (err) {
			// Done is only called here on an error
			return done(err);
		}

		req.setHeader('Content-Length', length);

		body.pipe(req);
	});
}