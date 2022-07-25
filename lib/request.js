const ORIGINAL_REQUEST = Symbol('ori_req'),
      MAKE_REQUEST = Symbol('make_request'),
      METHOD = Symbol('method'),
      URL    = Symbol('url');

/**
 * The Request class in the Develry namespace,
 * inherits from the Informer class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.7.0
 *
 * @param    {Object|RURL}   options
 */
var Request = Collection.Function.inherits('Informer', 'Develry', function Request(options) {

	// Set the time it was created
	this.time_created = Date.now();

	// And the time it was started will be set later
	this.time_started = null;

	// And the time the request ended
	this.time_ended = null;

	// Empty headers object
	this.headers = {};

	// Keep track of the number of times we've been redirected
	this.redirect_count = 0;

	// Store the original requested url (as string)
	this.original_url = '';

	// The serialized body that was ultimately sent
	this.serialized_body = null;

	// Force a download even if it's an inline response?
	// (Normally it's only downloaded if it's an attachment)
	this.download_if_inline = null;

	if (options) {
		this.setOptions(options);
	}

	if (Blast.isNode) {
		// Accept gzip by default
		this.setHeader('accept-encoding', 'gzip');
	}
});

/**
 * A cache instance used for caching GET requests
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @return   {Cache}
 */
Request.prepareStaticProperty(function cache() {
	return new Blast.Classes.Develry.Cache({
		max_age : 60 * 1000,
	});
});

/**
 * Method info
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @param    {String}
 *
 * @return   {Object}
 */
Request.setStatic('method_info', {
	GET     : [ , 1, 1, 1, 1, 1],
	HEAD    : [ ,  , 1, 1, 1   ],
	POST    : [1, 1,  ,  ,  , 1],
	PUT     : [1,  ,  , 1      ],
	DELETE  : [1, 1,  , 1      ],
	CONNECT : [ , 1            ],
	OPTIONS : [ , 1, 1, 1      ],
	TRACE   : [ ,  ,  , 1      ],
	PATCH   : [1]
});

/**
 * Get method info
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @param    {String}
 *
 * @return   {Object}
 */
Request.setStatic(function getMethodInfo(method) {

	var result,
	    info;

	method = String(method).toUpperCase();
	info = Request.method_info[method];

	if (!info) {
		return;
	}

	result = {
		name            : method,
		method          : method,
		has_body        : !!info[0],
		response_body   : !!info[1],
		safe            : !!info[2],
		idempotent      : !!info[3],
		cacheable       : !!info[4],
		allowed_in_form : !!info[5]
	};

	return result;
});

/**
 * Is this an allowed method?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @param    {String}
 *
 * @return   {Boolean}
 */
Request.setStatic(function isAllowedMethod(method) {
	return !!Request.method_info[String(method).toUpperCase()];
});

/**
 * The original response data
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {*}
 */
Request.setProperty('raw_response_body', null);

/**
 * The parent request we're caching
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {Develry.Request}
 */
Request.setProperty('cached_request', null);

/**
 * Was this request cancelled?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {boolean}
 */
Request.setProperty('cancelled', false);

/**
 * Default timeout in ms
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {Number}
 */
Request.setProperty('timeout', null);

/**
 * Default max timeout in ms
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {Number}
 */
Request.setProperty('max_timeout', 30000);

/**
 * Allow cached responses?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {boolean|number|null}
 */
Request.setProperty('cache', null);

/**
 * Refer to the time_started
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 *
 * @type     {Number}
 */
Request.setProperty(function request_start() {
	return this.time_started;
});

/**
 * The HTTP method name to use
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {String}
 */
Request.setProperty(function method() {

	if (this[METHOD]) {
		return this[METHOD];
	}

	return 'GET';
}, function setMethod(method) {

	method = String(method).toUpperCase();

	if (!Request.isAllowedMethod(method)) {
		throw new Error('Method "' + method + '" is not allowed!');
	}

	return this[METHOD] = method;
});

