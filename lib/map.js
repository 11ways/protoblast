/**
 * Calculate the bytesize of a map
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {Number}
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