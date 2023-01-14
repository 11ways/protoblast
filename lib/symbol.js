/**
 * Is this a symbol?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return  {Boolean}
 */
Blast.defineStatic(Symbol, function isSymbol(value) {
	return typeof value == 'symbol';
});