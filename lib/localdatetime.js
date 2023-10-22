const YEAR = Symbol('year'),
      MONTH = Symbol('month'),
      DAY = Symbol('day'),
      HOURS = Symbol('hours'),
      MINUTES = Symbol('minutes'),
      SECONDS = Symbol('seconds'),
      MILLISECONDS = Symbol('milliseconds');

function setTimeMethod(fnc) {
	LocalDateTime.setMethod(fnc);
	LocalTime.setMethod(fnc);
}

function setDateMethod(fnc) {
	LocalDateTime.setMethod(fnc);
	LocalDate.setMethod(fnc);
}

function setAll(fnc) {
	LocalDateTime.setMethod(fnc);
	LocalDate.setMethod(fnc);
	LocalTime.setMethod(fnc);
}

/**
 * The LocalDateTime Class:
 * A date & time representation without any timezone shenanigans.
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
const LocalDateTime = Fn.inherits('Develry.AbstractDateTime', 'LocalDateTime');

/**
 * Create a LocalDateTime instance from an integer representation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {BigInt}   int_representation
 *
 * @return   {LocalDateTime}
 */
LocalDateTime.setStatic(function fromNumericRepresentation(int_representation) {

	let date = new Date();

	let ms = Number(int_representation % 1000n);
	int_representation = int_representation / 1000n;

	let s = Number(int_representation % 100n);
	int_representation = int_representation / 100n;

	let m = Number(int_representation % 100n);
	int_representation = int_representation / 100n;

	let h = Number(int_representation % 100n);
	int_representation = int_representation / 100n;

	let d = Number(int_representation % 100n);
	int_representation = int_representation / 100n;

	let M = Number(int_representation % 100n);
	int_representation = int_representation / 100n;

	let y = Number(int_representation);

	date.setFullYear(y);
	date.setMonth(M - 1);
	date.setDate(d);
	date.setHours(h);
	date.setMinutes(m);
	date.setSeconds(s);
	date.setMilliseconds(ms);

	let result = new LocalDateTime(date);

	return result;
});

/**
 * Set the date from the given native date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Date}   date
 */
LocalDateTime.setMethod(function parseNativeDate(date) {
	this[YEAR] = date.getFullYear();
	this[MONTH] = date.getMonth() + 1;
	this[DAY] = date.getDate();
	this[HOURS] = date.getHours();
	this[MINUTES] = date.getMinutes();
	this[SECONDS] = date.getSeconds();
	this[MILLISECONDS] = date.getMilliseconds();
});

/**
 * Set the date from the given native UTC date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Date}   date
 */
LocalDateTime.setMethod(function parseUTCNativeDate(date) {
	this[YEAR] = date.getUTCFullYear();
	this[MONTH] = date.getUTCMonth() + 1;
	this[DAY] = date.getUTCDate();
	this[HOURS] = date.getUTCHours();
	this[MINUTES] = date.getUTCMinutes();
	this[SECONDS] = date.getUTCSeconds();
	this[MILLISECONDS] = date.getUTCMilliseconds();
});

/**
 * Get a Date instance of this date (in the current local timezone)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalDateTime.setMethod(function getNativeDate() {
	return new Date(this.getYear(), this.getMonth() - 1, this.getDay(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
});

/**
 * Get a Date instance of this date (in the UTC timezone)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalDateTime.setMethod(function getUTCNativeDate() {
	return new Date(Date.UTC(this.getYear(), this.getMonth() - 1, this.getDay(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds()));
});

/**
 * Get an integer representation of this date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {BigInt}
 */
LocalDateTime.setMethod(function toNumericRepresentation() {

	let result = this.getYear();

	result *= 100;
	result += this.getMonth();
	result *= 100;
	result += this.getDay();

	// Now turn it into a BigInt
	result = BigInt(result) * 100n;
	result += BigInt(this.getHours());
	result *= 100n;
	result += BigInt(this.getMinutes());
	result *= 100n;
	result += BigInt(this.getSeconds());
	result *= 1000n;
	result += BigInt(this.getMilliseconds());

	return result;
});

/**
 * Return a string representation of this date (YYYY-MM-DD HH:MM:SS.MMM)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
LocalDateTime.setMethod(function toString() {

	let result = this.getYear();

	result += '-' + String(this.getMonth()).padStart(2, '0');
	result += '-' + String(this.getDay()).padStart(2, '0');
	result += ' ' + String(this.getHours()).padStart(2, '0');
	result += ':' + String(this.getMinutes()).padStart(2, '0');
	result += ':' + String(this.getSeconds()).padStart(2, '0');

	return result;
});

/**
 * The LocalDate Class:
 * A date representation without any timezone shenanigans
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
const LocalDate = Fn.inherits('Develry.AbstractDateTime', function LocalDate(year, month, day) {
	LocalDate.super.call(this, ...arguments);
});

/**
 * Create a LocalDate instance from an integer representation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   int_representation
 *
 * @return   {LocalDate}
 */
LocalDate.setStatic(function fromNumericRepresentation(int_representation) {

	let day = int_representation % 100;
	int_representation = int_representation / 100;

	let month = int_representation % 100;
	int_representation = int_representation / 100;

	let year = int_representation;

	let result = new LocalDate(year, month, day);

	return result;
});

