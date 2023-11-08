/**
 * The AbstractNumeric Class:
 * The base class for all custom numeric classes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
const AbstractNumeric = Fn.inherits(null, 'Develry', function AbstractNumeric(value) {});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Object}
 */
AbstractNumeric.setStatic(function unDry(value) {
	return new this(value.string);
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Object}
 */
AbstractNumeric.setMethod(function toDry() {
	return {
		value: {
			string: this.toString(),
		}
	};
});

/**
 * Return the json stringified version of this object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @return   {String}
 */
AbstractNumeric.setMethod(function toJSON() {
	return this.toString();
});

if (!Blast.isServer) {
	return;
}

/**
 * Custom Janeway representation (left side)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
AbstractNumeric.setMethod(Symbol.for('janeway_arg_left'), function janewayClassIdentifier() {
	return this.constructor.name;
});

/**
 * Custom Janeway representation (right side)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
AbstractNumeric.setMethod(Symbol.for('janeway_arg_right'), function janewayInstanceInfo() {
	return this.toString();
});