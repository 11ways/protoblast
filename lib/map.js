/**
 * Revive a map
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Object}   value
 *
 * @return   {Set}
 */
Fn.setStatic(Map, function unDry(value) {
	return new this(value);
});

/**
 * Allow all Maps to be serialized
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 */
Fn.setMethod(Map, function toDry() {
	return {value: Array.from(this)};
});

/**
 * Calculate the bytesize of a map
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {number}
 */
Blast.definePrototype('Map', Blast.sizeofSymbol, function calculateSizeof() {

	var bytes = 0,
	    iterator = this.entries(),
	    entries = [],
	    entry,
	    i;

	while (entry = iterator.next()) {

		if (!entry.value) {
			break;
		}

		entries.push(entry.value[0], entry.value[1]);
	}

	bytes += Blast.Bound.Object.sizeof(entries);

	return bytes;
});