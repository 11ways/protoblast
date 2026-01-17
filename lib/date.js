const defStat = Blast.createStaticDefiner('Date'),
      defProto = Blast.createProtoDefiner('Date');

const rx_duration = /[-+]|(this|next|last|previous)\s+(\w+)|((-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*))|\w+/ig,
      rx_ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
      rx_dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;

let ms_units,
    days,
    key;

ms_units = {
	'n'           : 1 / 1e6,
	'nanosecond'  : 1 / 1e6,
	'µs'          : 1 / 1e3,
	'microsecond' : 1 / 1e3,
	'ms'          : 1,
	'millisecond' : 1,
	's'           : 1e3,
	'sec'         : 1e3,
	'second'      : 1e3,
	'm'           : 6e4,
	'min'         : 6e4,
	'minute'      : 6e4,
	'h'           : 36e5,
	'hr'          : 36e5,
	'hour'        : 36e5,
	'd'           : 864e5,
	'day'         : 864e5,
	'w'           : 6048e5,
	'wk'          : 6048e5,
	'week'        : 6048e5,
	'isoweek'     : 6048e5,
	'b'           : 2592e6,
	'month'       : 2592e6,
	'y'           : 31536e6,
	'yr'          : 31536e6,
	'year'        : 31536e6
};

days = {
	sun    : 0,
	mon    : 1,
	tue    : 2,
	tues   : 2,
	wed    : 3,
	wednes : 3,
	thu    : 4,
	thurs  : 4,
	fri    : 5,
	sat    : 6,
	satur  : 6
};

// Add plurals to the object
for (key in ms_units) {
	if (key.length > 1 && key[key.length - 1] != 's') {
		ms_units[key + 's'] = ms_units[key];
	}
}

// Add 'day' to the days
for (key in days) {
	days[key + 'day'] = days[key];
}

/**
 * Create a new date object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.11
 */
defStat(function create(value) {
	if (value == null) {
		return new Date();
	} else {
		return new Date(value);
	}
});

/**
 * Determine if a variable is a date object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 */
defStat(function isDate(variable) {
	return Object.prototype.toString.call(variable) === '[object Date]';
});

/**
 * Get a specific unit's duration in ms, or 0 if it doesn't exist
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.7.0
 *
 * @param    {string}   unit
 * @param    {Date}     context
 *
 * @return   {number}
 */
defStat(function getUnitMs(unit, context) {

	var result = ms_units[unit];

	if (!result) {
		unit = unit.toLowerCase();
		result = ms_units[unit];
	}

	// Do a leap year check if we need to add a year
	if (context != null && unit == 'y' || unit == 'yr' || unit == 'year') {
		if (Bound.Date.isLeapYear(context)) {
			result += ms_units.day;
		}
	}

	return result || 0;
});

/**
 * Get the simplified unit name
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.13
 * @version  0.8.13
 *
 * @param    {string}   input
 *
 * @return   {string}
 */
defStat(function getUnitName(input) {

	input = input.toLowerCase().trim();

	switch (input) {
		case 'ms':
		case 'millisecond':
		case 'milliseconds':
			return 'ms';

		case 's':
		case 'sec':
		case 'second':
		case 'seconds':
			return 'second';

		case 'm':
		case 'min':
		case 'minute':
		case 'minutes':
			return 'minute';

		case 'h':
		case 'hr':
		case 'hour':
		case 'hours':
			return 'hour';

		case 'd':
		case 'day':
		case 'days':
			return 'day';

		case 'w':
		case 'wk':
		case 'week':
		case 'weeks':
			return 'week';

		case 'm':
		case 'month':
		case 'months':
			return 'month';

		case 'y':
		case 'yr':
		case 'year':
		case 'years':
			return 'year';
	}

});