/**
 * Information on the HTTP method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Object}
 */
Request.setProperty(function method_info() {
	return Request.getMethodInfo(this.method);
});

/**
 * The URL
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {RURL}
 */
Request.setProperty(function url() {
	return this[URL];
}, function setUrl(url) {
	return this.setUrl(url);
});

/**
 * Get the response content type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {string|undefined}
 */
Request.setProperty(function content_type() {

	let content_type = this.getResponseHeader('content-type');

	if (content_type) {

		if (content_type.indexOf(';') > -1) {
			content_type = Bound.String.before(content_type, ';');
		}

		return content_type;
	}

	if (Blast.isBrowser && this.xhr_res) {
		return this.xhr_res.type;
	}

	if (this.cached_request) {
		return this.cached_request.content_type;
	}
});

/**
 * Deprecated reference to the status number
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {number}
 */
Request.setProperty(function statusCode() {
	return this.status;
});

/**
 * Set options
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.5
 */
Request.setMethod(function setOptions(options) {

	var set_method,
	    info,
	    body,
	    get,
	    key;

	if (!options) {
		return;
	}

	if (typeof options == 'string' || Blast.Classes.RURL.isUrl(options)) {
		return this.setUrl(options);
	} else if (options.url || options.href) {
		this.setUrl(options.url || options.href);
	}

	for (key in options) {

		// See if the key is one of the valid http request methods
		info = Request.getMethodInfo(key);

		if (info) {
			if (!options[key]) {
				continue;
			}

			// Skip setting the GET method if another one was already set
			if (info.method == 'GET' && set_method) {
				// Ignore
			} else {
				this.method = key;
				set_method = true;
			}

			if (info.has_body) {
				body = options[key];
			}
		} else {
			if (key == 'headers') {
				this.setHeader(options[key]);
			} else {
				this[key] = options[key];
			}
		}
	}

	if (body) {
		this.body = body;
	}

	if (options.body != null) {
		this.body = options.body;
	}

	if (options.get) {
		this.get = options.get;
	}

});

/**
 * Set the URL to request
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.2
 *
 * @param    {URL|String}   url
 */
Request.setMethod(function setUrl(url, origin) {

	if (typeof url == 'string') {

		if (arguments.length == 1 && Blast.isBrowser) {
			origin = window.location;
		}

		this[URL] = Blast.Classes.RURL.parse(url, origin);
	} else {
		this[URL] = url;
	}
});

/**
 * Set header
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.2
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

	name = String(name).toLowerCase();

	// If only the name is given, return the value
	if (arguments.length == 1) {
		return this.headers[name];
	}

	this.headers[name] = value;
});

/**
 * Start this request
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.7.10
 *
 * @return   {Pledge}
 */
Request.setMethod(function start() {

	var that = this;

	// Set the time when the request started
	if (this.time_started == null) {
		this.time_started = Date.now();
	}

	// Don't start the same request twice
	if (this.original_url) {
		return;
	}

	if (this.get && typeof this.get == 'object') {
		this.url.addQuery(this.get);
	}

	let pledge,
	    key;

	if (this.method == 'GET' && this.cache !== false && this.blast_cache !== false) {
		key = Blast.Classes.Object.checksum([this.url.href, this.headers, this.download_if_inline, this.get_stream]);
		pledge = Request.cache.get(key);

		if (pledge) {
			return this._resolveWithCache(pledge, key);
		}
	}

	// Do the response, follow redirects
	pledge = this[MAKE_REQUEST](key);

	return pledge;
});

/**
 * Parse a response
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.16
 *
 * @param    {string}   response_body
 *
 * @return   {Object}
 */
