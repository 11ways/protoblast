const CONTAINER = Symbol('container'),
      HEAD = Symbol('head'),
      TAIL = Symbol('tail'),
      SIZE = Symbol('size'),
      MAP = Symbol('map'),
      KEY = Symbol('key'),
      VALUE = Symbol('value'),
      NEXT = Symbol('next'),
      PREV = Symbol('prev');

/**
 * The BaseLinkedList Class:
 * a doubly linked list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
const BaseLinkedList = Fn.inherits(null, 'Develry', function BaseLinkedList() {});

/**
 * Indicate this is an abstract class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.makeAbstractClass();

/**
 * unDry an object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {BaseLinkedList}
 */
BaseLinkedList.setStatic(function unDry(value) {
	let result = new this(),
	    val;

	for (val of value.values) {
		result.push(val);
	}

	return result;
});

/**
 * Get the current head
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.setProperty(function head() {
	return this[HEAD];
});

/**
 * Get the current tail
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.setProperty(function tail() {
	return this[TAIL];
});

/**
 * Get the current size
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.setProperty(function size() {
	return this[SIZE];
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {Object}
 */
BaseLinkedList.setMethod(function toDry() {
	return {
		value: {
			values: [...this.values()]
		}
	};
});

/**
 * Get the value at the given index
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {number}   index
 *
 * @return   {Mixed}
 */
BaseLinkedList.setMethod(function at(index) {

	if (index < 0) {
		return;
	}
	
	let node = this[HEAD],
	    i = 0;

	while (node) {
		if (i == index) {
			return node[VALUE];
		}

		node = node[NEXT];
		i++;
	}
});

/**
 * Replace the value at the given index
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {number}   index
 * @param    {Mixed}    value
 *
 * @return   {Mixed}    The replaced value
 */
BaseLinkedList.setMethod(function setAt(index, value) {

	// Throw an error when the index is out of bounds
	if (index < 0 || index >= this[SIZE]) {
		throw new Error('Index out of bounds');
	}

	let node = this[HEAD],
	    i = 0,
	    old;

	while (node) {
		if (i == index) {
			old = node[VALUE];
			node[VALUE] = value;
			return old;
		}

		node = node[NEXT];
		i++;
	}
});

/**
 * Is the given value present in this list?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   value
 *
 * @return   {Mixed}
 */
BaseLinkedList.setMethod(function includes(value) {
	return this.indexOf(value) > -1;
});

/**
 * Return the (first) index of the given value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   value
 *
 * @return   {number}
 */
BaseLinkedList.setMethod(function indexOf(value) {

	let node = this[HEAD],
	    i = 0;

	while (node) {
		if (node[VALUE] === value) {
			return i;
		}

		node = node[NEXT];
		i++;
	}

	return -1;
});

/**
 * Remove & retrieve the first value of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {mixed}
 */
BaseLinkedList.setMethod(function shift() {

	let node = this[HEAD];

	if (!node) {
		return;
	}

	if (node[NEXT]) {
		node[NEXT][PREV] = null;
	} else {
		this[TAIL] = null;
	}

	this[HEAD] = node[NEXT];
	this[SIZE]--;

	return node[VALUE];
});

/**
 * Remove & retrieve the last value of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {mixed}
 */
BaseLinkedList.setMethod(function pop() {
	
	let node = this[TAIL];

	if (!node) {
		return;
	}

	if (node[PREV]) {
		node[PREV][NEXT] = null;
	} else {
		this[HEAD] = null;
	}

	this[TAIL] = node[PREV];
	this[SIZE]--;

	return node[VALUE];
});

/**
 * Remove all the values from the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.setMethod(function clear() {
	this[HEAD] = this[TAIL] = null;
	this[SIZE] = 0;
});

/**
 * Retrieve the first value of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {mixed}
 */
BaseLinkedList.setMethod(function first() {
	return this[HEAD]?.[VALUE];
});

/**
 * Retrieve the last value of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {mixed}
 */
BaseLinkedList.setMethod(function last() {
	return this[TAIL]?.[VALUE];
});

