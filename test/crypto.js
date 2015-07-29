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
});