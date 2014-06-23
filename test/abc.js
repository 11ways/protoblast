var assert   = require('assert'),
    Blast    = require('../index.js'),
    blastObj = Blast(false),
    modifiedProto;

modifiedProto = !!(String.prototype.startsWith && Object.divide);

describe('Blast(false)', function() {
	it('should not modify the prototype', function() {
		assert.equal(false, modifiedProto);
	});

	it('should have returned bound functions', function() {
		var bound = !!(blastObj.Bound.String.startsWith);
		assert.equal(true, bound);
	});
});

describe('Blast()', function() {
	it('should modify prototype when no parameter is given', function() {
		assert.equal(true, !!String.prototype.startsWith);
	});
});