/**
 * Determine the difference between two dates.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.8
 * @version  0.1.11
 *
 * @param    {string}   unit           year, quarter, month, week, day, ...
 * @param    {Date}     start
 * @param    {Date}     end
 * @param    {boolean}  startOfUnit    Use the start-of-unit of the dates
 *
 * @return   {number}
 */
defStat(function difference(unit, start, end, startOfUnit) {

	var diff;

	if (typeof unit != 'string' && unit != null) {
		end = start;
		start = unit;
		unit = null;
	}

	start = Collection.Date.create(start);
	end = Collection.Date.create(end);

	if (unit != null) {

		unit = unit.toLowerCase();
		unit = Bound.String.singularize(unit);

		if (startOfUnit) {
			// Go to the start unit of the startdate
			Bound.Date.startOf(start, unit);

			// Go to the end unit of the enddate
			Bound.Date.startOf(end, unit);
		}
	}

	// Calculate the difference
	diff = end - start;

	// See if it needs to be in a specific unit
	if (unit != null) {
		diff /= ms_units[unit];
	}

	return diff;
});

var date_tokens = {
	today: function(date) {
		return Bound.Date.startOf(date, 'day');
	},
	tomorrow: function(date) {
		return Bound.Date.add(this.today(date), 1, 'day');
	},
	yesterday: function(date) {
		return Bound.Date.subtract(this.today(date), 1, 'day');
	}
};

/**
 * Parse datetime strings and return a timestamp
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {string}   str    The input string
 * @param    {string}   base   The time basis [0]
 *
 * @return   {Date}
 */
defStat(function parseString(str, base) {
	return new Date(Blast.Bound.Date.parseStringToTime(str, base));
});

/**
 * Parse datetime strings and return a timestamp
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.8.2
 *
 * @param    {string}   str    The input string
 * @param    {string}   base   The time basis [0]
 *
 * @return   {number}
 */
defStat(function parseStringToTime(str, base) {

	if (typeof str == 'string') {
		if (rx_dmy.test(str) || rx_ymd.test(str)) {
			// A base would have a strange effect when used
			// with a regular date string, so disable it
			// This way, base will turn into a 0 later
			base = false;

			// Convert the date string to a number
			str = Number(new Date(str));
		}
	}

	if (base == null) {
		base = Date.now();
	} else if (!isNaN(Number(base))) {
		base = Number(base);
	} else {
		base = parseStringToTime(base);
	}

	let nr = Number(str);

	if (isFinite(nr)) {
		return nr + base;
	}

	if (typeof str != 'string') {
		throw new TypeError('Value is not a string or number');
	}

	let base_date,
	    result,
	    entry,
	    type,
	    name,
	    unit,
	    val,
	    add,
	    d;

	// Lowercase the string
	str = str.toLowerCase();

	// Turn the base into a date, too
	base_date = new Date(base);

	// Start at the given base
	result = base;

	// Do additions by default
	add = true;

	// Reset the state of the regex
	rx_duration.lastIndex = 0;

	// Extract all the durations
	while (entry = rx_duration.exec(str)) {

		if (entry[1]) {
			type = entry[1];
			result = Number(lastNext(new Date(result), entry[1], entry[2], base_date));
			continue;
		}

		if (!entry[5]) {
			name = entry[0];

			if (name == '+') {
				add = true;
			} else {
				add = false;
			}

			if (date_tokens[name]) {
				d = new Date(result);
				result = Number(date_tokens[name](d, base_date));
			} else if (days[name]) {
				d = new Date(result);
				lastNext(d, 0, name, base_date);
				result = Number(d);
			}

			continue;
		}

		unit = Collection.Date.getUnitMs(entry[5]);

		if (!unit) {
			continue;
		}

		val = parseFloat(entry[4], 10) * unit;

		if (add) {
			result += val;
		} else {
			result -= val;
		}
	}

	return result;
});

/**
 * Parse durations to milliseconds
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {string}   str
 * @param    {string}   base
 *
 * @return   {number}
 */
defStat(function parseDuration(str, base) {
	return Blast.Bound.Date.parseStringToTime(str, 0);
});

