var assert = require('assert'),
    Blast;

describe('Number', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.random(min, max)', function() {
		it('should return a random number', function() {

			var def = Number.random(),
			    dec = Number.random(0,10),
			    neg = Number.random(-10,0),
			    max = Number.random(1000);

			assert.equal(true, def > -1, 'Default should return an integer above -1');
			assert.equal(true, def < 101, 'Default should return an integer under 101');

			assert.equal(true, dec > -1, '(0,10) should return an integer above -1');
			assert.equal(true, dec < 11, '(0,10) should return an integer under 11');

			assert.equal(true, neg > -11, '(0,10) should return an integer above -11');
			assert.equal(true, neg < 1, '(0,10) should return an integer under 1');

			assert.equal(true, max > -1, '(1000) should return an integer above -1');
			assert.equal(true, max < 1001, '(1000) should return an integer under 1001');
		});
	});

	describe('.clip(value, lowest, highest)', function() {

		var valueA = 2,
		    valueB = 288,
		    valueC = 5,
		    lowest = 4,
		    highest = 10;

		it('should return the original value if it is between the margins', function() {
			assert.equal(valueC, Number.clip(valueC, lowest, highest));
		});

		it('should return `lowest` if the value is lower', function() {
			assert.equal(lowest, Number.clip(valueA, lowest, highest));
		});

		it('should return `highest` if the value is higher', function() {
			assert.equal(highest, Number.clip(valueB, lowest, highest));
		});

		it('should return `lowest` for undefined values', function() {
			assert.equal(lowest, Number.clip(undefined, lowest, highest));
		});

		it('should return `lowest` for null values', function() {
			assert.equal(lowest, Number.clip(null, lowest, highest));
		});

		it('should return `lowest` for objects', function() {
			assert.equal(lowest, Number.clip({}, lowest, highest));
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the number', function() {
			assert.equal('(new Number(5))', (5).toSource());
		});
	});

	describe('#toPaddedString()', function() {
		it('should return the string with padded zeros in the front', function() {
			assert.equal('00005', (5).toPaddedString(5));
		});
	});

	describe('#humanize(delimiter, separator)', function() {
		it('should humanize a number', function() {
			assert.equal('1,840,774.5', 1840774.5.humanize());
		});

		it('should humanize a number with given parameters', function() {
			assert.equal('1 840 774,5', 1840774.5.humanize(' ', ','));
		});
	});

	describe('#clip(lowest, highest)', function() {
		it('should call Number.clip and return the result', function() {
			assert.equal(50, (288).clip(1, 50));
		});
	});

	describe('#toByte(to)', function() {
		it('should interpret the number as bytes and convert to another byte factor', function() {
			var KiB = 1024,
			    GiB = 1073741824;

			assert.equal(1, KiB.toByte('kib'), '1024 should be 1 kib');
			assert.equal(1, GiB.toByte('gib'), 'Should be 1 gib');
			assert.equal(1.1, GiB.toByte('gb'), 'Should be 1.1 gb (not gib)');
		});
	});

	describe('#toByte(from, to)', function() {
		it('should interpret the number as given byte factor and convert to another factor', function() {
			var a = 1024,
			    b = 1073741824;

			assert.equal(1, a.toByte('b', 'kib'), '1024 should be 1 kib');
			assert.equal(1, a.toByte('gib', 'tib'), '1024 gib should be 1 tib');
			assert.equal(1, a.toByte('gb', 'tb'));
			assert.equal(1024, 1024..toByte(1, 1), 'When to is not a string, default to bytes');
		});
	});

});