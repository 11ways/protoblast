var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Math', function() {

	describe('#toSource()', function() {
		it('should return the source code representation of the Math object', function() {
			assert.equal('Math', Math.toSource());
		});
	});

});