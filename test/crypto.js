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
});