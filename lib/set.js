/**
 * Revive a set
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Object}   value
 *
 * @return   {Set}
 */
 Fn.setStatic(Set, function unDry(value) {
	return new this(value);
});

/**
 * Add this to the Set class, so all sets can be dried
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 */
Fn.setMethod(Set, function toDry() {
	return {value: Array.from(this)};
});