/**
 * Iterate over the list and apply the callback to each item
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Function}   callback
 */
BaseLinkedList.setMethod(function forEach(callback) {

	let node = this[HEAD],
	    i = 0;

	while (node) {
		callback(node[VALUE], i++, this);
		node = node[NEXT];
	}
});

/**
 * Return the values in an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {Array}
 */
BaseLinkedList.setMethod(function toArray() {

	let result = [],
	    node = this[HEAD];

	while (node) {
		result.push(node[VALUE]);
		node = node[NEXT];
	}

	return result;
});

/**
 * Return an iterator over the list's values
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.setMethod(function* values() {
	
	let node = this[HEAD];

	while (node) {
		yield node[VALUE];
		node = node[NEXT];
	}
});

/**
 * Set the iterable symbol
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseLinkedList.setMethod(Symbol.iterator, function entries() {
	return this.entries();
});

/**
 * The LinkedList Class:
 * a doubly linked list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
const LinkedList = Fn.inherits('Develry.BaseLinkedList', function LinkedList() {

	// The head node
	this[HEAD] = null;

	// The tail node
	this[TAIL] = null;

	// The size of the list
	this[SIZE] = 0;
});

/**
 * Get the value for the given index
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {number}   index
 *
 * @return   {Mixed}
 */
LinkedList.setMethod(function get(index) {
	return this.at(index);
});

/**
 * Add one or more items to the start of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   values
 *
 * @return   {number}
 */
LinkedList.setMethod(function unshift(...values) {

	let node,
	    i;

	for (i = 0; i < values.length; i++) {
		node = new LinkedListNode(this, values[i], this[HEAD]);

		if (this[HEAD]) {
			this[HEAD][PREV] = node;
		} else {
			this[TAIL] = node;
		}

		this[HEAD] = node;
		this[SIZE]++;
	}

	return this[SIZE];
});

/**
 * Push one or more items to the end of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   values
 *
 * @return   {number}
 */
LinkedList.setMethod(function push(...values) {

	let node,
	    i;

	for (i = 0; i < values.length; i++) {
		node = new LinkedListNode(this, values[i], null, this[TAIL]);

		if (this[TAIL]) {
			this[TAIL][NEXT] = node;
		} else {
			this[HEAD] = node;
		}

		this[TAIL] = node;
		this[SIZE]++;
	}

	return this[SIZE];
});

/**
 * Delete the given index from the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {number}   index
 *
 * @return   {boolean}
 */
LinkedList.setMethod(['remove', 'delete'], function _delete(index) {

	let node = this[HEAD],
	    i = 0;

	while (node) {
		if (i == index) {
			if (node[PREV]) {
				node[PREV][NEXT] = node[NEXT];
			} else {
				this[HEAD] = node[NEXT];
			}

			if (node[NEXT]) {
				node[NEXT][PREV] = node[PREV];
			} else {
				this[TAIL] = node[PREV];
			}

			this[SIZE]--;
			return true;
		}

		node = node[NEXT];
		i++;
	}

	return false;
});

/**
 * Return an iterator over the list's entries
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
LinkedList.setMethod(function* entries() {
	
	let node = this[HEAD],
	    i = 0;

	while (node) {
		yield [i++, node[VALUE]];
		node = node[NEXT];
	}
});

/**
 * The LinkedMap Class:
 * a map that also is a linked list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
const LinkedMap = Fn.inherits('Develry.BaseLinkedList', function LinkedMap() {

	// The map itself
	this[MAP] = new Map();

	// The head node
	this[HEAD] = null;

	// The tail node
	this[TAIL] = null;

	// The size of the list
	this[SIZE] = 0;
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {BaseLinkedList}
 */
