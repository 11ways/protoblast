var empty             = Symbol('empty'),
    cache_map         = Symbol('cache_map'),
    newest            = Symbol('newest'),
    oldest            = Symbol('oldest'),
    length            = Symbol('length'),
    total_size        = Symbol('size'),
    max_length_symbol = Symbol('max_length'),
    max_size_symbol   = Symbol('max_size'),
    max_age_symbol    = Symbol('max_age'),
    max_idle_symbol   = Symbol('max_idle'),
    set_for_get       = Symbol('set_for_get'),
    length_symbol     = length,
    getEntryByKey     = Symbol('getEntryByKey'),
    getAllEntries     = Symbol('getAllEntries');

/**
 * The Cache class in the Develry namespace,
 * inherits from the Informer class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.1
 */
var Cache = Fn.inherits('Informer', 'Develry', function Cache(options) {
	this.reset();
	Object.assign(this, options);
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
 * Get the total size of the cache
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
Cache.setProperty(function size() {

	var keys  = this.keys,
	    total = 0,
	    entry,
	    key,
	    i;

	for (i = 0; i < keys.length; i++) {
		key = keys[i];
		entry = this[getEntryByKey](key);

		if (entry.size == null) {
			entry.size = this.calculateSizeOfValue(entry.value, key);
		}

		total += entry.size;
	}

	return total;
});

/**
 * Get the newest property key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
Cache.setProperty(['newest', 'first'], function get_newest() {
	return this[newest];
});

/**
 * Get the oldest property key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
Cache.setProperty(['oldest', 'last'], function get_oldest() {
	return this[oldest];
});

/**
 * The maximum amount of items this cache can hold.
 * There is no limit by default
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
 * The default max_age for new entries in ms
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @type     {Number}
 */
Cache.setProperty(function max_age() {
	return this[max_age_symbol] || 0;
}, function setMaxAge(value) {

	if (typeof value == 'string') {
		value = Bound.Date.parseDuration(value);
	}

	this[max_age_symbol] = value;

	// Update all existing entries
	this[cache_map].forEach(function eachEntry(entry, key) {

		// Don't increase already set max_age
		if (entry.max_age < value) {
			return;
		}

		entry.max_age = value;
		entry.expiration = entry.added + value;
	});

	return value;
});

/**
 * The max_idle for all entries
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @type     {Number}
 */
Cache.setProperty(function max_idle() {
	return this[max_idle_symbol] || 0;
}, function setMaxIdle(value) {

	if (typeof value == 'string') {
		value = Bound.Date.parseDuration(value);
	}

	this[max_idle_symbol] = value;

	return value;
});

/**
 * The biggest size this cache can be.
 * The way size is defined can be overriden,
 * but uses `Object.sizeof()` by default
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @type     {Number}
 */
Cache.setProperty(function max_size() {
	return this[max_size_symbol] || 0;
}, function setMaxSize(value) {
	this[max_size_symbol] = value;
	this.prune(true);
	return value;
});

/**
 * Get all the keys of the cache
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @type     {Array}
 */
Cache.setProperty(function keys() {

	var result = [],
	    entry,
	    prev,
	    key = this.newest;

	while (key !== empty) {
		prev = entry;
		entry = this[getEntryByKey](key);

		if (entry) {
			result.push(key);
			key = entry.older;
		} else if (prev) {
			key = prev.older;
		} else {
			key = this.newest;

			if (key === empty) {
				break;
			}
		}
	}

	return result;
});

/**
 * Get all the values of the cache
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @type     {Array}
 */
Cache.setProperty(function values() {

	var results = [],
	    entries = this[getAllEntries](),
	    i;

	for (i = 0; i < entries.length; i++) {
		results.push(entries[i].value);
	}

	return results;
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
	this[newest] = empty;
	this[oldest] = empty;
	this[length] = 0;
});

/**
 * Is the given key available in this cache?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.4
 *
 * @param    {Mixed}    key
 *
 * @return   {Boolean}
 */
Cache.setMethod(function has(key) {
	return !!this[getEntryByKey](key);
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

	var old_newer,
	    old_newest,
	    old_older,
	    is_new,
	    item,
	    now = Date.now();

	// See if we already have this value in the cache
	item = this[cache_map].get(key);

	if (!item) {
		is_new = true;

		// Create a new cache entry object
		item = {
			added  : now,
			older  : empty,
			newer  : empty
		};

		// Store it in the cache map
		this[cache_map].set(key, item);

		// Increase the actual length of the cache
		this[length]++;

		// See if we have to apply a default max age
		if (max_age == null && this[max_age_symbol]) {
			max_age = this[max_age_symbol];
		}
	}

	// Set the new value
	item.value = value;

	// Set the updated time
	item.updated = now;

	// Is this `set` called within `get`?
	if (max_age === set_for_get) {
		max_age = null;
	} else {
		if (!is_new) {
			item.added = now;
			item.max_age = null;
			item.expiration = null;
		}

		// See if we have to get the size of the entry
		if (this[max_size_symbol]) {
			item.size = this.calculateSizeOfValue(value, key);
		}
	}

	if (max_age) {

		// Set the max_age
		item.max_age = max_age;

		// Calculate the expiration date
		item.expiration = item.added + item.max_age;
	}

	if (this[newest] === key) {
		return this;
	}

	if (this[length] === 1) {
		this[newest] = this[oldest] = key;
		return this;
	}

	// Get the old newest entry;
	old_newest = this[cache_map].get(this[newest]);

	// Get the old newer
	old_newer = this[cache_map].get(item.newer);

	// Get the old older
	old_older = this[cache_map].get(item.older);

	// Set us as the "newer" on the old newest
	if (old_newest) {
		old_newest.newer = key;
	}

	if (old_newer) {
		old_newer.older = item.older;
	}

	if (old_older) {
		old_older.newer = item.newer;
	}

	if (this[oldest] === key) {
		this[oldest] = item.newer;
	}

	item.newer = empty;
	item.older = this[newest];

	this[newest] = key;

	// If the cache has become too big, remove the least used item
	if (is_new) {
		if (this.max_length > 0 && this[length] > this.max_length) {
			this.evict();
		}

		if (this[max_size_symbol] && this.size > this[max_size_symbol]) {
			this.prune(true);
		}
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

	if (entry) {
		let now = Date.now();

		if (   (entry.max_age && entry.expiration <= now)
			|| (this[max_idle_symbol] && (entry.updated + this[max_idle_symbol]) <= now)) {

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

			return;
		}
	}

	return entry;
});

/**
 * Get all entries
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {Array}
 */
Cache.setMethod(getAllEntries, function getAllEntries() {

	var results = [],
	    entry,
	    keys = this.keys,
	    i;

	for (i = 0; i < keys.length; i++) {
		entry = this[getEntryByKey](keys[i]);

		if (entry) {
			results.push(entry);
		}
	}

	return results;
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
		this.set(key, entry.value, set_for_get);
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

	// Get the "newer" entry
	let newer = this[cache_map].get(entry.newer),
	    older = this[cache_map].get(entry.older),
	    temp = empty;

	if (newer) {
		newer.older = entry.older;
	}

	if (older) {
		older.newer = entry.newer;
	}

	// Set the found "older" or "empty"
	if (this[newest] === key) {
		if (older) {
			this[newest] = entry.older;
		} else {
			this[newest] = empty;
		}
	}

	if (this[oldest] === key) {
		this[oldest] = entry.newer;
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

	if (this[oldest] !== empty) {
		let oldest_key = this[oldest],
		    value = this.remove(oldest_key);

		/**
		 * Evicted event
		 *
		 * @event   Cache#evicted
		 *
		 * @param   {Mixed}   value   The evicted value
		 * @param   {Mixed}   key     The evicted value's key
		 */
		this.emit('evicted', value, oldest_key);
	}

	return this;
});

/**
 * Remove old values
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {Cache}
 */
Cache.setMethod(function prune(check_size) {
	var keys = this.keys;

	if (check_size && this[max_size_symbol]) {
		while (this.size > this[max_size_symbol]) {
			this.evict();
		}
	}

	return this;
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
	    keys = this.keys,
	    i;

	for (i = 0; i < keys.length; i++) {
		entry = this[getEntryByKey](keys[i]);

		if (entry) {
			task(entry.value, keys[i]);
		}
	}

	return this;
});

/**
 * Method used to calculate the 'size' of an entry.
 * Default implementation uses `Object.sizeof()`
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Mixed}   value
 * @param    {Mixed}   key
 *
 * @return   {Number}
 */
Cache.setMethod(function calculateSizeOfValue(value, key) {
	return Obj.sizeof([value, key]);
});