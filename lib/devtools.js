const defStat = Blast.createStaticDefiner(Blast);

/**
 * Identifier symbols
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
const JANEWAY_LEFT  = defStat('JANEWAY_LEFT', Symbol.for('janeway_arg_left')),
      JANEWAY_RIGHT = defStat('JANEWAY_RIGHT', Symbol.for('janeway_arg_right'));

/**
 * Get all the object getters
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
defStat(function getObjectGetters(obj) {

	const result = new Map();

	let descriptors,
	    descriptor,
	    symbols,
	    current = obj,
	    entry,
	    key;

	while (current && typeof current == 'object') {
		descriptors = Object.getOwnPropertyDescriptors(current);

		// Get the symbols
		symbols = this.getObjectSymbols(current);

		if (symbols && symbols.length) {
			let i;

			for (i = 0; i < symbols.length; i++) {
				key = symbols[i];
				descriptor = Object.getOwnPropertyDescriptor(current, key);

				if (descriptor.get) {
					descriptor.symbol = key;
					descriptors[String(key)] = descriptor;
				}
			}
		}

		for (key in descriptors) {

			if (key == '__proto__') {
				continue;
			}

			entry = descriptors[key];

			if (entry.get) {
				result.set(key, entry);
			}
		}

		if (current.__proto__) {
			current = current.__proto__;
		} else {
			break;
		}
	}

	return result;
});

/**
 * Get all the symbol properties of the given object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Object}   arg
 *
 * @return   {Array}
 */
defStat(function getObjectSymbols(arg) {
	if (!Object.getOwnPropertySymbols) {
		return [];
	}

	return Object.getOwnPropertySymbols(arg);
});