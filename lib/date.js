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

};