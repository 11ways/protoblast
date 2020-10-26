var machine_id,
    process_id,
    counter = ~~(Math.random() * 10000);

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
 * Benchmark a query selector
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {String}   selector
 */
Blast.defineStatic('Function', 'benchmarkCSSRule', function benchmarkCSSRule(selector) {
	return Bound.Function.benchmark(function querySelectorAllTest() {
		document.querySelectorAll(selector);
	});
});

/**
 * Internal URL parser,
 * is needed for IE9 only
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
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
 * Parse an HTML string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.0
 *
 * @param    {String}   html
 *
 * @return   {HTMLCollection|HTMLElement}
 */
Blast.parseHTML = function parseHTML(html) {

	var result;

	result = document.createRange().createContextualFragment(html);
	result = result.childNodes;

	if (result.length > 1) {
		return result;
	} else {
		return result[0];
	}
};

/**
 * Create an ObjectID string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {String}
 */
Blast.createObjectId = function createObjectId() {

	var result,
	    count,
	    time;

	// Start with 4 bytes for the time in seconds
	time = parseInt(Date.now()/1000).toString(16).slice(0, 8);
	result = time;

	// Add the machine identifier
	if (!machine_id) {
		machine_id = Math.abs(Bound.String.fowler(navigator.userAgent)).toString(16);

		if (machine_id.length < 6) {
			machine_id += result;
		}

		// Get the first 6 pieces
		machine_id = machine_id.slice(0, 6);
	}

	result += machine_id;

	if (!process_id) {
		process_id = Blast.Classes.Crypto.pseudoHex().slice(0, 4);
	}

	result += process_id;

	// Create the counter
	count = (counter++).toString(16);

	if (count.length < 6) {
		count = Bound.String.multiply('0', 6 - count.length) + count;
	}

	result += count;

	return result;
};