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
 * MAgic property setter
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