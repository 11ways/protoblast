var assert = require('assert'),
    Blast;

describe('Object', function() {

	before(function() {
		Blast = require('../index.js');
		Blast.unit_test = true;
		Blast = Blast();
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
			expectEqual(true, Object.isObject({}));
			expectEqual(true, Object.isObject(new Object()));
		});

		it('should return true for arrays', function() {
			expectEqual(true, Object.isObject([]));
			expectEqual(true, Object.isObject(new Array()));
		});

		it('should return true for the object form of primitives', function() {
			expectEqual(true, Object.isObject(new String()));
			expectEqual(true, Object.isObject(new Number()));
			expectEqual(true, Object.isObject(new Boolean()));
		});

		it('should return false for null', function() {
			expectEqual(false, Object.isObject(null));
		});

		it('should return false for primitives', function() {
			expectEqual(false, Object.isObject(''));
			expectEqual(false, Object.isObject(1));
			expectEqual(false, Object.isObject(true));
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

			expectEqual(true, Object.isPlainObject(obj));
			expectEqual(true, Object.isPlainObject(obj2));
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
			expectEqual(false, Object.isPlainObject(1));
			expectEqual(false, Object.isPlainObject('a'));
			expectEqual(false, Object.isPlainObject(true));
			expectEqual(false, Object.isPlainObject(undefined));
			expectEqual(false, Object.isPlainObject(null));
			expectEqual(false, Object.isPlainObject(NaN));
		});
	});

	describe('.isPrimitiveObject(obj)', function() {
		it('should return true for the object form of primitives', function() {
			expectEqual(true, Object.isPrimitiveObject(new String()));
			expectEqual(true, Object.isPrimitiveObject(new Number()));
			expectEqual(true, Object.isPrimitiveObject(new Boolean()));
		});

		it('should return false for other objects', function() {
			expectEqual(false, Object.isPrimitiveObject([]));
			expectEqual(false, Object.isPrimitiveObject({}));
		});

		it('should return false for regular primitives', function() {

			expectEqual(false, Object.isPrimitiveObject(0));
			expectEqual(false, Object.isPrimitiveObject(''));
			expectEqual(false, Object.isPrimitiveObject(false));

			expectEqual(false, Object.isPrimitiveObject(1));
			expectEqual(false, Object.isPrimitiveObject('a'));
			expectEqual(false, Object.isPrimitiveObject(true));
		});
	});

	describe('.isPrimitive(value)', function() {
		it('should return true for primitive values', function() {
			assert.equal(Object.isPrimitive('test'), true);
			assert.equal(Object.isPrimitive(true), true);
			assert.equal(Object.isPrimitive(1), true);
			assert.equal(Object.isPrimitive(null), true);
			assert.equal(Object.isPrimitive(undefined), true);
			assert.equal(Object.isPrimitive(Symbol('bla')), true);
			assert.equal(Object.isPrimitive(1n), true);
		});

		it('should return false for other objects', function() {
			assert.equal(Object.isPrimitive([]), false);
			assert.equal(Object.isPrimitive({}), false);
			assert.equal(Object.isPrimitive(new String()), false);
			assert.equal(Object.isPrimitive(new Number()), false);
			assert.equal(Object.isPrimitive(new Boolean()), false);
		});
	});

	describe('.stringifyPrimitive(value)', function() {
		it('should return the string for useful primitives', function() {
			assert.equal(Object.stringifyPrimitive('test'), 'test');
			assert.equal(Object.stringifyPrimitive(1), '1');
			assert.equal(Object.stringifyPrimitive(10n), '10');
			assert.equal(Object.stringifyPrimitive(true), 'true');
			assert.equal(Object.stringifyPrimitive(false), 'false');
			assert.equal(Object.stringifyPrimitive(null), '');
			assert.equal(Object.stringifyPrimitive(undefined), '');
			assert.equal(Object.stringifyPrimitive({}), '');
		});
	});

	describe('.size(variable)', function() {

		var arr = [1,2,3,4,5],
		    obj = {a: 1, b: 2, c: 3, d: 4, e: 5},
		    str = 'four',
		    nr = 22;

		it('should return an array\'s length', function() {
			expectEqual(5, Object.size(arr));
		});

		it('should count the keys inside an object', function() {
			expectEqual(5, Object.size(obj));
		});

		it('should return the length of a string', function() {
			expectEqual(4, Object.size(str));
			expectEqual(4, Object.size(new String(str)));
		});

		it('should return the value of a number', function() {
			expectEqual(22, Object.size(nr), 'Primitive numbers should return their value');
			expectEqual(22, Object.size(new Number(nr)), 'Number objects should return their value');
		});

		it('should return the value of a boolean', function() {
			expectEqual(0, Object.size(false));
			expectEqual(1, Object.size(true));

			expectEqual(0, Object.size(new Boolean(false)));
			expectEqual(1, Object.size(new Boolean(true)));
		});

		it('should return 0 for falsy values', function() {
			expectEqual(0, Object.size());
			expectEqual(0, Object.size(undefined));
			expectEqual(0, Object.size(null));
			expectEqual(0, Object.size(false));
			expectEqual(0, Object.size(''));
		});

		it('should return the numeric value of a date', function() {
			var date = new Date(1000);
			expectEqual(1000, Object.size(date));
		});

		it('should return the length of a RegExp\'s string representation', function() {
			var regex = /myregex/i;
			expectEqual(10, Object.size(regex));
		});
	});

	describe('.sizeof(input)', function() {
		it('should calculate the size of an object in bytes', function() {

			var input = {
				a: 1,
				b: '2'
			};

			let bytes = Object.sizeof(input);

			assert.strictEqual(bytes, 30);

			input.c = null;

			bytes = Object.sizeof(input);

			assert.strictEqual(bytes, 40);
		});

		it('should return 0 for null values', function() {
			assert.strictEqual(Object.sizeof(null), 0);
		});

		it('should return the size of a string in bytes', function() {
			assert.strictEqual(Object.sizeof('abc'), 6);
		});

		it('should return the size of a number in bytes', function() {
			assert.strictEqual(Object.sizeof(0), 8);
			assert.strictEqual(Object.sizeof(100), 8);
			assert.strictEqual(Object.sizeof(474758315), 8);
		});

		it('should return the size of a symbol in bytes', function() {
			assert.strictEqual(Object.sizeof(Symbol('test')), 8);
		});

		it('should return the size of an array in bytes', function() {
			assert.strictEqual(Object.sizeof([]), 0);
			assert.strictEqual(Object.sizeof([1]), 16);
			assert.strictEqual(Object.sizeof(['1']), 10);
		});

		it('should return the size of a Date object', function() {
			assert.strictEqual(Object.sizeof(new Date()), 96);
		});

		it('should return the size of a RegExp object', function() {
			assert.strictEqual(Object.sizeof(/testing/i), 30);
		});

		if (typeof window == 'undefined') {
			it('should return the size of a buffer', function() {

				var buf = Buffer.from('abc');

				assert.strictEqual(Object.sizeof(buf), buf.length);
			});
		}

		it('should return the size of a map', function() {

			var map = new Map(),
			    obj = {};

			map.set('a', 1);
			map.set('b', true);

			obj.a = 1;
			obj.b = true;

			assert.strictEqual(Object.sizeof(map), 48);
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
			expectEqual(true, Object.alike(a, a));
		});

		it('should return true when both object are identical', function() {
			expectEqual(true, Object.alike(a, b));
			expectEqual(true, Object.alike(b, a));
			expectEqual(true, Object.alike(aa, ab));
			expectEqual(true, Object.alike(ab, aa));
		});

		it('should return true when identical objects have different order', function() {
			expectEqual(true, Object.alike(a, f));
			expectEqual(true, Object.alike(f, a));
		});

		it('should return false when objects have different amount of entries', function() {
			expectEqual(false, Object.alike(a, c));
			expectEqual(false, Object.alike(c, a));
		});

		it('should return false when the values are not the same', function() {
			expectEqual(false, Object.alike(a, d));
			expectEqual(false, Object.alike(d, a));
		});

		it('should return true when the values are the same, ignoring undefined values', function() {
			expectEqual(true, Object.alike(a, e));
			expectEqual(true, Object.alike(e, a));
		});

		it('should handle recursive objects', function() {

			var a = {};
			var b = {};
			var c = {};

			c.a = c;
			c.b = a;
			c.c = a;

			a.a = b;
			a.b = b;
			a.c = c;

			b.a = c;
			b.b = b;
			b.c = a;

			// Even though these are all empty objects,
			// they are not alike because of the recursiveness
			assert.equal(Object.alike(a, b), false);
		});

		it('should handle buffers', function() {

			var a = new Buffer([1,2,3]),
			    b = new Buffer([1,2,3]);

			assert.strictEqual(Object.alike(a, b), true);
		});

		it('should not sort arrays by default', function() {

			var a = ['a', 'b', 'c'],
			    b = ['c', 'b', 'a'];

			assert.strictEqual(Object.alike(a, b), false);
		});

		it('should not compare null & regular objects', function() {

			var a, b;

			a = {
				contents: {
					test: undefined
				}
			};

			b = {
				contents: null
			};

			assert.strictEqual(Object.alike(a, b), false);
		});

		it('should use methods with the Blast.alikeSymbol name', function() {

			var a = {z: 1},
			    b = {z: 1};

			a[Blast.alikeSymbol] = b[Blast.alikeSymbol] = function alike(other, seen) {
				return Object.alike(this.$main, other.$main, seen);
			};

			a.$main = {x: 1, ref: a};
			b.$main = {x: 1, ref: b};

			assert.strictEqual(Object.alike(a, b), true);
		});

		it('should use `equals` method', function() {

			let a = {
				value: 'a',
			};

			let b = {
				value: 'b',
			};

			assert.notStrictEqual(a, b);

			assert.strictEqual(Object.alike(a, b), false);

			let a_clone = {value: 'a'};
			let b_clone = {value: 'b'};

			function bEquals(other) {
				return other?.value == 'b';
			}

			assert.strictEqual(Object.alike(a, a_clone), true);
			a.equals = bEquals;
			assert.strictEqual(Object.alike(a, a_clone), false);

			let a_string = 'a';

			function stringEquals(other) {
				return other == 'a';
			}

			assert.strictEqual(Object.alike(a_string, 'a'), true);
			a_clone.equals = stringEquals;
			assert.strictEqual(Object.alike(a_clone, 'a'), true);
			assert.strictEqual(Object.alike('a', a_clone), true);

		});
	});

	describe('.flatten(obj, divider)', function() {
		var obj = {
			one: 1,
			settings: {
				two: 2,
				sub: {
					three: 3,
					sub: {
						four: 4
					}
				}
			}
		};

		it('flattens an object with a . divider by default', function() {

			var result = {
				'one'                   : 1,
				'settings.two'          : 2,
				'settings.sub.three'    : 3,
				'settings.sub.sub.four' : 4
			};

			assert.deepEqual(Object.flatten(obj), result);
		});

		it('flattens an object with a given divider', function() {
			var result = {
				'one'                   : 1,
				'settings»two'          : 2,
				'settings»sub»three'    : 3,
				'settings»sub»sub»four' : 4
			};

			assert.deepEqual(Object.flatten(obj, '»'), result);
		});

		it('flattens an object with an array as divider option', function() {

			var result = {
				'one'                      : 1,
				'settings[two]'            : 2,
				'settings[sub][three]'     : 3,
				'settings[sub][sub][four]' : 4
			};

			assert.deepEqual(Object.flatten(obj, ['[', ']']), result, 'Properties should be encased in []');
		});

		it('flattens arrays', function() {

			var obj_with_array = {
				a: ['b', 'c', 'd']
			};

			var result = {
				'a[0]'  : 'b',
				'a[1]'  : 'c',
				'a[2]'  : 'd'
			};

			assert.deepEqual(Object.flatten(obj_with_array, ['[', ']']), result);
		});

		it('should not flatten arrays when not wanted', function() {


			var data = {
				"settings": {
					"basic_auth": [
						"my:pass"
					],
					"script": "/media/bridge/projects/develry/develry/server.js",
					"user": null,
					"node": null,
					"environment_variables": [
						{}
					]
				},
				"domain": [
					{
						"listen_on": [
							"192.168.1.2"
						],
						"hostname": [
							"my.hostname.be"
						],
						"headers": [
							{
								"name": "test",
								"value": "test-value"
							}
						]
					}
				]
			};

			var expected = {
				"settings.basic_auth": ["my:pass"],
				"settings.script": "/media/bridge/projects/develry/develry/server.js",
				"settings.user": null,
				"settings.node": null,
				"settings.environment_variables": [{}],
				"domain": [
					{
						"listen_on": ["192.168.1.2"],
						"hostname": ["my.hostname.be"],
						"headers": [
							{
								"name": "test",
								"value": "test-value"
							}
						]
					}
				]
			};

			assert.deepEqual(Object.flatten(data, null, false), expected);
		});
	});

	describe('.divide(obj)', function() {
		it('should create a new object for every key-value and wrap them in an array', function() {

			var obj = {
				one: 1,
				two: 2,
				three: 3
			};

			var result = [{"one":1},{"two":2},{"three":3}];

			assert.deepEqual(Object.divide(obj), result);
		});
	});

	describe('.dissect(obj)', function() {
		it('should act like divide, but also store the key and value as properties', function() {

			var obj = {
				one: 1,
				two: 2,
			};

			var result = [{"key":"one","value":1},{"key":"two","value":2}];

			assert.deepEqual(Object.dissect(obj), result);
		});
	});

	describe('.setPath(obj, path, value)', function() {
		it('sets the value in an object', function() {
			var obj = Object.setPath({}, 'well.test.property', 'one');

			assert.deepEqual(obj, {well: {test: {property: 'one'}}});
		});

		it('should not set things in the prototype', function() {
			var test = Object.setPath({}, 'not.__proto__.in_here_please', 'WRONG', null, false),
			    obj = {};

			assert.equal(obj.in_here_please, undefined);
		});
	});

	describe('.path(obj, path)', function() {
		it('should get the value of the given property path (as a string)', function() {

			var obj = {well: {test: {property: 'one'}}};

			expectEqual('one', Object.path(obj, 'well.test.property'));
			expectEqual(undefined, Object.path(obj, 'does.not.exist'));
		});

		it('should get the value of the given property path (as an array)', function() {

			var obj = {well: {test: {property: 'one'}}};

			expectEqual('one', Object.path(obj, ['well', 'test', 'property']));
			expectEqual(undefined, Object.path(obj, ['does'], ['not'], ['exist']));
		});

		it('should get the value of the given property path (as arguments)', function() {

			var obj = {well: {test: {property: 'one'}}};

			expectEqual('one', Object.path(obj, 'well', 'test', 'property'));
			expectEqual(undefined, Object.path(obj, 'does', 'not', 'exist'));
		});
	});

	describe('.path(BLAST.PATH_AGGREGATE, obj, path)', function() {
		it('should aggregate values in an array', function() {

			var obj = {
				a: {
					b: {
						c: [
							{d: 1},
							{d: 2},
							{d: 3}
						]
					}
				}
			};

			let result = Object.path(Blast.PATH_AGGREGATE, obj, 'a.b.c.d');

			assert.deepStrictEqual(result, [1, 2, 3]);
		});
	});

	describe('.exists(obj, path)', function() {
		it('should see if the path exists inside the given object', function() {

			var obj = {well: {test: {property: 'one', undef: undefined}}};

			assert.equal(Object.exists(obj, 'well.test.property'), true);
			assert.equal(Object.exists(obj, 'well.test.undef'),    true, 'Keys with undefined properties should also return true');
			assert.equal(Object.exists(obj, 'does.not.exist'),     false);
		});
	});

	describe('.isEmpty(obj, includePrototype)', function() {
		it('should determine if the object is empty', function() {

			var obj = {well: {test: {property: 'one', undef: undefined}}};

			expectEqual(false, Object.isEmpty(obj));
			expectEqual(true, Object.isEmpty({}));
		});
	});

	describe('.assign(target, obj1, obj2, ...)', function() {
		it('should inject objn properties into the target object', function() {

			var target = {},
			    obj1   = {one: 1, two: 2},
			    obj2   = {three: 3};

			Object.assign(target, obj1, obj2);

			expectEqual(1, target.one);
			expectEqual(3, target.three);
		});
	});

	describe('.isSelfContained(target)', function() {
		it('should return true for self contained objects', function() {

			var string = new String('a'),
			    number = new Number(1),
			    bool   = new Boolean(1),
			    regexp = /test/i,
			    date   = new Date();

			expectEqual(true, Object.isSelfContained(string));
			expectEqual(true, Object.isSelfContained(number));
			expectEqual(true, Object.isSelfContained(bool));
			expectEqual(true, Object.isSelfContained(regexp));
			expectEqual(true, Object.isSelfContained(date));

			// Primitives are also considered to be self contained
			expectEqual(true, Object.isSelfContained('string'));
			expectEqual(true, Object.isSelfContained(1));
			expectEqual(true, Object.isSelfContained(true));

			// Null is also self contained
			expectEqual(true, Object.isSelfContained(null));

			// Regular objects are not self contained
			expectEqual(false, Object.isSelfContained({}));
		});
	});

	describe('.merge(target, obj1, obj2, ...)', function() {
		it('should recursively inject objn properties into the target object', function() {

			var target = {one: {a: 1, b: 1, c: 1}},
			    obj1   = {one: {b: 2, c: 2}},
			    obj2   = {one: {c: 3}};

			Object.merge(target, obj1, obj2);

			expectEqual(1, target.one.a);
			expectEqual(2, target.one.b);
			expectEqual(3, target.one.c);
		});

		it('should handle RegExps correctly', function() {

			var target = {one: {a: 1, b: 1}},
			    obj1   = {one: {b: /r/i}};

			Object.merge(target, obj1);

			expectEqual(1, target.one.a);
			expectEqual('/r/i', target.one.b.toString());
		});

		it('should handle Dates correctly', function() {

			var date = new Date(),
			    target = {one: {a: 1, b: 1}},
			    obj1   = {one: {b: date}};

			Object.merge(target, obj1);

			expectEqual(1, target.one.a);
			expectEqual(true, target.one.b == date);
		});

		it('should handle Dates correctly in the root', function() {

			var date = new Date(),
			    target = {},
			    obj1   = {a: date};

			Object.merge(target, obj1);

			expectEqual(true, target.a == date);
		});

		it('should protect against malicious payloads', function() {

			var malicious_payload = '{"__proto__":{"oops":"It works !"}}',
			    a = {};

			// Before parsing anything oops is undefined
			assert.equal(a.oops, undefined);

			// Assign the malicious payload
			Object.merge({}, JSON.parse(malicious_payload));

			assert.equal(a.oops, undefined);
		});
	});

	describe('.objectify(source, recursive, value)', function() {

		it('should convert an array of objects to one object', function() {

			var arr = [{one: 1}, {two: 2}, {three: 3}, 'four']
			    convert = Object.objectify(arr);

			expectEqual(1, convert.one);
			expectEqual(3, convert.three);
			expectEqual(true, convert.four);
		});
	});

	describe('.each(obj, fnc)', function() {

		it('should execute the given function for each key-value pair', function() {

			var obj = {one: 1, two: 2, three: 3},
			    count = 0;

			Object.each(obj, function(value, key) {
				count += value;
			});

			expectEqual(6, count);
		});
	});

	describe('.map(obj, fnc)', function() {

		it('should execute the given function for each key-value pair and return the result as a new object', function() {

			var obj = {one: 1, two: 2, three: 3},
			    result;

			result = Object.map(obj, function(value, key) {
				return value * 2;
			});

			expectEqual(2, result.one);
			expectEqual(6, result.three);
		});
	});

	describe('.getValueKey(target, value)', function() {

		it('should return the key of a value in an object', function() {

			var obj = {one: 1, two: 2, three: 3};

			expectEqual('two', Object.getValueKey(obj, 2));
		});

		it('should return strict false if the key is not in the object', function() {

			var obj = {one: 1, two: 2, three: 3};

			expectEqual(false, Object.getValueKey(obj, 66));
		});

		it('should return the index of a value in an array', function() {

			var arr = [47,49,2,66,33];

			expectEqual(3, Object.getValueKey(arr, 66));
		});
	});

	describe('.hasProperty(target, propertyName)', function() {

		it('should return true if the object has this property', function() {

			var obj = {one: 1, falsy: false, zero: 0, undef: undefined};

			expectEqual(true, Object.hasProperty(obj, 'one'));
			expectEqual(true, Object.hasProperty(obj, 'falsy', 'Falsy values should also be present'));
			expectEqual(true, Object.hasProperty(obj, 'zero', 'Falsy values should also be present'));
			expectEqual(true, Object.hasProperty(obj, 'undef', 'Properties with the specific "undefined" value are also true'));

			expectEqual(false, Object.hasProperty(obj, 'doesnotexist'));
		});
	});

	describe('.hasValue(target, value)', function() {

		it('should return true if the value is inside the object', function() {

			var obj = {one: 1, two: 2, three: 3};

			expectEqual(true, Object.hasValue(obj, 2));
			expectEqual(false, Object.hasValue(obj, 99));
		});

		it('should return false if the value is not inside the object', function() {
			var obj = {one: 1, two: 2, three: 3};
			expectEqual(false, Object.hasValue(obj, 99));
		});

		it('should return true if the value is inside the array', function() {

			var arr = [47,49,2,66,33];

			expectEqual(true, Object.hasValue(arr, 33));
		});
	});

	describe('.first()', function() {
		it('should return the first value it sees in the object', function() {
			assert.equal(Object.first({a: 47}), 47);
		});

		it('should return index 0 of an array', function() {
			assert.equal(Object.first([55, 23]), 55);
		});

		it('should return undefined if the object is empty', function() {
			assert.equal(Object.first({}), undefined);
			assert.equal(Object.first([]), undefined);
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

		it('should ignore property order in regular objects by default', function() {
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

		it('should differentiate between dates & numbers', function() {

			var date = new Date(),
			    nr = Number(date);

			let date_cs = Object.checksum(date);
			let nr_cs = Object.checksum(nr);

			assert.notStrictEqual(date_cs, nr_cs);
			assert.strictEqual(date_cs, 'D' + nr);
			assert.strictEqual(nr_cs, 'N' + nr);
		});

		it('should work with cached string checksums', function() {

			let id_one = '633c63c665a21a06269129f0',
				id_two = '634051edc2dc82c5e6b65a32';
			
			let obj_one = {conditions: {_id: id_one}},
				obj_two = {conditions: {_id: id_two}};
			
			let checksum_one = Object.checksum(obj_one),
				checksum_two = Object.checksum(obj_two);
			
			assert.notStrictEqual(checksum_one, checksum_two);

			assert.strictEqual(checksum_one, 'O1-S32-af8jdd3d0l6u');
			assert.strictEqual(checksum_two, 'O1-S31-1uok79j1xv7hho');
		});

		it('should checksum class instances', () => {

			let local_date = Blast.Classes.Develry.LocalDate.create('2023-10-01');
			let checksum_local_date = Object.checksum(local_date);
			
			assert.notStrictEqual(Object.checksum(Blast.Classes.Develry.LocalDate.create('2023-10-02')), checksum_local_date);
			assert.strictEqual(Object.checksum(Blast.Classes.Develry.LocalDate.create('2023-10-01')), checksum_local_date);

			assert.notStrictEqual(
				Object.checksum(Blast.Classes.Develry.LocalDate.create('2023-10-02')),
				Object.checksum(Blast.Classes.Develry.LocalDateTime.create('2023-10-02'))
			);

			let ChecksumTestA = Function.inherits(null, function ChecksumTestA() {});
			let ChecksumTestB = Function.inherits(null, function ChecksumTestB() {});

			let a = new ChecksumTestA();
			let b = new ChecksumTestB();
			let a2 = new ChecksumTestA();

			let checksum_a = Object.checksum(a);
			let checksum_b = Object.checksum(b);

			assert.notStrictEqual(checksum_a, checksum_b);

			a.test = 1;

			let property_checksum = Object.checksum(a);

			// The checksum should be different BECAUSE the class has no
			// `valueOf` or `toDry` or `toJSON` method.
			assert.notStrictEqual(property_checksum, checksum_a);
			assert.notStrictEqual(Object.checksum(a2), property_checksum);

			ChecksumTestA.setMethod(function toJSON() {
				return {};
			});

			let json_checksum = Object.checksum(a);

			assert.notStrictEqual(json_checksum, property_checksum);
			assert.notStrictEqual(json_checksum, checksum_a);

			// Even though the 2 instances have different properties,
			// they have the same checksum because the toJSON method
			// ignores extra attached properties.
			assert.strictEqual(Object.checksum(a), Object.checksum(a2));

			let url_1 = RURL.parse('/'),
			    url_2 = RURL.parse('/?test=1');

			assert.notStrictEqual(Object.checksum(url_1), Object.checksum(url_2));

			let set_1 = new Set(),
			    set_2 = new Set();

			assert.strictEqual(Object.checksum(set_1), Object.checksum(set_2));

			set_1.add(1);

			assert.notStrictEqual(Object.checksum(set_1), Object.checksum(set_2));

			set_2.add(1);

			assert.strictEqual(Object.checksum(set_1), Object.checksum(set_2));

			let map_1 = new Map(),
			    map_2 = new Map();

			assert.strictEqual(Object.checksum(map_1), Object.checksum(map_2));

			map_1.set('a', 1);

			assert.notStrictEqual(Object.checksum(map_1), Object.checksum(map_2));

			map_2.set('a', 1);

			assert.strictEqual(Object.checksum(map_1), Object.checksum(map_2));
		});

		if (typeof window == 'undefined') {
			it('should checksum Buffers', function() {

				var buf_a = new Buffer([1,2,3]),
				    buf_b = new Buffer([1,2,3]);

				let cs_a = Object.checksum(buf_a),
				    cs_b = Object.checksum(buf_b);

				assert.strictEqual(cs_a, 'BUF5289df737df57326fcdd22597afb1fac');
				assert.strictEqual(cs_b, 'BUF5289df737df57326fcdd22597afb1fac');
			});
		}
	});

	describe('.checksum(obj, sort_arrays)', function() {
		it('should return different checksums when sort_arrays is false', function() {

			var alpha,
			    beta;

			alpha = {
				arr: ['awel', 'baloe']
			};

			beta = {
				arr: ['baloe', 'awel']
			};

			assert.notStrictEqual(Object.checksum(alpha, false), Object.checksum(beta, false));
			assert.strictEqual(Object.checksum(alpha), Object.checksum(beta));
		});
	});
});

function expectEqual(expect, actual) {
	return assert.strictEqual(actual, expect);
}