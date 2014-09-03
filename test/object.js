var assert = require('assert'),
    Blast;

describe('Object', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the object', function() {

			var simple = {one: 1, str: "str"},
			    complex = {
			    	json: JSON,
			    	fnc: function(){return 1;},
			    	regex: /search/i
			    };

			assert.equal('({})', ({}).toSource());
			assert.equal('({"one": 1,"str": "str"})'.replace(/"| /g, ''), simple.toSource().replace(/"| /g, ''))
			assert.equal('({"json": JSON,"fnc": (function (){return 1;}),"regex": /search/i})'.replace(/"| /g, ''), complex.toSource().replace(/"| /g, ''))
		});
	});

	describe('.isObject(obj)', function() {
		it('should return true for regular objects', function() {
			assert.equal(true, Object.isObject({}));
			assert.equal(true, Object.isObject(new Object()));
		});

		it('should return true for arrays', function() {
			assert.equal(true, Object.isObject([]));
			assert.equal(true, Object.isObject(new Array()));
		});

		it('should return true for the object form of primitives', function() {
			assert.equal(true, Object.isObject(new String()));
			assert.equal(true, Object.isObject(new Number()));
			assert.equal(true, Object.isObject(new Boolean()));
		});

		it('should return false for null', function() {
			assert.equal(false, Object.isObject(null));
		});

		it('should return false for primitives', function() {
			assert.equal(false, Object.isObject(''));
			assert.equal(false, Object.isObject(1));
			assert.equal(false, Object.isObject(true));
		});
	});

	describe('.isPlainObject(obj)', function() {
		it('should return true for plain objects', function() {

			var obj  = new Object(),
			    obj2 = {
				one: 1,
				two: 2,
				three: 3
			};

			assert.equal(true, Object.isPlainObject(obj));
			assert.equal(true, Object.isPlainObject(obj2));
		});

		it('should return false for other objects', function() {

			var arr = [],
			    str = new String(),
			    nr  = new Number();
			    testclass = function testclass(){},
			    testobj = new testclass();

			assert.equal(false, Object.isPlainObject(arr));
			assert.equal(false, Object.isPlainObject(str));
			assert.equal(false, Object.isPlainObject(nr));
			assert.equal(false, Object.isPlainObject(testobj));
		});

		it('should return false for primitives', function() {
			assert.equal(false, Object.isPlainObject(1));
			assert.equal(false, Object.isPlainObject('a'));
			assert.equal(false, Object.isPlainObject(true));
			assert.equal(false, Object.isPlainObject(undefined));
			assert.equal(false, Object.isPlainObject(null));
			assert.equal(false, Object.isPlainObject(NaN));
		});
	});

	describe('.isPrimitiveObject(obj)', function() {
		it('should return true for the object form of primitives', function() {
			assert.equal(true, Object.isPrimitiveObject(new String()));
			assert.equal(true, Object.isPrimitiveObject(new Number()));
			assert.equal(true, Object.isPrimitiveObject(new Boolean()));
		});

		it('should return false for other objects', function() {
			assert.equal(false, Object.isPrimitiveObject([]));
			assert.equal(false, Object.isPrimitiveObject({}));
		});

		it('should return false for regular primitives', function() {

			assert.equal(false, Object.isPrimitiveObject(0));
			assert.equal(false, Object.isPrimitiveObject(''));
			assert.equal(false, Object.isPrimitiveObject(false));

			assert.equal(false, Object.isPrimitiveObject(1));
			assert.equal(false, Object.isPrimitiveObject('a'));
			assert.equal(false, Object.isPrimitiveObject(true));
		});
	});

	describe('.size(variable)', function() {

		var arr = [1,2,3,4,5],
		    obj = {a: 1, b: 2, c: 3, d: 4, e: 5},
		    str = 'four',
		    nr = 22;

		it('should return an array\'s length', function() {
			assert.equal(5, Object.size(arr));
		});

		it('should count the keys inside an object', function() {
			assert.equal(5, Object.size(obj));
		});

		it('should return the length of a string', function() {
			assert.equal(4, Object.size(str));
			assert.equal(4, Object.size(new String(str)));
		});

		it('should return the value of a number', function() {
			assert.equal(22, Object.size(nr), 'Primitive numbers should return their value');
			assert.equal(22, Object.size(new Number(nr)), 'Number objects should return their value');
		});

		it('should return the value of a boolean', function() {
			assert.equal(0, Object.size(false));
			assert.equal(1, Object.size(true));

			assert.equal(0, Object.size(new Boolean(false)));
			assert.equal(1, Object.size(new Boolean(true)));
		});

		it('should return 0 for falsy values', function() {
			assert.equal(0, Object.size());
			assert.equal(0, Object.size(undefined));
			assert.equal(0, Object.size(null));
			assert.equal(0, Object.size(false));
			assert.equal(0, Object.size(''));
		});

	});

	describe('.flatten(obj)', function() {
		it('flatten an object', function() {

			var obj = {
				one: 1,
				settings: {
					two: 2,
					sub: {
						three: 3
					}
				}
			};

			assert.equal('{"one":1,"settings.two":2,"settings.sub.three":3}', JSON.stringify(Object.flatten(obj)));
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

	describe('.dissect(obj)', function() {
		it('should act like divide, but also store the key and value as properties', function() {

			var obj = {
				one: 1,
				two: 2,
			};

			assert.equal('[{"key":"one","value":1},{"key":"two","value":2}]', JSON.stringify(Object.dissect(obj)));
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