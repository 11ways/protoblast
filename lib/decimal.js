const INTEGRAL = Symbol('integral'),
      FRACTIONAL = Symbol('fractional'),
      SCALE = Symbol('scale'),
      SCALE_BI = Symbol('scale_bi'),
      MAX_ARITHMETIC_SCALE = Symbol('max_arithmetic_scale'),
      IS_POSITIVE = Symbol('is_positive'),
      MAX_ITERATIONS = Symbol('max_iterations'),
      ROUNDING = Symbol('rounding'),
      MUTABLE_CLASS = Symbol('mutable_class'),
      IMMUTABLE_CLASS = Symbol('immutable_class'),
      PRINT_SCALE = Symbol('print_scale');

const ROUND_UP = 0,
      ROUND_DOWN = 1,
      ROUND_CEIL = 2,
      ROUND_FLOOR = 3,
      ROUND_HALF_UP = 4,
      ROUND_HALF_DOWN = 5,
      ROUND_HALF_EVEN = 6,
      ROUND_HALF_CEIL = 7,
      ROUND_HALF_FLOOR = 8;

function createMutableClass(ImmutableParent, MutableConstructor) {

	const result = Fn.inherits(ImmutableParent, MutableConstructor);

	Blast.defineValue(result.prototype, IMMUTABLE_CLASS, ImmutableParent);
	Blast.defineValue(result.prototype, MUTABLE_CLASS, result);

	result.setMethod(function getOrCreateBaseResultInstance() {
		return this;
	});

	result.setMethod(function getOrCreateResultInstanceFromSelf() {
		return this;
	});

	result.setMethod(function toImmutable() {
		let result = new ImmutableParent(this);
		copySettings(result, this);

		return result;
	});

	return result;
}

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

	if (!(this instanceof Decimal)) {
		return new Decimal(value);
	}

	if (typeof value != 'string') {
		value = String(value);
	}

	let is_scientific = false;

	if (value.includes('E')) {
		is_scientific = true;
		value = value.toLowerCase();
	} else if (value.includes('e')) {
		is_scientific = true;
	}

	if (is_scientific) {
		value = scientificToDecimal(value);
	}

	// Split the value into integral and fractional parts
	const [integral_string, fractional_string] = value.split('.');

	const integral = BigInt(integral_string);
	const fractional = BigInt(fractional_string || '0');
	const scale = fractional_string ? fractional_string.length : 0;
	const scale_bi = BigInt(scale);

	this[INTEGRAL] = integral;
	this[FRACTIONAL] = fractional;
	this[SCALE] = scale;
	this[SCALE_BI] = scale_bi;

	if (scale > this[MAX_ARITHMETIC_SCALE]) {
		this.setArithmeticScale(scale);
	}

	const is_positive = (integral === 0n && integral_string === '-0') ? false : integral >= 0n;

	if (!is_positive) {
		this[INTEGRAL] = -this[INTEGRAL];
	}

	this[IS_POSITIVE] = is_positive;
});

/**
 * Mutable version of the Decimal class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String|Number}   value
 */
const MutableDecimal = createMutableClass(Decimal, function MutableDecimal(value) {

	if (!(this instanceof MutableDecimal)) {
		return new MutableDecimal(value);
	}

	return MutableDecimal.super.call(this, value);
});

/**
 * Fixed version of the Decimal class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String|Number}   value
 * @param    {Number}          scale
 */
const FixedDecimal = Fn.inherits(Decimal, function FixedDecimal(value, scale) {

	if (!(this instanceof FixedDecimal)) {
		return new FixedDecimal(value, scale);
	}

	let result = FixedDecimal.super.call(this, value);

	if (!result) {
		result = this;
	}

	if (scale != null && this[SCALE] != scale) {
		result = this.toScale(scale);
	} else if (scale == null) {
		scale = this[SCALE];
	}

	result[MAX_ARITHMETIC_SCALE] = scale;

	return result;
});

/**
 * Ensure the given value is a fixed decimal
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
FixedDecimal.setMethod(function ensure(value) {
	return new this.constructor(value, this[MAX_ARITHMETIC_SCALE]);
});

/**
 * The scale to use for printing
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @type     {Number}
 */
FixedDecimal.setProperty(PRINT_SCALE, function printScale() {
	return this[MAX_ARITHMETIC_SCALE];
});

/**
 * The mutable version of the Fixed Decimal class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String|Number}   value
 * @param    {Number}          scale
 */
