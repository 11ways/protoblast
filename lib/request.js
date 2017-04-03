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
	 * @version  0.2.0
	 *
	 * @param    {URL|String}   url
	 */
	Request.setMethod(function setUrl(url) {

		if (typeof url == 'string') {
			this.url = Blast.Bound.URL.parse(url);
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
	 * @version  0.3.6
	 *
	 * @param    {Object}     options
	 * @param    {Function}   callback
	 */
	Request.setMethod(function http_request(options, callback) {

		var that = this,
		    protocol,
		    config,
		    url,
		    req;

		if (typeof options.url == 'string') {
			url = Blast.Bound.URL.parse(options.url);
		} else {
			url = options.url;
		}

		config = {
			host    : url.hostname,
			path    : url.pathname + url.search,
			port    : url.port,
			headers : options.headers
		};

		if (url.protocol == 'https:') {
			protocol = https;
		} else {
			protocol = http;
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
				options.url = res.headers['location'];

				// Set the previous URL as the referrer
				options.headers.referrer = '' + url;

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

			// Listen for data to stream in
			output.on('data', function gotData(data) {
				body += data.toString('utf-8');
			});

			output.on('end', function ended() {

				var error;

				if (res.status >= 400) {
					error = new Error(res.status + ': ' + res.statusMessage);
				} else {
					error = null;
				}

				if (res.headers['content-type'] && (~res.headers['content-type'].indexOf('json'))) {
					body = Blast.Bound.JSON.safeParse(body);
				}

				callback(error, res, body);
			});
		});

		// Listen for request errors
		req.on('error', function onRequestError(err) {
			callback(err);
		});

		// Initiate the request
		req.end();
	});

	/**
	 * Start this request
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @param    {Function}   callback
	 */
	Request.setMethod(function start(callback) {

		var that = this,
		    options,
		    url,
		    req;

		// Don't start the same request twice
		if (this.original_url) {
			return;
		}

		// Store the original url
		this.original_url = this.url + '';

		options = {
			url      : this.url,
			headers  : this.headers
		};

		// Do the response, follow redirects
		this.http_request(options, callback);
	});

	if (!Blast.isNode) {
		return;
	}

	/**
	 * Fetch a simple resource
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @param    {String}     url
	 * @param    {Function}   callback
	 */
	Blast.fetch = function fetch(url, callback) {

		var req = new Request();

		// Set the url
		req.setUrl(url);

		// Start the request
		req.start(callback);
	};

	https = require('https');
	http = require('http');
	zlib  = require('zlib');
};