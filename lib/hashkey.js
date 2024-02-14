/**
 * The HashKey Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Object}   value
 */
const HashKey = Fn.inherits(function HashKey(value) {
	this.value = value;
	this.cheap_key = HashKey.createCheapKey(value);
});

/**
 * Create a cheap key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Object}   value
 *
 * @return   {string|symbol}
 */
HashKey.setStatic(function createCheapKey(value, level) {

	if (value == null) {
		return 'null';
	}

	if (level > 3) {
		return '';
	}

	let type = typeof value;

	if (type == 'boolean') {
		return 'B' + value;
	}

	if (type == 'number') {
		return 'N' + value;
	}

	if (type == 'string') {
		return 'S' + value.length;
	}

	if (type == 'symbol') {
		return value;
	}

	if (!level) {
		level = 1;
	}

	if (Array.isArray(value)) {
		return 'A' + value.length + '_' + createCheapKey(value[0], level + 1);
	}

	let keys = Object.keys(value);

	return 'O' + keys.length + '_' + createCheapKey(value[keys[0]], level +1);
});

/**
 * Generate the full key when it's requested
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @type     {string}
 */
HashKey.enforceProperty(function full_key(new_value) {

	if (!new_value) {
		new_value = Obj.checksum(this.value);
	}

	return new_value;
});