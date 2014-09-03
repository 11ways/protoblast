var assert = require('assert'),
    Blast;

describe('Error', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the error', function() {
			var e = new Error('msg'),
			    src = e.toSource(),
			    begin = '(new Error("msg", ';

			assert.equal(begin, e.toSource().slice(0,18));
		});
	});

});