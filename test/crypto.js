var assert = require('assert'),
    Blast;

describe('Crypto', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new Crypto()', function() {
		it('should return a new crypto object', function() {
			var instance = new Crypto();
		});
	});

	describe('.uid()', function() {
		it('should return a unique identifier', function() {

			var uid = Crypto.uid(),
			    pieces = uid.split('-'),
			    now = Date.now(),
			    time = parseInt(pieces[0], 36),
			    two = parseInt(pieces[1], 16),
			    three = parseInt(pieces[2], 16);

			// First part should be the date
			assert.equal((now - time) >= 0, true);
			assert.equal((now - time) < 100, true);

			// 2 last parts should be valid numbers
			assert.equal(two == two, true);
			assert.equal(three == three, true);
		});
	});

	describe('.randomBytes(bytesize)', function() {
		it('should return a buffer of the given amount of bytes', function() {

			var result = Crypto.randomBytes(4);

			assert.equal(result.length, 4);
		});

		it('should allow the use of callbacks', function(done) {
			Crypto.randomBytes(4, function(err, res) {

				if (err) {
					throw err;
				}

				assert.equal(res.length, 4);
				done();
			});
		});
	});

	describe('.randomHex(bytesize)', function() {
		it('should return a hex of the given amount of bytes', function() {

			var result = Crypto.randomHex(4);

			assert.equal(result.length, 8);
		});

		it('should allow the use of callbacks', function(done) {
			Crypto.randomHex(4, function(err, res) {

				if (err) {
					throw err;
				}

				assert.equal(res.length, 8);
				done();
			});
		});
	});

	describe('.nanoid(size)', function() {
		it('should return a nanoid of a given size', function() {
			assert.strictEqual(Crypto.nanoid(2).length, 2);
			assert.strictEqual(Crypto.nanoid(3).length, 3);
			assert.strictEqual(Crypto.nanoid(4).length, 4);
			assert.strictEqual(Crypto.nanoid(5).length, 5);
		});
	});

	describe('.createNanoidGenerator(alphabet, default_size, random)', function() {

		it('should allow setting a custom alphabet', function() {

			let generator = Crypto.createNanoidGenerator('aaaaaaaaaaaaaa');

			assert.strictEqual(generator(4), 'aaaa');
			assert.strictEqual(generator(5), 'aaaaa');
			assert.strictEqual(generator(6), 'aaaaaa');
		});

		it('should allow using another rng', function() {

			let srng = new Blast.Classes.SeededRng(47);

			let generator = Crypto.createNanoidGenerator('acdefhjkmnprtwxyz34679', 6, srng);

			assert.strictEqual(generator(2), '9m');
			assert.strictEqual(generator(3), 'tmp');
			assert.strictEqual(generator(4), 'c4pj');
			assert.strictEqual(generator(5), 'ahz9h');
			assert.strictEqual(generator(6), 'wahhk6');
			assert.strictEqual(generator(),  '4xjemz');
		});
	});
});