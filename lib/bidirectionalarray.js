const POSITIVE_ARRAY = Symbol('positive_array'),
      NEGATIVE_ARRAY = Symbol('negative_array');

/**
 * A BiDirectionalArray:
 * Add items to the start or end of the array, without shifting the rest.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 */
const BDArray = Fn.inherits(null, 'Develry', function BiDirectionalArray() {
	this[POSITIVE_ARRAY] = [];
	this[NEGATIVE_ARRAY] = [];
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {Object}
 */
BDArray.setStatic(function unDry(value) {
	let result = new this();
	result[POSITIVE_ARRAY] = value.positive;
	result[NEGATIVE_ARRAY] = value.negative;
	return result;
});

/**
 * Get the size of the array (the amount of items in it)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @type     {Number}
 */
BDArray.setProperty(function size() {
	return this[POSITIVE_ARRAY].length + this[NEGATIVE_ARRAY].length;
});

/**
 * Get the start index
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @type     {Number}
 */
BDArray.setProperty(function start_index() {

	if (this[NEGATIVE_ARRAY].length) {
		return -this[NEGATIVE_ARRAY].length;
	}

	return 0;
});

/**
 * Get the end index
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @type     {Number}
 */
BDArray.setProperty(function end_index() {

	if (this[POSITIVE_ARRAY].length) {
		return this[POSITIVE_ARRAY].length - 1;
	}

	return 0;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {Object}
 */
BDArray.setMethod(function toDry() {
	return {
		value: {
			positive: this[POSITIVE_ARRAY],
			negative: this[NEGATIVE_ARRAY],
		}
	};
});

/**
 * Return the json stringified version of this object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {String}
 */
BDArray.setMethod(function toJSON() {
	return this.toDry();
});

/**
 * Is the given item included in the array?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {Boolean}
 */
BDArray.setMethod(function includes(element) {

	if (this[POSITIVE_ARRAY].includes(element)) {
		return true;
	}

	if (this[NEGATIVE_ARRAY].includes(element)) {
		return true;
	}

	return false;
});

/**
 * Get the index of the given element.
 * If it is not found, false is returned.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {Boolean|Boolean}
 */
BDArray.setMethod(function indexOf(element) {

	let index = this[POSITIVE_ARRAY].indexOf(element);

	if (index > -1) {
		return index;
	}

	index = this[NEGATIVE_ARRAY].indexOf(element);

	if (index > -1) {
		return -index - 1;
	}

	return false;
});

/**
 * Get the element at the given index.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {*}
 */
BDArray.setMethod(function at(index) {

	if (index >= 0) {
		return this[POSITIVE_ARRAY][index];
	}

	return this[NEGATIVE_ARRAY][-index - 1];
});

/**
 * Append an item to the end of the array
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {Number}
 */
BDArray.setMethod(function append(element) {
	return this[POSITIVE_ARRAY].push(element) - 1;
});

/**
 * Prepend an item to the beginning of the array
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.9
 * @version  0.2.9
 *
 * @return   {Number}
 */
BDArray.setMethod(function prepend(element) {

	let result;

	if (this[POSITIVE_ARRAY].length) {
		result = -this[NEGATIVE_ARRAY].push(element);
	} else {
		result = this[POSITIVE_ARRAY].push(element) - 1;
	}

	return result;
});