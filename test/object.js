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
		it('should get the value of the given property path (as a string)', function() {

			var obj = {well: {test: {property: 'one'}}};

			assert.equal('one', Object.path(obj, 'well.test.property'));
			assert.equal(undefined, Object.path(obj, 'does.not.exist'));
		});

		it('should get the value of the given property path (as an array)', function() {

			var obj = {well: {test: {property: 'one'}}};

			assert.equal('one', Object.path(obj, ['well', 'test', 'property']));
			assert.equal(undefined, Object.path(obj, ['does'], ['not'], ['exist']));
		});

		it('should get the value of the given property path (as arguments)', function() {

			var obj = {well: {test: {property: 'one'}}};

			assert.equal('one', Object.path(obj, 'well', 'test', 'property'));
			assert.equal(undefined, Object.path(obj, 'does', 'not', 'exist'));
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

	describe('.assign(target, obj1, obj2, ...)', function() {
		it('should inject objn properties into the target object', function() {

			var target = {},
			    obj1   = {one: 1, two: 2},
			    obj2   = {three: 3};

			Object.assign(target, obj1, obj2);

			assert.equal(1, target.one);
			assert.equal(3, target.three);
		});
	});

	describe('.objectify(source, recursive, value)', function() {

		it('should convert an array of objects to one object', function() {

			var arr = [{one: 1}, {two: 2}, {three: 3}, 'four']
			    convert = Object.objectify(arr);

			assert.equal(1, convert.one);
			assert.equal(3, convert.three);
			assert.equal(true, convert.four);
		});
	});

	describe('.each(obj, fnc)', function() {

		it('should execute the given function for each key-value pair', function() {

			var obj = {one: 1, two: 2, three: 3},
			    count = 0;

			Object.each(obj, function(value, key) {
				count += value;
			});

			assert.equal(6, count);
		});
	});

	describe('.map(obj, fnc)', function() {

		it('should execute the given function for each key-value pair and return the result as a new object', function() {

			var obj = {one: 1, two: 2, three: 3},
			    result;

			result = Object.map(obj, function(value, key) {
				return value * 2;
			});

			assert.equal(2, result.one);
			assert.equal(6, result.three);
		});
	});

	describe('.getValueKey(target, value)', function() {

		it('should return the key of a value in an object', function() {

			var obj = {one: 1, two: 2, three: 3};

			assert.equal('two', Object.getValueKey(obj, 2));
		});

		it('should return strict false if the key is not in the object', function() {

			var obj = {one: 1, two: 2, three: 3};

			assert.strictEqual(false, Object.getValueKey(obj, 66));
		});

		it('should return the index of a value in an array', function() {

			var arr = [47,49,2,66,33];

			assert.equal(3, Object.getValueKey(arr, 66));
		});
	});

	describe('.hasProperty(target, propertyName)', function() {

		it('should return true if the object has this property', function() {

			var obj = {one: 1, falsy: false, zero: 0, undef: undefined};

			assert.equal(true, Object.hasProperty(obj, 'one'));
			assert.equal(true, Object.hasProperty(obj, 'falsy', 'Falsy values should also be present'));
			assert.equal(true, Object.hasProperty(obj, 'zero', 'Falsy values should also be present'));
			assert.equal(true, Object.hasProperty(obj, 'undef', 'Properties with the specific "undefined" value are also true'));

			assert.equal(false, Object.hasProperty(obj, 'doesnotexist'));
		});
	});


	describe('.hasValue(target, value)', function() {

		it('should return true if the value is inside the object', function() {

			var obj = {one: 1, two: 2, three: 3};

			assert.equal(true, Object.hasValue(obj, 2));
			assert.equal(false, Object.hasValue(obj, 99));
		});

		it('should return false if the value is not inside the object', function() {
			var obj = {one: 1, two: 2, three: 3};
			assert.equal(false, Object.hasValue(obj, 99));
		});

		it('should return true if the value is inside the array', function() {

			var arr = [47,49,2,66,33];

			assert.equal(true, Object.hasValue(arr, 33));
		});
	});

});