/**
 * Get an integer representation of this date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
LocalDate.setMethod(function toNumericRepresentation() {

	let result = this.getYear();

	result *= 100;
	result += this.getMonth();
	result *= 100;
	result += this.getDay();

	return result;
});

/**
 * Set the date from the given native date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Date}   date
 */
LocalDate.setMethod(function parseNativeDate(date) {
	this[YEAR] = date.getFullYear();
	this[MONTH] = date.getMonth() + 1;
	this[DAY] = date.getDate();
});

/**
 * Set the date from the given native UTC date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Date}   date
 */
LocalDate.setMethod(function parseUTCNativeDate(date) {
	this[YEAR] = date.getUTCFullYear();
	this[MONTH] = date.getUTCMonth() + 1;
	this[DAY] = date.getUTCDate();
});

/**
 * Get a Date instance of this date (in the current local timezone)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalDate.setMethod(function getNativeDate() {
	return new Date(this.getYear(), this.getMonth() - 1, this.getDay());
});

/**
 * Get a Date instance of this date (in the UTC timezone)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalDate.setMethod(function getUTCNativeDate() {
	return new Date(Date.UTC(this.getYear(), this.getMonth() - 1, this.getDay()));
});

/**
 * Return a string representation of this date (YYYY-MM-DD)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
LocalDate.setMethod(function toString() {

	let result = this.getYear();

	result += '-' + String(this.getMonth()).padStart(2, '0');
	result += '-' + String(this.getDay()).padStart(2, '0');

	return result;
});

/**
 * The LocalTime Class:
 * A time representation without any timezone shenanigans
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   hours         The hours (0-23) or a string
 * @param    {Number}   minutes       The minutes (0-59)
 * @param    {Number}   seconds       The seconds (0-59)
 * @param    {Number}   milliseconds  The milliseconds (0-999)
 */
const LocalTime = Fn.inherits('Develry.AbstractDateTime', function LocalTime(hours = 0, minutes = 0, seconds = 0, milliseconds = 0) {

	let len = arguments.length,
	    native_date;

	if (len == 0) {
		native_date = new Date();
	} else if (len == 1) {
		if (typeof hours == 'string') {
			this.parseFromHourString(hours);
			return;
		} else if (hours instanceof Date) {
			native_date = hours;
		} else if (hours instanceof Blast.Classes.Develry.AbstractDateTime) {
			native_date = hours.getNativeDate();
		}
	}

	if (!native_date) {
		native_date = new Date(0, 0, 0, hours, minutes, seconds, milliseconds);
	}

	if (isNaN(native_date)) {
		throw new Error('Invalid hour');
	}

	this.parseNativeDate(native_date);
});

/**
 * Create a LocalDate instance from an integer representation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   int_representation
 *
 * @return   {LocalTime}
 */
LocalTime.setStatic(function fromNumericRepresentation(int_representation) {

	let ms = int_representation % 1000;
	int_representation = int_representation / 1000;

	let s = int_representation % 100;
	int_representation = int_representation / 100;

	let m = int_representation % 100;
	int_representation = int_representation / 100;

	let h = int_representation;

	let result = new LocalTime(h, m, s, ms);

	return result;
});

/**
 * Get an integer representation of this date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
LocalTime.setMethod(function toNumericRepresentation() {

	let result = this.getHours();
	result *= 100;
	result += this.getMinutes();
	result *= 100;
	result += this.getSeconds();
	result *= 1000;
	result += this.getMilliseconds();

	return result;
});
/**
 * Parse an hour string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
LocalTime.setMethod(function parseFromHourString(hours) {

	// Try a simple date parse first
	let date = new Date(hours);

	if (!isNaN(date)) {
		this.parseNativeDate(date);
		return;
	}

	let parts = hours.split(':'),
	    len = parts.length,
	    i;
	
	if (len == 0) {
		throw new Error('Invalid hour string');
	}

	if (len > 3) {
		throw new Error('Invalid hour string');
	}

	for (i = 0; i < len; i++) {
		parts[i] = Number(parts[i]);
	}

	this[HOURS] = parts[0];
	this[MINUTES] = parts[1] || 0;
	this[SECONDS] = parts[2] || 0;
	this[MILLISECONDS] = 0;
});

/**
 * Set the date from the given native date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Date}   date
 */
LocalTime.setMethod(function parseNativeDate(date) {
	this[HOURS] = date.getHours();
	this[MINUTES] = date.getMinutes();
	this[SECONDS] = date.getSeconds();
	this[MILLISECONDS] = date.getMilliseconds();
});

/**
 * Set the date from the given native UTC date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Date}   date
 */
LocalTime.setMethod(function parseUTCNativeDate(date) {
	this[HOURS] = date.getUTCHours();
	this[MINUTES] = date.getUTCMinutes();
	this[SECONDS] = date.getUTCSeconds();
	this[MILLISECONDS] = date.getUTCMilliseconds();
});

