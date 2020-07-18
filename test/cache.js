var assert = require('assert'),
    Blast;

describe('Cache', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#set(key, value)', function() {
		var cache,
		    obj = {};

		before(function() {
			cache = new Blast.Classes.Develry.Cache();
		});

		it('should allow primitive keys', function() {
			assert.strictEqual(cache.length, 0);
			cache.set('alpha', 1);
			assert.strictEqual(cache.length, 1);
			cache.set(Symbol('whatever'), 1);
			assert.strictEqual(cache.length, 2);
		});

		it('should allow object keys', function() {
			cache.set(obj, 1);
			assert.strictEqual(cache.length, 3);
		});

		it('should overwrite existing keys', function() {
			cache.set('alpha', 2);
			assert.strictEqual(cache.length, 3);

			cache.set(obj, 2);
			assert.strictEqual(cache.length, 3);
		});
	});

	describe('#set(key, value, max_age)', function() {
		it('should set a value with a maximum age', function(done) {
			var cache = new Blast.Classes.Develry.Cache();

			cache.set('a', 1);
			cache.set('b', 2, 5);

			assert.deepStrictEqual(cache.keys, ['b', 'a']);

			ensureTimeout(function() {
				assert.deepStrictEqual(cache.keys, ['a']);

				done();
			}, 10);
		});

		it('should reset the `added` time', async function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('a', 1, 1);

			cache.set('a', 2);

			await Pledge.after(5);

			assert.strictEqual(cache.get('a'), 2, 'The earlier max_age should have been unset');
		});

		it('should evict entries when the cache gets too big', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.max_length = 3;

			cache.set('a', 1);
			cache.set('b', 2);
			cache.set('c', 3);

			assert.deepStrictEqual(cache.keys, ['c', 'b', 'a']);

			cache.set('d', 4);

			assert.deepStrictEqual(cache.keys, ['d', 'c', 'b']);
		});
	});

	describe('#get(key)', function() {
		it('gets a value from the cache', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('alpha', 1);
			assert.strictEqual(cache.get('alpha'), 1);
			assert.strictEqual(cache.get('nope'), undefined);

			var obj = {};

			cache.set(obj, 2);
			assert.strictEqual(cache.get(obj), 2);
		});
	});

	describe('#has(key)', function() {
		it('checks if the cache contains a value for the given key', function() {

			var cache = new Blast.Classes.Develry.Cache(),
			    obj = {};

			cache.set('alpha', 1);
			cache.set(obj, 2);

			assert.strictEqual(cache.has(obj), true);
			assert.strictEqual(cache.has('alpha'), true);
			assert.strictEqual(cache.has('test'), false);

			cache.set('falsy', false);

			assert.strictEqual(cache.has('falsy'), true);
		});
	});

	describe('#remove(key)', function() {
		it('should return undefined when key is not found', function() {

			var cache = new Blast.Classes.Develry.Cache();

			assert.strictEqual(cache.remove('doesnotexist'), undefined);
		});
	});

	describe('#evict()', function() {
		it('evicts the least used entry from the cache', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('a', 1);
			cache.set('b', 2);
			cache.set('c', 3);
			cache.set('d', 4);
			cache.set('e', 5);

			assert.strictEqual(cache.length, 5);

			cache.evict();

			assert.strictEqual(cache.length, 4);

			assert.strictEqual(cache.get('a'), undefined, 'The least used should have been evicted');

			cache.get('b');

			cache.evict();

			assert.strictEqual(cache.length, 3);

			assert.strictEqual(cache.get('c'), undefined, 'It should have evicted `c`, because `b` was most recently used');
		});
	});

	describe('#forEach(task)', function() {
		it('iterates over the values in order', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('e', 5);
			cache.set('d', 4);
			cache.set('c', 3);
			cache.set('b', 2);
			cache.set('a', 1);

			var str = '';

			cache.forEach(function (value, key) {
				str += key;
			});

			assert.strictEqual(str, 'abcde');
		});

		it('does not change the order while iterating', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('e', 5);
			cache.set('d', 4);
			cache.set('c', 3);
			cache.set('b', 2);
			cache.set('a', 1);

			var str = '';

			cache.forEach(function (value, key) {
				cache.set('e', 1);
				str += key;
			});

			assert.strictEqual(str, 'abcde');

			str = '';

			cache.forEach(function (value, key) {
				str += key;
			});

			assert.strictEqual(str, 'eabcd');
		});
	});

	describe('#keys', function() {
		it('get all keys of the cache in the current order', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('e', 5);
			cache.set('d', 4);
			cache.set('c', 3);
			cache.set('b', 2);
			cache.set('a', 1);

			var keys = cache.keys;

			assert.deepStrictEqual(keys, ['a', 'b', 'c', 'd', 'e']);

			// Create new order
			cache.set('c', 5);
			cache.set('a', 4);
			cache.set('e', 3);
			cache.set('d', 2);
			cache.set('b', 1);

			keys = cache.keys;
			assert.deepStrictEqual(keys, ['b', 'd', 'e', 'a', 'c']);
		});

		it('should skip expired keys', function(done) {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('e', 5);
			cache.set('d', 4, 1);
			cache.set('c', 3);
			cache.set('b', 2);
			cache.set('a', 1);

			let keys = cache.keys;

			assert.deepStrictEqual(keys, ['a', 'b', 'c', 'd', 'e']);

			ensureTimeout(function() {

				keys = cache.keys;

				assert.deepStrictEqual(keys, ['a', 'b', 'c', 'e']);
				done();
			}, 10);
		});

		it('should return empty array when everything is expired', function(done) {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('e', 5, 1);
			cache.set('d', 4, 1);
			cache.set('c', 3, 1);
			cache.set('b', 2, 1);
			cache.set('a', 1, 1);

			var keys = cache.keys;

			assert.deepStrictEqual(keys, ['a', 'b', 'c', 'd', 'e']);

			ensureTimeout(function checkKeys() {

				keys = cache.keys;

				assert.deepStrictEqual(keys, []);
				done();
			}, 6);
		});
	});

	describe('#values', function() {
		it('get all values of the cache in the current order', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('e', 5);
			cache.set('d', 4);
			cache.set('c', 3);
			cache.set('b', 2);
			cache.set('a', 1);

			var values = cache.values;

			assert.deepStrictEqual(values, [1, 2, 3, 4, 5]);

			// Create new order
			cache.set('c', 'C');
			cache.set('a', 'A');
			cache.set('e', 'E');
			cache.set('d', 'D');
			cache.set('b', 'B');

			values = cache.values;
			assert.deepStrictEqual(values, ['B', 'D', 'E', 'A', 'C']);
		});
	});

	describe('#newest', function() {
		it('refers to the most recently updated key', function() {
			var cache = new Blast.Classes.Develry.Cache();
			cache.set('a', 1);

			assert.strictEqual(cache.newest, 'a');

			cache.set('b', 2);
			assert.strictEqual(cache.newest, 'b');

			cache.get('a');
			assert.strictEqual(cache.newest, 'a', 'Getting a value also updates the newest');
		});
	});

	describe('#oldest', function() {
		it('refers to the least recently updated key', function() {
			var cache = new Blast.Classes.Develry.Cache();
			cache.set('a', 1);

			assert.strictEqual(cache.oldest, 'a');

			cache.set('b', 2);
			assert.strictEqual(cache.oldest, 'a');

			cache.get('a');
			assert.strictEqual(cache.oldest, 'b', 'Getting a value also updates the newest');
		});
	});

	describe('#max_length', function() {
		it('sets the maximum amount of entries the cache has', function() {

			var cache = new Blast.Classes.Develry.Cache();

			assert.strictEqual(cache.max_length, 0, 'Max length is 0 by default');

			cache.set('a', 1);
			cache.set('b', 2);
			cache.set('c', 3);
			cache.set('d', 4);
			cache.set('e', 5);

			assert.strictEqual(cache.length, 5);

			// Now set the max length
			cache.max_length = 3;

			assert.strictEqual(cache.length, 3);

			assert.strictEqual(cache.get('a'), undefined);
			assert.strictEqual(cache.get('b'), undefined);
			assert.strictEqual(cache.get('c'), 3);
			assert.strictEqual(cache.get('d'), 4);
			assert.strictEqual(cache.get('e'), 5);
		});
	});

	describe('#max_age', function() {
		it('sets the max age of each entry', function(done) {
			var cache = new Blast.Classes.Develry.Cache();

			assert.strictEqual(cache.max_age, 0, 'max_age should be 0 by default');

			cache.max_age = 1;

			assert.strictEqual(cache.max_age, 1);

			cache.set('a', 1);
			cache.set('c', 1);

			// Override the default max_age
			cache.set('b', 2, 1000);

			ensureTimeout(function() {

				assert.strictEqual(cache.get('a'), undefined, 'This entry should have expired');
				assert.strictEqual(cache.has('a'), false, 'The expired entry should not be seen as available after trying to get it');

				assert.strictEqual(cache.has('b'), true);
				assert.strictEqual(cache.get('b'), 2, 'This entry should not have expired yet');

				assert.strictEqual(cache.has('c'), false, 'The expired entry should not be seen as available even before trying to get it');
				assert.strictEqual(cache.get('c'), undefined, 'This entry should have expired');

				done();
			}, 10);
		});

		it('accepts a duration string', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.max_age = '3 seconds';

			assert.strictEqual(cache.max_age, 3 * 1000);

			cache.max_age = '3.5 seconds';
			assert.strictEqual(cache.max_age, 3.5 * 1000);

		});

		it('overrides older (but lower) values of earlier entries', async function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('a', 1);
			cache.set('b', 2, 100);
			cache.set('c', 3, 7);

			await Pledge.after(2);

			assert.strictEqual(cache.get('a'), 1);
			assert.strictEqual(cache.get('b'), 2);

			cache.max_age = 15;

			await Pledge.after(7);

			assert.strictEqual(cache.get('c'), undefined, 'This entry had a lower max_age before the global value was set');
			assert.strictEqual(cache.get('a'), 1);
			assert.strictEqual(cache.get('b'), 2);

			await Pledge.after(10);

			assert.strictEqual(cache.get('a'), undefined);
			assert.strictEqual(cache.get('b'), undefined);
		});
	});

	describe('#size', function() {
		it('returns the size of the cache', function() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('a', 1);
			cache.set('b', 1);
			cache.set('c', 1);

			// 6 references + 3 numbers + 3 key strings of 1 char = 78 bytes
			assert.strictEqual(cache.size, 78);
		});
	});

	describe('#max_size', function() {
		it('sets the maximum size of the cache', function() {

			var cache = new Blast.Classes.Develry.Cache();

			assert.strictEqual(cache.max_size, 0, 'max_size should be 0 by default');

			cache.set('a', 1);
			cache.set('b', 1);
			cache.set('c', 1);

			assert.strictEqual(cache.length, 3);

			// The cache should be 78 bytes now, so set the max size to 1 lower.
			// Now the oldest entry should have been removed
			cache.max_size = 77;

			assert.strictEqual(cache.max_size, 77);

			assert.strictEqual(cache.size, 52);
			assert.strictEqual(cache.get('a'), undefined);
			assert.strictEqual(cache.peek('b'), 1);
			assert.strictEqual(cache.length, 2);

			cache.set('d', 1);

			assert.strictEqual(cache.size, 52);
			assert.strictEqual(cache.get('b'), undefined);

			cache.set('dd', 1);

			assert.strictEqual(cache.size, 54);
			assert.strictEqual(cache.length, 2);
		});
	});

	describe('#max_idle', function() {
		it('sets the maximum time entries can stay in the cache without being accessed', async function dotest() {

			var cache = new Blast.Classes.Develry.Cache();

			cache.set('a', 1);
			cache.set('b', 1);
			cache.set('c', 1);

			// Set the max age
			cache.max_age = 40;

			assert.strictEqual(cache.max_idle, 0, 'max_idle should be 0 by default');

			// And the max idle
			cache.max_idle = 20;

			assert.strictEqual(cache.max_idle, 20);

			let now = Date.now();

			await Pledge.after(10);

			let passed = Date.now() - now;

			if (passed > 15) {
				return dotest();
			}

			assert.strictEqual(cache.get('a'), 1);

			await Pledge.after(12);

			assert.strictEqual(cache.get('a'), 1);
			assert.strictEqual(cache.get('b'), undefined);
			assert.strictEqual(cache.get('c'), undefined);

			await Pledge.after(10);

			assert.strictEqual(cache.get('a'), 1);

			await Pledge.after(12);

			assert.strictEqual(cache.get('a'), undefined, 'The max_age should have been reached by now');
		});

		it('should accept duration strings', function() {

			var cache = new Blast.Classes.Develry.Cache();

			assert.strictEqual(cache.max_idle, 0, 'max_idle should be 0 by default');

			cache.max_idle = '2 seconds';

			assert.strictEqual(cache.max_idle, 2 * 1000);
		});
	});

});