/**
 * A memory-efficient circular buffer with O(1) push operations
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {number}   capacity   The maximum number of items to store
 */
const RingBuffer = Fn.inherits(null, 'Develry', function RingBuffer(capacity) {

	if (!capacity || capacity < 1) {
		throw new Error('RingBuffer capacity must be at least 1');
	}

	// The maximum number of items
	this.capacity = capacity;

	// The internal buffer array
	this.buffer = new Array(capacity);

	// The current head position (where next item will be written)
	this.head = 0;

	// The current number of items in the buffer
	this.length = 0;
});

/**
 * Push a new item into the buffer.
 * If the buffer is full, the oldest item is overwritten.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {*}   item   The item to add
 *
 * @return   {RingBuffer}   Returns this for chaining
 */
RingBuffer.setMethod(function push(item) {

	// Store the item at the current head position
	this.buffer[this.head] = item;

	// Move head to next position, wrapping around if needed
	this.head = (this.head + 1) % this.capacity;

	// Increase length up to capacity
	if (this.length < this.capacity) {
		this.length++;
	}

	return this;
});

/**
 * Peek at the most recent item without removing it.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {*}   The most recent item, or undefined if empty
 */
RingBuffer.setMethod(function peek() {

	if (this.length === 0) {
		return undefined;
	}

	// Most recent item is at (head - 1), wrapping around
	let index = (this.head - 1 + this.capacity) % this.capacity;

	return this.buffer[index];
});

/**
 * Peek at the oldest item without removing it.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {*}   The oldest item, or undefined if empty
 */
RingBuffer.setMethod(function peekOldest() {

	if (this.length === 0) {
		return undefined;
	}

	if (this.length < this.capacity) {
		// Buffer not yet full, oldest item is at index 0
		return this.buffer[0];
	}

	// Buffer is full, oldest item is at head position
	return this.buffer[this.head];
});

/**
 * Get all items as an array, in chronological order (oldest first).
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {Array}   Array of items in chronological order
 */
RingBuffer.setMethod(function toArray() {

	if (this.length === 0) {
		return [];
	}

	let result = new Array(this.length),
	    start = this.length < this.capacity ? 0 : this.head;

	for (let i = 0; i < this.length; i++) {
		result[i] = this.buffer[(start + i) % this.capacity];
	}

	return result;
});

/**
 * Get the last n items, in chronological order (oldest first).
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {number}   n   The number of items to get
 *
 * @return   {Array}   Array of the last n items
 */
RingBuffer.setMethod(function getLast(n) {

	n = Math.floor(n);

	if (!n || n <= 0 || this.length === 0) {
		return [];
	}

	// Limit n to the actual length
	n = Math.min(n, this.length);

	let result = new Array(n);

	// Calculate the starting buffer index for the last n items
	// The newest item is at (head - 1), so n items back is at (head - n)
	let start = (this.head - n + this.capacity) % this.capacity;

	for (let i = 0; i < n; i++) {
		result[i] = this.buffer[(start + i) % this.capacity];
	}

	return result;
});

/**
 * Clear all items from the buffer.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {RingBuffer}   Returns this for chaining
 */
RingBuffer.setMethod(function clear() {

	// Fill buffer with undefined to release old item references
	this.buffer.fill(undefined);
	this.head = 0;
	this.length = 0;

	return this;
});

/**
 * Get the actual buffer index for a logical index.
 * Logical index 0 = oldest item, logical index (length-1) = newest item.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {number}   logicalIndex   The logical index (0 = oldest)
 *
 * @return   {number}   The actual buffer index, or -1 if out of bounds
 */
RingBuffer.setMethod(function _getBufferIndex(logicalIndex) {

	if (logicalIndex < 0 || logicalIndex >= this.length) {
		return -1;
	}

	if (this.length < this.capacity) {
		// Buffer not yet full, logical index equals buffer index
		return logicalIndex;
	}

	// Buffer is full, oldest item is at head position
	return (this.head + logicalIndex) % this.capacity;
});

/**
 * Get the item at the given logical index.
 * Logical index 0 = oldest item, logical index (length-1) = newest item.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {number}   logicalIndex   The logical index (0 = oldest)
 *
 * @return   {*}   The item at the given index, or undefined if out of bounds
 */
RingBuffer.setMethod(function get(logicalIndex) {

	logicalIndex = Math.floor(logicalIndex);

	let bufferIndex = this._getBufferIndex(logicalIndex);

	if (bufferIndex === -1) {
		return undefined;
	}

	return this.buffer[bufferIndex];
});

/**
 * Check if the buffer is at full capacity.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {boolean}   True if the buffer is full
 */
RingBuffer.setMethod(function isFull() {
	return this.length === this.capacity;
});

/**
 * Check if the buffer is empty.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {boolean}   True if the buffer is empty
 */
RingBuffer.setMethod(function isEmpty() {
	return this.length === 0;
});

/**
 * Iterate over all items in chronological order (oldest first).
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {Function}   callback   Function to call for each item: callback(item, index, ringbuffer)
 */
RingBuffer.setMethod(function forEach(callback) {

	for (let i = 0; i < this.length; i++) {
		callback(this.get(i), i, this);
	}
});

/**
 * Make the RingBuffer iterable.
 * Iterates in chronological order (oldest first).
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {Iterator}
 */
RingBuffer.setMethod(Symbol.iterator, function* iterate() {

	for (let i = 0; i < this.length; i++) {
		yield this.get(i);
	}
});

/**
 * Get items that match a predicate, starting from the newest.
 * Stops when predicate returns false (assumes items are ordered).
 * Useful for time-based queries where recent items match first.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {Function}   predicate   Function that returns true for matching items
 *
 * @return   {Array}   Matching items in chronological order (oldest first)
 */
RingBuffer.setMethod(function getWhileMatch(predicate) {

	if (this.length === 0) {
		return [];
	}

	let matches = [];

	// Iterate from newest to oldest
	for (let i = this.length - 1; i >= 0; i--) {
		let item = this.get(i);

		if (predicate(item)) {
			matches.push(item);
		} else {
			// Stop when predicate fails (assumes ordered data)
			break;
		}
	}

	// Reverse to get chronological order
	matches.reverse();

	return matches;
});

/**
 * Get items within a time range.
 * Assumes items have a 'timestamp' property and are stored chronologically.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {number}   startTime   Start timestamp (inclusive)
 * @param    {number}   endTime     End timestamp (inclusive), defaults to now
 *
 * @return   {Array}   Items within the time range, in chronological order
 */
RingBuffer.setMethod(function getInTimeRange(startTime, endTime) {

	if (this.length === 0) {
		return [];
	}

	if (endTime == null) {
		endTime = Date.now();
	}

	let matches = [];

	// Iterate from newest to oldest
	for (let i = this.length - 1; i >= 0; i--) {
		let item = this.get(i);
		let timestamp = item?.timestamp;

		// Skip items without a timestamp
		if (timestamp == null) {
			continue;
		}

		if (timestamp > endTime) {
			// Too new, keep looking
			continue;
		}

		if (timestamp >= startTime) {
			matches.push(item);
		} else {
			// Too old, we're done (assumes chronological order)
			break;
		}
	}

	// Reverse to get chronological order
	matches.reverse();

	return matches;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {Object}
 */
RingBuffer.setMethod(function toDry() {
	return {
		value: {
			capacity: this.capacity,
			items: this.toArray(),
		},
	};
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {Object}   value
 *
 * @return   {RingBuffer}
 */
RingBuffer.setStatic(function unDry(value) {

	let result = new RingBuffer(value.capacity);

	for (let item of value.items) {
		result.push(item);
	}

	return result;
});
