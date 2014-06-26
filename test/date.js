var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Date', function() {

	describe('.create()', function() {
		it('should return a new date object', function() {
			assert.equal('Date', Date.create().constructor.name);
		});
	});

	describe('.isDate(variable)', function() {
		it('should return true if the argument is a date object', function() {

			var date = new Date(),
			    str  = '';
			assert.equal(true, Date.isDate(date));
			assert.equal(false, Date.isDate(str));
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the date', function() {
			var d = new Date(1);
			assert.equal('(new Date(1))', d.toSource());
		});
	});

});