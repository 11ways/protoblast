const YEAR = Symbol('year'),
      MONTH = Symbol('month'),
      DAY = Symbol('day'),
      HOURS = Symbol('hours'),
      MINUTES = Symbol('minutes'),
      SECONDS = Symbol('seconds'),
      MILLISECONDS = Symbol('milliseconds');

const setTimeMethod = function setTimeMethod(fnc) {
	LocalDateTime.setMethod(fnc);
	LocalTime.setMethod(fnc);
};

const setDateMethod = function setDateMethod(fnc) {
	LocalDateTime.setMethod(fnc);
	LocalDate.setMethod(fnc);
};

const setAll = function setAll(fnc) {
	LocalDateTime.setMethod(fnc);
	LocalDate.setMethod(fnc);
	LocalTime.setMethod(fnc);
};

/**
 * The LocalDateTime Class:
 * A date & time representation without any timezone shenanigans.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   year          The year (4 digits) or a string that can be parsed by `new Date()`
 * @param    {number}   month         The month (1-12)
 * @param    {number}   day           The day (1-31)
 * @param    {number}   hours         The hours (0-23)
 * @param    {number}   minutes       The minutes (0-59)
 * @param    {number}   seconds       The seconds (0-59)
 * @param    {number}   milliseconds  The milliseconds (0-999)
 */
const LocalDateTime = Fn.inherits('Develry.AbstractDateTime', 'LocalDateTime');

/**
 * Create a LocalDateTime instance from an integer representation
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {string}
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   year          The year (4 digits) or a string that can be parsed by `new Date()`
 * @param    {number}   month         The month (1-12)
 * @param    {number}   day           The day (1-31)
 * @param    {number}   hours         The hours (0-23)
 * @param    {number}   minutes       The minutes (0-59)
 * @param    {number}   seconds       The seconds (0-59)
 * @param    {number}   milliseconds  The milliseconds (0-999)
 */
const LocalDate = Fn.inherits('Develry.AbstractDateTime', function LocalDate(year, month, day) {
	LocalDate.super.call(this, ...arguments);
});

/**
 * Create a LocalDate instance from an integer representation
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   int_representation
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {Date}
 */
LocalDate.setMethod(function getUTCNativeDate() {
	return new Date(Date.UTC(this.getYear(), this.getMonth() - 1, this.getDay()));
});

/**
 * Basically a method just for compatibility with the other classes
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {AbstractDateTime}
 *
 * @return   {LocalDate}
 */
LocalDate.setMethod(function withDate(date) {
	return LocalDate.create(date);
});

/**
 * Return a string representation of this date (YYYY-MM-DD)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {string}
 */
LocalDate.setMethod(function toString() {

	let result = this.getYear();

	result += '-' + String(this.getMonth()).padStart(2, '0');
	result += '-' + String(this.getDay()).padStart(2, '0');

	return result;
});

/**
 * Get a date range for a named period.
 *
 * Supported periods:
 * - today, yesterday
 * - this_week, last_week
 * - this_month, last_month
 * - this_quarter, last_quarter
 * - this_year, last_year
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.8
 * @version  0.9.8
 *
 * @param    {string}      period      The period name
 * @param    {LocalDate}   reference   Reference date (defaults to today)
 *
 * @return   {Object}   Object with `from` and `to` LocalDate properties
 */
LocalDate.setStatic(function getDateRange(period, reference) {

	if (!reference) {
		reference = new LocalDate();
	} else if (!(reference instanceof LocalDate)) {
		reference = LocalDate.create(reference);
	}

	let from = reference.clone();

	// Modify `from` based on period
	switch (period) {
		case 'today':
			break;
		case 'yesterday':
			from.subtract(1, 'day');
			break;
		case 'this_week':
			from.startOf('isoweek');
			break;
		case 'last_week':
			from.subtract(1, 'week').startOf('isoweek');
			break;
		case 'this_month':
			from.startOf('month');
			break;
		case 'last_month':
			from.subtract(1, 'month').startOf('month');
			break;
		case 'this_quarter':
			from.startOf('quarter');
			break;
		case 'last_quarter':
			from.subtract(3, 'month').startOf('quarter');
			break;
		case 'this_year':
			from.startOf('year');
			break;
		case 'last_year':
			from.subtract(1, 'year').startOf('year');
			break;
		default:
			throw new Error(`Unknown period: "${period}"`);
	}

	let to = from.clone();

	// Modify `to` for multi-day periods
	switch (period) {
		case 'this_week':
		case 'last_week':
			to.add(6, 'day');
			break;
		case 'this_month':
		case 'last_month':
			to.endOf('month');
			break;
		case 'this_quarter':
		case 'last_quarter':
			to.add(2, 'month').endOf('month');
			break;
		case 'this_year':
		case 'last_year':
			to.endOf('year');
			break;
	}

	return { from, to };
});

