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

	if (typeof window == 'undefined') {
		describe('.values(obj)', function() {
			it('should return all the values of an object in an array', function() {
				var object1 = {
					a: 'somestring',
					b: 42,
					c: false
				};

				var arr = Blast.Shims['Object.values'](object1);

				assert.deepEqual(arr, ['somestring', 42, false]);
			});
		});

		describe('.entries(obj)', function() {
			it('should return all the key & values of an object in an array', function() {
				var object1 = {
					a: 'somestring',
					b: 42,
					c: false
				};

				var arr = Blast.Shims['Object.entries'](object1);

				assert.deepEqual(arr, [['a', 'somestring'], ['b', 42], ['c', false]]);
			});
		});
	}

	describe('.unzip(obj)', function() {
		it('should return an object with the keys & values as separate arrays', function() {
			var obj = {
				a: 1,
				b: 2,
				c: false
			};

			let result = Object.unzip(obj),
			    key,
			    i;

			for (i = 0; i < result.keys.length; i++) {
				key = result.keys[i];
				assert.strictEqual(result.values[i], obj[key]);
			}
		});
	});

	describe('.zip(key, values)', function() {
		it('should return an object', function() {

			var keys = ['a', 'b', 'c'],
			    values = [1, 2, 3];

			let result = Object.zip(keys, values);

			assert.strictEqual(result.a, 1);
			assert.strictEqual(result.b, 2);
			assert.strictEqual(result.c, 3);

			let second = Object.zip({keys: keys, values: values});

			assert.deepStrictEqual(second, result);

			let third = Object.zip([keys, values]);

			assert.deepStrictEqual(third, result);
		});

		it('should throw an error for wrong arguments', function() {

			assert.throws(function() {
				Object.zip();
			});

			assert.throws(function() {
				Object.zip(['a']);
			});

			assert.throws(function() {
				Object.zip({});
			});

			assert.throws(function() {
				Object.zip({keys: ['a']});
			});
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

			assert.equal(false, Object.isEmpty(obj));
			assert.equal(true, Object.isEmpty({}));
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
			assert.equal('/r/i', target.one.b.toString());
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