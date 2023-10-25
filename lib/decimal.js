const INTEGRAL = Symbol('integral'),
      FRACTIONAL = Symbol('fractional'),
      FRACTIONAL_LENGTH = Symbol('fractional_length'),
      FRACTIONAL_LENGTH_BI = Symbol('fractional_length_bi'),
      IS_POSITIVE = Symbol('is_positive'),
      SCALE = Symbol('scale');

/**
 * Provides a robust and flexible implementation
 * for handling arbitrary-precision decimal numbers
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String|Number}   value
 */
const Decimal = Fn.inherits('Develry.AbstractNumeric', function Decimal(value) {

	if (this == null) {
		return new Decimal(value);
	}

	if (typeof value != 'string') {
		value = String(value);
	}

	// Split the value into integral and fractional parts
	const [integral_string, fractional_string] = value.split('.');

	const integral = BigInt(integral_string);
	const fractional = BigInt(fractional_string || '0');
	const fractional_length = fractional_string ? fractional_string.length : 0;
	const fractional_length_bi = BigInt(fractional_length);

	this[INTEGRAL] = integral;
	this[FRACTIONAL] = fractional;
	this[FRACTIONAL_LENGTH] = fractional_length;
	this[FRACTIONAL_LENGTH_BI] = fractional_length_bi;

	const is_positive = (integral === 0n && integral_string === '-0') ? false : integral >= 0n;

	if (!is_positive) {
		this[INTEGRAL] = -this[INTEGRAL];
	}

	this[IS_POSITIVE] = is_positive;
});

/**
 * Ensure the given value is a Decimal.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setStatic(function ensure(value) {

	if (value instanceof Decimal) {
		return value;
	}

	return new Decimal(value);
});

/**
 * Ensure the given value is a decimal
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function ensure(value) {
	return Decimal.ensure(value);
});

/**
 * Converts the Decimal object's integral and fractional parts
 * to a scaled BigInt representation.
 *
 * This function takes the Decimal object's integral and fractional parts and
 * combines them into a unified BigInt representation, scaled by 10 to the power
 * of the maximum fractional length provided.
 * It allows for precise arithmetic operations.
 * The method can also optionally round the fractional part.
 *
 * Example:
 * Decimal('1.516').toScaledBigInt(3) returns 1516n
 * Decimal('1.516').toScaledBigInt(2, true) returns 152n
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param {BigInt|number}   max_fractional_length  The maximum number of fractional digits to consider for the unified BigInt.
 * @param {boolean}         [should_round=false]   Flag indicating whether the fractional part should be rounded if its length exceeds max_fractional_length.
 *
 * @returns {BigInt} - The unified BigInt representation of the Decimal object.
 */
Decimal.setMethod(function toScaledBigInt(max_fractional_length, should_round = false) {

	// Get the current fractional length as a BigInt
	let fractional_length = this[FRACTIONAL_LENGTH_BI];

	// Make sure the new fractional length is a BigInt
	max_fractional_length = BigInt(max_fractional_length);

	// Calculate the new scale
	const scale = 10n ** BigInt(max_fractional_length);

	// Scale the integral part (`5` with a fractional length of 2 becomes `500`)
	const scaled_integral = this[INTEGRAL] * scale;

	let scaled_fractional;

	// If the current fractional length is larger than the max fractional length,
	// we need to scale the fractional part
	if (fractional_length > max_fractional_length) {
		const reduction_factor = 10n ** (fractional_length - max_fractional_length);
		scaled_fractional = this[FRACTIONAL] / reduction_factor;
		if (should_round) {
			const remainder = this[FRACTIONAL] % reduction_factor;
			if (remainder * 2n >= reduction_factor) {
				scaled_fractional += 1n;
			}
		}
	} else {
		scaled_fractional = this[FRACTIONAL] * (10n ** (max_fractional_length - fractional_length));
	}

	let result = scaled_integral + scaled_fractional;

	if (!this[IS_POSITIVE]) {
		result = -result;
	}

	return result;
});

/**
 * Apply the arithmetic result by creating a new decimal
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function returnArithmeticResult(unified_result, fractional_length) {

	let result = Object.create(Decimal.prototype);

	return result._applyArithmeticResult(unified_result, fractional_length);
});

/**
 * Apply the arithmetic result on this instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function _applyArithmeticResult(unified_result, fractional_length) {

	let scale = 10n ** BigInt(fractional_length);

	let integral = unified_result / scale;
	let fractional = unified_result % scale;

	this[FRACTIONAL_LENGTH] = fractional_length;
	this[FRACTIONAL_LENGTH_BI] = BigInt(fractional_length);
	this[IS_POSITIVE] = unified_result >= 0n;
	this[SCALE] = scale;

	if (fractional < 0 || integral < 0) {
		integral = -integral;
		fractional = -fractional;
	}

	this[INTEGRAL] = integral;
	this[FRACTIONAL] = fractional;

	return this;
});

/**
 * Add the given value to this value and return the new result.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   value
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function add(value) {

	let other_decimal = this.ensure(value);

	// Determine the max fractional length to know by how much to scale each operand
	let max_fractional_length = Math.max(this[FRACTIONAL_LENGTH], other_decimal[FRACTIONAL_LENGTH]);

	// Get the scaled integral and fractional parts of this value
	let this_unified = this.toScaledBigInt(max_fractional_length);
	let other_unified = other_decimal.toScaledBigInt(max_fractional_length);

	// Add the unified values
	let unified_result = this_unified + other_unified;

	return this.returnArithmeticResult(unified_result, max_fractional_length);
});

/**
 * Subtract the given value from this value and return the new result.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   value
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function subtract(value) {

	let other_decimal = new Decimal(value);
	other_decimal[IS_POSITIVE] = !other_decimal[IS_POSITIVE];

	return this.add(other_decimal);
});

/**
 * Return the string representation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
Decimal.setMethod(function toString() {

	let result = this[INTEGRAL].toString();

	if (!this[IS_POSITIVE]) {
		result = '-' + result;
	}

	if (this[FRACTIONAL_LENGTH]) {
		let fractional_str = this[FRACTIONAL].toString().padStart(this[FRACTIONAL_LENGTH], '0');
		result += '.' + fractional_str;
	}

	return result;
});