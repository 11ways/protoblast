module.exports = function BlastError(Blast, Collection) {

	/**
	 * Return a string representing the source code of the error.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Error', 'toSource', function toSource() {

		var name     = this.name,
		    message  = JSON.stringify(this.message),
		    fileName = JSON.stringify(this.fileName),
		    lineno   = this.lineNumber;

		lineno = (lineno === 0 ? '' : ', ' + lineno);

		return '(new ' + name + '(' + message + ', ' + fileName + lineno + '))';
	}, true);

};