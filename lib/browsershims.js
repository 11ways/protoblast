module.exports = function BlastBrowserShims(Blast, Collection) {

	var stringifyPrimitive = function(v) {
		if (typeof v === 'string')
			return v;
		if (typeof v === 'boolean')
			return v ? 'true' : 'false';
		if (typeof v === 'number')
			return isFinite(v) ? v : '';
		return '';
	};

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/**
	 * Internal URL parser,
	 * is needed for IE9 only
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   url
	 *
	 * @return   {URL}
	 */
	Blast.definePrototype('URL', 'parse', function parse(url) {

		var pieces = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(?:\/\/(?:([^:@]*)(?::([^:@]*))?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);

		if (!pieces) {
			throw new RangeError();
		}

		this.href     = pieces[0] || '';
		this.protocol = pieces[1] || '';
		this.username = pieces[2] || '';
		this.password = pieces[3] || '';
		this.host     = pieces[4] || '';
		this.hostname = pieces[5] || '';
		this.port     = pieces[6] || '';
		this.pathname = pieces[7] || '';
		this.search   = pieces[8] || '';
		this.hash     = pieces[9] || '';

		this.origin = this.protocol + (this.host !== '' ? '//' + this.host : '');
	}, true);

	/**
	 * Serialize an object to a query string
	 *
	 * @author   Joyent, Inc. and other Node contributors
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	Blast.defineStatic('URL', 'encodeQuery', function encodeQuery(obj, sep, eq, options) {
		sep = sep || '&';
		eq = eq || '=';

		var encode = encodeURIComponent;
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	Blast.defineStatic('URL', 'parseQuery', function parseQuery(qs, sep, eq, options) {

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