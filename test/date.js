var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Date', function() {

	describe('.create()', function() {
		it('should return a new date object', function() {
			assert.equal('Date', Date.create().constructor.name);
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the date', function() {
			var d = new Date(1);
			assert.equal('(new Date(1))', d.toSource());
		});
	});

});