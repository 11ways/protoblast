module.exports = function BlastMath(Blast, Collection) {

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('Math', 'toSource', function toSource() {
		return "Math";
	}, true);

};