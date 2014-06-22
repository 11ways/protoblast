var assert = require('assert'),
    Blast  = require('../index.js')();

describe('JSON', function() {

	describe('#toSource()', function() {
		it('should return the source code representation of the JSON object', function() {
			assert.equal('JSON', JSON.toSource());
		});
	});

});