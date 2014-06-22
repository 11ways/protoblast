var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Object', function() {

	describe('#toSource()', function() {
		it('should return the source code representation of the object', function() {

			var simple = {one: 1, str: "str"},
			    complex = {
			    	json: JSON,
			    	fnc: function(){return 1;},
			    	regex: /search/i
			    };

			assert.equal('({})', ({}).toSource());
			assert.equal('({"one": 1,"str": "str"})', simple.toSource())
			assert.equal('({"json": JSON,"fnc": (function (){return 1;}),"regex": /search/i})', complex.toSource())
		});
	});

	describe('.divide(obj)', function() {
		it('should create a new object for every key-value and wrap them in an array', function() {

			var obj = {
				one: 1,
				two: 2,
				three: 3
			};

			assert.equal('[{"one":1},{"two":2},{"three":3}]', JSON.stringify(Object.divide(obj)));
		});
	});

	describe('.path(obj, path)', function() {
		it('should get the value of the given property path', function() {

			var obj = {well: {test: {property: 'one'}}};

			assert.equal('one', Object.path(obj, 'well.test.property'));
			assert.equal(undefined, Object.path(obj, 'does.not.exist'));
		});
	});

	describe('.exists(obj, path)', function() {
		it('should see if the path exists inside the given object', function() {

			var obj = {well: {test: {property: 'one', undef: undefined}}};

			assert.equal(true, Object.exists(obj, 'well.test.property'));
			assert.equal(true, Object.exists(obj, 'well.test.undef', 'Keys with undefined properties should also return true'));
			assert.equal(false, Object.exists(obj, 'does.not.exist'));
		});
	});

	describe('.isEmpty(obj, includePrototype)', function() {
		it('should determine if the object is empty', function() {

			var obj = {well: {test: {property: 'one', undef: undefined}}};

			assert.equal(false, Object.isEmpty(obj));
			assert.equal(true, Object.isEmpty({}));
		});
	});

	describe('.values(obj, includePrototype)', function() {
		it('should get an array of the object values', function() {

			var obj = {
				one: 1,
				two: 2,
				three: 3
			};

			assert.equal('[1,2,3]', JSON.stringify(Object.values(obj)));
		});
	});

});