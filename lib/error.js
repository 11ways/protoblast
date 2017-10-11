module.exports = function BlastError(Blast, Collection) {

	/**
	 * Revive a JSON-died error
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Error', 'unDry', function unDry(obj) {

		var result = new Error(obj.message);

		result.stack = obj.stack;

		return result;
	});

	/**
	 * Return an object for json-drying this error
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Object}
	 */
	Blast.definePrototype('Error', 'toDry', function toDry() {
		return {
			value: {
				message: this.message,
				stack: this.stack
			},
			path: 'Error'
		};
	});

};