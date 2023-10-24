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

	if (typeof value === 'string') {
		const [integral, fractional] = value.split('.');
		this.integral = BigInt(integral);
		this.fractional = BigInt(fractional || '0');
		this.fractional_length = fractional ? fractional.length : 0;
		this.is_positive = this.integral >= 0n;

		if (this.integral === 0n && integral === '-0') {
			this.is_positive = false;
		} else if (!this.is_positive) {
			this.integral = -this.integral;
		}
	} else {
		throw new Error('Invalid input type');
	}
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
 * Normalize the decimal when the fractional part of the number grows
 * large enough to impact the integral part
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Decimal}
 */
Decimal.setMethod(function normalize() {

	let max_fractional_length = this.fractional_length;
	let scaling_factor = BigInt(10 ** max_fractional_length);

	let abs_fractional = this.fractional < 0n ? -this.fractional : this.fractional;

	if (this.fractional >= scaling_factor) {
		this.integral += 1n;
		this.fractional -= scaling_factor;
	} else if (abs_fractional >= scaling_factor) {
		this.integral -= 1n;
		this.fractional += scaling_factor;
	}

	if (this.fractional < 0n) {
		this.fractional = -this.fractional;

		if (this.integral !== 0n) {
			this.integral -= 1n;
		}
		
		this.is_positive = false;
	}

	if (this.integral < 0n) {
		this.is_positive = false;
		this.integral = -this.integral;
	}
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
Decimal.setMethod(function returnArithmeticResult(integral, fractional, fractional_length) {

	let result = Object.create(Decimal.prototype);

	return result._applyArithmeticResult(integral, fractional, fractional_length);
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
Decimal.setMethod(function _applyArithmeticResult(integral, fractional, fractional_length) {

	this.integral = integral;
	this.fractional = fractional;
	this.fractional_length = fractional_length;
	this.is_positive = integral >= 0n;

	// if (!this.is_positive) {
	// 	this.integral = -this.integral;
	// }

	this.normalize();

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
	let max_fractional_length = Math.max(this.fractional_length, other_decimal.fractional_length);

	// Scale the fractional part of each operand
	// These values will always be positive
	let this_fractional = this.fractional * BigInt(10 ** (max_fractional_length - this.fractional_length));
	let other_fractional = other_decimal.fractional * BigInt(10 ** (max_fractional_length - other_decimal.fractional_length));

	// Even if the whole decimal is negative, the integral part will always be positive
	let this_integral = this.integral;
	let other_integral = other_decimal.integral;

	// Perform the addition on integral and fractional parts separately
	let fractional,
	    integral;

	if (this.is_positive && other_decimal.is_positive) {
		integral = this_integral + other_integral;
		fractional = this_fractional + other_fractional;
	} else if (!this.is_positive && !other_decimal.is_positive) {
		integral = this_integral + other_integral;
		fractional = this_fractional + other_fractional;

		// Make sure it's negative
		if (integral > 0n) {
			integral = -integral;
		} else if (fractional > 0n) {
			fractional = -fractional;
		}
	} else if (this.is_positive && !other_decimal.is_positive) {
		integral = this_integral - other_integral;
		fractional = this_fractional - other_fractional;
	} else if (!this.is_positive && other_decimal.is_positive) {
		integral = this_integral - other_integral;
		fractional = this_fractional - other_fractional;

		if (integral > 0n) {
			integral = -integral;
		} else if (fractional > 0n) {
			fractional = -fractional;
		}
	} else {
		throw new Error('Unknown situation');
	}

	// if (this.is_positive && other_decimal.is_positive) {
	// 	integral = this.integral + other_decimal.integral;
	// 	fractional = this_fractional + other_fractional;
	// } else if (!this.is_positive && !other_decimal.is_positive) {
	// 	integral = this.integral - other_decimal.integral;
	// 	fractional = this_fractional - other_fractional;
	// } else if (this.is_positive && !other_decimal.is_positive) {
	// 	integral = this.integral - other_decimal.integral;
	// 	fractional = this_fractional - other_fractional;
	// }
	
	// if (other_decimal.is_positive) {
	// 	integral = this.integral + other_decimal.integral;
	// 	fractional = this_fractional + other_fractional;
	// } else {
	// 	integral = this.integral - other_decimal.integral;
	// 	fractional = this_fractional - other_fractional;

	// 	console.log(this.integral, '-', other_decimal.integral, '»', integral);
	// 	console.log(this_fractional, '-', other_fractional, '»', fractional);
	// }

	return this.returnArithmeticResult(integral, fractional, max_fractional_length);
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
	other_decimal.is_positive = !other_decimal.is_positive;

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

	let result = this.integral.toString();

	if (!this.is_positive) {
		result = '-' + result;
	}

	if (this.fractional_length) {
		let fractional_str = this.fractional.toString().padStart(this.fractional_length, '0');
		result += '.' + fractional_str;
	}

	return result;
});