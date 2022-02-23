var rx_protocol = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i,
    rx_slashes  = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//,
    test_url;

/**
 * A URL class that accepts relative urls, like it should
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @author   Arnout Kazemier
 * @since    0.1.3
 * @version  0.7.5
 *
 * @param    {String}           address
 * @param    {String|Boolean}   base
 */
let RURL = Fn.inherits(function RURL(address, base) {

	this._data = {
		from_base : null,
		pathname  : null,
		segments  : null,
		host      : null,
		hostname  : null,
		port      : null,
		protocol  : null,
		search    : null,
		query     : null,
		hash      : null,
		auth      : null,
		username  : null,
		password  : null,
		slashes   : null,

		// Used by the isUrl method
		href      : null,
		path      : null,
		fragment  : null,
		schema    : null,
	};

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
 * Is the given parameter url-like?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.5
 *
 * @return   {Boolean}
 */
RURL.setStatic(function isUrl(arg) {

	if (!arg) {
		return false;
	}

	if (typeof arg == 'object') {
		if (arg instanceof RURL) {
			return true;
		}

		if (!test_url) {
			test_url = new RURL();
		}

		let keys = Object.keys(arg),
		    key,
		    i;

		for (i = 0; i < keys.length; i++) {
			key = keys[i];

			// Only allow properties that can be in URL-like objects
			if (test_url._data[key] !== null) {
				return false;
			}
		}
	}

	return RURL.parse(arg).seems_valid;
});

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
	} else if (type == 'string' || type == 'object') {
		result = new RURL(address);

		result.hash = null;
		result.query = null;
	}

	return result;
});

/**
 * Parse an url-like object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Object}   obj
 *
 * @return   {RURL}
 */
