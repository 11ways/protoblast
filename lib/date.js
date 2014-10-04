module.exports = function BlastDate(Blast, Collection) {

	/**
	 * Create a new date object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	Blast.defineStatic('Date', 'create', function create() {
		return new Date();
	});

	/**
	 * Determine is a variable is a date object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	Blast.defineStatic('Date', 'isDate', function isDate(variable) {
		return Object.prototype.toString.call(variable) === '[object Date]';
	});

	/**
	 * Return a string representing the source code of the date.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Date', 'toSource', function toSource() {
		return '(new Date(' + Date.prototype.valueOf.call(this) + '))';
	}, true);

	/**
	 * Return a new date without the time information
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Date}
	 */
	Blast.definePrototype('Date', 'stripDate', function stripDate() {
		return new Date(1970, 0, 1, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
	});

};