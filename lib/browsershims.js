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
	return Object.hasOwn(obj, prop);
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
	return Fn.benchmark(function querySelectorAllTest() {
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