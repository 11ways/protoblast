var assert = require('assert'),
    Blast;

describe('JSON', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the JSON object', function() {
			assert.equal('JSON', JSON.toSource());
		});
	});

});