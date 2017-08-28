var assert = require('assert'),
    Blast;

describe('SeededRng', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new SeededRng()', function() {
		it('should return an empty deck', function() {
			var instance = new Blast.Classes.SeededRng();

			assert.equal(instance.multiplier, 1664525);
			assert.equal(typeof instance.random, 'function');
		});
	});

	describe('.random()', function() {
		it('should return the same sequence with the same seed', function() {

			var one = new Blast.Classes.SeededRng(47),
			    two = new Blast.Classes.SeededRng(47),
			    dif = new Blast.Classes.SeededRng(12);

			assert.equal(one.random(), 0.25428293691948056);
			assert.equal(two.random(), 0.25428293691948056);
			assert.equal(one.random(), two.random());

			assert.notEqual(dif.random(), 0.25428293691948056);
		});

		it('should convert numerical strings to numbers', function() {

			var nr  = new Blast.Classes.SeededRng(29),
			    str = new Blast.Classes.SeededRng('29');

			assert.equal(nr.random(), str.random());
		});

		it('should hash other type of string seeds', function() {

			var instance = new Blast.Classes.SeededRng('protoblast');

			assert.equal(instance.random(), 0.19023933447897434);
			assert.equal(instance.random(), 0.36429158761166036);
			assert.equal(instance.random(), 0.6909372718073428);
		});

		it('should be able to be JSON-DRIED', function() {

			var instance = new Blast.Classes.SeededRng('protoblast'),
			    cloned,
			    json;

			// Test first random number
			assert.equal(instance.random(), 0.19023933447897434);

			// Dry it
			json = JSON.dry(instance);

			// Make sure we got a response
			assert.equal(json.length > 10, true);

			// Revive the string
			cloned = JSON.undry(json);

			// Make sure it's the correct instance
			assert.equal(cloned.constructor.name, 'SeededRng');

			// The cloned value should pick up where the the original one left of
			assert.equal(cloned.random(), 0.36429158761166036);
		});
	});
});