/**
 * Get the first week of the year
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   year
 *
 * @return   {Date}
 */
defStat(function firstWeekOfYear(year) {

	var day_offset,
	    date = new Date(year, 0, 1),
	    day = date.getDay();

	// Make the days monday-sunday equals to 1-7 instead of 0-6
	day = (day === 0) ? 7 : day;

	// day_offset will correct the date in order to get a Monday
	day_offset = -day + 1;

	if (7 - day + 1 < 4) {
		// the current week has not the minimum 4 days
		// required by iso 8601 => add one week
		day_offset += 7;
	}

	return new Date(date.getTime() + day_offset * 24 * 60 * 60 * 1000);
});

/**
 * Return the date of the first day of the given week
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   year
 * @param    {number}   week
 *
 * @return   {Date}
 */
defStat(function firstDayOfWeek(week, year) {

	var target_time,
	    week_time,
	    date;

	if (year == null) {
		year = (new Date()).getFullYear();
	}

	date = Bound.Date.firstWeekOfYear(year);
	week_time = 1000 * 60 * 60 * 24 * 7 * (week - 1);
	target_time = date.getTime() + week_time;

	date.setTime(target_time);

	return date;
});

/**
 * Timestamp getter
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @return   {string}
 */
defProto(function timestamp() {
	return +this;
}, 'get');

/**
 * Calculate the bytesize of a date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {number}
 */
defProto(Blast.sizeofSymbol, function calculateSizeof() {
	return 96;
});

/**
 * Return a clone of the current date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Date}
 */
defProto(function clone() {
	return new Date(this.valueOf());
});

/**
 * Return a new date without the time information
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Date}
 */
defProto(function stripTime() {
	return new Date(Date.UTC(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate()));
});

/**
 * Returns a new date with only the time filled in.
 * This is from the start of the epoch.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Date}
 */