const MutableFixedDecimal = createMutableClass(FixedDecimal, function MutableFixedDecimal(value, scale) {

	if (!(this instanceof MutableFixedDecimal)) {
		return new MutableFixedDecimal(value, scale);
	}

	return MutableFixedDecimal.super.call(this, value, scale);
});

Blast.defineValue(Decimal.prototype, IMMUTABLE_CLASS, Decimal);
Blast.defineValue(Decimal.prototype, MUTABLE_CLASS, MutableDecimal);

Decimal.ROUND_UP = ROUND_UP;
Decimal.ROUND_DOWN = ROUND_DOWN;
Decimal.ROUND_CEIL = ROUND_CEIL;
Decimal.ROUND_FLOOR = ROUND_FLOOR;
Decimal.ROUND_HALF_UP = ROUND_HALF_UP;
Decimal.ROUND_HALF_DOWN = ROUND_HALF_DOWN;
Decimal.ROUND_HALF_EVEN = ROUND_HALF_EVEN;
Decimal.ROUND_HALF_CEIL = ROUND_HALF_CEIL;
Decimal.ROUND_HALF_FLOOR = ROUND_HALF_FLOOR;

/**
 * Convert a scientific notation string to a decimal string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
function scientificToDecimal(input) {

	const parts = input.split('e');
	
	if (parts.length === 1) {
		return parts[0];
	}

	let base = new Decimal(parts[0]),
	    exponent = new Decimal(parts[1]),
	    multiplier = (new Decimal(10)).power(exponent);

	return base.multiply(multiplier).toString();
}

/**
 * Return a simple value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}  self
 * @param    {Number}   value
 *
 * @return   {Decimal}
 */
function returnSimpleValue(self, value) {

	let result = self.getOrCreateBaseResultInstance();

	result[INTEGRAL] = BigInt(value);
	result[FRACTIONAL] = 0n;
	result[SCALE] = 0;
	result[SCALE_BI] = 0n;
	result[IS_POSITIVE] = value >= 0;

	return result;
}

/**
 * Return a decimal value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}  self
 * @param    {Decimal}  value
 *
 * @return   {Decimal}
 */
function returnDecimalValue(self, value) {

	let result = self.getOrCreateBaseResultInstance();
	copySettings(result, self);
	copyValues(result, value);

	return result;
}

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
 * Set the default maximum scale for arithmetic operations.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @type     {Number}
 */
Decimal.setProperty(MAX_ARITHMETIC_SCALE, 20);

/**
 * Set the default rounding mode for arithmetic operations.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @type     {Number}
 */
Decimal.setProperty(ROUNDING, ROUND_HALF_UP);

/**
 * Set the default maximum amount of iterations
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @type     {Number}
 */
Decimal.setProperty(MAX_ITERATIONS, 50);

/**
 * The scale to use for printing
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @type     {Number}
 */
Decimal.setProperty(PRINT_SCALE, function printScale() {
	return this[SCALE];
});

/**
 * Clone this instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function clone() {

	let result = Object.create(this.constructor.prototype);
	copySettings(result, this);
	copyValues(result, this);

	return result;
});

/**
 * Set the arithmetic precision
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function setArithmeticScale(value) {
	this[MAX_ARITHMETIC_SCALE] = value;
});

/**
 * Set the rounding mode for arithmetic operations.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function setRoundingMode(value) {
	this[ROUNDING] = value;
});

/**
 * Set the maximum amount of iterations for a calculation.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function setMaxIterations(value) {
	this[MAX_ITERATIONS] = value;
});

/**
 * Is this value an integer?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Boolean}
 */
Decimal.setMethod(function isInteger() {
	return this[SCALE] === 0 || this[FRACTIONAL] === 0n;
});

/**
 * Is this value positive?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Boolean}
 */
Decimal.setMethod(function isPositive() {
	return this[IS_POSITIVE];
});

/**
 * Is this value 0?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Boolean}
 */
Decimal.setMethod(function isZero() {
	return this[INTEGRAL] === 0n && this[FRACTIONAL] === 0n;
});

