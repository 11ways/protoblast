module.exports = function BlastBoolean(Blast, Collection) {

	/**
	 * Return a string representing the source code of the boolean.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Boolean', 'toSource', function toSource() {
		return '(new Boolean(' + this + '))';
	}, true);

};