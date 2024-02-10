/**
 * A class that should resolve to another value.
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
const Placeholder = Fn.inherits(null, 'Develry', function Placeholder() {});

// This is an abstract class
Placeholder.makeAbstractClass();

/**
 * Resolve all the placeholders in the given object.
 * The original object will not be modified.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   input            The object that contains the trails
 *
 * @return   {*}
 */
Placeholder.setStatic(function resolve(input, ...args) {

	if (input instanceof Placeholder) {
		return input.resolve(...args);
	}

	const seen = new Map();
	return _resolvePlaceholders(input, seen, args);
});

/**
 * Actual trail resolving
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Object}   input     The object that contains the trails
 * @param    {Map}      seen      The seen objects
 * @param    {Array}    args
 *
 * @return   {*}
 */
const _resolvePlaceholders = (input, seen, args) => {

	if (seen.has(input)) {
		return seen.get(input);
	}

	if (input instanceof Placeholder) {
		return input.resolve(...args);
	}

	let result,
	    is_array = Array.isArray(input),
	    is_plain = Obj.isPlainObject(input);

	// Only map arrays and plain objects
	if (!is_array && !is_plain) {
		result = input;
	} else {
		result = is_array ? [] : {};
		seen.set(input, result);

		if (is_array) {
			let i;

			for (i = 0; i < input.length; i++) {
				result[i] = _resolvePlaceholders(input[i], seen, args);
			}
		} else {
			let key;

			for (key in input) {
				if (!Object.hasOwnProperty.call(obj, key)) {
					continue;
				}
	
				result[key] = _resolvePlaceholders(input[key], seen, args);
			}
		}
	}

	seen.set(input, result);

	return result;
};

/**
 * Each Placeholder class should have a `resolve` method
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @return   {*}
 */
Placeholder.setAbstractMethod('resolve');