/**
 * Get a representation of this value with the given scale
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   scale
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function toScale(scale) {

	let original_scale = this[SCALE];

	// Get the scaled integral and fractional parts of this value
	let this_unified = this.toScaledBigInt(original_scale);

	return this.returnArithmeticResult(
		this_unified,

		// Arithmetic scale used
		original_scale,

		// Normalize scale to use
		null,

		// Target scale for the result
		null,
		
		// Maximum fractional length
		scale
	);
});

/**
 * Does this value match the given one?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function equals(other_value) {

	let other_decimal = this.ensure(other_value);

	if (this[IS_POSITIVE] != other_decimal[IS_POSITIVE]) {
		return false;
	}

	if (this[INTEGRAL] != other_decimal[INTEGRAL]) {
		return false;
	}

	if (this[FRACTIONAL] != other_decimal[FRACTIONAL]) {
		return false;
	}

	return true;
});

/**
 * Is this value greater than the given value?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function isGreaterThan(other_value) {

	let other_decimal = this.ensure(other_value);

	if (this.isPositive() && !other_decimal.isPositive()) {
		return true;
	} else if (!this.isPositive() && other_decimal.isPositive()) {
		return false;
	} else if (this.isPositive() && other_decimal.isPositive()) {
		return this.compareMagnitude(other_decimal) === 1;
	} else {
		return other_decimal.compareMagnitude(this) === -1;
	}
});

/**
 * Is this value greater than or equal to the given value?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function isGreaterThanOrEqual(other_value) {

	let other_decimal = this.ensure(other_value);

	if (this.isPositive() && !other_decimal.isPositive()) {
		return true;
	} else if (!this.isPositive() && other_decimal.isPositive()) {
		return false;
	} else if (this.isPositive() && other_decimal.isPositive()) {
		return this.compareMagnitude(other_decimal) >= 0;
	} else {
		return other_decimal.compareMagnitude(this) <= 0;
	}
});

/**
 * Is this value lower than the given value?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function isLowerThan(other_value) {

	let other_decimal = this.ensure(other_value);

	if (this.isPositive() && !other_decimal.isPositive()) {
		return false;
	} else if (!this.isPositive() && other_decimal.isPositive()) {
		return true;
	} else if (this.isPositive() && other_decimal.isPositive()) {
		return this.compareMagnitude(other_decimal) === -1;
	} else {
		return other_decimal.compareMagnitude(this) === 1;
	}
});

/**
 * Is this value lower than or equal to the given value?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function isLowerThanOrEqual(other_value) {

	let other_decimal = this.ensure(other_value);

	if (this.isPositive() && !other_decimal.isPositive()) {
		return false;
	} else if (!this.isPositive() && other_decimal.isPositive()) {
		return true;
	} else if (this.isPositive() && other_decimal.isPositive()) {
		return this.compareMagnitude(other_decimal) <= 0;
	} else {
		return other_decimal.compareMagnitude(this) >= 0;
	}
});

/**
 * compare the magniture with the other value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function compareMagnitude(other_value) {
	
	let other_decimal = this.ensure(other_value);

	let this_integral = this[INTEGRAL],
	    other_integral = other_decimal[INTEGRAL];

	if (this_integral > other_integral) {
		return 1;
	} else if (this_integral < other_integral) {
		return -1;
	} else {
		let max_scale = Math.max(this[SCALE], other_decimal[SCALE]);

		let this_bi = this.toScaledBigInt(max_scale),
		    other_bi = other_decimal.toScaledBigInt(max_scale);

		if (this_bi > other_bi) {
			return 1;
		} else if (this_bi < other_bi) {
			return -1;
		} else {
			return 0;
		}
	}
});

/**
 * Copy the settings from the given source to the target.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
function copySettings(target, source) {
	target[ROUNDING] = source[ROUNDING];
	target[MAX_ARITHMETIC_SCALE] = source[MAX_ARITHMETIC_SCALE];
}

/**
 * Copy the values from the given source to the target.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
function copyValues(target, source) {
	target[INTEGRAL] = source[INTEGRAL];
	target[FRACTIONAL] = source[FRACTIONAL];
	target[SCALE] = source[SCALE];
	target[SCALE_BI] = source[SCALE_BI];
	target[IS_POSITIVE] = source[IS_POSITIVE];
}

/**
 * Create a mutable version of this value.
 * Will always create a new instance.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {MutableDecimal}
 */
Decimal.setMethod(function toMutable() {

	let result = Object.create(this[MUTABLE_CLASS].prototype);
	copySettings(result, this);
	copyValues(result, this);

	return result;
});

/**
 * Create an immutable version of this value.
 * Will only create a new instance if this is a mutable version.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function toImmutable() {
	return this;
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
 * @param {BigInt|number}   max_scale              The maximum number of fractional digits to consider for the unified BigInt.
 * @param {boolean}         [should_round=false]   Flag indicating whether the fractional part should be rounded if its length exceeds max_fractional_length.
 *
 * @returns {BigInt} - The unified BigInt representation of the Decimal object.
 */
