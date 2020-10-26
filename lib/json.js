var Dry = require('json-dry');

// Override the Dry classes with the Protoblast classes
Dry.Classes = Blast.Classes;
Dry.Classes.__Protoblast = Blast;

/**
 * Deep clone an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.6
 * @version  0.3.8
 *
 * @param    {Object}   obj
 * @param    {String}   custom_method   Custom method to use if available
 * @param    {Array}    extra_args      Extra arguments for the custom method
 * @param    {WeakMap}  wm
 *
 * @return   {Object}
 */
Blast.defineStatic('JSON', 'clone', Dry.clone);

/**
 * Dry it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.3.3
 *
 * @param    {Mixed}         value
 * @param    {Function}      replacer
 * @param    {NumberString}  space
 *
 * @return   {String}
 */
Blast.defineStatic('JSON', 'dry', Dry.stringify);

/**
 * Dry it to an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.4.2
 *
 * @param    {Mixed}         value
 * @param    {Function}      replacer
 *
 * @return   {Object}
 */
Blast.defineStatic('JSON', 'toDryObject', Dry.toObject);

/**
 * Register a drier
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.10
 * @version  0.1.10
 *
 * @param    {String}   constructor_name   What constructor to listen to
 * @param    {Function} fnc
 * @param    {Object}   options
 */
Blast.defineStatic('JSON', 'registerDrier', Dry.registerDrier);

/**
 * Register an undrier
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.10
 * @version  0.1.10
 *
 * @param    {String}   constructor_name   What constructor to listen to
 * @param    {Function} fnc
 * @param    {Object}   options
 */
Blast.defineStatic('JSON', 'registerUndrier', Dry.registerUndrier);

/**
 * Undry string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.3.6
 *
 * @return   {Mixed}
 */
Blast.defineStatic('JSON', 'undry', Dry.parse);

/**
 * Safe JSON parsing
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Mixed}
 */
Blast.defineStatic('JSON', function safeParse(text, reviver) {
	try {
		return JSON.parse(text, reviver);
	} catch (err) {
		return null;
	}
});

/**
 * Expose the Dry object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.2
 * @version  0.4.2
 *
 * @type     {Object}
 */
Blast.defineStatic('JSON', 'Dry', Dry);