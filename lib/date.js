module.exports = function BlastDate(Blast, Collection, Bound, Obj) {

	var rx_duration = /[-+]|(this|next|last|previous)\s+(\w+)|((-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*))|\w+/ig,
	    rx_ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
	    rx_dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
	    ms_units,
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.11
	 */
	Blast.defineStatic('Date', function create(value) {
		if (value == null) {
			return new Date();
		} else {
			return new Date(value);
		}
	});

	/**
	 * Determine if a variable is a date object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	Blast.defineStatic('Date', function isDate(variable) {
		return Object.prototype.toString.call(variable) === '[object Date]';
	});

	/**
	 * Get a specific unit's duration in ms, or 0 if it doesn't exist
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   unit
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Date', function getUnitMs(unit) {

		var result = ms_units[unit];

		if (!result) {
			result = ms_units[unit.toLowerCase()];
		}

		return result || 0;
	});

	/**
	 * Determine the difference between two dates.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.8
	 * @version  0.1.11
	 *
	 * @param    {String}   unit           year, quarter, month, week, day, ...
	 * @param    {Date}     start
	 * @param    {Date}     end
	 * @param    {Boolean}  startOfUnit    Use the start-of-unit of the dates
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Date', function difference(unit, start, end, startOfUnit) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   str    The input string
	 * @param    {String}   base   The time basis [0]
	 *
	 * @return   {Date}
	 */
	Blast.defineStatic('Date', function parseString(str, base) {
		return new Date(Blast.Bound.Date.parseStringToTime(str, base));
	});

	/**
	 * Parse datetime strings and return a timestamp
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.6.4
	 *
	 * @param    {String}   str    The input string
	 * @param    {String}   base   The time basis [0]
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Date', function parseStringToTime(str, base) {

		var unit_time,
		    base_date,
		    result,
		    entry,
		    type,
		    name,
		    unit,
		    val,
		    add,
		    d;

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

		if (Number(str)) {
			return Number(str) + base;
		}

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   str
	 * @param    {String}   base
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Date', function parseDuration(str, base) {
		return Blast.Bound.Date.parseStringToTime(str, 0);
	});

	/**
	 * Timestamp getter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Date', function timestamp() {
		return +this;
	}, 'get');

	/**
	 * Calculate the bytesize of a date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @return   {Number}
	 */
	Blast.definePrototype('Date', Blast.sizeofSymbol, function calculateSizeof() {
		return 96;
	});

	/**
	 * Return a clone of the current date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function clone() {
		return new Date(this.valueOf());
	});

	/**
	 * Return a new date without the time information
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function stripTime() {
		return new Date(Date.UTC(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate()));
	});

	/**
	 * Returns a new date with only the time filled in.
	 * This is from the start of the epoch.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function stripDate() {
		return new Date(1970, 0, 1, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
	});

	/**
	 * Set the hours/minutes/seconds using a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function setTimestring(string) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.5.7
	 *
	 * @param    {Number}   amount
	 * @param    {String}   unit    year, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function add(amount, unit) {

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

		unittime = Collection.Date.getUnitMs(unit);

		newtime += unittime * amount;

		this.setTime(newtime);

		return this;
	});

	/**
	 * Subtract a unit of time from the current date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.5.7
	 *
	 * @param    {Number}   amount
	 * @param    {String}   unit    year, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function subtract(amount, unit) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   unit    year, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function next(unit) {
		return lastNext(this, +1, unit);
	});

	/**
	 * Go to a previous date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   unit    year, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function previous(unit) {
		return lastNext(this, -1, unit);
	});

	/**
	 * Perform a last/next unit change
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {Date}     date
	 * @param    {String}   modifier   -1 for last, +1 for next
	 * @param    {String}   day
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {Date}     date
	 * @param    {String}   modifier   -1 for last, +1 for next
	 * @param    {String}   day
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.6.3
	 *
	 * @param    {String}   unit    year, quarter, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function startOf(unit) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}   unit    year, quarter, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', function endOf(unit) {

		// Add one unit
		Bound.Date.add(this, unit);

		// Go to the start of that unit
		Bound.Date.startOf(this, unit);

		// Subtract 1 ms
		this.setTime(this.valueOf() - 1);

		return this;
	});

	/**
	 * Determine if the current date is between (or equal to) start and end.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.2.0
	 *
	 * @param    {String}   unit    year, quarter, month, week, day, ...
	 * @param    {Date}     start
	 * @param    {Date}     end
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('Date', function between(unit, start, end) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Date', 'time_ago_settings', {
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

	function numberString(string, number) {
		return string.replace(/%d/i, number);
	}

	/**
	 * Return a time ago string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Object}   settings
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Date', function timeAgo(settings) {

		var difference = Date.now() - this,
		    seconds    = Math.abs(difference) / 1000,
		    minutes    = seconds / 60,
		    hours      = minutes / 60,
		    days       = ~~(hours / 24),
		    years      = ~~(days / 365),
		    result     = '',
		    future     = difference < 0,
		    months,
		    temp;

		days = days % 365;
		months = Math.round(days / 30);
		minutes = ~~minutes;
		seconds = Math.round(seconds);
		hours = ~~hours;

		if (!settings) {
			settings = this.time_ago_settings;
		} else {
			settings = Object.assign({}, this.time_ago_settings, settings);
		}

		if (years == 1) {
			result = numberString(settings.year, 1);
		} else if (years > 1) {
			result = numberString(settings.years, years);
		}

		if (result) result += settings.separator;

		if (months == 1) {
			result += numberString(settings.month, 1);
			days = days % 30;
		} else if (months > 1) {
			result += numberString(settings.months, months);
			days = days % 30;
		}

		if (!years) {
			if (result) result += settings.separator;

			if (days == 1) {
				result += numberString(settings.day, 1);
			} else if (days > 1) {
				result += numberString(settings.days, days);
			} else if (hours == 1) {
				result += numberString(settings.hour, 1);
			} else if (hours > 1) {
				result += numberString(settings.hours, hours);
			} else if (minutes == 1) {
				result += numberString(settings.minute, 1);
			} else if (minutes > 1) {
				result += numberString(settings.minutes, minutes);
			} else if (future || seconds > 30) {
				result += numberString(settings.seconds, seconds);
			} else if (!result) {
				return numberString(settings.now, seconds);
			}
		}

		result += ' ';

		if (future) {
			result += settings.from;
		} else {
			result += settings.ago;
		}

		return result;
	});
};