/**
 * Is this a symbol?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return  {boolean}
 */
Blast.defineStatic(Symbol, function isSymbol(value) {
	return typeof value == 'symbol';
});