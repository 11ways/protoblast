var dns_cache,
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
	dns   = require('dns');
}

/**
 * Server-side DNS lookup with caching
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.12
 */
Request.setStatic(function lookup(hostname, options, callback) {

	let pledge;

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

	pledge = new Blast.Classes.Pledge();
	dns_cache.set(key, pledge);

	dns.lookup(hostname, options, (...response) => {
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
 * @author   Jelle De Loecker   <jelle@elevenways.be>
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
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {IncomingMessage}
 */
Request.setProperty('incoming_res', null);

/**
 * Do not allow parsing responses as JSON-Dry by default
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {boolean}
 */
Request.setProperty('allow_json_dry_response', false);

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
	if (this.incoming_res) {
		return this.incoming_res.statusCode;
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.7.1
 */
Request.setMethod(function _make_request(options) {

	var that = this,
	    body_data,
	    protocol,
	    finished,
	    is_form,
	    origin,
	    config,
	    pledge = new Blast.Classes.Pledge(),
	    method = this.method_info,
	    body = this.body,
	    url;

	if (options) {
		url = options.url;
	} else {
		options = {};
		url = this.url;

		if (this.get) {
			url.addQuery(this.get);
		}
	}

	config = {
		host    : url.hostname,
		path    : url.pathname + url.search,
		port    : url.port,
		headers : this.headers,
		method  : method.method,
		lookup  : Request.lookup
	};

	if (url.protocol == 'https:') {
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

	// Create the request
	this.outgoing_req = protocol.request(config, (res) => {

		this.incoming_res = res;

		var output,
		    gzip,
		    body = '';

		// Set the request options on the response object
		res.request_options = config;

		// Follow redirects if there are any
		if (this.status > 299 && this.status < 400) {

			// Increase the redirect count
			that.redirect_count++;

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
			body += data.toString('utf-8');
		});

		output.on('end', function ended() {
			let parsed = that._parseResponse(body);
			done(parsed.error, parsed.result);
		});
	});

	// Listen for request errors
	this.outgoing_req.on('error', function onRequestError(err) {
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

	return pledge;
});

/**
 * Get a response header
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
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
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @return   {object}
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
 * Handle server-side form data submission
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
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