RURL.setStatic(function parseObject(obj) {

	var result;

	if (!obj) {
		return null;
	}

	// If it's an instance of the same constructor (same version),
	// we can safely clone it
	if (obj instanceof RURL) {
		return obj.clone();
	}

	result = new RURL();

	// If the commonly-used "port" property is actually a function,
	// try converting it to a string
	if (typeof obj.port == 'function' || typeof obj.getPath == 'function') {
		result.href = String(obj);
		return result;
	}

	if (obj.scheme) {
		result.protocol = obj.scheme;
	} else if (obj.protocol) {
		result.protocol = obj.protocol;
	}

	result.username = obj.username || obj.user || '';
	result.password = obj.password || '';

	if (obj.auth && !result.username && !result.password) {
		result.auth = obj.auth;
	}

	result.hostname = obj.hostname || obj.host || '';
	result.port = obj.port || '';
	result.pathname = obj.pathname || obj.path || '';
	result.search = obj.search || obj.query || '';
	result.hash = obj.hash || obj.fragment || '';

	// Maybe the object only had a href, then we can use that
	if (obj.href && !result.href) {
		result.href = obj.href;
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
 * Decode a URI component
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {String}   segment
 *
 * @return   {String}
 */
RURL.setStatic(function decodeUriSegment(segment) {
	try {
		return decodeURIComponent(segment.replace(/\+/g, ' '));
	} catch (e) {
		return segment;
	}
});

/**
 * Default query parsing options
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @type   {Object}
 */
RURL.setStatic('default_query_parse_options', {
	allow_dots        : false,
	array_limit       : 20,
	decoder           : RURL.decodeUriSegment,
	delimiter         : '&',
	depth             : 5,
	parameter_limit   : 1000,
	parse_arrays      : true,
	empty_value       : ''
});

/**
 * Parse a query string to an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.5.7
 *
 * @param    {String}   input
 * @param    {Object}   options
 *
 * @return   {Array}
 */
RURL.setStatic(function parseQueryValues(input, options) {

	var bracket_equals_pos,
	    result,
	    pieces,
	    limit,
	    part,
	    key,
	    val,
	    pos,
	    i;

	// Prepare the result array
	result = [];

	if (!input) {
		return result;
	}

	// Apply default options
	options = Obj.assign({}, RURL.default_query_parse_options, options);

	if (input && input[0] == '?') {
		input = input.slice(1);
	}

	// Get the parameter limit
	limit = options.parameter_limit === Infinity ? undefined : options.parameter_limit;

	// Cut the string into pieces, using the limit
	pieces = input.split(options.delimiter, limit);

	for (i = 0; i < pieces.length; i++) {
		part = pieces[i];

		bracket_equals_pos = part.indexOf(']=');
		pos = bracket_equals_pos == -1 ? part.indexOf('=') : bracket_equals_pos + 1;

		if (pos == -1) {
			key = options.decoder(part);
			val = options.empty_value;
		} else {
			key = options.decoder(part.slice(0, pos));
			val = options.decoder(part.slice(pos + 1));
		}

		result.push([key, val]);
	}

	return result;
});

/**
 * Extract form path info
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.11
 * @version  0.5.7
 *
 * @param    {String}   input
 * @param    {Number}   limit
 *
 * @return   {Array}
 */
RURL.setStatic(function parseFormPath(input, limit) {

	var root_name  = /^(.*?)(?:\[|$)/,
	    prop_name  = /(?:\[(.*?)\])/g,
	    properties = [],
	    temp,
	    i;

	if (limit == null) {
		limit = Infinity;
	}

	temp = root_name.exec(input);

	// Look for the root name
	if (temp && typeof temp[1] !== 'undefined') {
		properties.push(temp[1]);
	}

	i = 0;

	// Look for the sub property names
	while ((temp = prop_name.exec(input)) !== null && i < limit) {
		i++;

		properties.push(temp[1]);
	}

	if (temp) {
		properties.push(input.slice(temp.index));
	}

	return properties;
});

/**
 * Parse a query string to an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {String}   input
 * @param    {Object}   options
 *
 * @return   {Object}
 */
RURL.setStatic(function parseQuery(input, options) {

	var values,
	    result,
	    temp,
	    key,
	    val,
	    i;

	// Apply default options
	options = Obj.assign({}, RURL.default_query_parse_options, options);

	// Prepare an empty result object
	result = {};

	// First parse the query itself
	values = RURL.parseQueryValues(input, options);

	// Now parse all the keys
	for (i = 0; i < values.length; i++) {
		key = values[i][0];
		val = values[i][1];

		temp = RURL.parseFormPath(key, options.depth);

		// Set the path (but don't set prototype things)
		Obj.setPath(result, temp, val, null, false);
	}

	return result;
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.6.3
 *
 * @return   {RURL}
 */
RURL.setStatic(function unDry(obj) {
	var result = new RURL(obj);

	result._data.from_base = obj.from_base;

	return result;
});

/**
 * Pathname getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.7.1
 *
 * @type     {String}
 */
RURL.setProperty(function pathname() {

	let result = this._data.pathname || '';

	if (!result && this.slashes) {
		result = '/';
	}

	return result;

}, function setPathname(pathname) {

	if (pathname) {

		if (pathname.indexOf('#') > -1) {
			pathname = pathname.replace(/#/g, '%23');
		}

		if (pathname.indexOf('?') > -1) {
			pathname = pathname.replace(/\?/g, '%3F');
		}

		if (this.slashes && pathname[0] != '/') {
			pathname = '/' + pathname;
		}
	}

	// Unset the segments
	this._data.segments = null;

	return this._data.pathname = pathname;
});

/**
 * Extension getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.2
 *
 * @type     {String}
 */
RURL.setProperty(function extension() {

	// Get the last segment
	let last_segment = this.segment(-1);

	return last_segment ? Bound.String.afterLast(last_segment, '.') : '';

}, function setExtension(extension) {

	// Get the last segment
	let last_segment = this.segment(-1);

	let name;

	if (last_segment.indexOf('.') > -1) {
		name = Bound.String.beforeLast(last_segment, '.');
	} else {
		name = last_segment;
	}

	if (extension[0] == '.') {
		extension = extension.slice(1);
	}

	if (extension) {
		name = name + '.' + extension;
	}

	this.segment(-1, name);
});

/**
 * Path getter:
 * Following the WHATWG standard, the path is the pathname + the search
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @type     {String}
 */
RURL.setProperty(function path() {
	return this.pathname + this.search;
}, function setPath(path) {
	this.resource = path;
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

	if (resource && resource[0] != '/') {
		resource = '/' + resource;
	}

	// A little hack to get the href we want
	// (you normally can't add ? or # to the pathname)
	this._data.pathname = resource;

	this._parseInput(this.href);

	return this.resource;
});

/**
 * Segment getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.7.2
 *
 * @type     {Array}
 */
RURL.setProperty(function segments() {

	if (this._data.segments == null) {
		this._data.segments = Bound.Array.clean(this.pathname.slice(1).split('/'), '');
	}

	return this._data.segments;
}, function setSegments(segments) {

	this._data.segments = Bound.Array.clean(segments, '');
	this._data.pathname = '/' + segments.join('/');

	return segments;
});

/**
 * Host getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.7.16
 *
 * @type     {String}
 */
RURL.setProperty(function host() {
	return this._data.host || '';
}, function setHost(host) {

	host = (host || '').toLowerCase();

	// It's possible protocol info is added
	let extracted = RURL.extractProtocol(host);

	if (extracted.protocol && extracted.protocol.indexOf('.') == -1) {
		this._data.protocol = extracted.protocol;
		this._data.slashes = extracted.slashes;
		host = extracted.rest;

		if (!host) {
			return host;
		}
	}

	this._data.host = host;

	// IPv6 urls can contain colons, so we need to check this way
	if (/:\d+$/.test(host)) {
		let pieces = host.split(':');
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
 * @version  0.7.16
 *
 * @type     {String}
 */
RURL.setProperty(function hostname() {
	return this._data.hostname || '';
}, function setHostname(hostname) {

	if (!hostname) {
		hostname = '';
	}

	hostname = hostname.toLowerCase();

	// It's possible protocol info is added
	let extracted = RURL.extractProtocol(hostname);

	if (extracted.protocol && extracted.protocol.indexOf('.') == -1) {
		this._data.protocol = extracted.protocol;
		this._data.slashes = extracted.slashes;
		hostname = extracted.rest;

		if (!hostname) {
			return hostname;
		}
	}

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
	return this._data.port || '';
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
 * @version  0.7.0
 *
 * @type     {String}
 */
RURL.setProperty(function protocol() {
	return this._data.protocol || '';
}, function setProtocol(protocol) {

	var requires_slashes,
	    has_slashes,
	    extracted,
	    temp;

	// Attempt to extract the protocol
	extracted = RURL.extractProtocol(protocol);

	if (extracted && extracted.protocol) {
		protocol = extracted.protocol;

		if (extracted.slashes) {
			this.slashes = true;
		}
	} else if (protocol) {
		protocol = protocol.toLowerCase();
	} else if (extracted) {
		this.slashes = extracted.slashes;
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

	var result = this._data.search;

	if (result == null) {
		result = RURL.encodeQuery(this._data.query);

		if (result) {
			result = '?' + result;
		}

		this._data.search = result;
	}

	return result;
}, function setSearch(search) {
	this._data.query = null;

	// The search property needs to start with a questionmark
	if (search && search[0] != '?') {
		search = '?' + search;
	}

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

	if (Obj.size(query)) {
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
	return this._data.hash || '';
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

	return hash || '';

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
 * Does this url seem valid?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Boolean}
 */
RURL.setProperty(function seems_valid() {

	if (!this.host && !this.protocol) {
		if (this.pathname[0] != '/') {
			return false;
		}
	}

	return true;
});

/**
 * Which properties were gotten from the base?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @type     {Array}
 */
RURL.setProperty(function from_base() {

	if (!this._data.from_base) {
		this._data.from_base = [];
	}

	return this._data.from_base;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @return   {Object}
 */
RURL.setMethod(function toDry() {
	var value = this.toJSON();
	return {value: value};
});

/**
 * Return an object for JSON
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.7
 * @version  0.6.3
 *
 * @return   {Object}
 */
RURL.setMethod(function toJSON() {
	return {
		protocol  : this.protocol,
		username  : this.username,
		password  : this.password,
		hostname  : this.hostname,
		port      : this.port,
		pathname  : this.pathname,
		search    : this.search,
		hash      : this.hash,
		slashes   : this.slashes,
		from_base : this.from_base
	};
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

	var data = Bound.JSON.clone(this._data),
	    rurl = Object.create(RURL.prototype);

	rurl._data = data;

	return rurl;
});

/**
 * Return the URL as a string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.7.0
 *
 * @return   {String}
 */
RURL.setMethod(function toString() {

	var result = '';

	if (this.protocol) {
		result = this.protocol;
	}

	if (this.slashes) {
		result += '//';
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
 * @version  0.7.1
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

	if (address && typeof address == 'object') {
		address = String(RURL.parseObject(address));
	}

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
	if (extracted.protocol) {
		data.protocol = extracted.protocol;
	} else if (location && location.protocol) {
		data.protocol = location.protocol;
		this.from_base.push('protocol');
	} else {
		data.protocol = '';
	}

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

		if (data[key]) {
			data[key] = data[key];
		} else if (relative && rule[3] && location && location[key]) {
			data[key] = location[key];
			this.from_base.push(key);
		} else {
			data[key] = '';
		}

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

	// Set the pathname again, so we can catch hashes & questionmarks
	this.pathname = data.pathname;

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
 * @version  0.7.5
 *
 * @param    {String}   name
 * @param    {String}   value
 *
 * @return   {String}
 */
RURL.setMethod(function param(name, value) {

	if (arguments.length == 1) {
		if (name && typeof name == 'object') {
			return this.addQuery(name);
		}

		let result = this.query[name];

		if (result == null) {
			return Obj.path(this.query, RURL.parseFormPath(name));
		}

		return result;
	}

	this.addQuery(name, value);
});

/**
 * Add get parameters to the URL object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.7.5
 *
 * @param    {String|Object}   params
 * @param    {Mixed}           value
 */
RURL.setMethod(function addQuery(params, value) {

	var param_val,
	    query,
	    temp,
	    obj,
	    key,
	    i;

	// If no valid parameters are given, do nothing
	if (!params) {
		return;
	}

	query = this.query;

	if (typeof params === 'string') {

		// The params should not start with a question mark or an ampersand
		if (params[0] === '?' || params[0] === '&') {
			params = params.slice(1);
		}

		if (arguments.length == 1) {
			// Only 1 string argument means we want to add a querystring
			obj = RURL.parseQuery(params);
		} else {
			let pieces = RURL.parseFormPath(params);

			if (value == null) {
				let last_piece = pieces.pop();
				query = Obj.path(query, pieces);

				if (query) {
					delete query[last_piece];
				}

			} else {
				Obj.setPath(query, pieces, value);
			}
		}
	} else if (params && typeof params == 'object') {
		obj = params;
	}

	if (obj) {
		for (key in obj) {
			query[key] = obj[key];
		}
	}

	// The search string needs to be nullified
	this._data.search = null;

});

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

	var encode,
	    fields,
	    keys,
	    key,
	    val,
	    ks,
	    i,
	    j;

	sep = sep || '&';
	eq = eq || '=';

	// Use our custom method, so brackets don't get encoded
	encode = RURL.encodeUriSegment;

	if (options && typeof options.encodeURIComponent === 'function') {
		encode = options.encodeURIComponent;
	}

	if (obj && typeof obj === 'object') {

		// Flatten the object, using square brackets as dividers
		obj = Obj.flatten(obj, ['[', ']']);

		// Get all the keys
		keys = Object.keys(obj);

		// Prepare the fields array, all pairs go here
		fields = [];

		for (i = 0; i < keys.length; i++) {
			key = keys[i];
			val = obj[key];

			ks = encode(Obj.stringifyPrimitive(key)) + eq;

			if (Array.isArray(val)) {
				for (j = 0; j < val.length; j++) {
					fields.push(ks + encode(Obj.stringifyPrimitive(val[j])));
				}
			} else {
				fields.push(ks + encode(Obj.stringifyPrimitive(val)));
			}
		}
		return fields.join(sep);
	}
	return '';
});

/**
 * Did the wanted property come from the base location?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @param    {String}   name
 *
 * @return   {Boolean}
 */
RURL.setMethod(function usedBaseProperty(name) {

	if (!this.from_base.length) {
		return false;
	}

	return this.from_base.indexOf(name) > -1;
});

/**
 * Is this url a subpath of the given url?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.2
 * @version  0.7.2
 *
 * @param    {String|RURL}   url
 *
 * @return   {Boolean}
 */
RURL.setMethod(function isDescendant(url) {

	url = RURL.parse(url);

	if (url.hostname && this.hostname && this.hostname != url.hostname) {
		return false;
	}

	let parent_segments = url.segments,
	    segments = this.segments,
	    i;

	for (i = 0; i < parent_segments.length; i++) {
		if (parent_segments[i] != segments[i]) {
			return false;
		}
	}

	return true;
});

// Make it a global class
Blast.defineClass('RURL', RURL);

// Also store under URL, because who cares about the standard URL class anyway
Blast.Classes.URL = RURL;
Blast.Collection.URL = RURL;