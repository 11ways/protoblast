module.exports = function BlastDate(Blast, Collection, Bound, Obj) {

	var rx_duration = /[-+]|((-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*))|\w+/ig,
	    ms_units,
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

	// Add plurals to the object
	for (key in ms_units) {
		if (key.length > 1 && key[key.length - 1] != 's') {
			ms_units[key + 's'] = ms_units[key];
		}
	}

	/**
	 * Create a new date object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.11
	 */
	Blast.defineStatic('Date', 'create', function create(value) {
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
	Blast.defineStatic('Date', 'isDate', function isDate(variable) {
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
	Blast.defineStatic('Date', 'getUnitMs', function getUnitMs(unit) {

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
	Blast.defineStatic('Date', 'difference', function difference(unit, start, end, startOfUnit) {

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
		yesterday: function(date) {
			return Bound.Date.subtract(this.today(date), 1, 'day');
		}
	};

	/**
	 * Parse durations to milliseconds
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.7
	 * @version  0.5.7
	 *
	 * @param    {String}   str
	 *
	 * @return   {Number}
	 */
	Blast.defineStatic('Date', 'parseDuration', function parseDuration(str) {

		var unit_time,
		    result,
		    entry,
		    name,
		    unit,
		    val,
		    add,
		    d;

		if (Number(str)) {
			return Number(str);
		}

		// Add by default
		add = true;

		// Start at 0
		result = 0;

		// Reset the state of the regex
		rx_duration.lastIndex = 0;

		// Extract all the durations
		while (entry = rx_duration.exec(str)) {
			console.log(entry);

			if (!entry[3]) {
				name = entry[0];

				if (name == '+') {
					add = true;
				} else {
					add = false;
				}

				if (date_tokens[name]) {
					d = new Date();
					result += Number(date_tokens[name](d));
				}

				continue;
			}

			unit = Collection.Date.getUnitMs(entry[3]);

			if (!unit) {
				continue;
			}

			val = parseFloat(entry[2], 10) * unit;

			if (add) {
				result += val;
			} else {
				result -= val;
			}
		}

		return result;
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
	Blast.definePrototype('Date', 'clone', function clone() {
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
	Blast.definePrototype('Date', 'stripTime', function stripTime() {
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
	Blast.definePrototype('Date', 'stripDate', function stripDate() {
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
	Blast.definePrototype('Date', 'setTimestring', function setTimestring(string) {

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
	Blast.definePrototype('Date', 'add', function add(amount, unit) {

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
	Blast.definePrototype('Date', 'subtract', function subtract(amount, unit) {

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
	 * Set the current date to the start of a unit of time
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}   unit    year, quarter, month, week, day, ...
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', 'startOf', function startOf(unit) {

		var temp;

		unit = String(unit).toLowerCase();

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
	Blast.definePrototype('Date', 'endOf', function endOf(unit) {

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
	Blast.definePrototype('Date', 'between', function between(unit, start, end) {

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
};