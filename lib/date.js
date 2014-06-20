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

};