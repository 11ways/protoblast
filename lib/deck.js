module.exports = function BlastDeck(Blast, Collection) {

	/**
	 * The Deck class: a sorted dictionary
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	var Deck = function Deck() {
		this.insertCount = 0;
		this.dict = {};
		this.array = [];
		this.sorted = false;
		this.sortedItems = false;
	};

	/**
	 * Get the source code representation of this deck
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {String}
	 */
	Blast.defineValue(Deck.prototype, 'toSource', function toSource() {

		var src = '(function(){';
		src += 'var a = new _Protoblast.Classes.Deck();';
		src += 'a.insertCount=' + JSON.stringify(this.insertCount) + ';';
		src += 'a.dict=' + JSON.stringify(this.dict) + ';';
		src += 'return a;'
		src += '}())';

		return src;
	});

	/**
	 * The sort function: sort by weight & id
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Number}
	 */
	Blast.defineValue(Deck.prototype, 'sorter', function sorter(a, b) {
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   key
	 * @param    {Mixed}    value
	 * @param    {Number}   weight   The weight of this value, default 100
	 *
	 * @return   {Number}   The numeric id of the value
	 */
	Blast.defineValue(Deck.prototype, 'set', function set(key, value, weight) {

		// See if this key already exists
		var item = this.dict[key];

		// If it doesn't: create a new object an up the insert count
		if (!item) {
			item = {
				id: this.insertCount++
			};

			this.array[item.id] = item;
		}

		if (typeof weight !== 'number') {
			weight = 100;
		}

		item.key = key;
		item.value = value;
		item.weight = weight;

		this.dict[key] = item;

		// Clear the sorted items
		this.sorted = this.sortedItems = false;

		return item.id;
	});

	/**
	 * Add a value to the object, without a key
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Mixed}    value
	 * @param    {Number}   weight   The weight of this value, default 100
	 *
	 * @return   {Number}   The numeric id of the value
	 */
	Blast.defineValue(Deck.prototype, 'push', function push(value, weight) {

		// Get the new id
		var idKey = '_pushed_' + this.insertCount;

		return this.set(idKey, value, weight);
	});

	/**
	 * Get the value of the wanted key
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {String}   key
	 *
	 * @return   {Mixed}
	 */
	Blast.defineValue(Deck.prototype, 'get', function get(key) {
		if (this.dict[key]) {
			return this.dict[key].value;
		}
	});

	/**
	 * Get the value by id (or insert order)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   id
	 *
	 * @return   {Mixed}
	 */
	Blast.defineValue(Deck.prototype, 'getById', function getById(id) {
		if (this.array[id]) {
			return this.array[id].value;
		}
	});

	/**
	 * Get the sorted values
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	Blast.defineValue(Deck.prototype, 'getSorted', function getSorted() {

		var items,
		    i;

		if (!this.sorted) {

			items = this.getSortedItems();
			this.sorted = [];

			for (i = 0; i < items.length; i++) {
				this.sorted.push(items[i].value);
			}
		}

		return this.sorted.slice(0);
	});

	/**
	 * Get the sorted internal items
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	Blast.defineValue(Deck.prototype, 'getSortedItems', function getSortedItems() {

		if (!this.sortedItems) {

			this.sortedItems = Collection.Object.values(this.dict);

			// Sort the values
			this.sortedItems.sort(this.sorter);
		}

		return this.sortedItems.slice(0);
	});

	/**
	 * Iterate over the sorted items
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fnc
	 */
	Blast.defineValue(Deck.prototype, 'forEach', function forEach(fnc) {

		var items = this.getSortedItems(),
		    i;

		for (i = 0; i < items.length; i++) {
			fnc(items[i].value, items[i].key, i, items[i]);
		}
	});

	/**
	 * Iterate over the items in the dictionary,
	 * break loop on a returned true
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fnc
	 */
	Blast.defineValue(Deck.prototype, 'some', function some(fnc) {

		var items = this.getSortedItems(),
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fnc
	 */
	Blast.defineValue(Deck.prototype, 'every', function every(fnc) {

		var items = this.getSortedItems(),
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Iterator}
	 */
	Blast.defineValue(Deck.prototype, 'createIterator', function createIterator() {

		var values = this.getSorted();

		return Collection.Array.prototype.createIterator.call(values);
	});

	/**
	 * Create an iterator for the internal items
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Iterator}
	 */
	Blast.defineValue(Deck.prototype, 'createIteratorItems', function createIteratorItems() {

		var items = this.getSortedItems();

		return Collection.Array.prototype.createIterator.call(items);
	});

	Blast.defineClass('Deck', Deck);
};