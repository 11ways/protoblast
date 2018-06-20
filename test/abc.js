var assert   = require('assert');

describe('Blast(false)', function() {

	var Blast    = require('../index.js'),
	    blastObj,
	    modifiedProto;

	Blast.unit_test = true;

	blastObj = Blast(false);

	modifiedProto = !!(String.prototype.startsWith && Object.divide);

	it('should not modify the prototype', function() {
		assert.equal(modifiedProto, false);
	});

	it('should have returned bound functions', function() {
		var bound = !!(blastObj.Bound.String.startsWith);
		assert.equal(bound, true);
	});
});

describe('Blast()', function() {

	var Blast;

	it('should apply changes without throwing an error', function() {
		Blast = require('../index.js');
		Blast.unit_test = true;
		Blast = Blast();
	});

	it('should modify prototype when no parameter is given', function() {
		assert.equal(!!String.prototype.startsWith, true);
	});
});