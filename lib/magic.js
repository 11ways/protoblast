/**
 * The Magic Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.6
 * @version  0.6.6
 */
const Magic = Fn.inherits(function Magic() {});

/**
 * Modify child constructors by wrapping them
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.6
 * @version  0.9.0
 *
 * @param    {Function}   fnc
 */
Magic.setStatic(function modifyChildConstructor(fnc) {

	let result = function Profixy(...args) {
		fnc.call(this, ...args);
		return new Proxy(this, traps);
	};

	Blast.defineGet(fnc, 'super', function getSuper() {
		return result.super || result.wrapper?.super;
	});

	return result;
});

/**
 * Magic property getter
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.6
 * @version  0.6.6
 *
 * @param    {string}   name
 */
Magic.setMethod(function __get(name) {
	return this[name];
});

/**
 * Magic property setter
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.6
 * @version  0.6.6
 *
 * @param    {string}   name
 * @param    {Mixed}    value
 */
Magic.setMethod(function __set(name, value) {
	return this[name] = value;
});

/**
 * Magic delete handler
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.5
 * @version  0.9.5
 *
 * @param    {string}   name
 */
Magic.setMethod(function __delete(name) {
	return delete this[name];
});

/**
 * Get the "own" keys
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.5
 * @version  0.9.5
 */
Magic.setMethod(function __ownKeys() {
	return Object.keys(this);
});

/**
 * See if this property exists
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.5
 * @version  0.9.5
 */
Magic.setMethod(function has(name) {
	return typeof this[name] != 'undefined' && name in this;
});

/**
 * Define a property
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.5
 * @version  0.9.5
 */
Magic.setMethod(function __define(key, descriptor) {
	return Object.defineProperty(this, key, descriptor);
});

/**
 * Get a property descriptor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.5
 * @version  0.9.5
 */
Magic.setMethod(function __describe(key) {
	return Object.getOwnPropertyDescriptor(this, key);
});

/**
 * The actual traps
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.6
 * @version  0.6.6
 *
 * @type     {Object}
 */
const traps = {
	get: function get(context, property) {
		return context.__get(property);
	},
	set: function set(context, property, value) {
		return context.__set(property, value);
	},
	deleteProperty: function deleteProperty(context, property) {
		return context.__delete(property);
	},
	ownKeys: function ownKeys(context) {
		return context.__ownKeys();
	},
	has: function has(context, property) {
		return context.__has(property);
	},
	defineProperty: function defineProperty(context, key, descriptor) {
		return context.__define(key, descriptor);
	},
	getOwnPropertyDescriptor: function getOwnPropertyDescriptor(context, key) {
		return context.__describe(key);
	}
};