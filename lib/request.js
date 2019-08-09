module.exports = function BlastRequest(Blast, Collection) {

	var method_symbol = Symbol('method'),
	    url_symbol    = Symbol('url');

	/**
	 * The Request class in the Develry namespace,
	 * inherits from the Informer class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.6.2
	 *
	 * @param    {Object|RURL}   options
	 */
	var Request = Collection.Function.inherits('Informer', 'Develry', function Request(options) {

		// Empty headers object
		this.headers = {};

		// Keep track of the number of times we've been redirected
		this.redirect_count = 0;

		// Store the original requested url (as string)
		this.original_url = '';

		if (options) {
			this.setOptions(options);
		}

		if (Blast.isNode) {
			// Accept gzip by default
			this.setHeader('accept-encoding', 'gzip');
		}
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
	 * The HTTP method name to use
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.6.2
	 *
	 * @type     {String}
	 */
	Request.setProperty(function method() {

		if (this[method_symbol]) {
			return this[method_symbol];
		}

		return 'GET';
	}, function setMethod(method) {

		method = String(method).toUpperCase();

		if (!Request.isAllowedMethod(method)) {
			throw new Error('Method "' + method + '" is not allowed!');
		}

		return this[method_symbol] = method;
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
		return this[url_symbol];
	}, function setUrl(url) {
		return this.setUrl(url);
	});

	/**
	 * Set options
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.7.0
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

			this[url_symbol] = Blast.Classes.RURL.parse(url, origin);
		} else {
			this[url_symbol] = url;
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
	 * @version  0.6.2
	 *
	 * @return   {Pledge}
	 */
	Request.setMethod(function start() {

		var that = this;

		// Don't start the same request twice
		if (this.original_url) {
			return;
		}

		if (this.get && typeof this.get == 'object') {
			this.url.addQuery(this.get);
		}

		// Date when the request started
		this.request_start = Date.now();

		// Do the response, follow redirects
		return this._make_request();
	});

	/**
	 * Fetch a simple resource
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.6.4
	 *
	 * @param    {Object}     options
	 * @param    {Function}   callback
	 *
	 * @return   {Pledge}
	 */
	Blast.fetch = function fetch(options, callback) {

		var pledge,
		    req = new Request();

		// Set the url
		req.setOptions(options);

		// Start the request
		pledge = req.start();

		// Add a reference to the request instance on the pledge
		pledge.request = req;

		// Handle the callback
		if (callback) {
			pledge.done(function done(err, result) {

				if (err) {
					return callback(err, req.response);
				}

				callback(null, req.response, result);
			});
		}

		return pledge;
	};

	// PROTOBLAST START CUT
	if (!Blast.isNode) {
		return;
	}

	require('./request_server.js')(Blast, Collection);
	// PROTOBLAST END CUT
};