/**
 * Get a Date instance of this date (in the current local timezone)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalTime.setMethod(function getNativeDate() {
	return new Date(0, 0, 0, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
});

/**
 * Get a Date instance of this date (in the UTC timezone)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalTime.setMethod(function getUTCNativeDate() {
	return new Date(Date.UTC(0, 0, 0, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds()));
});

/**
 * Return the timestamp in the current timezone (with milliseconds)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
LocalTime.setMethod(function valueOf() {

	let result = this.getHours() * 60 * 60 * 1000;
	result += this.getMinutes() * 60 * 1000;
	result += this.getSeconds() * 1000;
	result += this.getMilliseconds();

	return result;
});

/**
 * Return a string representation of this date (HH:MM:SS)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {String}
 */
LocalTime.setMethod(function toString() {

	let result = String(this.getHours()).padStart(2, '0');
	result += ':' + String(this.getMinutes()).padStart(2, '0');
	result += ':' + String(this.getSeconds()).padStart(2, '0');

	return result;
});

/**
 * Reparse the current date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
setDateMethod(function reparseUTCDate() {
	this.parseUTCNativeDate(this.getUTCNativeDate());
});

/**
 * Get the current weekday (1-7)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setDateMethod(function getWeekDay() {

	let week_day = this.getNativeDate().getDay();

	if (week_day == 0) {
		week_day = 7;
	}

	return week_day;
});

/**
 * Set the current weekday (1-7).
 * The date can go up or down, but it will always stay in the same week,
 * unless the given week day is greater than 7 or smaller than 1.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   week_day
 */
setDateMethod(function setWeekDay(week_day) {

	if (!week_day) {
		return;
	}

	let current_week_day = this.getWeekDay(),
	    difference = week_day - current_week_day;

	this.add(difference, 'day');
});

/**
 * Get the year of this date (4 digits)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setDateMethod(function getYear() {
	return this[YEAR];
});

/**
 * Set the year of this date (4 digits)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_year
 */
setDateMethod(function setYear(new_year) {
	this[YEAR] = new_year;

	// If the month is february, and the day is 29, and the new year is not a leap year,
	// then set the day to the first of march
	if (this[MONTH] == 2 && this[DAY] == 29 && !this.isLeapYear()) {
		this[MONTH] = 3;
		this[DAY] = 1;
	}
});

/**
 * Is this in a leap year?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Boolean}
 */
setDateMethod(function isLeapYear() {
	const year = this.getYear();
	return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
});

/**
 * Get the month of this date (1-12)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setDateMethod(function getMonth() {
	return this[MONTH];
});

/**
 * Set the month of this date (1-12)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_month
 */
setDateMethod(function setMonth(new_month) {

	if (!new_month) {
		return;
	}

	this[MONTH] = new_month;

	// Perform a special check in certain cases
	if (new_month < 1 || new_month > 12 || this[DAY] > 28) {
		this.reparseUTCDate();
	}

	return this[MONTH];
});

/**
 * Get the day of the month of this date (1-31)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setDateMethod(function getDay() {
	return this[DAY];
});

/**
 * Set the day of the month of this date (1-31)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_day
 */
setDateMethod(function setDay(new_day) {

	if (!new_day) {
		return;
	}

	this[DAY] = new_day;

	// Perform a special check in certain cases
	if (new_day < 1 || new_day > 28) {
		this.reparseUTCDate();
	}

	return this[DAY];
});

/**
 * Get the hours of this date (0-23)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setTimeMethod(function getHours() {
	return this[HOURS];
});

/**
 * Set the hours of this date (0-23)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_hours
 */
setTimeMethod(function setHours(new_hours) {

	this[HOURS] = new_hours;

	// Perform a special check in certain cases
	if (new_hours < 0 || new_hours > 23) {
		this.reparseUTCDate();
	}
});

/**
 * Get the minutes of this date (0-59)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setTimeMethod(function getMinutes() {
	return this[MINUTES];
});

/**
 * Set the minutes of this date (0-59)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_minutes
 */
setTimeMethod(function setMinutes(new_minutes) {

	this[MINUTES] = new_minutes;

	// Perform a special check in certain cases
	if (new_minutes < 0 || new_minutes > 59) {
		this.reparseUTCDate();
	}
});

/**
 * Get the seconds of this date (0-59)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setTimeMethod(function getSeconds() {
	return this[SECONDS];
});

/**
 * Set the seconds of this date (0-59)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_seconds
 */
setTimeMethod(function setSeconds(new_seconds) {

	this[SECONDS] = new_seconds;

	// Perform a special check in certain cases
	if (new_seconds < 0 || new_seconds > 59) {
		this.reparseUTCDate();
	}
});

/**
 * Get the milliseconds of this date (0-999)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Number}
 */
setTimeMethod(function getMilliseconds() {
	return this[MILLISECONDS];
});

/**
 * Set the milliseconds of this date (0-999)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Number}   new_ms
 */
setTimeMethod(function setMilliseconds(new_ms) {
	this[MILLISECONDS] = new_ms;

	// Perform a special check in certain cases
	if (new_ms < 0 || new_ms > 999) {
		this.reparseUTCDate();
	}
});