module.exports = function BlastCache(Blast, Collection) {

	var empty             = Symbol('empty'),
	    cache_map         = Symbol('cache_map'),
	    first             = Symbol('first'),
	    first_symbol      = first,
	    last              = Symbol('last'),
	    last_symbol       = last,
	    length            = Symbol('length'),
	    max_length_symbol = Symbol('max_length'),
	    length_symbol     = length,
	    getEntryByKey     = Symbol('getEntryByKey');

	/**
	 * The Cache class in the Develry namespace,
	 * inherits from the Informer class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 */
	var Cache = Collection.Function.inherits('Informer', 'Develry', function Cache(options) {

		if (!options) {
			options = {};
		}

		if (options.max_length) {
			this.max_length = options.max_length;
		}

		this.reset();
	});

	/**
	 * The length property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 */
	Cache.setProperty(function length() {
		return this[length_symbol];
	}, function setLength(value) {

		var old = this[length];

		// If the new length is shorter, evict old entries
		if (value < old) {
			for (; value < old; value++) {
				this.evict();
			}
		}

		return this[length]
	});

	/**
	 * Get the first property key
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 */
	Cache.setProperty(function first() {
		return this[first_symbol];
	});

	/**
	 * Get the last property key
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 */
	Cache.setProperty(function last() {
		return this[last_symbol];
	});

	/**
	 * The max_length property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 */
	Cache.setProperty(function max_length() {
		return this[max_length_symbol] || 0;
	}, function setMaxLength(value) {
		this[max_length_symbol] = value;
		this.length = value;
		return this[max_length_symbol];
	});

	/**
	 * Reset the cache
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 */
	Cache.setMethod(function reset() {

		// Recreate the cache map
		this[cache_map] = new Map();

		// Reset the pointers
		this[first] = empty;
		this[last] = empty;
		this[length] = 0;
	});

	/**
	 * Is the given key available in this cache?
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Mixed}    key
	 *
	 * @return   {Boolean}
	 */
	Cache.setMethod(function has(key) {
		return this[cache_map].has(key);
	});

	/**
	 * Set a value in the cache
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Mixed}    key
	 * @param    {Mixed}    value
	 * @param    {Number}   max_age
	 *
	 * @return   {Cache}
	 */
	Cache.setMethod(function set(key, value, max_age) {

		var old_previous,
		    old_first,
		    old_next,
		    is_new,
		    item;

		// See if we already have this value in the cache
		item = this[cache_map].get(key);

		if (!item) {
			is_new = true;

			// Create a new cache entry object
			item = {
				next     : empty,
				previous : empty
			};

			// Store it in the cache map
			this[cache_map].set(key, item);

			// Increase the actual length of the cache
			this[length]++;
		}

		// Set the new value
		item.value = value;

		if (max_age) {

			// Set the time it was added
			item.updated = Date.now();

			// Set the max_age
			item.max_age = max_age;

			// Calculate the expiration date
			item.expiration = item.updated + item.max_age;
		}

		if (this[first] === key) {
			return this;
		}

		if (this[length] === 1) {
			this[first] = this[last] = key;
			return this;
		}

		// Get the old first entry;
		old_first = this[cache_map].get(this[first]);

		// Get the old previous
		old_previous = this[cache_map].get(item.previous);

		// Get the old next
		old_next = this[cache_map].get(item.next);

		// Set us as the "previous" on the old first
		if (old_first) {
			old_first.previous = key;
		}

		if (old_previous) {
			old_previous.next = item.next;
		}

		if (old_next) {
			old_next.previous = item.previous;
		}

		if (this[last] === key) {
			this[last] = item.previous;
		}

		item.previous = empty;
		item.next = this[first];

		this[first] = key;

		// If the cache has become too big, remove the least used item
		if (is_new && this.max_length > 0 && this[length] > this.max_length) {
			this.evict();
		}

		return this;
	});

	/**
	 * Get an entry by key
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @fires    {Cache#expired}
	 *
	 * @param    {Mixed}    key
	 *
	 * @return   {Object}
	 */
	Cache.setMethod(getEntryByKey, function getEntryByKey(key) {
		var entry = this[cache_map].get(key);

		if (entry && entry.max_age && entry.expiration >= Date.now()) {

			let value = this.remove(key);

			/**
			 * Expired event
			 *
			 * @event   Cache#expired
			 *
			 * @param   {Mixed}   value   The expired value
			 * @param   {Mixed}   key     The expired value's key
			 */
			this.emit('expired', value, key);
		}

		return entry;
	});

	/**
	 * Get a value from the cache
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Mixed}    key
	 *
	 * @return   {Mixed}
	 */
	Cache.setMethod(function get(key) {

		var entry = this[getEntryByKey](key);

		if (entry) {
			this.set(key, entry.value);
			return entry.value;
		}
	});

	/**
	 * Get a value from the cache without marking it as the most recently used
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Mixed}    key
	 *
	 * @return   {Mixed}
	 */
	Cache.setMethod(function peek(key) {
		var entry = this[getEntryByKey](key);

		if (entry) {
			return entry.value;
		}
	});

	/**
	 * Remove a value
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @fires    {Cache#removed}
	 *
	 * @param    {Mixed}    key
	 *
	 * @return   {Mixed}
	 */
	Cache.setMethod(function remove(key) {

		var entry = this[cache_map].get(key);

		if (!entry) {
			return;
		}

		// Remove the entry from the cache map
		this[cache_map].delete(key);

		// Decrease the length
		this[length]--;

		// Get the "previous" entry
		let previous = this[cache_map].get(entry.previous),
		    next = this[cache_map].get(entry.next),
		    temp = empty;

		if (previous) {
			previous.next = entry.next;
		}

		if (next) {
			next.previous = entry.previous;
		}

		// Set the found "next" or "empty"
		if (this[first] === key) {
			if (next) {
				this[first] = entry.next;
			} else {
				this[first] = empty;
			}
		}

		if (this[last] === key) {
			this[last] = entry.previous;
		}

		/**
		 * Removed event
		 *
		 * @event   Cache#removed
		 *
		 * @param   {Mixed}   value   The removed value
		 * @param   {Mixed}   key     The removed value's key
		 */
		this.emit('removed', entry.value, key);

		return entry.value;
	});

	/**
	 * Evict the oldest value
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @fires    {Cache#evicted}
	 *
	 * @return   {Cache}
	 */
	Cache.setMethod(function evict() {

		if (this[last] !== empty) {
			let last_key = this[last],
			    value = this.remove(last_key);

			/**
			 * Evicted event
			 *
			 * @event   Cache#evicted
			 *
			 * @param   {Mixed}   value   The evicted value
			 * @param   {Mixed}   key     The evicted value's key
			 */
			this.emit('evicted', value, last_key);
		}

		return this;
	});

	/**
	 * Get all the keys of the cache
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @return   {Array}
	 */
	Cache.setMethod(function keys() {

		var result = [],
		    entry,
		    prev,
		    key = this.first;

		while (key !== empty) {
			result.push(key);

			prev = entry;
			entry = this[getEntryByKey](key);

			if (entry) {
				key = entry.next;
			} else if (prev) {
				key = prev.next;
			} else {
				break;
			}
		}

		return result;
	});

	/**
	 * Iterate over all the entries in the cache
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Function}   task   A function with (value, key) arguments
	 *
	 * @return   {Cache}
	 */
	Cache.setMethod(function forEach(task) {

		var entry,
		    keys,
		    i;

		// Get the current ordered key
		keys = this.keys();

		for (i = 0; i < keys.length; i++) {
			entry = this[getEntryByKey](keys[i]);

			if (entry) {
				task(entry.value, keys[i]);
			}
		}

		return this;
	});

};