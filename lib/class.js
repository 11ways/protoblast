/**
 * The Class class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
function Class(constructor) {

	// The actual constructor of this class
	this.class_constructor = constructor;
};

Blast.defineClass('Class', Class);

/**
 * Add a method to the Class class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   name
 * @param    {Function} fnc
 */
let method = function method(name, fnc) {
	return Blast.definePrototype(Class, name, fnc);
};

/**
 * Inherit the given class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   class_path
 */
method(function inherit(class_path) {

	

});