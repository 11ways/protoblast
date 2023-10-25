const INTEGRAL = Symbol('integral'),
      FRACTIONAL = Symbol('fractional'),
      SCALE = Symbol('scale'),
      SCALE_BI = Symbol('scale_bi'),
      MAX_ARITHMETIC_SCALE = Symbol('max_arithmetic_scale'),
      IS_POSITIVE = Symbol('is_positive'),
      ROUNDING = Symbol('rounding');

const ROUND_UP = 0,
      ROUND_DOWN = 1,
      ROUND_CEIL = 2,
      ROUND_FLOOR = 3,
      ROUND_HALF_UP = 4,
      ROUND_HALF_DOWN = 5,
      ROUND_HALF_EVEN = 6,
      ROUND_HALF_CEIL = 7,
      ROUND_HALF_FLOOR = 8;

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
	const scale = fractional_string ? fractional_string.length : 0;
	const scale_bi = BigInt(scale);

	this[INTEGRAL] = integral;
	this[FRACTIONAL] = fractional;
	this[SCALE] = scale;
	this[SCALE_BI] = scale_bi;

	const is_positive = (integral === 0n && integral_string === '-0') ? false : integral >= 0n;

	if (!is_positive) {
		this[INTEGRAL] = -this[INTEGRAL];
	}

	this[IS_POSITIVE] = is_positive;
});

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
 * Is this value positive?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
Decimal.setMethod(function isPositive() {
	return this[IS_POSITIVE];
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
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function returnArithmeticResult(unified_result, arithmetic_scale, normalize_scale, target_scale) {
	let result = this._getResultInstance();
	return result._applyArithmeticResult(unified_result, arithmetic_scale, normalize_scale, target_scale);
});

/**
 * Get an instance to use as the final result.
 * This will be a new instance (without the constructor applied)
 * except when this is a mutable version of the class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function _getResultInstance() {
	let result = Object.create(Decimal.prototype);
	result[ROUNDING] = this[ROUNDING];
	result[MAX_ARITHMETIC_SCALE] = this[MAX_ARITHMETIC_SCALE];
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
 * @param    {Number}   normalize_scale    The fractional length to round to
 * @param    {Number}   target_scale      The fractional length to use for the result
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function _applyArithmeticResult(unified_result, arithmetic_scale, normalize_scale, target_scale) {

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

	if (target_scale != normalize_scale) {
		[integral, fractional] = reduceFractional(integral, fractional, normalize_scale, target_scale, this[ROUNDING]);
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

	let result = this._getResultInstance();

	result[INTEGRAL] = this[INTEGRAL];
	result[FRACTIONAL] = this[FRACTIONAL];
	result[SCALE] = this[SCALE];
	result[SCALE_BI] = this[SCALE_BI];
	result[IS_POSITIVE] = !this[IS_POSITIVE];

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

	// Determine the max fractional length to know by how much to scale each operand
	let max_scale = Math.max(this[SCALE], other_decimal[SCALE]);

	// Get the scaled integral and fractional parts of this value
	let this_unified = this.toScaledBigInt(max_scale);
	let other_unified = other_decimal.toScaledBigInt(max_scale);

	// Add the unified values
	let unified_result = this_unified + other_unified;

	return this.returnArithmeticResult(unified_result, max_scale);
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

	// Get the scaled integral and fractional parts of this value
	let this_scaled = this.toScaledBigInt(this[SCALE]);
	let other_scaled = other_decimal.toScaledBigInt(other_decimal[SCALE]);

	// Multiply the scaled values
	let scaled_result = this_scaled * other_scaled;

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
Decimal.setMethod(function pow(value) {

	let other_decimal = this.ensure(value);

	if (!other_decimal.isPositive()) {

		// Shallow clone of this instance
		let shallow = Object.create(this);

		// Shallow clone of the other instance
		let other_shallow = Object.create(other_decimal);

		// Create the negated power value
		let negated_powered = shallow.pow(other_shallow.negated());

		let result = this._getResultInstance();
		result[INTEGRAL] = 1n;
		result[FRACTIONAL] = 0n;
		result[SCALE] = 0;
		result[SCALE_BI] = 0n;
		result[IS_POSITIVE] = true;

		return result.divide(negated_powered);
	}

	// Determine the sum of fractional lengths to scale each operand
	let sum_scale = this[SCALE] + other_decimal[SCALE];

	// Get the scaled integral and fractional parts of this value
	let this_scaled = this.toScaledBigInt(this[SCALE]);
	let other_scaled = other_decimal.toScaledBigInt(other_decimal[SCALE]);

	// Multiply the scaled values
	let scaled_result = this_scaled ** other_scaled;

	return this.returnArithmeticResult(scaled_result, sum_scale);
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
	    min_scale = Math.min(this_scale, other_scale);

	// If the precision is the same, add 1 to the max for rounding purposes
	if (max_scale == min_scale && max_scale != 0) {
		max_scale += 1;
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

	if (this[SCALE]) {
		let fractional_str = this[FRACTIONAL].toString().padStart(this[SCALE], '0');
		result += '.' + fractional_str;
	}

	return result;
});