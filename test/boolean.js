var assert = require('assert'),
    Blast;

describe('Boolean', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the boolean', function() {
			assert.equal(true.toSource(), '(new Boolean(true))');
		});
	});

});