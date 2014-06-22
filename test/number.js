var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Number', function() {

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

});