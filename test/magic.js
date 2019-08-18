var MagicTest,
    assert = require('assert'),
    Blast;

describe('Magic', function() {

	before(function() {
		Blast = require('../index.js')();

		MagicTest = Function.inherits('Magic', function MagicTest() {
			this[DATA] = {};
		});

		let DATA = Symbol('data');

		MagicTest.setMethod(function __get(name) {
			return this[DATA][name];
		});

		MagicTest.setMethod(function __set(name, value) {
			return this[DATA][name] = value;
		});

		MagicTest.setMethod(function __ownKeys() {
			return Object.keys(this[DATA]);
		});

		MagicTest.setMethod(function __delete(name) {
			return delete this[DATA][name];
		});

		MagicTest.setMethod(function __has(name) {
			return this[DATA][name] != null;
		});

		MagicTest.setMethod(function __describe(name) {

			var value = this.__get(name);

			if (value == null) {
				return undefined;
			}

			return {
				value        : value,
				writable     : true,
				enumerable   : true,
				configurable : true
			};
		});

	});

	describe('#__get(name)', function() {

		it('should allow you to redirect getter functionality', function() {

			var a = new MagicTest();
			assert.strictEqual(a.bla, undefined);
		});

		it('provides default getter functionality', function() {

			var b = new Blast.Classes.Magic();

			b.bla = 'bla';
			assert.strictEqual(b.bla, 'bla');
		});
	});

	describe('#__set(name, value)', function() {

		it('should allow you to redirect setter functionality', function() {

			var a = new MagicTest();

			assert.strictEqual(a.bla, undefined);
			a.bla = 1;

			assert.strictEqual(a.bla, 1);
		});
	});

	describe('#__ownKeys()', function() {

		it('should allow you to iterate over the object', function() {

			var a = new MagicTest(),
			    keys = [];

			a.one = 1;
			a.two = 2;
			a.three = 3;

			for (let key in a) {
				switch (key) {
					case 'one':
					case 'two':
					case 'three':
						keys.push(key);
						break;

					default:
						throw new Error('Unexpected key: "' + key + '"');
				}
			}

			if (keys.length != 3) {
				throw new Error('Should have found three keys');
			}
		});
	});

	describe('#__has(name)', function() {
		it('should allow you to use `in` operator', function() {

			var a = new MagicTest();

			assert.strictEqual('one' in a, false);

			a.one = 0;

			assert.strictEqual('one' in a, true);

			a.one = 1;

			assert.strictEqual('one' in a, true);
		});
	});

	describe('#__delete(name)', function() {
		it('allows you to delete properties', function() {

			var a = new MagicTest(),
			    b = new Blast.Classes.Magic();

			a.one = 1;
			b.one = 1;

			assert.strictEqual(a.one, b.one);

			delete a.one;
			delete b.one;

			assert.strictEqual(a.one, undefined);
			assert.strictEqual(b.one, undefined);

			let keys = Object.keys(a);

			assert.deepStrictEqual(keys, []);
			assert.deepStrictEqual(Object.keys(b), []);

		});
	});
});