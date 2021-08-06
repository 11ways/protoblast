var assert = require('assert'),
    Blast;

describe('Decorators', function() {

	var MemoOne;

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('Decorators.memoize({max_age: 20})', function() {

		this.slow(100);

		before(function() {
			let decorator = Blast.Decorators.memoize({
				max_age : 20
			});

			MemoOne = Function.inherits('Informer', function MemoOne() {});

			MemoOne.decorateMethod(decorator, function testMaxAge(a) {
				return Date.now();
			});
		});

		it('caches results for the max_age amount of time', function doTest(done) {

			let start = Date.now();

			let instance = new MemoOne(),
			    first    = instance.testMaxAge(1);

			// Wait at least 4ms
			setTimeout(function() {

				let diff = Date.now() - start;

				if (diff > 15) {
					// Too much time passed, try again!
					return doTest(done);
				}

				let second = instance.testMaxAge(1),
				    different = instance.testMaxAge(2);

				assert.strictEqual(first, second, 'Method calls with the same arguments should return identical value');
				assert.notStrictEqual(different, second, 'Method call with different argument should return new value');

				setTimeout(function() {
					let third = instance.testMaxAge(1);

					assert.notStrictEqual(third, first, 'Method call after max_age amount of time should return new value');
					done();
				}, 21);
			}, 4);
		});

		it('has separate cache per instance', function doTest(done) {

			let start = Date.now();

			let instance_a = new MemoOne(),
			    instance_b = new MemoOne(),
			    first_a    = instance_a.testMaxAge(1);

			// Wait at least 4ms
			setTimeout(function() {

				let diff = Date.now() - start;

				if (diff > 15) {
					// Too much time passed, try again!
					return doTest(done);
				}

				let first_b = instance_b.testMaxAge(1);

				assert.notStrictEqual(first_b, first_a, 'Each instance should have a separate cache');
				done();
			}, 4);
		});
	});

	describe('Decorators.memoize({static: true})', function() {

		before(function() {
			let decorator = Blast.Decorators.memoize({
				max_age   : 6,
				static    : true,
				cache_key : 'cache'
			});

			let c = 0;

			MemoOne.decorateMethod(decorator, function staticCount(a) {
				return ++c;
			});
		});

		it('creates a cache that is shared over all instances', function(done) {

			var instance_a = new MemoOne(),
			    instance_b = new MemoOne();

			assert.strictEqual(instance_a.staticCount(), 1);
			assert.strictEqual(instance_a.staticCount(), 1);
			assert.strictEqual(instance_b.staticCount(), 1);

			setTimeout(function() {

				let b = instance_b.staticCount(),
				    a = instance_a.staticCount();

				assert.strictEqual(b, 2, 'Call after max_age has passed returned value `' + b + '`, but `2` is expected');
				assert.strictEqual(a, 2, 'Call after max_age has passed returned value `' + a + '`, but `2` is expected');

				// Reset the static cache
				MemoOne.cache.reset();

				assert.strictEqual(instance_b.staticCount(), 3);
				assert.strictEqual(instance_a.staticCount(), 3);

				done();
			}, 15);
		});
	});

	describe('Decorators.memoize({ignore_callbacks: true})', function() {

		before(function() {
			let decorator = Blast.Decorators.memoize({
				max_age          : 6,
				ignore_callbacks : true
			});

			let c = 0;

			MemoOne.decorateMethod(decorator, function ignoreCallback(a, callback) {
				callback(null, ++c);
			});
		});

		it('does not include callbacks in the checksum key', function doTest(done) {

			var instance = new MemoOne();

			instance.ignoreCallback(0, function done(err, res) {
				assert.strictEqual(res, 1);
			});

			// Second call will callback with the same, cached value
			instance.ignoreCallback(0, function done(err, res) {
				assert.strictEqual(res, 1);
			});

			setTimeout(function() {

				instance.ignoreCallback(0, function _done(err, res) {
					assert.strictEqual(res, 2, 'Received value of `' + res + '`, but `2` was expected after max_age elapsed');

					instance.ignoreCallback(0, function _done(err, res) {
						assert.strictEqual(res, 2, 'Received value of `' + res + '`, but `2` was expected');
						done();
					});
				});

			}, 10);
		});
	});
});