Decimal.setMethod(function toScaledBigInt(max_scale, should_round = false) {

	// Get the current fractional length as a BigInt
	let scale = this[SCALE_BI];

	// Make sure the new fractional length is a BigInt
	max_scale = BigInt(max_scale);

	// Calculate the new scale
	const scaler = 10n ** BigInt(max_scale);

	// Scale the integral part (`5` with a fractional length of 2 becomes `500`)
	const scaled_integral = this[INTEGRAL] * scaler;

	let scaled_fractional;

	// If the current fractional length is larger than the max fractional length,
	// we need to scale the fractional part
	if (scale > max_scale) {
		const reduction_factor = 10n ** (scale - max_scale);
		scaled_fractional = this[FRACTIONAL] / reduction_factor;
		if (should_round) {
			const remainder = this[FRACTIONAL] % reduction_factor;
			if (remainder * 2n >= reduction_factor) {
				scaled_fractional += 1n;
			}
		}
	} else {
		scaled_fractional = this[FRACTIONAL] * (10n ** (max_scale - scale));
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
 * @param    {BigInt}   unified_result     The big scaled BigInt result
 * @param    {Number}   arithmetic_scale   The fractional length used to scale
 * @param    {Number}   normalize_scale    The fractional length to round to
 * @param    {Number}   target_scale       The fractional length to use for the result
 * @param    {Number}   max_scale          The maximum fractional length to use
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function returnArithmeticResult(unified_result, arithmetic_scale, normalize_scale, target_scale, max_scale) {
	let result = this.getOrCreateBaseResultInstance();
	return result._applyArithmeticResult(unified_result, arithmetic_scale, normalize_scale, target_scale, max_scale);
});

/**
 * Get an instance to use for the final result of an arithmetic operation.
 * This will be a new instance (without the constructor applied)
 * except when this is a mutable version of the class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function getOrCreateBaseResultInstance() {
	let result = Object.create(this.constructor.prototype);
	copySettings(result, this);
	return result;
});

/**
 * Get an instance of to use for the final result of an arithmetic operation,
 * but copy the current values into it.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function getOrCreateResultInstanceFromSelf() {

	let result = this.getOrCreateBaseResultInstance();
	copyValues(result, this);

	return result;
});

/**
 * Apply the arithmetic result on this instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {BigInt}   unified_result    The big scaled BigInt result
 * @param    {Number}   arithmetic_scale  The fractional length used to scale
 * @param    {Number}   normalize_scale   The fractional length to round to
 * @param    {Number}   target_scale      The fractional length to use for the result
 * @param    {Number}   max_scale         The maximum fractional length to use
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function _applyArithmeticResult(unified_result, arithmetic_scale, normalize_scale, target_scale, max_scale) {

	let unscaler = 10n ** BigInt(arithmetic_scale);

	let integral = unified_result / unscaler;
	let fractional = unified_result % unscaler;

	if (normalize_scale == null) {
		normalize_scale = this.calculateTargetScale(fractional, arithmetic_scale);
	}

	if (arithmetic_scale == normalize_scale) {
		normalize_scale = arithmetic_scale;
	} else {
		[integral, fractional] = reduceFractional(integral, fractional, arithmetic_scale, normalize_scale, this[ROUNDING]);
	}

	if (target_scale == null) {
		target_scale = this.calculateTargetScale(fractional, normalize_scale);
	}

	if (max_scale == null) {
		max_scale = this[MAX_ARITHMETIC_SCALE];
	}

	if (target_scale > max_scale) {
		target_scale = max_scale;
	}

	if (target_scale != normalize_scale) {
		[integral, fractional] = reduceFractional(integral, fractional, normalize_scale, target_scale, this[ROUNDING]);

		let new_target_scale = this.calculateTargetScale(fractional, target_scale);

		// We have to do another reduction to make sure there are no dangling zeroes
		if (new_target_scale != target_scale) {
			[integral, fractional] = reduceFractional(integral, fractional, target_scale, new_target_scale, this[ROUNDING]);
			target_scale = new_target_scale;
		}
	}

	this[SCALE] = target_scale;
	this[SCALE_BI] = BigInt(target_scale);
	this[IS_POSITIVE] = unified_result >= 0n;

	if (!(unified_result >= 0n)) {
		this[IS_POSITIVE] = false;

		if (integral == 0n && fractional == 0n) {
			this[IS_POSITIVE] = true;
		}
	} else {
		this[IS_POSITIVE] = true;
	}

	if (fractional < 0 || integral < 0) {
		integral = -integral;
		fractional = -fractional;
	}

	this[INTEGRAL] = integral;
	this[FRACTIONAL] = fractional;

	return this;
});

/**
 * Apply the correct scale to the fractional part of the result.
 * Round if necessary.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {BigInt}
 */
function reduceFractional(integral, fractional, current_scale, target_scale, round_mode) {

	if (current_scale < target_scale) {
		return [integral, fractional];
	}

	let scale_difference = current_scale - target_scale;
	let reduction_factor = 10n ** BigInt(current_scale - target_scale);
	let result = fractional / reduction_factor;

	if (round_mode != null && round_mode != -1) {
		let remainder = fractional % reduction_factor;

		if (scale_difference > 1) {
			remainder = remainder / (10n ** BigInt(scale_difference - 1));
		}

		// If the remainder is 0, we don't need to do anything
		if (remainder == 0n) {
			return [integral, result];
		}

		let is_positive = !(integral < 0n || fractional < 0n);

		let absolute = result;

		if (!is_positive && absolute < 0n) {
			absolute = -absolute;
			remainder = -remainder;
		}

		let change = 0n;

		if (round_mode == ROUND_UP) {
			change += 1n;
		} else if (round_mode == ROUND_DOWN) {
			// Nothing
		} else if (round_mode == ROUND_CEIL) {
			if (is_positive) {
				change += 1n;
			}
		} else if (round_mode == ROUND_FLOOR) {
			if (!is_positive) {
				change += 1n;
			}
		} else if (round_mode == ROUND_HALF_UP) {
			if (remainder >= 5n) {
				change += 1n;
			}
		} else if (round_mode == ROUND_HALF_DOWN) {
			if (remainder > 5n) {
				change += 1n;
			}
		} else if (round_mode == ROUND_HALF_EVEN) {
			if (remainder > 5n) {
				change += 1n;
			} else if (remainder == 5n) {
				// If the last digit of the integral part is even, we round down
				if (absolute % 2n != 0n) {
					change += 1n;
				}
			}
		} else if (round_mode == ROUND_HALF_CEIL) {
			if (remainder >= 5n && is_positive) {
				change += 1n;
			}
		} else if (round_mode == ROUND_HALF_FLOOR) {
			if (remainder >= 5n && !is_positive) {
				change += 1n;
			}
		}

		if (change != 0n) {
			if (target_scale == 0) {
				if (is_positive) {
					integral += change;
				} else {
					integral -= change;
				}

				result = 0n;
			} else {
				if (is_positive) {
					result += change;
				} else {
					result -= change;
				}
			}
		}
	}

	return [integral, result];
}

/**
 * Calculate the target fractional length
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {BigInt}   fraction          The fractional part
 * @param    {Number}   arithmetic_scale  The fractional length used to scale
 *
 * @return   {Number}
 */
Decimal.setMethod(function calculateTargetScale(fraction, arithmetic_scale) {

	if (!fraction) {
		return 0;
	}

	// Get the amount of ending zeroes
	let zeroes = 0;

	while (fraction % 10n == 0n) {
		zeroes += 1;
		fraction /= 10n;
	}

	// If the amount of zeroes is larger than the unified fractional length,
	// we can just return 0
	if (zeroes >= arithmetic_scale) {
		return 0;
	}

	// Otherwise, we can return the difference
	return arithmetic_scale - zeroes;
});

/**
 * Get the negated version of this value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function negated() {
	let result = this.getOrCreateResultInstanceFromSelf();
	result[IS_POSITIVE] = !this[IS_POSITIVE];
	return result;
});

/**
 * Return the absolute value of this number
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function absolute() {
	let result = this.getOrCreateResultInstanceFromSelf();
	result[IS_POSITIVE] = true;
	return result;
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

	const this_scale = Math.min(this[SCALE], this[MAX_ARITHMETIC_SCALE]),
	      other_scale = Math.min(other_decimal[SCALE], other_decimal[MAX_ARITHMETIC_SCALE]);

	let max_scale = Math.max(this_scale, other_scale);

	// Get the scaled integral and fractional parts of this value
	let this_unified = this.toScaledBigInt(max_scale);
	let other_unified = other_decimal.toScaledBigInt(max_scale);

	// Add the unified values
	let unified_result = this_unified + other_unified;

	return this.returnArithmeticResult(unified_result, max_scale, max_scale, null, max_scale);
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
 * Multiply the this value with the given value and return the new result.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   value
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function multiply(value) {

	let other_decimal = this.ensure(value);

	// Determine the sum of fractional lengths to scale each operand
	let sum_scale = this[SCALE] + other_decimal[SCALE];

	const this_scale = this[MAX_ARITHMETIC_SCALE],
	      other_scale = other_decimal[MAX_ARITHMETIC_SCALE];

	let min_scale = Math.min(this_scale, other_scale);

	// Get the scaled integral and fractional parts of this value
	let this_scaled = this.toScaledBigInt(this[SCALE]);
	let other_scaled = other_decimal.toScaledBigInt(other_decimal[SCALE]);

	// Multiply the scaled values
	let scaled_result = this_scaled * other_scaled;

	// @TODO: Apply min arithmetic scale here too
	return this.returnArithmeticResult(scaled_result, sum_scale);
});

/**
 * Apply the given exponent to this value and return the new result.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   value
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function power(value) {

	let other_decimal = this.ensure(value);

	if (!other_decimal.isPositive()) {

		// Shallow clone of this instance
		let shallow = Object.create(this);

		// Shallow clone of the other instance
		let other_shallow = Object.create(other_decimal);

		// Create the negated power value
		let negated_powered = shallow.power(other_shallow.negated());

		let result = this.getOrCreateBaseResultInstance();
		result[INTEGRAL] = 1n;
		result[FRACTIONAL] = 0n;
		result[SCALE] = 0;
		result[SCALE_BI] = 0n;
		result[IS_POSITIVE] = true;

		return result.divide(negated_powered);
	}

	// Check if the base is negative and the exponent is a fraction
	if (!this.isPositive() && !other_decimal.isInteger()) {
		throw new Error('Cannot raise a negative number to a non-integer exponent');
	}

	if (!other_decimal.isInteger()) {

		if (other_decimal[SCALE] == 1 && other_decimal[FRACTIONAL] == 5n && other_decimal[INTEGRAL] == 0n) {
			return this.nthRoot(2);
		}

		let result = this.toMutable();
		result.setArithmeticScale(this[MAX_ARITHMETIC_SCALE] + 13);

		result.logarithm().multiply(LN10).multiply(other_decimal).naturalExponentiation();

		return returnDecimalValue(this, result.toScale(this[MAX_ARITHMETIC_SCALE]));
	}

	const this_scale = this[SCALE],
	      exponent   = other_decimal[INTEGRAL];

	// Get the scaled integral and fractional parts of this value
	let this_scaled = this.toScaledBigInt(this_scale);

	// Multiply the scaled values
	let scaled_result = this_scaled ** exponent;

	return this.returnArithmeticResult(scaled_result, this_scale * Number(exponent));
});

/**
 * Calculate the factorial of this value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function factorial() {

	if (!this.isInteger()) {
		throw new Error('Factorial is only defined for integers');
	}

	if (!this.isPositive()) {
		throw new Error('Factorial is only defined for positive integers');
	}

	let integral = this[INTEGRAL];

	if (integral <= 1n) {
		integral = 1n;
	} else {

		let i = integral - 1n;

		while (i > 1n) {
			integral *= i;
			i -= 1n;
		}
	}

	let result = this.getOrCreateResultInstanceFromSelf();
	result[INTEGRAL] = integral;

	return result;
});

/**
 * Calculate the natural exponentation of this value (e^x)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function naturalExponentiation() {

	if (!this.isInteger()) {
		return this.naturalExponentiationApproximation();
	}

	// This will be fine.
	// The alternative is to run a Taylor series, but that is immensely slow.
	let power = this.toImmutable();
	let self_result = this.getOrCreateBaseResultInstance();
	copyValues(self_result, E);

	return self_result.power(power);
});

/**
 * Calculate the natural exponentation of this value by using an approximation.
 * This is slower than the regular method, but needed for the power method
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function naturalExponentiationApproximation() {

	const max_iterations = this[MAX_ITERATIONS] * 5,
	      original_max_scale = this[MAX_ARITHMETIC_SCALE],
	      temporary_scale = original_max_scale + 10,
	      max_zeroes = Math.floor(original_max_scale / 2) + 8;

	let seen_zero = 0,
	    result = ONE.toMutable(),
	    term = ONE.toMutable(),
	    n;

	result.setArithmeticScale(temporary_scale);
	term.setArithmeticScale(temporary_scale);

	for (n = 1; n < max_iterations; n++) {
		term.multiply(this).divide(n);
		result.add(term);

		if (term[INTEGRAL] == 0n) {

			if (term[FRACTIONAL] == 0n) {
				break;
			}

			if (n > this[MAX_ITERATIONS]) {
				seen_zero++;

				if (seen_zero > max_zeroes) {
					break;
				}
			}
		}
	}

	result.toScale(original_max_scale);

	return returnDecimalValue(this, result);
});

/**
 * Calculate the base10 logarithm of this value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function logarithm() {

	let integral = this[INTEGRAL],
	    fractional = this[FRACTIONAL];

	// Handle exceptional cases
	if (fractional == 0n) {
		if (integral == 1n) {
			return returnSimpleValue(this, 0);
		}

		if (integral % 10n === 0n) {
			return returnSimpleValue(this, String(integral).length - 1);
		}
	}

	if (!this.isPositive()) {
		throw new Error('Logarithm of non-positive value');
	}

	let x = this.toMutable(),
	    n = 0;

	while (x.isGreaterThan(ONE)) {
		x.divide(TEN);
		n += 1;
	}

	while (x.isLowerThan(SQRT1_10)) {
		x.multiply(TEN);
		n -= 1;
	}

	x.setArithmeticScale(this[MAX_ARITHMETIC_SCALE] + 1);

	let neg = x.toImmutable().subtract(ONE),
	    pos = x.toImmutable().add(ONE);

	let z = neg.divide(pos);

	// Do the taylor series
	let sum = z.toMutable(),
	    k;

	let current_fractional,
	    current_integral,
	    last_fractional,
	    last_integral;

	for (k = 3; k < this[MAX_ITERATIONS]*2; k += 2) {
		sum.add(z.power(k).divide(k));

		current_fractional = sum[FRACTIONAL];
		current_integral = sum[INTEGRAL];

		if (current_fractional == last_fractional && current_integral == last_integral) {
			break;
		}

		last_fractional = current_fractional;
		last_integral = current_integral;
	}

	// Multiply 2 times Log10E
	sum.multiply(TWOLOG10E);

	// Set the scale back to the original
	sum.setArithmeticScale(this[MAX_ARITHMETIC_SCALE]);

	// Add n (this will also fix the scale)
	sum.add(n);

	return returnDecimalValue(this, sum);
});

/**
 * Calculate the natural logarithm of this value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function naturalLogarithm() {

	// Check if the value is negative or zero
	if (!this.isPositive() || this.isZero()) {
		throw new Error('Natural logarithm is undefined for non-positive or zero values');
	}

	let last_integral,
	    last_fractional,
	    powered_e,
	    result = new MutableDecimal(6),
	    neg,
	    pos,
	    div,
	    x,
	    i;

	for (i = 0n; i < this[MAX_ITERATIONS]; i++) {

		powered_e = E.power(result);
		neg = powered_e.subtract(this);
		pos = powered_e.add(this);

		div = neg.divide(pos);

		result.subtract(TWO.multiply(div));

		if (result[INTEGRAL] == last_integral && result[FRACTIONAL] == last_fractional) {
			break;
		}

		last_integral = result[INTEGRAL];
		last_fractional = result[FRACTIONAL];
	}

	return result;
});

/**
 * Get the square root of this value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function squareRoot() {

	if (!this.isPositive()) {
		throw new Error('Square root of negative number');
	}

	return this.nthRoot(2);
});

/**
 * Get the nth root of this value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   n   The root to get
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function nthRoot(n) {

	let other_decimal = this.ensure(n);

	if (!other_decimal.isInteger()) {
		return;
	}

	const integral = other_decimal[INTEGRAL],
	      max_iterations = (this[MAX_ITERATIONS] * 2) + this[SCALE],
	      result_scale = this[MAX_ARITHMETIC_SCALE],
	      max_scale = result_scale + 1,
	      base_is_integer = this.isInteger();

	let same_diff = 0,
	    last_low,
	    last_high,
	    integral_difference,
	    result,
	    power,
	    high = this,
	    low = ONE.toImmutable(),
	    mid,
	    i,
	    j;

	low.setArithmeticScale(max_scale + 1);

	for (i = 0; i < max_iterations; i++) {
		mid = low.add(high).divide(TWO);
		power = ONE.toMutable();

		for (j = 0; j < integral; j++) {
			power.multiply(mid);
		}

		if (power.isLowerThan(this)) {
			low = mid;
		} else {
			high = mid;
		}

		if (base_is_integer) {
			if (i > 5) {
				integral_difference = high[INTEGRAL] - low[INTEGRAL];

				if (integral_difference == 1) {

					let temp = high[INTEGRAL] ** 2n;

					if (temp == this[INTEGRAL]) {
						high[FRACTIONAL] = 0n;
						result = high;
						break;
					}

					let diff = high.subtract(low).toScale(4);

					if (diff.isInteger()) {
						// The difference is a whole number,
						// so return the high value without any decimals
						result = high.toScale(0);
						break;
					}
				} else if (integral_difference == 0) {
					let diff = high.toScaledBigInt(max_scale) - low.toScaledBigInt(max_scale);

					if (diff >= -1n && diff <= 1n) {
						break;
					}
				}
			}
		} else if (i > 10) {

			if (last_low && last_low.equals(low) && last_high.equals(high)) {
				break;
			}

			integral_difference = high[INTEGRAL] - low[INTEGRAL];

			if (integral_difference == 0) {
				let diff = high.toScaledBigInt(max_scale) - low.toScaledBigInt(max_scale);

				if (diff >= -1n && diff <= 1n) {
					same_diff++;
				} else {
					same_diff = 0;
				}

				if (same_diff > 2) {
					break;
				}
			}

			last_low = low;
			last_high = high;
		}
	}

	if (result == null) {
		result = low.add(high).divide(TWO);
	}

	result = result.toScale(result_scale);
	result.setArithmeticScale(result_scale);

	return returnDecimalValue(this, result);
});

/**
 * Divide this value with the given value and return the new result.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   value
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function divide(value) {

	let other_decimal = this.ensure(value);

	const this_scale = this[MAX_ARITHMETIC_SCALE],
	      other_scale = other_decimal[MAX_ARITHMETIC_SCALE];

	let max_scale = Math.max(this_scale, other_scale),
	    min_scale;

	// If the precision is the same, add 1 to the max for rounding purposes
	if (max_scale != 0) {
		max_scale += 1;
		min_scale = max_scale - 1;
	}

	// Determine the sum of fractional lengths
	let sum_Scale = this[SCALE] + other_decimal[SCALE];

	// Determine a scale to use for optimal precision
	let scale = max_scale + sum_Scale;

	// Get the scaled integral and fractional parts of this value
	let this_scaled = this.toScaledBigInt(scale);
	let other_scaled = other_decimal.toScaledBigInt(sum_Scale);

	// Divide the scaled values
	let scaled_result = this_scaled / other_scaled;

	return this.returnArithmeticResult(scaled_result, max_scale, min_scale);
});

/**
 * Calculate the modulo of this value with the given value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Decimal}   value
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function modulo(value) {

	let other_decimal = this.ensure(value);

	const max_scale = Math.max(this[SCALE], other_decimal[SCALE]);

	// Get the scaled integral and fractional parts of this value
	let this_unified = this.toScaledBigInt(max_scale);
	let other_unified = other_decimal.toScaledBigInt(max_scale);

	// Add the unified values
	let unified_module = this_unified % other_unified; 

	return this.returnArithmeticResult(unified_module, max_scale, max_scale, null, max_scale);

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

	const print_scale = this[PRINT_SCALE];

	if (print_scale) {
		let scale = this[SCALE];

		let fractional_str = this[FRACTIONAL].toString().padStart(scale, '0');

		if (scale != print_scale) {
			fractional_str = fractional_str.padEnd(print_scale, '0');
		}

		result += '.' + fractional_str;
	}

	return result;
});

const E = Decimal.E = new Decimal('2.71828182845904523536028747135266249775724709369995');
const LOG10E = Decimal.LOG10E = new Decimal('0.43429448190325182765112891891660508229439700580367');
const LOG2E = Decimal.LOG2E = new Decimal('1.44269504088896340735992468100189213742664595415299');
const LN10 = Decimal.LN10 = new Decimal('2.30258509299404568401799145468436420760110148862877');
const TWOLOG10E = Decimal.TWOLOG10E = LOG10E.multiply(2);
const SQRT1_10 = Decimal.SQRT1_10 = new Decimal('0.31622776601683793319988935444327185337195551393252');
const ZERO = Decimal.ZERO = new Decimal(0);
const ONE = Decimal.ONE = new Decimal(1);
const TWO = Decimal.TWO = new Decimal(2);
const TEN = Decimal.TEN = new Decimal(10);