Request.setMethod(function _parseResponse(response_body, error) {

	// Remember the raw response body
	this.raw_response_body = response_body;

	if (!error && this.status >= 400) {
		error = new Error(this.status_message);
		error.request = this;
		error.status = error.number = this.status;
	}

	let result;

	if (this.content_type && this.content_type.indexOf('json') > -1) {

		result = Bound.JSON.safeParse(response_body);

		if (this.allow_json_dry_response) {
			try {
				result = Bound.JSON.undry(result);
			} catch (parse_error) {
				if (!error) {
					error = parse_error;
				}
			}
		}
	} else {
		result = response_body;
	}

	if (error) {
		error.result = result;

		// If there is an error and a response object, it might contain more data
		if (result && typeof result == 'object') {
			let server_error;

			if (result instanceof Error) {
				server_error = result;
			} else if (result.error && result.error instanceof Error) {
				server_error = result.error;
			} else if (result.message && result.message instanceof Error) {
				server_error = result.message;
			}

			if (server_error) {
				error.message = server_error.message;
				error.stack = server_error.stack;
			}
		}
	}

	if (!error) {
		error = null;
	}

	this.result = result;
	this.error  = error;

	return {
		result : result,
		error  : error,
	};
});

/**
 * Resolve with a cached response
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @param    {Pledge}   cached_pledge   The Pledge gotten from the cache
 * @param    {string}   key             The key that was used in the cache
 *
 * @return   {Pledge}
 */
Request.setMethod(function _resolveWithCache(cached_pledge, key) {

	let ori_req = cached_pledge[ORIGINAL_REQUEST];

	// If no original request instance is found, or it had an error,
	// make the request anyway!
	if (!ori_req || ori_req.error || ori_req.cancelled) {
		return this[MAKE_REQUEST](key);
	}

	let result = new Blast.Classes.Pledge();

	this.cached_request = ori_req;
	result.request = this;

	Blast.Classes.Pledge.done(cached_pledge, (err, res) => {

		if (err || ori_req.error) {
			this.cached_request = null;
			result.resolve(this[MAKE_REQUEST](key));
			return;
		}

		this.time_ended = Date.now();

		let parsed = this._parseResponse(ori_req.raw_response_body, ori_req.error || err);

		if (parsed.error) {
			result.reject(parsed.error);
		} else {
			result.resolve(parsed.result);
		}
	});

	return result;
});

/**
 * Make the request and potentially cache it
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @param    {string}   key   The key that should be used in the cache
 *
 * @return   {Pledge}
 */
Request.setMethod(MAKE_REQUEST, function makeRequest(key) {

	let pledge = this._make_request();

	if (key) {
		let max_age;

		if (typeof this.cache == 'number') {
			max_age = this.cache;
		}

		Request.cache.set(key, pledge, max_age);
		pledge[ORIGINAL_REQUEST] = this;
	}

	return pledge;
});

/**
 * A small Response class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @param    {Develry.Request}   request
 */
const Response = Collection.Function.inherits('Informer', 'Develry', function Response(request) {
	this.request = request;
});

/**
 * Reference to the response status number
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {number}
 */
Response.setProperty(['status', 'statusCode'], function status() {
	return this.request.status;
});

/**
 * Reference to all the response headers
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.10
 * @version  0.7.10
 *
 * @type     {object}
 */
Response.setProperty(function headers() {
	return this.request.getAllResponseHeaders();
});

/**
 * Get the response body
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.22
 * @version  0.7.22
 *
 * @type     {*}
 */
Response.setProperty(function body() {
	return this.request.result;
});

/**
 * Fetch a simple resource
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.7.10
 *
 * @param    {Object}     options
 * @param    {Function}   callback
 *
 * @return   {Pledge}
 */
Blast.fetch = function fetch(options, callback) {

	var pledge,
	    req = new Request();

	if (callback && typeof callback == 'object') {
		let url = options;
		options = callback;
		callback = null;
		options.url = url;
	}

	// Set the url
	req.setOptions(options);

	// Start the request
	pledge = req.start();

	// Add a reference to the request instance on the pledge
	pledge.request = req;

	// Handle the callback
	if (callback) {
		pledge.done(function done(err, output) {

			let response = new Response(req);

			if (err) {
				return callback(err, response);
			}

			callback(null, response, output);
		});
	}

	return pledge;
};