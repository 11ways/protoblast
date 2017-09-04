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

	describe('.getPropertyDescriptor(target, key)', function() {

		var TestClass,
		    descriptor,
		    own;

		// Create the test class
		TestClass = function TestClass() {};

		// Create the descriptor
		descriptor = {
			value: function testMethod() {}
		};

		// Set some properties
		Object.defineProperty(TestClass.prototype, 'testMethod', descriptor);

		// Get the property descriptor using the native method
		own = Object.getOwnPropertyDescriptor(TestClass.prototype, 'testMethod');

		it('should return the wanted property descriptor, like native method', function() {
			var desc = Object.getPropertyDescriptor(TestClass.prototype, 'testMethod');
			assert.equal(own.value, desc.value);
		});

		it('should look for the descriptor in the prototype property if a function is given', function() {
			var desc = Object.getPropertyDescriptor(TestClass, 'testMethod');
			assert.equal(own.value, desc.value);
		});

		it('should look even further up the chain until it finds something', function() {

			var desc,
			    obj = new TestClass();

			desc = Object.getPropertyDescriptor(obj, 'testMethod');
			assert.equal(own.value, desc.value);
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

			var arr       = [],
			    date      = new Date(),
			    regex     = /r/i,
			    str       = new String(),
			    nr        = new Number();
			    testclass = function testclass(){},
			    testobj   = new testclass();

			assert.equal(Object.isPlainObject(arr),     false);
			assert.equal(Object.isPlainObject(str),     false);
			assert.equal(Object.isPlainObject(nr),      false);
			assert.equal(Object.isPlainObject(testobj), false);

			assert.equal(Object.isPlainObject(date),    false);
			assert.equal(Object.isPlainObject(regex),   false);
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

	describe('.isPrimitive(value)', function() {
		it('should return true for primitive values', function() {
			assert.equal(true, Object.isPrimitive('test'));
			assert.equal(true, Object.isPrimitive(true));
			assert.equal(true, Object.isPrimitive(1));
		});

		it('should return false for other objects', function() {
			assert.equal(false, Object.isPrimitive([]));
			assert.equal(false, Object.isPrimitive({}));
			assert.equal(false, Object.isPrimitive(new String()));
			assert.equal(false, Object.isPrimitive(new Number()));
			assert.equal(false, Object.isPrimitive(new Boolean()));
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

		it('should return the numeric value of a date', function() {
			var date = new Date(1000);
			assert.equal(1000, Object.size(date));
		});

		it('should return the length of a RegExp\'s string representation', function() {
			var regex = /myregex/i;
			assert.equal(10, Object.size(regex));
		});
	});

	describe('.alike(a, b)', function() {

		var a  = {alpha: 'alpha', b: 1},
		    b  = {alpha: 'alpha', b: 1},
		    c  = {alpha: 'alpha', b: 1, extra: true},
		    d  = {alpha: 'beta',  b: 1},
		    e  = {alpha: 'alpha', b: 1, extra: undefined},
		    f  = {b: 1, alpha: 'alpha'},
		    aa = {a: 1, ref: a},
		    ab = {a: 1, ref: b};

		it('should return true when both objects are the same reference', function() {
			assert.equal(true, Object.alike(a, a));
		});

		it('should return true when both object are identical', function() {
			assert.equal(true, Object.alike(a, b));
			assert.equal(true, Object.alike(b, a));
			assert.equal(true, Object.alike(aa, ab));
			assert.equal(true, Object.alike(ab, aa));
		});

		it('should return true when identical objects have different order', function() {
			assert.equal(true, Object.alike(a, f));
			assert.equal(true, Object.alike(f, a));
		});

		it('should return false when objects have different amount of entries', function() {
			assert.equal(false, Object.alike(a, c));
			assert.equal(false, Object.alike(c, a));
		});

		it('should return false when the values are not the same', function() {
			assert.equal(false, Object.alike(a, d));
			assert.equal(false, Object.alike(d, a));
		});

		it('should return true when the values are the same, ignoring undefined values', function() {
			assert.equal(true, Object.alike(a, e));
			assert.equal(true, Object.alike(e, a));
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

	describe('.isSelfContained(target)', function() {
		it('should return true for self contained objects', function() {

			var string = new String('a'),
			    number = new Number(1),
			    bool   = new Boolean(1),
			    regexp = /test/i,
			    date   = new Date();

			assert.equal(true, Object.isSelfContained(string));
			assert.equal(true, Object.isSelfContained(number));
			assert.equal(true, Object.isSelfContained(bool));
			assert.equal(true, Object.isSelfContained(regexp));
			assert.equal(true, Object.isSelfContained(date));

			// Primitives are also considered to be self contained
			assert.equal(true, Object.isSelfContained('string'));
			assert.equal(true, Object.isSelfContained(1));
			assert.equal(true, Object.isSelfContained(true));

			// Null is also self contained
			assert.equal(true, Object.isSelfContained(null));

			// Regular objects are not self contained
			assert.equal(false, Object.isSelfContained({}));
		});
	});

	describe('.merge(target, obj1, obj2, ...)', function() {
		it('should recursively inject objn properties into the target object', function() {

			var target = {one: {a: 1, b: 1, c: 1}},
			    obj1   = {one: {b: 2, c: 2}},
			    obj2   = {one: {c: 3}};

			Object.merge(target, obj1, obj2);

			assert.equal(1, target.one.a);
			assert.equal(2, target.one.b);
			assert.equal(3, target.one.c);
		});

		it('should handle RegExps correctly', function() {

			var target = {one: {a: 1, b: 1}},
			    obj1   = {one: {b: /r/i}};

			Object.merge(target, obj1);

			assert.equal(1, target.one.a);
			assert.equal('/r/i', target.one.b.toSource());
		});

		it('should handle Dates correctly', function() {

			var date = new Date(),
			    target = {one: {a: 1, b: 1}},
			    obj1   = {one: {b: date}};

			Object.merge(target, obj1);

			assert.equal(1, target.one.a);
			assert.equal(true, target.one.b == date);
		});

		it('should handle Dates correctly in the root', function() {

			var date = new Date(),
			    target = {},
			    obj1   = {a: date};

			Object.merge(target, obj1);

			assert.equal(true, target.a == date);
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

	describe('.first()', function() {
		it('should return the first value it sees in the object', function() {
			assert.equal(47, Object.first({a: 47}));
		});

		it('should return index 0 of an array', function() {
			assert.equal(55, Object.first([55, 23]));
		});

		it('should return the object itself if it is empty', function() {
			var a = {};
			assert.equal(a, Object.first(a));
		})
	});

	// Everytime something changes to the checksum algorithm,
	// these will have to be updated
	describe('.checksum(obj)', function() {

		it('should checksum strings', function() {
			assert.equal(Object.checksum('this is a string'), 'S16-1jtzwzb16ayzzy');
		});

		it('should prevent certain crc32 collisions', function() {

			var plumless = Object.checksum('plumless'),
			    buckeroo = Object.checksum('buckeroo');

			assert.equal(plumless, 'S8-ih5e8qnphp9e');
			assert.equal(buckeroo, 'S8-e48f7xl4l4hb');
		});

		it('split strings in two, but unevenly', function() {

			var collisiontesta = 'plumlessplumless',
			    collisiontestb = 'buckeroobuckeroo';

			assert.equal(Object.checksum(collisiontesta), 'S16-sb4hmd26lb02');
			assert.equal(Object.checksum(collisiontestb), 'S16-sb4hm1leshhz');
		});

		it('checksums objects', function() {
			assert.equal(Object.checksum({a: 1}), 'O1-S3-1skjwarew80jg');
		});

		it('should ignore property order in regular objects', function() {
			assert.equal(Object.checksum({b: 1, a: 1}), Object.checksum({a: 1, b: 1}));
		});

		it('also ignored order in arrays', function() {
			assert.equal(Object.checksum([1, 2]), Object.checksum([2, 1]));
		});

		it('handles recursive objects', function() {

			var a = {
				a: 1
			};

			a.b = a;

			assert.notEqual(Object.checksum(a), Object.checksum({a: 1}));
		});
	});

});