/**
 * The LocalTime Class:
 * A time representation without any timezone shenanigans
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   hours         The hours (0-23) or a string
 * @param    {number}   minutes       The minutes (0-59)
 * @param    {number}   seconds       The seconds (0-59)
 * @param    {number}   milliseconds  The milliseconds (0-999)
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   int_representation
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {string}
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {string}
 */
LocalTime.setMethod(function toString() {

	let result = String(this.getHours()).padStart(2, '0');
	result += ':' + String(this.getMinutes()).padStart(2, '0');
	result += ':' + String(this.getSeconds()).padStart(2, '0');

	return result;
});

/**
 * Get the time portion of this date as a LocalTime instance
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {LocalTime}
 */
setAll(function getTime() {
	return LocalTime.create(this);
});

/**
 * Set the current time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {AbstractDateTime}
 *
 * @return   {this}
 */
setTimeMethod(function setTime(time) {

	time = LocalTime.create(time);

	this[HOURS] = time[HOURS];
	this[MINUTES] = time[MINUTES];
	this[SECONDS] = time[SECONDS];
	this[MILLISECONDS] = time[MILLISECONDS];

	return this;
});

/**
 * Get the current date with a certain time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {AbstractDateTime}   time
 *
 * @return   {LocalDateTime}
 */
setDateMethod(function withTime(time) {

	let clone = LocalDateTime.create(this);

	if (!time) {
		return clone;
	}

	return clone.setTime(time);
});

/**
 * Get the date portion
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {LocalDate}
 */
setDateMethod(function getDate() {
	return LocalDate.create(this);
});

/**
 * Set the current date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {AbstractDateTime}   date
 *
 * @return   {this}
 */
setDateMethod(function setDate(date) {

	date = LocalDate.create(date);

	this[YEAR] = date[YEAR];
	this[MONTH] = date[MONTH];
	this[DAY] = date[DAY];

	return this;
});

/**
 * Get the day of the year
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getCurrentDayOfYear() {

	// Get the start of the year
	const start_of_year = new Date(this.getYear(), 0, 0);

	// Get the current date
	const current_date = this.getDate().getNativeDate();
	
	// Calculate the difference in milliseconds
	const diff = current_date - start_of_year;

	// Calculate how many milliseconds are in one day
	const one_day = 1000 * 60 * 60 * 24;

	const day = Math.floor(diff / one_day);

	return day;
});

/**
 * Get the week number of the current year.
 * If a year starts after a thursday, this will be 0 for the first days of january.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getWeekOfYear() {

	// Get the start of the year
	const start_of_year = new LocalDate(this.getYear(), 1, 1);

	// Get the weekday this year started on
	let start_day = start_of_year.getDayOfWeek();

	// Get the current day of the year
	let day_of_year = this.getCurrentDayOfYear();

	if (start_day > 4) {
		day_of_year -= (8-start_day);
	}

	// Calculate the week number
	const week = ~~Math.ceil(day_of_year / 7);

	return week;
});

/**
 * Get the current ISO week number.
 * If a year starts after a thursday,
 * the first days of that year will be in week 52 of the previous year.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getWeek() {

	let week_of_year = this.getWeekOfYear();

	if (week_of_year == 0) {
		let last_year = new LocalDate(this.getYear() - 1, 12, 31);
		week_of_year = last_year.getWeekOfYear();
	} else if (week_of_year == 53) {
		// Get the start of the year
		const start_of_year = new LocalDate(this.getYear(), 1, 1);

		// Get the weekday this year started on
		let start_day = start_of_year.getDayOfWeek();

		if (start_day < 4) {
			week_of_year = 1;
		}
	}

	return week_of_year;
});

/**
 * Get the current time with the given date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {AbstractDateTime}
 *
 * @return   {LocalDateTime}
 */
setTimeMethod(function withDate(date) {
	let result = LocalDateTime.create(date);
	return result.withTime(this);
});

/**
 * Reparse the current date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
setDateMethod(function reparseUTCDate() {
	this.parseUTCNativeDate(this.getUTCNativeDate());
});

/**
 * Get the current weekday (1-7)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   week_day
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getYear() {
	return this[YEAR];
});

/**
 * Get the year of this date (4 digits)
 * (Added for backwards-compatibility with Date instance)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.7
 * @version  0.9.7
 *
 * @return   {number}
 */