LinkedMap.setStatic(function unDry(value) {
	let result = new this(),
	    val,
	    key;

	for ([key, val] of value.entries) {
		result.set(key, val);
	}

	return result;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @return   {Object}
 */
LinkedMap.setMethod(function toDry() {
	return {
		value: {
			entries: [...this.entries()]
		}
	};
});

/**
 * Remove all the values from the map
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
LinkedMap.setMethod(function clear() {
	this[MAP].clear();
	clear.super.call(this);
});

/**
 * Delete the given key from the map & list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 *
 * @return   {boolean}
 */
LinkedMap.setMethod(['remove', 'delete'], function _delete(key) {

	let node = this[MAP].get(key);

	if (!node) {
		return false;
	}

	if (node[PREV]) {
		node[PREV][NEXT] = node[NEXT];
	} else {
		this[HEAD] = node[NEXT];
	}

	if (node[NEXT]) {
		node[NEXT][PREV] = node[PREV];
	} else {
		this[TAIL] = node[PREV];
	}

	this[MAP].delete(key);
	this[SIZE]--;

	return true;
});

/**
 * Is the given key present in the map?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 *
 * @return   {boolean}
 */
LinkedMap.setMethod(function has(key) {
	return this[MAP].has(key);
});

/**
 * Get the value for the given key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 *
 * @return   {Mixed}
 */
LinkedMap.setMethod(function get(key) {
	return this[MAP].get(key)?.[VALUE];
});

/**
 * Get the node after the given key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 * @param    {number}  amount
 *
 * @return   {KeyedNode}
 */
LinkedMap.setMethod(function getNodeAfter(key, amount = 1) {

	let node = this[MAP].get(key);

	if (!node) {
		return;
	}

	while (node && amount > 0) {
		node = node[NEXT];
		amount--;
	}

	return node;
});

/**
 * Get the node before the given key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 * @param    {number}  amount
 *
 * @return   {KeyedNode}
 */
LinkedMap.setMethod(function getNodeBefore(key, amount = 1) {

	let node = this[MAP].get(key);

	if (!node) {
		return;
	}

	while (node && amount > 0) {
		node = node[PREV];
		amount--;
	}

	return node;
});

/**
 * Get the node for the given key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 *
 * @return   {KeyedNode}
 */
LinkedMap.setMethod(function getNode(key) {
	return this[MAP].get(key);
});

/**
 * Push/set one item at the end of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 * @param    {Mixed}   value
 *
 * @return   {number}
 */
LinkedMap.setMethod(['push', 'set'], function set(key, value) {

	this.delete(key);
	
	let node = new KeyedNode(this, key, value, null, this[TAIL]);

	if (this[TAIL]) {
		this[TAIL][NEXT] = node;
	} else {
		this[HEAD] = node;
	}

	this[TAIL] = node;
	this[SIZE]++;

	this[MAP].set(key, node);

	return this[SIZE];
});

/**
 * Replace the value at the given index
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {number}   index
 * @param    {Mixed}    key
 * @param    {Mixed}    value
 *
 * @return   {Mixed}    The replaced value
 */
LinkedMap.setMethod(function setAt(index, key, value) {

	// Throw an error when the index is out of bounds
	if (index < 0 || index >= this[SIZE]) {
		throw new Error('Index out of bounds');
	}

	let node = this[HEAD],
	    i = 0,
	    old;

	// See if there is already a value with this key
	let existing = this[MAP].get(key);

	while (node) {
		if (i == index) {
			old = node[VALUE];
			node[KEY] = key;
			node[VALUE] = value;

			if (existing && existing != node) {
				existing.remove();
			}

			return old;
		}

		node = node[NEXT];
		i++;
	}
});

/**
 * Unshift an item at the start of the list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   key
 * @param    {Mixed}   value
 *
 * @return   {number}
 */
LinkedMap.setMethod(function unshift(key, value) {

	this.delete(key);

	let node = new KeyedNode(this, key, value, this[HEAD]);

	if (this[HEAD]) {
		this[HEAD][PREV] = node;
	} else {
		this[TAIL] = node;
	}

	this[HEAD] = node;
	this[SIZE]++;

	this[MAP].set(key, node);

	return this[SIZE];
});

/**
 * Set an item before the given key,
 * or at the end if the key is not found
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   existing_key
 * @param    {Mixed}   new_key
 * @param    {Mixed}   value
 *
 * @return   {number}
 */
LinkedMap.setMethod(function setBefore(existing_key, new_key, value) {

	let existing = this[MAP].get(existing_key);

	if (!existing) {
		return this.set(new_key, value);
	}

	// If the keys are the same, just update the value
	if (existing_key == new_key) {
		existing[VALUE] = value;
		return this[SIZE];
	}

	this.delete(new_key);

	let node = new KeyedNode(this, new_key, value, existing, existing.prev);

	if (existing[PREV]) {
		existing[PREV][NEXT] = node;
	} else {
		this[HEAD] = node;
	}

	existing[PREV] = node;
	this[SIZE]++;

	this[MAP].set(new_key, node);

	return this[SIZE];
});

/**
 * Set an item after the given key,
 * or at the end if the key is not found
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 *
 * @param    {Mixed}   existing_key
 * @param    {Mixed}   new_key
 * @param    {Mixed}   value
 *
 * @return   {number}
 */
LinkedMap.setMethod(function setAfter(existing_key, new_key, value) {

	let existing = this[MAP].get(existing_key);

	if (!existing) {
		return this.set(new_key, value);
	}

	// If the keys are the same, just update the value
	if (existing_key == new_key) {
		existing[VALUE] = value;
		return this[SIZE];
	}

	this.delete(new_key);

	let node = new KeyedNode(this, new_key, value, existing.next, existing);

	if (existing[NEXT]) {
		existing[NEXT][PREV] = node;
	} else {
		this[TAIL] = node;
	}

	existing[NEXT] = node;
	this[SIZE]++;

	this[MAP].set(new_key, node);

	return this[SIZE];
});

/**
 * Return an iterator over the map's entries
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
LinkedMap.setMethod(function* entries() {
	
	let node = this[HEAD];

	while (node) {
		yield [node[KEY], node[VALUE]];
		node = node[NEXT];
	}
});

/**
 * Return an iterator over the map's keys
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
LinkedMap.setMethod(function* keys() {

	let node = this[HEAD];

	while (node) {
		yield node[KEY];
		node = node[NEXT];
	}
});

/**
 * The base node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.8.16
 *
 * @param    {BaseLinkedList}   container
 * @param    {Mixed}            value
 * @param    {BaseNode}         next
 * @param    {BaseNode}         prev
 */
const BaseNode = Fn.inherits(null, 'Develry', function BaseLinkedNode(container, value, next = null, prev = null) {
	this[CONTAINER] = container;
	this[VALUE] = value;
	this[NEXT] = next;
	this[PREV] = prev;
});

/**
 * Get the value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseNode.setProperty(function value() {
	return this[VALUE];
});

/**
 * Get the next node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseNode.setProperty(function next() {
	return this[NEXT];
});

/**
 * Get the previous node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseNode.setProperty(function prev() {
	return this[PREV];
});

/**
 * Remove this node from its list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
BaseNode.setMethod(function remove() {

	if (this[PREV]) {
		this[PREV][NEXT] = this[NEXT];
	} else {
		this[CONTAINER][HEAD] = this[NEXT];
	}

	if (this[NEXT]) {
		this[NEXT][PREV] = this[PREV];
	} else {
		this[CONTAINER][TAIL] = this[PREV];
	}

	this[CONTAINER][SIZE]--;
});

/**
 * The node for a LinkedList
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.8.16
 */
const LinkedListNode = Fn.inherits(BaseNode, 'LinkedListNode');

/**
 * The keyed-node for a LinkedMap
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.8.16
 */
const KeyedNode = Fn.inherits(BaseNode, function KeyedNode(container, key, value, next = null, prev = null) {
	this[CONTAINER] = container;
	this[KEY] = key;
	this[VALUE] = value;
	this[NEXT] = next;
	this[PREV] = prev;
});

/**
 * Get the key
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.16
 * @version  0.8.16
 */
KeyedNode.setProperty(function key() {
	return this[KEY];
});