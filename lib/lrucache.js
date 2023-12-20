/**
 * A simple LRU cache.
 * Unlike `Develry.Cache`, this does not care about age
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.7.24
 *
 * @param    {Number}   capacity
 */
class LruCache {

	// The actual current size of the cache
	#size = 0;

	// The maximum capacity
	#limit = 0;

	// The cached values
	#cache = null;

	// The head of the cache
	#head = null;

	// The tail of the cache
	#tail = null;

	constructor(capacity) {
		this.#cache = new Map();
		this.#limit = capacity;
	}

	/**
	 * Get the current size of the cache
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 */
	get size() {
		return this.#size;
	}

	/**
	 * Get a value from the cache
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.24
	 * @version  0.7.24
	 *
	 * @param    {String}   key
	 */
	get(key) {

		if(this.#cache.has(key)) {
			const value = this.#cache.get(key).value;

			// node removed from it's position and cache
			this.remove(key);

			// write node again to the head of LinkedList to make it most recently used
			this.set(key, value);

			return value;
		}

		return null;
	}

	/**
	 * Set a value in the cache
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.24
	 * @version  0.7.24
	 *
	 * @param    {String}   key
	 * @param    {Mixed}    value
	 */
	set(key, value) {

		if (!this.#head) {
			this.#head = this.#tail = new Node(key, value);
		} else {
			const node = new Node(key, value, this.#head);
			this.#head.prev = node;
			this.#head = node;
		}
	
		// Update the cache map
		if (this.#cache.has(key)) {
			this.remove(key);
			this.#cache.set(key, this.#head);
			this.#size++;
		} else {
			this.ensureLimit();
			this.#cache.set(key, this.#head);
			this.#size++;
		}
	}

	/**
	 * Remove a value from the cache
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.24
	 * @version  0.7.24
	 *
	 * @param    {String}   key
	 */
	remove(key) {

		const node = this.#cache.get(key);

		if (node == null) {
			return;
		}

		if (node.prev !== null) {
			node.prev.next = node.next;
		} else {
			this.#head = node.next;
		}

		if (node.next !== null) {
			node.next.prev = node.prev;
		} else {
			this.#tail = node.prev
		}

		this.#cache.delete(key);
		this.#size--;
	}

	/**
	 * Make sure the cache isn't too big
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.24
	 * @version  0.7.24
	 *
	 * @param    {String}   key
	 * @param    {Mixed}    value
	 */
	ensureLimit(key, value) {
		if (this.#size === this.#limit) {
			this.remove(this.#tail.key);
		}
	}
};

/**
 * The nodes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.7.24
 */
class Node {
	constructor(key, value, next = null, prev = null) {
		this.key = key;
		this.value = value;
		this.next = next;
		this.prev = prev;
	}
}

Fn.inherits(null, 'Develry', LruCache);