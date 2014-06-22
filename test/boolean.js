var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Boolean', function() {

	describe('#toSource()', function() {
		it('should return the source code representation of the boolean', function() {
			assert.equal('(new Boolean(true))', true.toSource());
		});
	});

});