defProto(function stripDate() {
	return new Date(1970, 0, 1, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
});

/**
 * Set the hours/minutes/seconds using a string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Date}
 */
defProto(function setTimestring(string) {

	var pieces = string.split(':');

	if (pieces[0]) {
		this.setHours(pieces[0]);
	}

	if (pieces[1]) {
		this.setMinutes(pieces[1]);
	} else {
		this.setMinutes(0);
	}

	if (pieces[2]) {
		this.setSeconds(pieces[2]);
	} else {
		this.setSeconds(0);
	}

	return this;
});

/**
 * Add a unit of time to the current date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.5.7
 *
 * @param    {number}   amount
 * @param    {string}   unit    year, month, week, day, ...
 *
 * @return   {Date}
 */
defProto(function add(amount, unit) {

	var temp,
	    newtime,
	    unittime;

	newtime = this.valueOf();

	if (typeof amount === 'string') {
		if (typeof unit == 'string') {
			amount = Number(amount) || 0;
		} else {
			if (/\d/.test(amount)) {
				this.setTime(newtime + Collection.Date.parseDuration(amount));
				return this;
			} else {
				unit = amount;
				amount = 1;
			}
		}
	} else if (amount == null) {
		// Don't add anything if it's null or undefined
		return this;
	}

	unittime = Collection.Date.getUnitMs(unit, this);

	// If we're setting any units shorter then a day,
	// we can do so by simply increasing the time
	if (unittime < ms_units.day) {
		newtime += unittime * amount;
		this.setTime(newtime);
	} else {
		let current;
		unit = Collection.Date.getUnitName(unit);

		if (unit == 'week') {
			unit = 'day';
			amount = amount * 7;
		}

		if (unit == 'day') {
			current = this.getDate();

			// JavaScript will automatically handle overflows for us
			this.setDate(current + amount);
		} else if (unit == 'month') {
			current = this.getMonth();

			// JavaScript will automatically handle overflows for us
			this.setMonth(current + amount);
		} else if (unit == 'year') {
			current = this.getFullYear();
			this.setFullYear(current + amount);
		}
	}

	return this;
});

/**
 * Subtract a unit of time from the current date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.5.7
 *
 * @param    {number}   amount
 * @param    {string}   unit    year, month, week, day, ...
 *
 * @return   {Date}
 */
defProto(function subtract(amount, unit) {

	var temp,
	    newtime,
	    unittime;

	if (typeof amount === 'string') {
		if (typeof unit == 'string') {
			amount = Number(amount) || 1;
		} else {
			if (/\d/.test(amount)) {
				this.setTime(this.valueOf() + Collection.Date.parseDuration(amount) * -1);
				return this;
			} else {
				unit = amount;
				amount = 1;
			}
		}
	}

	return Bound.Date.add(this, amount * -1, unit);
});

/**
 * Go to a next date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {string}   unit    year, month, week, day, ...
 *
 * @return   {Date}
 */
defProto(function next(unit) {
	return lastNext(this, +1, unit);
});

/**
 * Go to a previous date
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {string}   unit    year, month, week, day, ...
 *
 * @return   {Date}
 */
defProto(function previous(unit) {
	return lastNext(this, -1, unit);
});

/**
 * Perform a last/next unit change
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Date}     date
 * @param    {string}   modifier   -1 for last, +1 for next
 * @param    {string}   day
 * @param    {Date}     base_date
 *
 * @return   {Date}
 */
function lastNext(date, modifier, unit, base_date) {

	var temp;

	if (!unit) {
		return date;
	}

	// Lowercase the unit
	unit = unit.toLowerCase();

	if (typeof modifier == 'string') {
		switch (modifier) {
			case 'next':
				modifier = +1;
				break;

			case 'last':
			case 'previous':
				modifier = -1;
				break;

			case 'this':
				modifier = 0;
		}
	}

	// If it's a day of the week, go to that date
	if (days[unit] != null) {
		return lastNextDay(date, modifier, unit, base_date);
	}

	if (unit == 'month') {
		// Get the current value
		temp = date.getMonth();

		date.setMonth(date.getMonth() + modifier);

		// Catch going earlier than the previous month or over the next
		if (temp == date.getMonth() || temp + 1 != date.getMonth()) {
			date.setDate(0);
		}
	} else {
		Blast.Bound.Date.add(date, modifier, unit);
	}

	return date;
}

/**
 * Go to a last/next day
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.7
 * @version  0.5.7
 *
 * @param    {Date}     date
 * @param    {string}   modifier   -1 for last, +1 for next
 * @param    {string}   day
 * @param    {Date}     base_date
 *
 * @return   {Date}
 */
function lastNextDay(date, modifier, day, base_date) {

	var current_iso_day,
	    current_day,
	    iso_day,
	    diff,
	    nr;

	// Get the day count
	nr = days[day];

	// Get the current day
	current_day = date.getDay();

	// Calculate the difference
	diff = nr - current_day;

	if (diff == 0) {
		diff = 7 * modifier;
	} else if (diff > 0 && modifier < 0) {
		diff -= 7;
	} else if (diff < 0 && modifier > 0) {
		diff += 7;
	} else if (diff && modifier == 0) {

		// Sunday is a special case
		if (current_day == 0) {
			diff -= 7;
		}
	}

	diff = date.getDate() + diff;

	date.setDate(diff);

	return date;
}

/**
 * Set the current date to the start of a unit of time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.6.3
 *
 * @param    {string}   unit    year, quarter, month, week, day, ...
 *
 * @return   {Date}
 */
defProto(function startOf(unit) {

	var temp;

	unit = String(unit).toLowerCase();

	// Set start of a tenfold?
	if (unit.slice(0, 4) == 'deca') {
		unit = unit.slice(4);

		switch (unit) {
			case 'minute':
			case 'second':
				break;

			default:
				throw new Error('Unable to set tenfold of "' + unit + '"');
		}

		// Get the unit amount
		temp = ms_units[unit] * 10;

		if (!temp) {
			throw new Error('Unable to find time unit "' + unit + '"');
		}

		temp = (~~(this / temp)) * temp;

		this.setTime(temp);

		return this;
	}

	switch (unit) {
		case 'year':
			this.setMonth(0);
		case 'quarter':
		case 'month':
			this.setDate(1);
		case 'week':
		case 'isoweek':
		case 'day':
			this.setHours(0);
		case 'hour':
			this.setMinutes(0);
		case 'minute':
			this.setSeconds(0);
		case 'second':
			this.setMilliseconds(0);
	}

	if (unit === 'week') {
		this.setDate(this.getDate() - this.getDay());
	} else if (unit === 'isoweek') {
		this.setDate(this.getDate() - this.getDay() + 1);
	}

	if (unit === 'quarter') {
		this.setMonth(~~(a.getMonth() / 3) * 3);
	}

	return this;
});

/**
 * Set the current date to the end of a unit of time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.9.5
 *
 * @param    {string}   unit    year, quarter, month, week, day, ...
 *
 * @return   {Date}
 */
defProto(function endOf(unit) {

	if (unit == 'month') {
		let new_date = new Date(this.getFullYear(), this.getMonth() + 1, 0);
		new_date.setHours(23, 59, 59, 999);
		this.setTime(new_date.valueOf());
		return this;
	}

	// Add one unit
	Bound.Date.add(this, unit);

	// Go to the start of that unit
	Bound.Date.startOf(this, unit);

	// Subtract 1 ms
	this.setTime(this.valueOf() - 1);

	return this;
});

/**
 * Is this in a leap year?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {boolean}
 */
defProto(function isLeapYear() {
	var year = this.getFullYear();
	return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
});

/**
 * Determine if the current date is between (or equal to) start and end.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.2.0
 *
 * @param    {string}   unit    year, quarter, month, week, day, ...
 * @param    {Date}     start
 * @param    {Date}     end
 *
 * @return   {boolean}
 */
defProto(function between(unit, start, end) {

	if (typeof unit != 'string' && unit != null) {
		end = start;
		start = unit;
		unit = null;
	}

	start = new Date(start);
	end = new Date(end || start);

	if (unit != null) {
		// Go to the start unit of the startdate
		Bound.Date.startOf(start, unit);

		// Go to the end unit of the enddate
		Bound.Date.endOf(end, unit);
	}

	return this >= start && this <= end;
});

/**
 * Time ago strings
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {string}
 */
defProto('time_ago_settings', {
	now       : 'just now',
	seconds   : '%d seconds',
	minute    : 'a minute',
	minutes   : '%d minutes',
	hour      : 'an hour',
	hours     : '%d hours',
	day       : 'a day',
	days      : '%d days',
	month     : 'a month',
	months    : '%d months',
	year      : 'a year',
	years     : '%d years',
	ago       : 'ago',
	from      : 'from now',
	separator : ' and '
});

/**
 * Time duration strings
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {string}
 */
defProto('time_duration_settings', {
	second    : '1s',
	seconds   : '%d seconds',
	minute    : '1 minute',
	minutes   : '%d minutes',
	hour      : '1 hour',
	hours     : '%d hours',
	day       : '1 day',
	days      : '%d days',
	month     : '1 month',
	months    : '%d months',
	year      : '1 year',
	years     : '%d years',
	separator : ' '
});

function numberString(string, number) {
	return string.replace(/%d/i, number);
}

/**
 * Return a time ago string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {number}   ms
 * @param    {Object}   settings
 *
 * @return   {string}
 */
defStat(function timeDuration(ms, settings) {

	if (typeof ms == 'object') {
		settings = ms;
		ms = settings.ms;
	}

	return Bound.Date.secondsToDuration(ms / 1000, settings);
});

/**
 * Return a time ago string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.9.6
 *
 * @param    {number}   seconds
 * @param    {Object}   settings
 *
 * @return   {string}
 */
defStat(function secondsToDuration(seconds, settings) {

	var minutes    = seconds / 60,
	    hours      = minutes / 60,
	    days       = ~~(hours / 24),
	    years      = ~~(days / 365),
	    result     = '',
	    minimize   = false,
	    dec_months,
	    base_settings,
	    context,
	    future,
	    months,
	    temp;

	days = days % 365;
	dec_months = days / 30;
	months = Math.floor(dec_months);
	minutes = (~~minutes) % 60;
	seconds = Math.round(seconds) % 60;
	hours = (~~hours) % 24;

	if (this.time_ago_settings) {
		context = this;
	} else {
		context = Bound.Date.prototype;
	}

	if (!settings || !settings.time_ago) {
		base_settings = context.time_duration_settings;
	} else {
		base_settings = context.time_ago_settings;
	}

	if (!settings) {
		settings = base_settings;
	} else {
		settings = Object.assign({}, base_settings, settings);

		if (settings.minimize != null) {
			minimize = settings.minimize;
		}
	}

	future = settings.future;

	if (years == 1) {
		result = numberString(settings.year, 1);
	} else if (years > 1) {
		result = numberString(settings.years, years);
	}

	if (months == 1) {
		// Only show amount of months if we didn't round up
		if ((days / 30) >= 1) {
			result = addToResult(result, numberString(settings.month, 1), settings);
			days = days % 30;
		}
	} else if (months > 1) {
		days = days % 30;

		// If the string should be minimized, and there are years to show,
		// days will be hidden. So in that case the months should be rounded
		// correctly (instead of just being rounded down)
		if (minimize && years) {
			months = Math.round(dec_months);
		}

		result = addToResult(result, numberString(settings.months, months), settings);
	}

	if (!years || !minimize) {

		if (days == 1) {
			temp = numberString(settings.day, 1);
		} else if (days > 1) {
			temp = numberString(settings.days, days);
		} else if (!minimize) {
			temp = numberString(settings.days, 0);
		}

		// Add the day
		result = addToResult(result, temp, settings);

		if (!minimize || !months) {
			if (hours == 1) {
				result = addToResult(result, numberString(settings.hour, 1), settings);
			} else if ((!result && hours) || (!minimize || (minimize && hours))) {
				result = addToResult(result, numberString(settings.hours, hours), settings);
			}

			if (!minimize || !result) {
				if (minutes == 1) {
					result = addToResult(result, numberString(settings.minute, 1), settings);
				} else if ((!result && minutes) || (!minimize || (minimize && minutes))) {
					result = addToResult(result, numberString(settings.minutes, minutes), settings);
				}
			}

			if (!minimize || !result) {
				if (seconds > 30 || future) {
					result = addToResult(result, numberString(settings.seconds, seconds), settings);
				}
			}
		}

		if (!result) {
			if (settings.now) {
				return numberString(settings.now, seconds);
			} else {
				return numberString(settings.seconds, seconds);
			}
		}
	}

	if (settings.time_ago) {
		result += ' ';

		if (future) {
			result += settings.from;
		} else {
			result += settings.ago;
		}
	}

	return result;
});

function addToResult(current, addition, settings) {

	if (!addition) {
		return current;
	}

	if (current) {
		current += settings.separator;
	} else {
		current = '';
	}

	return current + addition;
}

/**
 * Return a time ago string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.7.0
 *
 * @param    {Object}   settings
 *
 * @return   {string}
 */
defProto(function timeAgo(settings) {

	var difference = Date.now() - this,
	    seconds    = Math.abs(difference) / 1000,
	    future     = difference < 0;

	if (!settings) {
		settings = {};
	}

	settings.future = future;
	settings.time_ago = true;
	settings.minimize = true;

	return Bound.Date.secondsToDuration(seconds, settings);
});