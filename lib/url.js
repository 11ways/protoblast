module.exports = function BlastURL(Blast, Collection) {

	var queryString,
	    liburl,
	    NewURL,
	    props;

	props = [
		'href',
		'protocol',
		'host',
		'hostname',
		'pathname',
		'search',
		'username',
		'password',
		'hash',
		'port',
		'origin',
		'auth',
		'path',
		'query',
		'slashes'
	];

	/**
	 * The URL class is present on all modern browsers.
	 * It is not in node.js or IE9
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 */
	NewURL = Blast.defineClass('URL', function URL(url) {

		var auth;

		// These should always be filled in
		this.href = null;
		this.protocol = null;
		this.host = null;
		this.hostname = null;
		this.pathname = null;

		// These could be empty, but should not be null
		this.search = '';
		this.username = '';
		this.password = '';
		this.hash = '';
		this.port = '';

		// Parse the url
		if (this.parse) {
			this.parse(url);
		} else {
			parse.call(this, url);
		}

		// Add the origin
		this.origin = this.protocol + '//' + this.hostname;

		// 'auth' is not used on the browser
		if (this.auth) {
			auth = this.auth.split(':');
			this.username = auth[0];
			this.password = auth[1] || '';

			// Unset auth
			this.auth = undefined;
		}

		// These are properties that are not in the browser,
		// so we shouldn't use them in node either
		this.path = undefined;
		this.query = undefined;
		this.slashes = undefined;
	}, true);

	// IE10 has a URL class, but it doesn't work.
	if (Blast.isIE || Blast.isEdge) {
		Blast.Classes.URL = NewURL;
		Blast.Bound.URL = {};
		Blast.Collection.URL = NewURL;

		Blast.definePrototype(NewURL, 'parse', parse);
	} else if (!Blast.isNode) {
		// Detect broken URL constructor objects
		if (Object.prototype.toString.call(window.URL) == '[object URLConstructor]') {
			Blast.Classes.URL = NewURL;
			Blast.Bound.URL = {};
			Blast.Collection.URL = NewURL;
		}
	}

	// Add the URL-module prototype methods
	if (Blast.isNode && !Blast.isNWWindow) {
		liburl = require('url');
		Blast.Classes.URL.prototype = Object.create(liburl.Url.prototype);
	}

	/**
	 * Parse a url string.
	 * For use inside the prototype
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.3.6
	 *
	 * @param    {String}   url
	 *
	 * @return   {URL}
	 */
	function parse(url) {

		var anchor,
		    temp,
		    i;

		if (url && url.href) {
			url = ''+url.href;
		}

		temp = document.createElement('a');
		temp.href = url;

		anchor = document.createElement('a');
		anchor.href = ''+temp;

		// Add the properties of the anchor to our instance
		for (i = 0; i < props.length; i++) {
			if (props[i] in anchor) {
				this[props[i]] = anchor[props[i]];
			}
		}

		// Remove the injected toString
		this.toString = Blast.Classes.URL.prototype.toString;
	}

	/**
	 * Parse a url string.
	 * Same as 'new Url()'
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.12
	 *
	 * @param    {String}   url
	 *
	 * @return   {URL}
	 */
	Blast.defineStatic('URL', 'parse', function parse(url, origin) {

		var result,
		    temp;

		if (Blast.isNode) {

			if (origin) {
				url = liburl.resolve(origin, url);
			}

			result = new NewURL(url);
		} else {

			if (!origin) {
				origin = document.location;
			}

			result = new Blast.Classes.URL(url, origin);
		}

		return result;
	});

	/**
	 * Return the URL as a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.12
	 *
	 * @return   {String}
	 */
	function toString() {

		var result = '';

		if (this.protocol) {
			result = this.protocol + '//';
		}

		if (this.username) {
			result += this.username;

			if (this.password) {
				result += ':' + this.password;
			}

			result += '@';
		}

		if (this.hostname) {
			result += this.hostname;

			if (this.port) {
				result += ':' + this.port;
			}
		}

		if (!this.pathname || this.pathname[0] != '/') {
			result += '/';
		}

		result += this.pathname;
		result += this.search;
		result += this.hash;

		return result;
	}

	if (Blast.isNW || Blast.isNode) {
		// Force our version of toString
		Blast.definePrototype('URL', 'toString', toString);
	} else {
		Blast.definePrototype('URL', 'toString', toString, true);
	}

	/**
	 * Clone this URL object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {URL}
	 */
	Blast.definePrototype('URL', 'clone', function clone() {

		if (Blast.isNode) {
			return Object.assign(Object.create(Collection.URL.prototype), this);
		}

		return Collection.URL.parse(this.href);
	});

	/**
	 * Get or set a GET query parameter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}   name
	 * @param    {String}   value
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('URL', 'param', function param(name, value) {

		// Make sure the search object exists
		if (!this._search) {
			this._search = Collection.URL.parseQuery(this.search.slice(1)||'');
		}

		if (arguments.length == 1) {
			return this._search[name];
		}

		this.addQuery(name, value);
	});

	/**
	 * Add get parameters to the URL object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {String|Object}   params
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('URL', 'addQuery', function addQuery(params, value) {

		var query,
		    temp,
		    key;

		// If no valid parameters are given, do nothing
		if (!params) {
			return;
		}

		// Make sure the search object exists
		if (!this._search) {
			this._search = Collection.URL.parseQuery(this.search.slice(1)||'');
		}

		query = this._search;

		if (typeof params === 'string') {
			// The params should not start with a question mark or an ampersand
			if (params[0] === '?' || params[0] === '&') {
				params = params.slice(1);
			}

			if (arguments.length == 1) {
				temp = Collection.URL.parseQuery(params);
			} else {

				if (value == null) {
					delete query[params];
				} else {
					query[params] = value;
				}
			}
		} else if (params && typeof params == 'object') {
			for (key in params) {
				Blast.Bound.URL.addQuery(this, key, params[key]);
			}
		}

		temp = Collection.URL.encodeQuery(this._search);

		if (temp) {
			this.search = '?' + temp;
		} else {
			this.search = '';
		}
	});

	// Don't do the rest if we're not running on node
	if (!Blast.isNode) {
		return;
	}

	// Get the querystring module
	queryString = require('querystring');

	/**
	 * Serialize an object to a query string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Object}   obj
	 * @param    {String}   sep
	 * @param    {String}   eq
	 * @param    {Object}   options
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('URL', 'encodeQuery', queryString.encode);

	/**
	 * Parse a query string to an object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   str
	 * @param    {String}   sep
	 * @param    {String}   eq
	 * @param    {Object}   options
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('URL', 'parseQuery', queryString.parse);

};