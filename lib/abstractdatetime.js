/**
 * The AbstractDateTime Class:
 * The base class for all date/time classes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   year          The year (4 digits) or a string that can be parsed by `new Date()`
 * @param    {Number}   month         The month (1-12)
 * @param    {Number}   day           The day (1-31)
 * @param    {Number}   hours         The hours (0-23)
 * @param    {Number}   minutes       The minutes (0-59)
 * @param    {Number}   seconds       The seconds (0-59)
 * @param    {Number}   milliseconds  The milliseconds (0-999)
 */
const AbstractDateTime = Fn.inherits(null, 'Develry', function AbstractDateTime(year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) {
	let date,
	    len = arguments.length;

	if (len == 0) {
		date = new Date();
	} else if (len == 1) {
		if (typeof year == 'string') {
			date = this.parseLocalTimeStringToNativeDate(year);
		} else if (year instanceof Date) {
			date = year;
		} else if (year instanceof AbstractDateTime) {
			date = year.getNativeDate();
		}
	} else {
		date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
	}

	if (isNaN(date)) {
		throw new Error('Invalid date');
	}

	this.parseNativeDate(date);
});

/**
 * Create an instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {AbstractDateTime}
 */
AbstractDateTime.setStatic(function create(...args) {

	let length = args.length,
	    first = args[0];

	if (length == 0 || first == null) {
		return new this();
	}

	if (length > 1) {
		return new this(...args);
	}

	let type = typeof first;

	if (type == 'bigint' || type == 'number') {
		return this.fromNumericRepresentation(first);
	}

	return new this(first);
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Object}
 */
AbstractDateTime.setStatic(function unDry(value) {
	let result = this.fromNumericRepresentation(value.numeric);
	return result;
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
AbstractDateTime.setMethod('toDry', function toDry() {
	return {
		value: {
			numeric: this.toNumericRepresentation(),
		}
	};
});

/**
 * Clone this
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {AbstractDateTime}
 */
AbstractDateTime.setMethod(function clone() {
	let result = new this.constructor(this.getNativeDate());
	return result;
});

/**
 * Parse a local time string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String}   input
 *
 * @return   {Date}
 */
AbstractDateTime.setMethod(function parseLocalTimeStringToNativeDate(input) {

	input = input.trim();
	let length = input.length;

	// If it contains time, JavaScript will parse it in the current timezone
	if (input.length > 10 || input.includes(' ') || input.includes(':')) {
		return new Date(input);
	}

	// There is NO time, so JavaScript will parse it in UTC
	// So simply add the start of the day in the current timezone
	input += ' 00:00:00';

	return new Date(input);
});

/**
 * Set the current date to the start of a unit of time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String}   unit    year, quarter, month, week, day, ...
 *
 * @return   {AbstractDateTime}
 */
AbstractDateTime.setMethod(function startOf(unit) {

	let utc_date = this.getNativeDate();
	Blast.Bound.Date.startOf(utc_date, unit);
	this.parseNativeDate(utc_date);

	return this;
});

/**
 * Set the current date to the end of a unit of time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {String}   unit    year, quarter, month, week, day, ...
 *
 * @return   {AbstractDateTime}
 */
AbstractDateTime.setMethod(function endOf(unit) {

	let utc_date = this.getNativeDate();
	Blast.Bound.Date.endOf(utc_date, unit);
	this.parseNativeDate(utc_date);

	return this;
});

/**
 * Add a unit of time to the current date.
 * It will be changed in place.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   amount
 * @param    {String}   unit
 *
 * @return   {AbstractDateTime}
 */
AbstractDateTime.setMethod(function add(amount, unit) {

	if (typeof amount === 'string') {
		if (typeof unit == 'string') {
			amount = Number(amount) || 0;
		} else {
			unit = amount;
			amount = 1;
		}
	} else if (amount == null) {
		// Don't add anything if it's null or undefined
		return this;
	}

	let utc_date = this.getUTCNativeDate();
	let unittime = Collection.Date.getUnitMs(unit, this);

	// If we're setting any units shorter then a day,
	// we can do so by simply increasing the time
	if (unittime < 864e5) {
		let newtime = utc_date.valueOf() + (unittime * amount);
		utc_date.setTime(newtime);
	} else {
		let current;
		unit = Collection.Date.getUnitName(unit);

		if (unit == 'week') {
			unit = 'day';
			amount = amount * 7;
		}

		if (unit == 'day') {
			current = utc_date.getUTCDate();

			// JavaScript will automatically handle overflows for us
			utc_date.setUTCDate(current + amount);
		} else if (unit == 'month') {
			current = utc_date.getUTCMonth();

			// JavaScript will automatically handle overflows for us
			utc_date.setUTCMonth(current + amount);
		} else if (unit == 'year') {
			current = utc_date.getUTCFullYear();
			utc_date.setUTCFullYear(current + amount);
		}
	}

	this.parseUTCNativeDate(utc_date);

	return this;
});

/**
 * Subtract a unit of time from the current date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   amount
 * @param    {String}   unit    year, month, week, day, ...
 *
 * @return   {AbstractDateTime}
 */
AbstractDateTime.setMethod(function subtract(amount, unit) {

	if (typeof amount === 'string') {
		if (typeof unit == 'string') {
			amount = Number(amount) || 1;
		} else {
			unit = amount;
			amount = 1;
		}
	}

	return this.add(-amount, unit);
});

/**
 * Return the timestamp in the current timezone
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
AbstractDateTime.setMethod(function valueOf() {
	return this.getNativeDate().valueOf();
});

/**
 * Format this date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
AbstractDateTime.setMethod(function format(pattern, locale, timezone) {
	return Bound.Date.format(this.getNativeDate(), pattern, locale, timezone);
});

/**
 * Return a checksum
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
AbstractDateTime.setMethod(Blast.checksumSymbol, function checksum() {
	return 'LD' + this.toNumericRepresentation();
});
