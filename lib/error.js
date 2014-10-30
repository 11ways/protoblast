module.exports = function BlastError(Blast, Collection) {

	/**
	 * Return a string representing the source code of the error.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Error', 'toSource', function toSource() {

		var name     = this.name,
		    message  = JSON.stringify(this.message),
		    fileName = JSON.stringify(this.fileName),
		    lineno   = this.lineNumber;

		lineno = ((lineno === 0 || lineno == null) ? '' : ', ' + lineno);

		return '(new ' + name + '(' + message + ', ' + fileName + lineno + '))';
	}, true);

	/**
	 * Revive a JSON-died error
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
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