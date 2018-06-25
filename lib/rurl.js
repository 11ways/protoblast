module.exports = function BlastURL(Blast, Collection) {

	var rx_protocol = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i,
	    rx_slashes  = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//,
	    queryString,
	    liburl,
	    props,
	    RURL,
	    key;

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
	 * A URL class that accepts relative urls, like it should
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @author   Arnout Kazemier
	 * @since    0.1.3
	 * @version  0.5.7
	 *
	 * @param    {String}           address
	 * @param    {String|Boolean}   base
	 */
	RURL = Collection.Function.inherits(function RURL(address, base) {
		this._data = {};

		if (arguments.length) {
			this._parseInput(address, base);
		}
	});

	/**
	 * The rules used for parsing the url
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {Array}
	 */
	RURL.setStatic('parse_rules', [
		['#',       'hash'],                      // Extract from the back
		['?',       'search'],                    // Extract from the back
		['/',       'pathname'],                  // Extract from the back
		['@',       'auth',     1],               // Extract from the front
		[NaN,       'host',     undefined, 1, 1], // Set left over value
		[/:(\d+)$/, 'port',     undefined, 1],    // RegExp the back
		[NaN,       'hostname', undefined, 1, 1]  // Set left over
	]);

	/**
	 * Parse a URL string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.5.7
	 *
	 * @param    {String}   address
	 * @param    {String}   base
	 *
	 * @return   {RURL}
	 */
	RURL.setStatic(function parse(address, base) {
		return new RURL(address, base);
	});

	/**
	 * Is this port required for the given protocol?
	 *
	 * @author   Arnout Kazemier
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {Number}   port
	 * @param    {String}   protocol
	 *
	 * @return   {Boolean}
	 */
	RURL.setStatic(function requiresPort(port, protocol) {

		if (!protocol) {
			return false;
		}

		protocol = protocol.split(':')[0];
		port = +port;

		if (!port) {
			return false;
		}

		switch (protocol) {
			case 'http':
			case 'ws':
				return port !== 80;

			case 'https':
			case 'wss':
				return port !== 443;

			case 'ftp':
				return port !== 21;

			case 'gopher':
				return port !== 70;

			case 'file':
				return false;
		}

		return port !== 0;
	});

	/**
	 * Does this protocol require slashes?
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   protocol
	 *
	 * @return   {Boolean}
	 */
	RURL.setStatic(function requiresSlashes(protocol) {

		if (!protocol) {
			return null;
		}

		protocol = protocol.toLowerCase();

		if (protocol[protocol.length - 1] == ':') {
			protocol = protocol.slice(0, protocol.length - 1);
		}

		switch (protocol) {
			case 'https':
			case 'http':
			case 'wss':
			case 'ws':
			case 'ftp':
			case 'gopher':
			case 'file':
			case 'ldap':
			case 'crid':
			case 'irc':
				return true;

			case 'view-source':
			case 'magnet':
			case 'mailto':
			case 'about':
			case 'data':
			case 'sips':
			case 'geo':
			case 'sip':
				return false;
		}

		return null;
	});

	/**
	 * Parse & fix current location
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   address
	 *
	 * @return   {RURL}
	 */
	RURL.setStatic(function parseLocation(address) {

		var location = Blast.Globals.location || {},
		    result,
		    type,
		    key;

		if (!address) {
			address = location;
		}

		type = typeof address;

		if (address.protocol == 'blob:') {
			result = new RURL(unescape(address.pathname));
		} else if (type == 'string') {
			result = new RURL(address);

			result.hash = null;
			result.query = null;

		} else if (type == 'object') {
			result = new RURL();

			for (key in address) {

				if (key == 'hash' || key == 'query' || key == 'search') {
					continue;
				}

				result[key] = address[key];
			}

			if (result.slashes === undefined) {
				result.slashes = rx_slashes.test(address.href);
			}
		}

		return result;
	});

	/**
	 * Is the given path absolute?
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   path
	 *
	 * @return   {Boolean}
	 */
	RURL.setStatic(function isAbsolutePath(path) {
		return path[0] == '/';
	});

	/**
	 * Resolve a path
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   from
	 * @param    {String}   to
	 * @param    {Boolean}  resolve_up
	 *
	 * @return   {String}
	 */
	RURL.setStatic(function resolvePath(from, to, must_end_abs) {

		var from_parts   = from.split('/'),
		    to_parts     = to.split('/'),
		    from_is_abs  = RURL.isAbsolutePath(from),
		    to_is_abs    = RURL.isAbsolutePath(to),
		    must_end_abs,
		    has_trailing_slash,
		    result,
		    part,
		    last,
		    up,
		    i;

		if (!must_end_abs) {
			must_end_abs = from_is_abs || to_is_abs;
		}

		if (to && to_is_abs) {
			from_parts = to_parts;
		} else if (to && to_parts.length) {
			// To is relative, so we can drop the "filename"
			from_parts.pop();
			from_parts = from_parts.concat(to_parts);
		}

		if (!from_parts.length) {
			return '/';
		}

		if (from_parts.length) {
			last = from_parts[from_parts.length - 1];
			has_trailing_slash = (last == '.' || last == '..' || last === '');
		} else {
			has_trailing_slash = false;
		}

		up = 0;

		// Iterate over the from parts in reverse
		for (i = from_parts.length; i >= 0; i--) {
			part = from_parts[i];

			if (part == '.') {
				from_parts.splice(i, 1);
			} else if (part == '..') {
				from_parts.splice(i, 1);
				up++;
			} else if (up) {
				from_parts.splice(i, 1);
				up--;
			}
		}

		if (!must_end_abs) {
			while (up) {
				from_parts.unshift('..');
				up--;
			}
		}

		if (must_end_abs && from_parts[0] !== '' && (!from_parts[0] || !RURL.isAbsolutePath(from_parts[0]))) {
			from_parts.unshift('');
		}

		result = from_parts.join('/');

		if (has_trailing_slash && result.substr(-1) != '/') {
			result += '/';
		}

		return result;
	});

	/**
	 * Resolve full urls
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   from
	 * @param    {String}   to
	 *
	 * @return   {String}
	 */
	RURL.setStatic(function resolve(from, to) {

		var url = new RURL();

		url._parseInput(to, from, false);

		return url.href;
	});

	/**
	 * Extract the protocol information from a URL (with or without double slash)
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   address
	 *
	 * @return   {Object}
	 */
	RURL.setStatic(function extractProtocol(address) {

		var match = rx_protocol.exec(address),
		    result;

		result = {
			protocol : match[1] ? match[1].toLowerCase() : '',
			slashes  : !!match[2],
			rest     : match[3]
		};

		return result;
	});

	/**
	 * Encode a URI query
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.1
	 * @version  0.4.1
	 *
	 * @param    {String}   val
	 * @param    {Boolean}  pct_encode_spaces
	 *
	 * @return   {String}
	 */
	RURL.setStatic(function encodeUriQuery(val, pct_encode_spaces) {
		return encodeURIComponent(val)
			.replace(/%40/gi, '@')
			.replace(/%3A/gi, ':')
			.replace(/%24/g, '$')
			.replace(/%2C/gi, ',')
			.replace(/%20/g, (pct_encode_spaces ? '%20' : '+'));
	});

	/**
	 * We need our custom method because encodeURIComponent is too aggressive
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.1
	 * @version  0.4.1
	 *
	 * @param    {String}   val
	 * @param    {Boolean}  pct_encode_spaces
	 *
	 * @return   {String}
	 */
	RURL.setStatic(function encodeUriSegment(val) {
		return RURL.encodeUriQuery(val, true)
			.replace(/%5b/gi, '[')
			.replace(/%5d/gi, ']');
	});

	/**
	 * Pathname getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(['path', 'pathname'], function pathname() {
		return this._data.pathname;
	}, function setPathname(pathname) {

		if (pathname && pathname[0] != '/') {
			pathname = '/' + pathname;
		}

		return this._data.pathname = pathname;
	});

	/**
	 * Resource getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function resource() {
		var pathname = this.pathname,
		    search = this.search,
		    hash = this.hash,
		    result = '';

		if (!pathname || pathname[0] != '/') {
			if (this.slashes) {
				result += '/';
			}
		}

		if (pathname) {
			result += pathname;
		}

		if (search) {
			result += search;
		}

		if (hash) {
			result += hash;
		}

		return result;
	}, function setResource(resource) {

		var href;

		this.hash = '';
		this.search = '';
		this.pathname = resource;

		this._parseInput(this.href);

		return this.resource;
	});

	/**
	 * Segment getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {Array}
	 */
	RURL.setProperty(function segments() {

		if (this._data.segments == null) {
			this._data.segments = this.pathname.slice(1).split('/');
		}

		return this._data.segments;
	}, function setSegments(segments) {

		this._data.segments = segments;
		this._data.pathname = '/' + segments.join('/');

		return segments;
	});

	/**
	 * Host getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function host() {
		return this._data.host;
	}, function setHost(host) {

		var pieces;

		host = (host || '').toLowerCase();

		this._data.host = host;

		// IPv6 urls can contain colons, so we need to check this way
		if (/:\d+$/.test(host)) {
			pieces = host.split(':');
			this._data.port = pieces.pop() || '';
			this._data.hostname = pieces.join(':');
		} else {
			this._data.hostname = host;
			this._data.port = '';
		}

		return host;
	});

	/**
	 * Hostname getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function hostname() {
		return this._data.hostname;
	}, function setHostname(hostname) {

		if (!hostname) {
			hostname = '';
		}

		hostname = hostname.toLowerCase();

		// Set the new hostname
		this._data.hostname = hostname;

		// Trigger a `host` update by setting the port
		this.port = this.port;

		return hostname;
	});

	/**
	 * Port getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function port() {
		return this._data.port;
	}, function setPort(port) {

		var host;

		if (!RURL.requiresPort(port, this.protocol)) {
			port = '';
		}

		this._data.port = port;

		host = this.hostname;

		if (port) {
			host = host + ':' + port;
		}

		this.host = host;

		return port;
	});

	/**
	 * Protocol getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function protocol() {
		return this._data.protocol;
	}, function setProtocol(protocol) {

		var requires_slashes,
		    has_slashes,
		    temp;

		if (protocol) {
			protocol = protocol.toLowerCase();
		}

		has_slashes = this.slashes;
		requires_slashes = RURL.requiresSlashes(protocol);

		if (protocol && protocol[protocol.length - 1] != ':') {
			protocol += ':';
		}

		this._data.protocol = protocol;

		if (requires_slashes != null) {
			this.slashes = requires_slashes;

			if (has_slashes != requires_slashes && !this.host) {
				temp = this.protocol;

				if (requires_slashes) {
					temp += '//';
				}

				temp += this.pathname;
				this._parseInput(temp);
			}

		}

		return protocol;
	});

	/**
	 * Search getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function search() {
		return this._data.search;
	}, function setSearch(search) {
		this._data.query = null;
		return this._data.search = search;
	});

	/**
	 * Query getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {Object}
	 */
	RURL.setProperty(function query() {

		if (this._data.query == null) {
			this._data.query = RURL.parseQuery(this.search);
		}

		return this._data.query;
	}, function setQuery(query) {
		this._data.query = query;

		if (Blast.Bound.Object.size(query)) {
			this._data.search = '?' + RURL.encodeQuery(query);
		} else {
			this._data.search = '';
		}

		return query;
	});

	/**
	 * Origin getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function origin() {

		if (this.protocol && this.host && this.protocol != 'file:') {
			return this.protocol + '//' + this.host;
		} else {
			return 'null';
		}

	}, function setOrigin(origin) {
		var pieces = origin.split('//');

		this._data.protocol = pieces[0];
		this._data.hostname = pieces[1];
	});

	/**
	 * Hash getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function hash() {
		return this._data.hash;
	}, function setHash(hash) {

		if (hash && hash[0] != '#') {
			hash = '#' + hash;
		}

		return this._data.hash = hash;
	});

	/**
	 * Fragment getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function fragment() {

		var hash = this.hash;

		if (hash) {
			hash = hash.slice(1);
		}

		return hash;

	}, function setFragment(fragment) {
		this.hash = fragment;
		return this.fragment;
	});

	/**
	 * Href getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function href() {
		return this.toString();
	}, function setHref(href) {
		this._parseInput(href);
		return this.href;
	});

	/**
	 * Auth getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function auth() {
		return this._data.auth;
	}, function setAuth(auth) {
		this._data.auth = auth;
		this._parseAuth();
		return auth;
	});

	/**
	 * Username getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function username() {
		return this._data.username || '';
	}, function setUsername(username) {

		var auth = username || '';

		this._data.username = username;

		if (this.password) {
			auth += ':' + this.password;
		}

		this._data.auth = auth;

		return username;
	});

	/**
	 * Password getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {String}
	 */
	RURL.setProperty(function password() {
		return this._data.password || '';
	}, function setPassword(password) {

		var auth = this.username;

		this._data.password = password;

		if (auth || password) {
			auth += ':';
		}

		if (password) {
			auth += password;
		}

		this._data.auth = auth;

		return password;
	});

	/**
	 * Slashes getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @type     {Boolean}
	 */
	RURL.setProperty(function slashes() {
		return this._data.slashes;
	}, function setSlashes(slashes) {
		return this._data.slashes = slashes;
	});

	/**
	 * Parse the auth part
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.5.7
	 *
	 * @return   {RURL}
	 */
	RURL.setMethod(function _parseAuth() {

		var auth = this._data.auth,
		    temp;

		if (auth) {
			temp = auth.split(':');
			this._data.username = temp[0];
			this._data.password = temp[1];
		} else {
			this._data.username = '';
			this._data.password = '';
		}
	});

	/**
	 * Get or set a specific segment
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {Number}   index
	 * @param    {String}   value
	 */
	RURL.setMethod(function segment(index, value) {

		var len = arguments.length;

		if (len == 0) {
			return this.segments;
		}

		if (typeof index == 'string') {
			index = index.toLowerCase();

			if (index == 'first') {
				index = 0;
			} else if (index == 'last') {
				index = this.segments.length - 1;
			}
		}

		if (index < 0) {
			index = this.segments.length + index;
		}

		if (len == 1) {

			if (Array.isArray(index)) {
				this.segments = index;
				return;
			}

			return this.segments[index];
		}

		this.segments[index] = value;
		this.segments = this.segments;
	});

	/**
	 * Clone the url
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.5.7
	 *
	 * @return   {RURL}
	 */
	RURL.setMethod(function clone() {

		var data = Blast.Bound.JSON.clone(this._data),
		    rurl = Object.create(RURL.prototype);

		rurl._data = data;

		return rurl;
	});

	/**
	 * Return the URL as a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.4.1
	 *
	 * @return   {String}
	 */
	RURL.setMethod(function toString() {

		var result = '';

		if (this.protocol) {
			result = this.protocol;

			if (this.slashes) {
				result += '//';
			}
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

		result += this.resource;

		return result;
	});

	/**
	 * Parse the input
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}           address
	 * @param    {String|Boolean}   base
	 * @param    {Boolean}          must_end_abs
	 */
	RURL.setMethod(function _parseInput(address, base, must_end_abs) {

		var extracted,
		    relative,
		    location,
		    index,
		    parse,
		    rules,
		    rule,
		    data,
		    rest,
		    key;

		// Extract protocol information
		extracted = RURL.extractProtocol(address);

		// Is this relative?
		relative = !extracted.protocol && !extracted.slashes;

		// @TODO: must_end_abs doesn't seem to do much
		if (must_end_abs == null) {
			must_end_abs = true;
		}

		if (base) {
			location = RURL.parseLocation(base);
		}

		// The data object
		data = this._data;

		// Store the protocol
		data.protocol = extracted.protocol || (location && location.protocol) || '';

		// Store the slashes
		data.slashes = extracted.slashes || relative && location && location.slashes;

		// Get the rest of the address
		rest = extracted.rest;

		// Get the rules
		rules = RURL.parse_rules.slice(0);

		if (!extracted.slashes) {
			rules[2] = [/(.*)/, 'pathname'];
		}

		while (rules.length) {
			rule = rules.shift();
			parse = rule[0];
			key = rule[1];

			// Unset the value
			data[key] = '';

			if (parse !== parse) {
				data[key] = rest;
			} else if (typeof parse == 'string') {
				index = rest.indexOf(parse);

				if (index > -1) {
					if (typeof rule[2] == 'number') {
						data[key] = rest.slice(0, index);
						rest = rest.slice(index + rule[2]);
					} else {
						data[key] = rest.slice(index);
						rest = rest.slice(0, index);
					}
				}
			} else if ((index = parse.exec(rest))) {
				data[key] = index[1];
				rest = rest.slice(0, index.index);
			}

			data[key] = data[key] || (relative && rule[3] ? location && location[key] || '' : '');

			// Lowercase hostname, host & protocol
			if (rule[4]) {
				data[key] = data[key].toLowerCase();
			}
		}

		// If the url is relative, resolve the pathname against the base url
		if (relative && location) {
			if (data.pathname[0] != '/' && (data.pathname !== '' || location.pathname !== '')) {
				data.pathname = RURL.resolvePath(location.pathname, data.pathname, must_end_abs);

				if (data.pathname && data.pathname[0] != '/') {
					data.pathname = '/' + data.pathname;
				}
			}
		}

		// Certain ports are not required and can safely be removed
		if (!RURL.requiresPort(data.port, data.protocol)) {
			data.host = data.hostname;
			data.port = '';
		}

		this._parseAuth();
	});

	/**
	 * Get or set a GET query parameter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.5.7
	 *
	 * @param    {String}   name
	 * @param    {String}   value
	 *
	 * @return   {String}
	 */
	RURL.setMethod(function param(name, value) {

		// Make sure the search object exists
		if (!this._search) {
			this._search = RURL.parseQuery(this.search.slice(1)||'');
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
	 * @version  0.5.7
	 *
	 * @param    {String|Object}   params
	 * @param    {Mixed}           value
	 */
	RURL.setMethod(function addQuery(params, value) {

		var param_val,
		    query,
		    temp,
		    key,
		    i;

		// If no valid parameters are given, do nothing
		if (!params) {
			return;
		}

		// Make sure the search object exists
		if (!this._search) {
			this._search = RURL.parseQuery(this.search.slice(1)||'');
		}

		query = this._search;

		if (typeof params === 'string') {
			// The params should not start with a question mark or an ampersand
			if (params[0] === '?' || params[0] === '&') {
				params = params.slice(1);
			}

			if (arguments.length == 1) {
				temp = RURL.parseQuery(params);
			} else {

				if (value == null) {
					delete query[params];
				} else {

					if (value && typeof value == 'object') {

						if (Collection.Array.likeArray(value)) {
							for (i = 0; i < value.length; i++) {
								temp = params + '[' + i + ']';
								addQuery.call(this, temp, value[i]);
							}
						} else if (!Collection.Object.isPlainObject(value)) {
							// Don't iterate over non-plain objects,
							// like class instances
							this.addQuery(params, String(value));
						} else {
							for (key in value) {
								temp = params + '[' + key + ']';
								addQuery.call(this, temp, value[key]);
							}
						}
					} else {
						query[params] = value;
					}
				}
			}
		} else if (params && typeof params == 'object') {
			for (key in params) {
				this.addQuery(key, params[key]);
			}
		}

		temp = RURL.encodeQuery(this._search);

		if (temp) {
			this.search = '?' + temp;
		} else {
			this.search = '';
		}

		this.href = String(this);
	});

	// Make it a global class
	Blast.defineClass('RURL', RURL);

	// Also store under URL, because who cares about the standard URL class anyway
	Blast.Classes.URL = RURL;
	Blast.Collection.URL = RURL;

	if (Blast.isNode) {
		liburl = require('url');
		queryString = require('querystring');

		/**
		 * Serialize an object to a query string
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.1.3
		 * @version  0.5.7
		 *
		 * @param    {Object}   obj
		 * @param    {String}   sep
		 * @param    {String}   eq
		 * @param    {Object}   options
		 *
		 * @return   {String}
		 */
		RURL.setStatic(function encodeQuery(obj, sep, eq, options) {

			if (!options) {
				options = {};
			}

			if (!options.encodeURIComponent) {
				options.encodeURIComponent = RURL.encodeUriSegment;
			}

			return queryString.encode(obj, sep, eq, options);
		});

		/**
		 * Parse a query string to an object
		 *
		 * @author   Jelle De Loecker   <jelle@develry.be>
		 * @since    0.1.3
		 * @version  0.5.7
		 *
		 * @param    {String}   str
		 * @param    {String}   sep
		 * @param    {String}   eq
		 * @param    {Object}   options
		 *
		 * @return   {Object}
		 */
		RURL.setStatic(function parseQuery(str, sep, eq, options) {

			if (str[0] == '?') {
				str = str.slice(1);
			}

			return queryString.parse(str, sep, eq, options);
		});

		return;
	}

	/**
	 * Serialize an object to a query string
	 *
	 * @author   Joyent, Inc. and other Node contributors
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.4.1
	 *
	 * @param    {Object}   obj
	 * @param    {String}   sep
	 * @param    {String}   eq
	 * @param    {Object}   options
	 *
	 * @return   {String}
	 */
	RURL.setStatic(function encodeQuery(obj, sep, eq, options) {
		sep = sep || '&';
		eq = eq || '=';

		// Use our custom method, so brackets don't get encoded
		var encode = RURL.encodeUriSegment;

		if (options && typeof options.encodeURIComponent === 'function') {
			encode = options.encodeURIComponent;
		}

		if (obj && typeof obj === 'object') {
			var keys = Object.keys(obj);
			var fields = [];

			for (var i = 0; i < keys.length; i++) {
				var k = keys[i];
				var v = obj[k];
				var ks = encode(stringifyPrimitive(k)) + eq;

				if (Array.isArray(v)) {
					for (var j = 0; j < v.length; j++)
						fields.push(ks + encode(stringifyPrimitive(v[j])));
				} else {
					fields.push(ks + encode(stringifyPrimitive(v)));
				}
			}
			return fields.join(sep);
		}
		return '';
	});

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
	RURL.setStatic(function parseQuery(qs, sep, eq, options) {

		sep = sep || '&';
		eq = eq || '=';
		var obj = {};

		if (typeof qs !== 'string' || qs.length === 0) {
			return obj;
		}

		var regexp = /\+/g;
		qs = qs.split(sep);

		var maxKeys = 1000;
		if (options && typeof options.maxKeys === 'number') {
			maxKeys = options.maxKeys;
		}

		var len = qs.length;
		// maxKeys <= 0 means that we should not limit keys count
		if (maxKeys > 0 && len > maxKeys) {
			len = maxKeys;
		}

		var decode = decodeURIComponent;
		if (options && typeof options.decodeURIComponent === 'function') {
			decode = options.decodeURIComponent;
		}

		for (var i = 0; i < len; ++i) {
			var x = qs[i].replace(regexp, '%20'),
			    idx = x.indexOf(eq),
			    kstr, vstr, k, v;

			if (idx >= 0) {
				kstr = x.substr(0, idx);
				vstr = x.substr(idx + 1);
			} else {
				kstr = x;
				vstr = '';
			}

			k = decode(kstr);
			v = decode(vstr);

			if (!hasOwnProperty(obj, k)) {
				obj[k] = v;
			} else if (Array.isArray(obj[k])) {
				obj[k].push(v);
			} else {
				obj[k] = [obj[k], v];
			}
		}

		return obj;
	});
};