setDateMethod(function getFullYear() {
	return this[YEAR];
});

/**
 * Set the year of this date (4 digits)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_year
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {boolean}
 */
setDateMethod(function isLeapYear() {
	const year = this.getYear();
	return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
});

/**
 * Get the month of this date (1-12)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getMonth() {
	return this[MONTH];
});

/**
 * Set the month of this date (1-12)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_month
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
 * Get the day of the week of this date (1-7)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getDayOfWeek() {

	let day = this.getNativeDate().getDay();

	if (day == 0) {
		day = 7;
	}

	return day;
});

/**
 * Get the day of the month of this date (1-31)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setDateMethod(function getDay() {
	return this[DAY];
});

/**
 * Set the day of the month of this date (1-31)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_day
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
 * Parse a date for comparing
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {Mixed}   other_date
 *
 * @return   {AbstractDateTime}
 */
setAll(function parseOtherDateForComparison(other_date) {

	if (!other_date) {
		return new this.constructor();
	}

	if (other_date instanceof Date) {
		return new this.constructor(other_date);
	}

	if (other_date instanceof Blast.Classes.Develry.AbstractDateTime) {
		return other_date;
	}

	if (typeof other_date == 'string') {
		if (other_date.includes(':')) {
			if (other_date.length < 9) {
				return new LocalTime(other_date);
			} else {
				return new LocalDateTime(other_date);
			}
		}

		return new LocalDate(other_date);
	}

	return new LocalDateTime(other_date);
});

/**
 * Is this time before the given date?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {LocalDate}   other_date
 */
LocalTime.setMethod(function isBefore(other_date) {
	other_date = this.parseOtherDateForComparison(other_date);
	return this < other_date;
});

/**
 * Is this time after the given date?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {LocalDate}   other_date
 */
LocalTime.setMethod(function isAfter(other_date) {
	other_date = this.parseOtherDateForComparison(other_date);
	return this > other_date;
});

/**
 * Is this date before the given date?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {LocalDate}   other_date
 */
setDateMethod(function isBefore(other_date) {

	other_date = this.parseOtherDateForComparison(other_date);

	// If both values are DateTime, use the numeric representation
	if (this instanceof LocalDateTime && other_date instanceof LocalDateTime) {
		return this.toNumericRepresentation() < other_date.toNumericRepresentation();
	}

	// If either values are LocalTime values, only the time should be checked
	if (this instanceof LocalTime || other_date instanceof LocalTime) {
		return this.getTime() < other_date.getTime();
	}

	// Both values should be LocalDate values
	return this.getDate() < other_date.getDate();
});

/**
 * Is this date after the given date?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {LocalDate}   other_date
 */
setDateMethod(function isAfter(other_date) {

	other_date = this.parseOtherDateForComparison(other_date);

	// If both values are DateTime, use the numeric representation
	if (this instanceof LocalDateTime && other_date instanceof LocalDateTime) {
		return this.toNumericRepresentation() > other_date.toNumericRepresentation();
	}

	// If either values are LocalTime values, only the time should be checked
	if (this instanceof LocalTime || other_date instanceof LocalTime) {
		return this.getTime() > other_date.getTime();
	}

	// Both values should be LocalDate values
	return this.getDate() > other_date.getDate();
});

/**
 * Is this on the same date?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {LocalDate}   other_date
 */
setDateMethod(function isOnSameDate(other_date) {

	other_date = this.parseOtherDateForComparison(other_date);

	if (other_date.getYear() != this.getYear()) {
		return false;
	}

	if (other_date.getMonth() != this.getMonth()) {
		return false;
	}

	if (other_date.getDay() != this.getDay()) {
		return false;
	}

	return true;
});

/**
 * Get the hours of this date (0-23)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setTimeMethod(function getHours() {
	return this[HOURS];
});

/**
 * Set the hours of this date (0-23)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_hours
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setTimeMethod(function getMinutes() {
	return this[MINUTES];
});

/**
 * Set the minutes of this date (0-59)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_minutes
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setTimeMethod(function getSeconds() {
	return this[SECONDS];
});

/**
 * Set the seconds of this date (0-59)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_seconds
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @return   {number}
 */
setTimeMethod(function getMilliseconds() {
	return this[MILLISECONDS];
});

/**
 * Set the milliseconds of this date (0-999)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 *
 * @param    {number}   new_ms
 */
setTimeMethod(function setMilliseconds(new_ms) {
	this[MILLISECONDS] = new_ms;

	// Perform a special check in certain cases
	if (new_ms < 0 || new_ms > 999) {
		this.reparseUTCDate();
	}
});