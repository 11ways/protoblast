module.exports = function BlastDate(Blast, Collection) {

	var msUnits;

	msUnits = unitMillisecondFactors = {
		'm'           : 1,
		'millisecond' : 1,
		'second'      : 1e3,
		'minute'      : 6e4,
		'hour'        : 36e5,
		'day'         : 864e5,
		'week'        : 6048e5,
		'isoweek'     : 6048e5,
		'month'       : 2592e6,
		'year'        : 31536e6
	};

	/**
	 * Create a new date object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	Blast.defineStatic('Date', 'create', function create() {
		return new Date();
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
	 * Determine the difference between two dates.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.8
	 * @version  0.1.8
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

		start = new Date(start);
		end = new Date(end);

		if (unit != null) {

			unit = unit.toLowerCase();
			unit = Blast.Bound.String.singularize(unit);

			if (startOfUnit) {
				// Go to the start unit of the startdate
				Blast.Bound.Date.startOf(start, unit);

				// Go to the end unit of the enddate
				Blast.Bound.Date.startOf(end, unit);
			}
		}

		// Calculate the difference
		diff = end - start;

		// See if it needs to be in a specific unit
		if (unit != null) {
			diff /= msUnits[unit];
		}

		return diff;
	});

	/**
	 * Return a string representing the source code of the date.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Date', 'toSource', function toSource() {
		return '(new Date(' + Date.prototype.valueOf.call(this) + '))';
	}, true);

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
	 * Add a unit of time to the current date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
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

		newtime = this.valueOf();
		unit = String(unit).toLowerCase();

		unittime = msUnits[unit];

		if (!unittime) {
			unittime = msUnits[Blast.Bound.String.singularize(unit)] || 0;
		}

		newtime += unittime * amount;

		this.setTime(newtime);

		return this;
	});

	/**
	 * Subtract a unit of time from the current date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
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
				unit = amount;
				amount = 1;
			}
		}

		return Blast.Bound.Date.add(this, amount * -1, unit);
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
		Blast.Bound.Date.add(this, unit);

		// Go to the start of that unit
		Blast.Bound.Date.startOf(this, unit);

		// Subtract 1 ms
		this.setTime(this.valueOf() - 1);

		return this;
	});

	/**
	 * Determine if the current date is between (or equal to) start and end.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
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
		end = new Date(end);

		if (unit != null) {
			// Go to the start unit of the startdate
			Blast.Bound.Date.startOf(start, unit);

			// Go to the end unit of the enddate
			Blast.Bound.Date.endOf(end, unit);
		}

		return this >= start && this <= end;
	});
};