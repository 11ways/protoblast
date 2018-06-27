module.exports = function BlastRequest(Blast, Collection) {

	var https,
	    http,
	    zlib;

	/**
	 * The Request class in the Develry namespace,
	 * inherits from the Informer class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 */
	var Request = Collection.Function.inherits('Informer', 'Develry', function Request(options) {

		if (!options) {
			options = {};
		}

		// Empty headers object
		this.headers = {};

		// Keep track of the number of times we've been redirected
		this.redirect_count = 0;

		// Store the original requested url (as string)
		this.original_url = '';

		// See if the url has already been specified
		if (options.url) {
			this.setUrl(options.url);
		}

		// Accept gzip by default
		this.setHeader('accept-encoding', 'gzip');
	});

	/**
	 * Set the URL to request
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.5.7
	 *
	 * @param    {URL|String}   url
	 */
	Request.setMethod(function setUrl(url) {

		if (typeof url == 'string') {
			this.url = Blast.Classes.RURL.parse(url);
		} else {
			this.url = url;
		}
	});

	/**
	 * Set header
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @param    {String}   name
	 * @param    {Mixed}    value
	 */
	Request.setMethod(function setHeader(name, value) {

		var key;

		// If `name` is an object,
		// set its contents as headers
		if (name && typeof name == 'object') {
			for (key in name) {
				this.setHeader(key, name[key]);
			}

			return;
		}

		this.headers[String(name).toLowerCase()] = value;
	});

	/**
	 * Actually make a request
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.5.7
	 *
	 * @param    {Object}     options
	 * @param    {Function}   callback
	 */
	Request.setMethod(function http_request(options, callback) {

		var that = this,
		    body_data,
		    protocol,
		    config,
		    body,
		    url,
		    req;

		if (typeof options == 'string') {
			url = Blast.Classes.RURL.parse(options);
			options = {};
		} else if (typeof options.url == 'string') {
			url = Blast.Classes.RURL.parse(options.url);
		} else {
			url = options.url;
		}

		if (options.get) {
			url.addQuery(options.get);
		}

		if (options.head) {
			url.addQuery(options.head);
		}

		config = {
			host    : url.hostname,
			path    : url.pathname + url.search,
			port    : url.port,
			headers : options.headers || {}
		};

		if (url.protocol == 'https:') {
			protocol = https;
		} else {
			protocol = http;
		}

		if (options.head) {
			config.method = 'HEAD';
		}

		if (options.post) {
			config.method = 'POST';
			body_data = options.post;
		}

		if (options.put) {
			config.method = 'PUT';
			body_data = options.put;
		}

		if (options.delete) {
			config.method = 'DELETE';
			body_data = options.delete;
		}

		if (options.options) {
			config.method = 'OPTIONS';
		}

		if (options.patch) {
			config.method = 'PATCH';
			body_data = options.patch;
		}

		if (body_data) {
			if (typeof body_data == 'object') {
				config.headers['Content-Type'] = 'application/json';
				body = JSON.stringify(body_data);
			} else {
				body = String(body_data);
			}

			config.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
		}

		// Create the request
		req = protocol.request(config, function gotResponse(res) {

			var output,
			    gzip,
			    body = '';

			// Set the request options on the response object
			res.request_options = config;

			// Follow redirects if there are any
			if (res.statusCode > 299 && res.statusCode < 400) {

				// Increase the redirect count
				that.redirect_count++;

				// Override the URL to request
				options.url = Blast.Classes.RURL.parse(res.headers['location'], url.protocol + '//' + config.host);

				if (!options.headers) {
					options.headers = {};
				}

				// Set the previous URL as the referrer
				options.headers.referrer = url.href;

				return that.http_request(options, callback);
			}

			// If an error occurs, call the callback with it
			res.on('error', function gotResponseError(err) {
				callback(err, res);
			});

			// If the response is gzipped, unzip it
			if (res.headers['content-encoding'] == 'gzip') {
				gzip = zlib.createGunzip();
				res.pipe(gzip);
				output = gzip;
			} else {
				output = res;
			}

			if (options.get_stream) {
				return callback(null, res, output);
			}

			// Listen for data to stream in
			output.on('data', function gotData(data) {
				body += data.toString('utf-8');
			});

			output.on('end', function ended() {

				var error_data,
				    error;

				if (res.headers['content-type'] && (~res.headers['content-type'].indexOf('json'))) {
					body = Blast.Bound.JSON.safeParse(body);
				}

				if (res.statusCode >= 400) {
					error = res.statusCode + ' - ' + res.statusMessage + '\n';

					if (body && typeof body == 'object') {
						if (body.code) {
							error += '  Body error code: ' + body.code + '\n';
						}

						if (body.message) {
							error += '  Body error message: ' + body.message + '\n';
						}
					}

					error += 'on ' + config.method + ' ' + String(url) + '\n';

					error = new Error(error);
				} else {
					error = null;
				}

				callback(error, res, body);
			});
		});

		// Listen for request errors
		req.on('error', function onRequestError(err) {
			callback(err);
		});

		if (body != null) {
			req.write(body);
		}

		// Initiate the request
		req.end();
	});

	/**
	 * Start this request
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.3.7
	 *
	 * @param    {Function}   callback
	 */
	Request.setMethod(function start(options, callback) {

		var that = this,
		    options,
		    url,
		    req;

		if (typeof options == 'function') {
			callback = options;
			options = {};
		}

		// Don't start the same request twice
		if (this.original_url) {
			return;
		}

		// Store the original url
		this.original_url = this.url + '';

		options.url = this.url;

		if (!options.headers) {
			options.headers = {};
		}

		Collection.Object.assign(options.headers, this.headers);

		// Do the response, follow redirects
		this.http_request(options, callback);
	});

	/**
	 * Fetch a simple resource
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @param    {String|Object}  url
	 * @param    {Function}       callback
	 */
	Blast.fetch = function fetch(url, callback) {

		var req = new Request();

		// Start the request
		return req.http_request(url, callback);
	};

	if (!Blast.isNode) {
		return;
	}

	if (Blast.isNW) {
		https = nw.require('https');
		http  = nw.require('http');
		zlib  = nw.require('zlib');
	} else {
		https = require('https');
		http  = require('http');
		zlib  = require('zlib');
	}
};