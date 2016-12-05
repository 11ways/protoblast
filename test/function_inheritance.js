var assert = require('assert'),
    TestClass,
    Blast;

describe('Inheritance', function() {

	before(function() {
		Blast  = require('../index.js')();

		TestClass = function TestClass() {
			this.testClassInited = true;
			this.abc();
		};
	});

	describe('#setMethod(key, fnc)', function() {
		it('should set a method on the current function', function() {

			var abc = function abc() {
				this.OriginalAbcRan = true;
			};

			TestClass.setMethod('abc', abc);

			assert.equal(abc, TestClass.prototype.abc);
		});

		it('should set a method to the method name when no key is given', function() {

			var def = function def() {
				this.OriginalDefRan = true;
			};

			TestClass.setMethod(def);

			assert.equal(def, TestClass.prototype.def);
		});

		it('should throw an error when no keyname can be found', function() {

			var anon = (function() {return function(){}}()),
			    xerr;

			try {
				TestClass.setMethod(anon);
			} catch (err) {
				xerr = err;
			}

			assert.equal(true, !!xerr);
		});

		it('should execute correctly', function() {

			var obj = new TestClass();

			assert.equal(true, obj.testClassInited);
			assert.equal(true, obj.OriginalAbcRan);
		});
	});

	describe('#extend(newConstructor)', function() {

		var ExtendedClass;

		it('should add all the current function prototype methods to the newConstructor\'s', function() {

			var obj;

			ExtendedClass = TestClass.extend(function ExtendedClass() {
				ExtendedClass.super.call(this);
			});

			obj = new ExtendedClass();

			assert.equal(true, obj.testClassInited);
			assert.equal(true, obj.OriginalAbcRan);
		});

		it('should be able to override inherited methods', function() {

			var obj;

			ExtendedClass = TestClass.extend(function ExtendedClass() {
				ExtendedClass.super.call(this);
			});

			ExtendedClass.setMethod(function abc() {
				this.OverridenAbcRan = true;
			});

			obj = new ExtendedClass();

			assert.equal(true, obj.testClassInited);
			assert.equal(false, !!obj.OriginalAbcRan);
			assert.equal(true, obj.OverridenAbcRan);
		});
	});

	describe('#setStatic(fnc)', function() {

		it('should set a static property on the class constructor', function() {
			TestClass.setStatic('staticText', 'text');
			assert.equal(TestClass.staticText, 'text');
		});

		it('should set a static method on the class constructor', function() {
			TestClass.setStatic('staticMethod', function staticMethod() {
				return this;
			});

			assert.equal('function', typeof TestClass.staticMethod);
		});

		it('should have the constructor as the context in static methods', function() {
			assert.equal(TestClass, TestClass.staticMethod());
		});

		it('should pass down static properties & methods to extended classes', function() {

			var ExtendedClass = TestClass.extend(function ExtendedClass() {});

			assert.equal(ExtendedClass, ExtendedClass.staticMethod(), 'Static method was not inherited');
		});

	});

});