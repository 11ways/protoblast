/**
 * The HashSet Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 */
const HashSet = Fn.inherits(Set, function HashSet(values) {

	// A map to HashKey keys
	this.values_to_key = new Map();

	// A HashKey map to the values
	this.key_to_value = new Map();

	// A cheap-key map to HashKey keys
	this.cheap_to_keys = new Map();

	if (values) {
		let entry;

		for (entry of values) {
			this.add(entry);
		}
	}
});

/**
 * The size of this set
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @type     {number}
 */
HashSet.setProperty(function size() {
	return this.key_to_value.size;
});

/**
 * The constructor to use for assignments
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @type     {number}
 */
HashSet.setProperty(Symbol.species, function getSpecies() {
	return HashSet;
});

/**
 * Iterate over the values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @return   {HashSet}
 */
HashSet.setMethod(Symbol.iterator, function iterate() {
	return this.values();
});

/**
 * Return the values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @return   {HashSet}
 */
HashSet.setMethod(function* values() {
	let entry;

	for (entry of this.key_to_value.values()) {
		yield entry;
	}
});

/**
 * Return the entries
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @return   {HashSet}
 */
HashSet.setMethod(function* entries() {
	let entry;

	for (entry of this.key_to_value.values()) {
		yield [entry, entry];
	}
});

/**
 * Iterate over the values with a callback
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Function}   task
 */
HashSet.setMethod(function forEach(task, this_arg) {

	if (!this_arg) {
		this_arg = this;
	}

	let entry;

	for (entry of this) {
		task.call(this_arg, entry, entry, this);
	}
});

/**
 * Add a value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {*}
 *
 * @return   {HashSet}
 */
HashSet.setMethod(function add(value) {

	let key = this.values_to_key.get(value);

	if (!key) {
		key = new Blast.Classes.HashKey(value);

		// See if this set has a cheap key registered
		let existing_cheap_keys = this.cheap_to_keys.get(key.cheap_key);

		// It does, so we have to start making expensive compares
		if (existing_cheap_keys) {
			let existing_key;

			// Iterate over all the existing keys
			for (existing_key of existing_cheap_keys) {
				// Compare the full keys
				if (existing_key.full_key == key.full_key) {

					// Full key matched, so this value is already present
					// Add a weak reference to the first added existing_key
					this.values_to_key.set(value, existing_key);
					
					return this;
				}
			}
		} else {
			existing_cheap_keys = [];
			this.cheap_to_keys.set(key.cheap_key, existing_cheap_keys);
		}

		existing_cheap_keys.push(key);
		this.key_to_value.set(key, value);

		this.values_to_key.set(value, key);
	}

	return this;
});

/**
 * Remove all values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 */
HashSet.setMethod(function clear() {

	if (!this.size) {
		return;
	}

	this.values_to_key.clear();
	this.key_to_value.clear();
	this.cheap_to_keys.clear();
});

/**
 * Is this value in this set?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {*}
 *
 * @return   {boolean}
 */
HashSet.setMethod(function has(value) {

	if (!this.size) {
		return false;
	}

	let key = this.values_to_key.get(value);

	if (key) {
		return true;
	}

	key = new Blast.Classes.HashKey(value);

	// See if this set has a cheap key registered
	let existing_cheap_keys = this.cheap_to_keys.get(key.cheap_key);

	if (!existing_cheap_keys || !existing_cheap_keys.length) {
		return false;
	}

	let existing_key;

	// Iterate over all the existing keys
	for (existing_key of existing_cheap_keys) {
		// Compare the full keys
		if (existing_key.full_key == key.full_key) {
			return true;
		}
	}

	return false;
});

/**
 * Delete a value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {*}
 *
 * @return   {boolean}
 */
HashSet.setMethod('delete', function _delete(value) {

	if (!this.size) {
		return false;
	}

	let key = this.values_to_key.get(value);

	if (!key) {
		let temp_key = new Blast.Classes.HashKey(value);

		// See if this set has a cheap key registered
		let existing_cheap_keys = this.cheap_to_keys.get(temp_key.cheap_key);

		// It does, so we have to start making expensive compares
		if (existing_cheap_keys) {
			let existing_key;

			// Iterate over all the existing keys
			for (existing_key of existing_cheap_keys) {
				// Compare the full keys
				if (existing_key.full_key == temp_key.full_key) {
					key = existing_key;
					break;
				}
			}
		}

		if (!key) {
			return false;
		}
	}

	this.values_to_key.clear();

	// Get all the cheap keys
	let cheap_keys = this.cheap_to_keys.get(key.cheap_key);

	if (cheap_keys) {
		let existing_key,
		    i;

		for (i = 0; i < cheap_keys.length; i++) {
			existing_key = cheap_keys[i];

			if (existing_key.full_key == key.full_key) {
				this.key_to_value.delete(existing_key);
				cheap_keys.splice(i, 1);
				return true;
			}
		}
	}
});

Blast.defineClass('HashSet', HashSet);