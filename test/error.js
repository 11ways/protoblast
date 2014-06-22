var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Error', function() {

	describe('#toSource()', function() {
		it('should return the source code representation of the error', function() {
			var e = new Error('msg');
			assert.equal('(new Error("msg", undefined, undefined))', e.toSource());
		});
	});

});