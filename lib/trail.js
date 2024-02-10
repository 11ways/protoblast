const CHAIN = Symbol('chain'),
      GET_OR_EVALUATE = Symbol('getOrEvaluate');

/**
 * Class that represents a path
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Array}   chain
 */
const Trail = Fn.inherits('Develry.Placeholder', function Trail(chain) {

	if (!(this instanceof Trail)) {
		return new Trail(chain);
	}

	// The path pieces
	this[CHAIN] = chain;

	// Is this a root path?
	this.is_root = chain[0] === '';

	// If it is a root path, remove the first piece
	if (this.is_root) {
		this[CHAIN].shift();
	}
});

/**
 * Undry the value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   value
 *
 * @return   {Trail}
 */
Trail.setStatic(function unDry(value) {
	let result = Object.create(this.prototype);
	result[CHAIN] = value.chain;
	result.is_root = value.is_root;
	return result;
});

/**
 * Create a trail using the given delimiter
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string|string[]}   path
 * @param    {string}            delimiter
 *
 * @return   {Trail}
 */
Trail.setStatic(function fromDelimiter(path, delimiter = '.') {
	
	if (!Array.isArray(path)) {
		if (path.includes('\\')) {
			let escaped_pieces = path.split('\\' + delimiter),
			    split_pieces,
			    i;

			path = [];

			for (i = 0; i < escaped_pieces.length; i++) {
				split_pieces = escaped_pieces[i].split(delimiter);

				if (i > 0) {
					path[path.length-1] += delimiter + split_pieces.shift();
				}

				if (split_pieces.length) {
					path.push(...split_pieces);
				}
			}
		} else {
			path = path.split(delimiter);
		}
	}

	return new Trail(path);
});

/**
 * Create a trail from a dot-separated string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string}   path
 */
Trail.setStatic(function fromDot(path) {
	return Trail.fromDelimiter(path, '.');
});

/**
 * Create a trail from an arrow-separated string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string}   path
 */
Trail.setStatic(function fromArrow(path) {
	return Trail.fromDelimiter(path, '->');
});

/**
 * Create a trail from a slash-separated string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string}   path
 */
Trail.setStatic(function fromSlash(path) {
	return Trail.fromDelimiter(path, '/');
});

/**
 * Return the serialized json-dry representation
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
Trail.setMethod(function toDry() {

	let value = {
		chain : this[CHAIN],
	};

	if (this.is_root) {
		value.is_root = true;
	}

	return {
		value: value,
	};
});

/**
 * Get the value of the given path.
 * If `evaluate` is true and the last piece is a function, it will be called.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   context
 * @param    {boolean}  evaluate
 *
 * @return   {*}
 */
Trail.setMethod([GET_OR_EVALUATE], function internalGetOrEvaluate(context, evaluate = false) {

	if (!context) {
		return;
	}

	const chain = this[CHAIN],
	      length = chain.length,
	      last = length - 1;

	let value,
	    index,
	    key;

	for (index = 0; index < length; index++) {

		if (context == null) {
			return;
		}

		key = chain[index];
		value = context[key];

		if (value == null) {
			return;
		}

		if (evaluate && index == last && typeof value == 'function') {
			value = context[key]();
		} else {
			context = value;
		}
	}

	return value;
});

/**
 * Resolve the value of this path.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   context
 *
 * @return   {*}
 */
Trail.setMethod(function resolve(context) {
	return this.extract(context);
});

/**
 * Extract the actual value of this path.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   context
 *
 * @return   {*}
 */
Trail.setMethod(function extract(context) {

	if (arguments.length == 0) {
		context = Blast.Globals;
	}

	return this[GET_OR_EVALUATE](context, false);
});

/**
 * Extract the actual value of this path.
 * Evaluate the last piece if it's a function.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   context
 *
 * @return   {*}
 */
Trail.setMethod(function extractOrEvaluate(context) {

	if (arguments.length == 0) {
		context = Blast.Globals;
	}

	return this[GET_OR_EVALUATE](context, true);
});

if (!Blast.isServer) {
	return;
}

/**
 * Custom Janeway representation (left side)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @return   {string}
 */
Trail.setMethod(Symbol.for('janeway_arg_left'), function janewayClassIdentifier() {
	return this.constructor.name;
});

/**
 * Custom Janeway representation (right side)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @return   {string}
 */
Trail.setMethod(Symbol.for('janeway_arg_right'), function janewayInstanceInfo() {
	return this[CHAIN].join(' » ');
});