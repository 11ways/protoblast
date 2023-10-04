const SIZE = Symbol('size');

/**
 * The Deck class: a sorted dictionary
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 */
var Deck = Fn.inherits('Iterator', function Deck() {
	this.dict = {};
	this.array = [];
	this._iterSubject = [];
	this[SIZE] = null;
});

/**
 * The initial insertCount is always 0
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @type   {Number}
 */
Deck.setProperty('insertCount', 0);

/**
 * Get the size of this deck
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.12
 * @version  0.8.12
 *
 * @type     {Number}
 */
Deck.setProperty(function size() {

	let result = this[SIZE];

	if (result == null) {
		let entry;
		result = 0;

		for (entry of this.array) {
			if (!entry) {
				continue;
			}

			result++;
		}

		this[SIZE] = result;
	}

	return result;
});

/**
 * The values are not sorted at init
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @type   {Boolean}
 */
Deck.setProperty('sorted', false);

/**
 * The items are not sorted at init
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @type   {Boolean}
 */
Deck.setProperty('sortedItems', false);

/**
 * In a deck the source of the iterator subject are objects
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @type   {Boolean}
 */
Deck.setProperty('_iterSubjectIsArray', false);

/**
 * Create a new Deck object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Deck}
 */
Blast.defineStatic(Deck, 'create', function create() {
	return new Deck();
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.11
 *
 * @return   {Object}
 */
Blast.defineStatic(Deck, 'unDry', function unDry(obj) {

	let result = new Deck(),
	    entry,
	    key;

	result.dict = obj.dict;
	result.array = obj.array;
	result._iterSubject = obj.array.slice(0);
	result.insertCount = obj.ic;

	for (key in obj.attributes) {
		result[key] = obj.attributes[key];
	}

	return result;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.11
 *
 * @return   {Object}
 */
Deck.setMethod('toDry', function toDry() {

	var attributes = {},
	    keys = Object.keys(this),
	    key,
	    i;

	for (i = 0; i < keys.length; i++) {
		key = keys[i];

		switch (key) {
			case 'dict':
			case 'array':
			case '_iterSubject':
			case 'insertCount':
			case 'sorted':
			case 'sortedItems':
			case '_iterSubjectIsArray':
				continue;

			default:
				attributes[key] = this[key];
		}
	}

	return {
		value: {
			ic: this.insertCount,
			dict: this.dict,
			array: this.array,
			attributes: attributes
		},
		path: '__Protoblast.Classes.Deck'
	};
});

/**
 * The sort function: sort by weight & id
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @return   {Number}
 */
Deck.setMethod('sorter', function sorter(a, b) {
	if (a.weight < b.weight) {
		return 1;
	} else if (a.weight > b.weight) {
		return -1;
	} else {
		// Smaller ids get preference here
		if (a.id < b.id) {
			return -1;
		} else if (a.id > b.id) {
			return 1;
		} else {
			return 0;
		}
	}
});

/**
 * Set a key-value pair with an optional weight
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.8.12
 *
 * @param    {String}   key
 * @param    {Mixed}    value
 * @param    {Number}   weight   The weight of this value, default 100
 *
 * @return   {Number}   The numeric id of the value
 */
Deck.setMethod(function set(key, value, weight) {

	// See if this key already exists
	var item = this.dict[key];

	if (typeof weight !== 'number') {
		weight = 100;
	}

	// If it doesn't: create a new object an up the insert count
	if (item == null) {
		item = {
			id: this.insertCount++,
			key: key,
			value: value,
			weight: weight
		};

		// Store the new item in the array by its insert id
		this.array[item.id] = item;
		this._iterSubject.push(item);

		// And in the dictionary by its key
		this.dict[key] = item;

		this[SIZE] = null;
	} else {
		// Overwrite the settings if it does exist
		item.value = value;
		item.weight = weight;
	}

	// Clear the sorted items
	this.sorted = this.sortedItems = false;

	return item.id;
});

/**
 * Add a value to the object, without a key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Mixed}    value
 * @param    {Number}   weight   The weight of this value, default 100
 *
 * @return   {Number}   The numeric id of the value
 */
Deck.setMethod(function push(value, weight) {

	// Get the new id
	var idKey = '_pushed_' + this.insertCount;

	return this.set(idKey, value, weight);
});

/**
 * See if the deck has a certain key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {String}   key
 *
 * @return   {Boolean}
 */
Deck.setMethod(function has(key) {
	return this.dict[key] != null;
});

/**
 * Get the value of the wanted key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {String}   key   The key to get
 * @param    {Mixed}    def   Optional default value
 *
 * @return   {Mixed}
 */
Deck.setMethod(function get(key, def) {
	if (this.dict[key] != null) {
		return this.dict[key].value;
	}

	if (arguments.length == 2) {

		if (typeof def === 'function') {
			this.set(key, def());
		} else {
			this.set(key, def);
		}

		return this.dict[key].value;
	}
});

/**
 * Remove a given value by its key
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.4
 * @version  0.8.12
 *
 * @param    {String}   key
 *
 * @return   {Boolean}  If the item was removed
 */
Deck.setMethod(function remove(key) {

	var item = this.dict[key],
	    id;

	if (!item) {
		return false;
	}

	this.dict[key] = undefined;
	this.array[item.id] = undefined;

	// Get the index in the sorted array
	id = this._iterSubject.indexOf(item);

	if (id > -1) {
		this._iterSubject.splice(id, 1);
	}

	this[SIZE] = null;

	return true;
});

/**
 * Remove all current entries
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.27
 * @version  0.8.12
 */
Deck.setMethod(function clear() {
	this.dict = {};
	this.array = [];
	this._iterSubject = [];
	this.insertCount = 0;
	this._iterSubjectIsArray = false;
	this.sorted = false;
	this.sortedItems = false;
	this[SIZE] = null;
});

/**
 * Get the value by id (or insert order)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Number}   id
 *
 * @return   {Mixed}
 */
Deck.setMethod(function getById(id) {
	if (this.array[id] != null) {
		return this.array[id].value;
	}
});

/**
 * Find inside value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.11
 * @version  0.6.4
 *
 * @param    {Mixed}    key_value
 * @param    {Boolean}  recursive   Look through other decks? [true]
 *
 * @return   {Mixed}
 */
Deck.setMethod(function findByKey(key_value, recursive) {

	var result,
	    entry,
	    val,
	    i;

	if (recursive == null) {
		recursive = true;
	}

	// Go over entry in this deck
	for (i = 0; i < this.array.length; i++) {
		entry = this.array[i];

		if (entry == null) {
			continue;
		}

		val = entry.value;

		if (entry.key === key_value) {
			return val;
		}

		// Only look in objects
		if (val && typeof val == 'object') {
			if (val.constructor && val.constructor.name == 'Deck') {
				result = val.findByKey(key_value, recursive);
				if (result) return result;
			}
		}
	}
});

/**
 * Get a dictionary
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Object}
 */
Deck.setMethod(function getDict() {

	var result = {},
	    sorted = this.getSortedItems(),
	    entry,
	    i;

	for (i = 0; i < sorted.length; i++) {
		entry = sorted[i];

		// Set the key-val
		result[entry.key] = entry.value;
	}

	return result;
});

/**
 * Get the sorted values
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Boolean}   slice   Slice the array before returning (true)
 *
 * @return   {Array}
 */
Deck.setMethod(function getSorted(slice) {

	var items,
	    i;

	if (!this.sorted) {

		items = this.getSortedItems();
		this.sorted = [];

		for (i = 0; i < items.length; i++) {
			this.sorted.push(items[i].value);
		}
	}

	if (slice === false) {
		return this.sorted;
	}

	return this.sorted.slice(0);
});

/**
 * Get the sorted internal items
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Boolean}   slice   Slice the array before returning (true)
 *
 * @return   {Array}
 */
Deck.setMethod(function getSortedItems(slice) {

	if (!this.sortedItems) {

		// Sort the iterator subject array values
		this._iterSubject.sort(this.sorter);

		this.sortedItems = true;
	}

	if (slice === false) {
		return this._iterSubject;
	}

	return this._iterSubject.slice(0);
});

/**
 * Iterate over the sorted items
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Function}   fnc
 */
Deck.setMethod(function forEach(fnc) {

	var items = this.getSortedItems(false),
	    i;

	for (i = 0; i < items.length; i++) {
		fnc(items[i].value, items[i].key, i, items[i]);
	}
});

/**
 * Iterate over the items in the dictionary,
 * break loop on a returned true
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Function}   fnc
 */
Deck.setMethod(function some(fnc) {

	var items = this.getSortedItems(false),
	    temp,
	    i;

	for (i = 0; i < items.length; i++) {
		temp = fnc(items[i].value, items[i].key, i, items[i]);

		if (temp === true) {
			break;
		}
	}
});

/**
 * Iterate over the items in the dictionary,
 * break loop on a returned false
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Function}   fnc
 */
Deck.setMethod(function every(fnc) {

	var items = this.getSortedItems(false),
	    temp,
	    i;

	for (i = 0; i < items.length; i++) {
		temp = fnc(items[i].value, items[i].key, i, items[i]);

		if (temp === false) {
			break;
		}
	}
});

/**
 * Create an iterator
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.7.0
 *
 * @return   {Iterator}
 */
Deck.setMethod(function createIterator() {

	var values = this.getSorted();

	return new Blast.Classes.Iterator(values);
});

/**
 * Create an iterator for the internal items
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.7.0
 *
 * @return   {Iterator}
 */
Deck.setMethod(function createIteratorItems() {

	var items = this.getSortedItems();

	return new Blast.Classes.Iterator(items);
});

/**
 * Return the next item (sorts items first)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Object}
 */
Deck.setMethod(function next() {

	if (this.sortedItems === false) {
		this.getSortedItems();
	}

	if (this._iterNextIndex < this._iterSubject.length) {
		return {
			index: this._iterNextIndex,
			key: this._iterSubject[this._iterNextIndex].key,
			value: this._iterSubject[this._iterNextIndex++].value,
			done: false
		};
	}

	return {done: true};
});

/**
 * Clone the deck (but not the values)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Deck}
 */
Deck.setMethod(function clone() {

	var result,
	    items,
	    i;

	// Get the sorted internal items
	items = this.getSortedItems(false);

	// Create a new deck
	result = new Deck();

	for (i = 0; i < items.length; i++) {
		result.set(items[i].key, items[i].value, items[i].weight);
	}

	return result;
});

/**
 * Iterator method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 */
Deck.setMethod(Symbol.iterator, function* iterate() {

	var values = this.getSorted(false),
	    i;

	for (i = 0; i < values.length; i++) {
		yield values[i];
	}
});

Blast.defineClass('Deck', Deck);