var assert = require('assert'),
    Blast;

describe('RingBuffer', function() {

	var RingBuffer;

	before(function() {
		Blast = require('../index.js')();
		RingBuffer = Blast.Classes.Develry.RingBuffer;
	});

	describe('new RingBuffer(capacity)', function() {
		it('should return an empty ring buffer with the given capacity', function() {
			var ring = new RingBuffer(5);

			assert.strictEqual(ring.capacity, 5);
			assert.strictEqual(ring.length, 0);
		});

		it('should throw an error if capacity is less than 1', function() {
			assert.throws(function() {
				new RingBuffer(0);
			}, /capacity must be at least 1/);

			assert.throws(function() {
				new RingBuffer(-5);
			}, /capacity must be at least 1/);
		});

		it('should throw an error if capacity is not provided', function() {
			assert.throws(function() {
				new RingBuffer();
			}, /capacity must be at least 1/);
		});
	});

	describe('#push(item)', function() {
		it('should add items to the buffer', function() {
			var ring = new RingBuffer(5);

			ring.push('a');
			assert.strictEqual(ring.length, 1);

			ring.push('b');
			assert.strictEqual(ring.length, 2);
		});

		it('should return the ring buffer for chaining', function() {
			var ring = new RingBuffer(5);
			var result = ring.push('a');

			assert.strictEqual(result, ring);
		});

		it('should overwrite oldest items when full', function() {
			var ring = new RingBuffer(3);

			ring.push('a').push('b').push('c');
			assert.strictEqual(ring.length, 3);
			assert.deepStrictEqual(ring.toArray(), ['a', 'b', 'c']);

			ring.push('d');
			assert.strictEqual(ring.length, 3);
			assert.deepStrictEqual(ring.toArray(), ['b', 'c', 'd']);

			ring.push('e').push('f');
			assert.strictEqual(ring.length, 3);
			assert.deepStrictEqual(ring.toArray(), ['d', 'e', 'f']);
		});
	});

	describe('#peek()', function() {
		it('should return undefined for empty buffer', function() {
			var ring = new RingBuffer(5);
			assert.strictEqual(ring.peek(), undefined);
		});

		it('should return the most recent item without removing it', function() {
			var ring = new RingBuffer(5);

			ring.push('a');
			assert.strictEqual(ring.peek(), 'a');
			assert.strictEqual(ring.length, 1);

			ring.push('b').push('c');
			assert.strictEqual(ring.peek(), 'c');
			assert.strictEqual(ring.length, 3);
		});

		it('should return the most recent item after buffer wraps', function() {
			var ring = new RingBuffer(3);

			ring.push('a').push('b').push('c').push('d').push('e');
			assert.strictEqual(ring.peek(), 'e');
		});
	});

	describe('#peekOldest()', function() {
		it('should return undefined for empty buffer', function() {
			var ring = new RingBuffer(5);
			assert.strictEqual(ring.peekOldest(), undefined);
		});

		it('should return the oldest item without removing it', function() {
			var ring = new RingBuffer(5);

			ring.push('a');
			assert.strictEqual(ring.peekOldest(), 'a');

			ring.push('b').push('c');
			assert.strictEqual(ring.peekOldest(), 'a');
		});

		it('should return the oldest item after buffer wraps', function() {
			var ring = new RingBuffer(3);

			ring.push('a').push('b').push('c').push('d').push('e');
			assert.strictEqual(ring.peekOldest(), 'c');
		});
	});

	describe('#get(logicalIndex)', function() {
		it('should return undefined for empty buffer', function() {
			var ring = new RingBuffer(5);
			assert.strictEqual(ring.get(0), undefined);
		});

		it('should return undefined for out-of-bounds index', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b');

			assert.strictEqual(ring.get(-1), undefined);
			assert.strictEqual(ring.get(2), undefined);
			assert.strictEqual(ring.get(100), undefined);
		});

		it('should return item at logical index (0 = oldest)', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.strictEqual(ring.get(0), 'a');
			assert.strictEqual(ring.get(1), 'b');
			assert.strictEqual(ring.get(2), 'c');
		});

		it('should handle wrapped buffer correctly', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d').push('e');
			// Buffer now contains: c, d, e (oldest to newest)

			assert.strictEqual(ring.get(0), 'c');
			assert.strictEqual(ring.get(1), 'd');
			assert.strictEqual(ring.get(2), 'e');
		});

		it('should floor fractional indices', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.strictEqual(ring.get(1.9), 'b');
			assert.strictEqual(ring.get(0.1), 'a');
		});
	});

	describe('#toArray()', function() {
		it('should return empty array for empty buffer', function() {
			var ring = new RingBuffer(5);
			assert.deepStrictEqual(ring.toArray(), []);
		});

		it('should return items in chronological order (oldest first)', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.deepStrictEqual(ring.toArray(), ['a', 'b', 'c']);
		});

		it('should return correct order after buffer wraps', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d').push('e');

			assert.deepStrictEqual(ring.toArray(), ['c', 'd', 'e']);
		});

		it('should return a copy, not internal buffer', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b');

			var arr = ring.toArray();
			arr[0] = 'modified';

			assert.strictEqual(ring.get(0), 'a');
		});
	});

	describe('#getLast(n)', function() {
		it('should return empty array for empty buffer', function() {
			var ring = new RingBuffer(5);
			assert.deepStrictEqual(ring.getLast(3), []);
		});

		it('should return empty array for n <= 0', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.deepStrictEqual(ring.getLast(0), []);
			assert.deepStrictEqual(ring.getLast(-1), []);
		});

		it('should return last n items in chronological order', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c').push('d').push('e');

			assert.deepStrictEqual(ring.getLast(3), ['c', 'd', 'e']);
			assert.deepStrictEqual(ring.getLast(1), ['e']);
			assert.deepStrictEqual(ring.getLast(5), ['a', 'b', 'c', 'd', 'e']);
		});

		it('should limit to available items if n > length', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b');

			assert.deepStrictEqual(ring.getLast(10), ['a', 'b']);
		});

		it('should work correctly after buffer wraps', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d').push('e');

			assert.deepStrictEqual(ring.getLast(2), ['d', 'e']);
			assert.deepStrictEqual(ring.getLast(3), ['c', 'd', 'e']);
		});

		it('should floor fractional n values', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.deepStrictEqual(ring.getLast(2.9), ['b', 'c']);
		});

		it('should handle NaN and undefined gracefully', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.deepStrictEqual(ring.getLast(NaN), []);
			assert.deepStrictEqual(ring.getLast(undefined), []);
		});
	});

	describe('#clear()', function() {
		it('should remove all items', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			ring.clear();

			assert.strictEqual(ring.length, 0);
			assert.deepStrictEqual(ring.toArray(), []);
		});

		it('should return the ring buffer for chaining', function() {
			var ring = new RingBuffer(5);
			ring.push('a');

			var result = ring.clear();
			assert.strictEqual(result, ring);
		});

		it('should allow new items to be pushed after clearing', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c');
			ring.clear();
			ring.push('x').push('y');

			assert.deepStrictEqual(ring.toArray(), ['x', 'y']);
		});
	});

	describe('#isFull()', function() {
		it('should return false for empty buffer', function() {
			var ring = new RingBuffer(3);
			assert.strictEqual(ring.isFull(), false);
		});

		it('should return false for partially filled buffer', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b');
			assert.strictEqual(ring.isFull(), false);
		});

		it('should return true when buffer reaches capacity', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c');
			assert.strictEqual(ring.isFull(), true);
		});

		it('should remain true after buffer wraps', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d');
			assert.strictEqual(ring.isFull(), true);
		});
	});

	describe('#isEmpty()', function() {
		it('should return true for empty buffer', function() {
			var ring = new RingBuffer(3);
			assert.strictEqual(ring.isEmpty(), true);
		});

		it('should return false after pushing items', function() {
			var ring = new RingBuffer(3);
			ring.push('a');
			assert.strictEqual(ring.isEmpty(), false);
		});

		it('should return true after clearing', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b');
			ring.clear();
			assert.strictEqual(ring.isEmpty(), true);
		});
	});

	describe('#forEach(callback)', function() {
		it('should not call callback for empty buffer', function() {
			var ring = new RingBuffer(5);
			var called = false;

			ring.forEach(function() {
				called = true;
			});

			assert.strictEqual(called, false);
		});

		it('should iterate in chronological order (oldest first)', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			var items = [];
			ring.forEach(function(item) {
				items.push(item);
			});

			assert.deepStrictEqual(items, ['a', 'b', 'c']);
		});

		it('should pass item, index, and ring buffer to callback', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b');

			var calls = [];
			ring.forEach(function(item, index, rb) {
				calls.push({item: item, index: index, isRing: rb === ring});
			});

			assert.deepStrictEqual(calls, [
				{item: 'a', index: 0, isRing: true},
				{item: 'b', index: 1, isRing: true}
			]);
		});

		it('should work correctly after buffer wraps', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d').push('e');

			var items = [];
			ring.forEach(function(item) {
				items.push(item);
			});

			assert.deepStrictEqual(items, ['c', 'd', 'e']);
		});
	});

	describe('Symbol.iterator', function() {
		it('should be iterable with for...of', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			var items = [];
			for (var item of ring) {
				items.push(item);
			}

			assert.deepStrictEqual(items, ['a', 'b', 'c']);
		});

		it('should work with spread operator', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			assert.deepStrictEqual([...ring], ['a', 'b', 'c']);
		});

		it('should iterate in chronological order after buffer wraps', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d').push('e');

			assert.deepStrictEqual([...ring], ['c', 'd', 'e']);
		});
	});

	describe('#getWhileMatch(predicate)', function() {
		it('should return empty array for empty buffer', function() {
			var ring = new RingBuffer(5);
			var result = ring.getWhileMatch(function() { return true; });
			assert.deepStrictEqual(result, []);
		});

		it('should return matching items from newest, stopping when predicate fails', function() {
			var ring = new RingBuffer(5);
			ring.push(1).push(2).push(3).push(4).push(5);

			// Get items >= 3 from newest
			var result = ring.getWhileMatch(function(item) {
				return item >= 3;
			});

			assert.deepStrictEqual(result, [3, 4, 5]);
		});

		it('should return items in chronological order (oldest first)', function() {
			var ring = new RingBuffer(5);
			ring.push(10).push(20).push(30).push(40).push(50);

			var result = ring.getWhileMatch(function(item) {
				return item >= 30;
			});

			assert.deepStrictEqual(result, [30, 40, 50]);
		});

		it('should return empty array if first item fails predicate', function() {
			var ring = new RingBuffer(5);
			ring.push(1).push(2).push(3);

			var result = ring.getWhileMatch(function(item) {
				return item > 10;
			});

			assert.deepStrictEqual(result, []);
		});
	});

	describe('#getInTimeRange(startTime, endTime)', function() {
		it('should return empty array for empty buffer', function() {
			var ring = new RingBuffer(5);
			var now = Date.now();
			var result = ring.getInTimeRange(now - 1000, now);
			assert.deepStrictEqual(result, []);
		});

		it('should return items within the time range', function() {
			var ring = new RingBuffer(5);
			var now = Date.now();

			ring.push({timestamp: now - 5000, value: 'a'});
			ring.push({timestamp: now - 3000, value: 'b'});
			ring.push({timestamp: now - 1000, value: 'c'});
			ring.push({timestamp: now, value: 'd'});

			var result = ring.getInTimeRange(now - 4000, now);
			var values = result.map(function(x) { return x.value; });

			assert.deepStrictEqual(values, ['b', 'c', 'd']);
		});

		it('should use current time as default endTime', function() {
			var ring = new RingBuffer(5);
			var now = Date.now();

			ring.push({timestamp: now - 2000, value: 'a'});
			ring.push({timestamp: now - 1000, value: 'b'});
			ring.push({timestamp: now, value: 'c'});

			var result = ring.getInTimeRange(now - 1500);
			var values = result.map(function(x) { return x.value; });

			assert.deepStrictEqual(values, ['b', 'c']);
		});

		it('should skip items without timestamp property', function() {
			var ring = new RingBuffer(5);
			var now = Date.now();

			ring.push({timestamp: now - 2000, value: 'a'});
			ring.push({value: 'no-timestamp'});
			ring.push({timestamp: now - 1000, value: 'b'});
			ring.push({timestamp: now, value: 'c'});

			var result = ring.getInTimeRange(now - 3000, now);
			var values = result.map(function(x) { return x.value; });

			assert.deepStrictEqual(values, ['a', 'b', 'c']);
		});

		it('should return items in chronological order', function() {
			var ring = new RingBuffer(3);
			var now = Date.now();

			// Push more than capacity to wrap
			ring.push({timestamp: now - 5000, value: 'a'});
			ring.push({timestamp: now - 4000, value: 'b'});
			ring.push({timestamp: now - 3000, value: 'c'});
			ring.push({timestamp: now - 2000, value: 'd'});
			ring.push({timestamp: now - 1000, value: 'e'});

			var result = ring.getInTimeRange(now - 10000, now);
			var values = result.map(function(x) { return x.value; });

			assert.deepStrictEqual(values, ['c', 'd', 'e']);
		});
	});

	describe('#toDry() and RingBuffer.unDry()', function() {
		it('should serialize and deserialize correctly', function() {
			var ring = new RingBuffer(5);
			ring.push('a').push('b').push('c');

			var dried = JSON.dry(ring);
			var undried = JSON.undry(dried);

			assert.strictEqual(undried.capacity, 5);
			assert.strictEqual(undried.length, 3);
			assert.deepStrictEqual(undried.toArray(), ['a', 'b', 'c']);
		});

		it('should preserve capacity after serialization', function() {
			var ring = new RingBuffer(10);
			ring.push('a').push('b');

			var dried = JSON.dry(ring);
			var undried = JSON.undry(dried);

			assert.strictEqual(undried.capacity, 10);
		});

		it('should handle wrapped buffer correctly', function() {
			var ring = new RingBuffer(3);
			ring.push('a').push('b').push('c').push('d').push('e');

			var dried = JSON.dry(ring);
			var undried = JSON.undry(dried);

			assert.deepStrictEqual(undried.toArray(), ['c', 'd', 'e']);
			assert.strictEqual(undried.peek(), 'e');
			assert.strictEqual(undried.peekOldest(), 'c');
		});

		it('should handle empty buffer', function() {
			var ring = new RingBuffer(5);

			var dried = JSON.dry(ring);
			var undried = JSON.undry(dried);

			assert.strictEqual(undried.capacity, 5);
			assert.strictEqual(undried.length, 0);
			assert.deepStrictEqual(undried.toArray(), []);
		});

		it('should handle complex objects', function() {
			var ring = new RingBuffer(3);
			ring.push({name: 'Alice', age: 30});
			ring.push({name: 'Bob', age: 25});

			var dried = JSON.dry(ring);
			var undried = JSON.undry(dried);

			assert.deepStrictEqual(undried.toArray(), [
				{name: 'Alice', age: 30},
				{name: 'Bob', age: 25}
			]);
		});
	});

	describe('edge cases', function() {
		it('should handle capacity of 1', function() {
			var ring = new RingBuffer(1);

			ring.push('a');
			assert.deepStrictEqual(ring.toArray(), ['a']);

			ring.push('b');
			assert.deepStrictEqual(ring.toArray(), ['b']);

			ring.push('c');
			assert.deepStrictEqual(ring.toArray(), ['c']);
		});

		it('should handle null and undefined values', function() {
			var ring = new RingBuffer(5);

			ring.push(null);
			ring.push(undefined);
			ring.push('value');

			assert.strictEqual(ring.get(0), null);
			assert.strictEqual(ring.get(1), undefined);
			assert.strictEqual(ring.get(2), 'value');
		});

		it('should handle various data types', function() {
			var ring = new RingBuffer(10);
			var obj = {key: 'value'};
			var arr = [1, 2, 3];
			var fn = function() {};

			ring.push(42);
			ring.push('string');
			ring.push(true);
			ring.push(obj);
			ring.push(arr);
			ring.push(fn);

			assert.strictEqual(ring.get(0), 42);
			assert.strictEqual(ring.get(1), 'string');
			assert.strictEqual(ring.get(2), true);
			assert.strictEqual(ring.get(3), obj);
			assert.strictEqual(ring.get(4), arr);
			assert.strictEqual(ring.get(5), fn);
		});
	});
});
