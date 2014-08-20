var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Number', function() {

	describe('.random(min, max)', function() {
		it('should return a random number', function() {

			var def = Number.random(),
			    dec = Number.random(0,10),
			    neg = Number.random(-10,0);

			assert.equal(true, def > -1, 'Default should return an integer above -1');
			assert.equal(true, def < 101, 'Default should return an integer under 101');

			assert.equal(true, dec > -1, '(0,10) should return an integer above -1');
			assert.equal(true, dec < 11, '(0,10) should return an integer under 11');

			assert.equal(true, neg > -11, '(0,10) should return an integer above -11');
			assert.equal(true, neg < 1, '(0,10) should return an integer under 1');
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

});