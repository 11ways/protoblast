module.exports = function BlastRequestServer(Blast, Collection) {

	var Request = Blast.Classes.Develry.Request,
	    https,
	    http,
	    zlib;

	if (Blast.isNW) {
		https = nw.require('https');
		http  = nw.require('http');
		zlib  = nw.require('zlib');
	} else {
		https = require('https');
		http  = require('http');
		zlib  = require('zlib');
	}

	/**
	 * Actually make a request
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.7.0
	 */
	Request.setMethod(function _make_request(options) {

		var that = this,
		    body_data,
		    protocol,
		    finished,
		    origin,
		    config,
		    pledge = new Pledge(),
		    method = this.method_info,
		    body = this.body,
		    url,
		    req;

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
			method  : method.method
		};

		if (url.protocol == 'https:') {
			protocol = https;
		} else {
			protocol = http;
		}

		if (method.has_body && body) {
			if (typeof body == 'object') {
				body = JSON.stringify(body);
				this.setHeader('content-type', 'application/json');
			} else {
				body = String(body);
			}

			this.setHeader('content-length', Buffer.byteLength(body, 'utf8'));
		} else {
			body = undefined;
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

				// Set the previous URL as the referrer
				that.setHeader('referrer', url.href);

				return pledge.resolve(that._make_request(options));
			}

			that.response = res;

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
					error.result = body;
				} else {
					error = null;
				}

				done(error, body);
			});
		});

		// Listen for request errors
		req.on('error', function onRequestError(err) {
			done(err);
		});

		if (body != null) {
			req.write(body);
		}

		// Initiate the request
		req.end();

		function done(err, response) {

			if (finished) {
				return;
			}

			finished = true;

			if (err) {
				pledge.reject(err);
			} else {
				pledge.resolve(response);
			}
		}

		return pledge;
	});

};