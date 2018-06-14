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

	describe('.getNamespace(namespace)', function() {
		it('should return a function', function() {

			var ns = Function.getNamespace('My.New.Namespace.Roxymoron');

			assert.equal(typeof ns, 'function');
		});

		it('should return a function that throws an error when the class does not exist yet', function() {
			var ns = Function.getNamespace('My.New.Namespace.Roxymoron');

			assert.throws(function() {
				ns();
			}, /Could not find class "Roxymoron" in namespace "My\.New\.Namespace\.Roxymoron"/);
		});

		it('should return a function that creates an instance of the class of the same name', function() {

			var ns = Function.getNamespace('Test.Existing.Superclass');

			Function.inherits('Informer', 'Test.Existing.Superclass', function Superclass() {
				this.test = 'OK!';
			});

			var instance = ns();

			assert.equal(instance.test, 'OK!');

		});
	});

	describe('.inherits(parent, namespace, constructor)', function() {
		it('should inherit from multiple parents', function() {

			var Multiple,
			    instance;

			Multiple = Function.inherits(['Deck', 'Informer'], function Multiple() {
				this.constructed = true
			});

			instance = new Multiple();

			assert.equal(true, instance.constructed, 'The constructor did not execute');
			assert.equal(Deck.prototype.set, instance.set, 'The class did not inherit from Deck');
			assert.equal(Informer.prototype.emit, instance.emit, 'The class did not inherit from Informer');
		});

		it('should inherit from parents with multiple parents', function() {

			var Deep,
			    instance;

			Deep = Function.inherits('Multiple', function Deep() {});

			instance = new Deep();

			assert.equal(Deck.prototype.set, instance.set, 'The class did not inherit from Deck');
			assert.equal(Informer.prototype.emit, instance.emit, 'The class did not inherit from Informer');
		});

		it('should inherit from multiple parents that are children', function() {

			var instance,
			    Deeper,
			    Top,
			    Mid;

			Top = Function.inherits('Informer', function Top() {});

			Top.setMethod(function testMe() {
				return 'Top';
			});

			Top.setMethod(function topMethod() {
				return 'Top';
			});

			Top.setMethod(function deepMethod() {
				return 'Top';
			});

			Top.setMethod(function concatMethod() {
				return 'Top';
			});

			Mid = Function.inherits('Top', function Mid() {});
			Mid.setMethod(function testMe() {
				return 'Mid';
			});

			Mid.setMethod(function deepMethod() {
				return 'Mid';
			});

			Mid.setMethod(function concatMethod() {
				return concatMethod.super.call(this) + 'Mid';
			});

			Deeper = Function.inherits(['Deck', 'Mid'], function Deeper() {});
			Deeper.setMethod(function deepMethod() {
				return 'Deep';
			});

			Deeper.setMethod(function concatMethod() {
				return concatMethod.super.call(this) + 'Deep';
			});

			instance = new Deeper();

			assert.equal(Deck.prototype.set, instance.set, 'The class did not inherit from Deck');
			assert.equal(Informer.prototype.emit, instance.emit, 'The class did not inherit from Informer');
			assert.equal('Top', instance.topMethod());
			assert.equal('Mid', instance.testMe());
			assert.equal('Deep', instance.deepMethod());
			assert.equal('TopMidDeep', instance.concatMethod());
		});

		it('should inherit static properties from grandparent if parent is not yet available', function(done) {

			var Grandparent = Blast.Bound.Function.inherits('Informer', 'Grandparent', function Grandparent() {});

			Grandparent.setStatic(function returnOne() {
				return 1;
			});

			// Inherit parent, which doesn't exist yet
			var Grandchild = Blast.Bound.Function.inherits('Grandparent.Parent', function Grandchild() {});

			// Even though Parent doesn't exist, it should have the returnOne from the grandparent
			assert.equal(Grandchild.returnOne(), 1);

			// Now create the parent
			var Parent = Blast.Bound.Function.inherits('Grandparent', function Parent() {});

			assert.equal(Parent.returnOne(), 1);

			// Add a static method to that
			Parent.setStatic(function returnTwo() {
				return 2;
			});

			setTimeout(function() {
				// The grandchild will only have returnTwo on the next tick
				assert.equal(Grandchild.returnTwo(), 2);
				done();
			}, 20)
		});

		it('should inherit the class from the correct namespace', function(done) {

			var FakeBehaviour = Function.inherits(function Behaviour() {});
			var Descendant = Function.inherits('UnitTesting.Behaviour', function Descendant() {});
			var RealBehaviour = Function.inherits('Informer', 'UnitTesting', function Behaviour() {});
			var Fake = Function.inherits('Behaviour', function Fake() {});

			setTimeout(function() {
				assert.equal(Descendant.super, RealBehaviour);
				assert.equal(Fake.super, FakeBehaviour);
				done();
			}, 20);
		});
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

		it('should pass down static properties set on extended classes to its extended classes', function() {

			var MyClass,
			    EClass;

			MyClass = Function.inherits('Informer', function EEMyClass() {});

			// Add a new static function
			MyClass.setStatic(function testStatic() {});

			// Create a new extended class
			EClass = Function.inherits('EEMyClass', function EEExMyClass() {});

			assert.equal(typeof EClass.testStatic, 'function');
		});

		it('should pass down static properties to other namespaces', function() {

			var MyClass,
			    EClass;

			MyClass = Function.inherits('Informer', 'SomeNamespace', function NEEMyClass() {});

			// Add a new static function
			MyClass.setStatic(function testStaticTwo() {});

			// Create a new extended class
			EClass = Function.inherits('SomeNamespace.NEEMyClass', 'UnitTesting', function EEExMyClass() {});

			assert.equal(typeof EClass.testStaticTwo, 'function');
		});

		it('should pass down static properties to deeper extensions', function() {

			var BaseClass,
			    MyClass,
			    EClass,
			    XClass,
			    YClass;

			BaseClass = Function.inherits(function TestingABaseClass() {});
			BaseClass.setStatic(function setTestOne() {});

			MyClass = Function.inherits('TestingABaseClass', 'SomeNamespace', function NNEEMyClass() {});

			// Create a new extended class
			EClass = Function.inherits('SomeNamespace.NNEEMyClass', 'UnitTestingTwo', function EEExMyClass() {});

			EClass.setStatic(function setTestTwo() {});

			XClass = Function.inherits('UnitTestingTwo.EEExMyClass', function XClass() {});

			// Add a new static function
			XClass.setStatic(function testStaticThree() {});

			YClass = Function.inherits('UnitTestingTwo.XClass', function YClass() {});

			assert.equal(typeof YClass.setTestOne, 'function');
			assert.equal(typeof YClass.setTestTwo, 'function');
			assert.equal(typeof YClass.testStaticThree, 'function');
		});
	});

	describe('.constitute(fnc)', function() {

		var ConstituteTestBase,
		    i = 0;

		before(function() {
			ConstituteTestBase = Blast.Bound.Function.inherits(function ConstituteTestBase() {});
		});

		it('should execute on the class', function(done) {

			var done_count = 0;

			ConstituteTestBase.constitute(function doFirst() {

				if (!this.first_count) {
					this.first_count = 0;
				}

				// This should remain 1, we'll test that later
				this.first_count++;

				this.first_time = i++;
				done_count++;
			});

			ConstituteTestBase.constitute(function doSecond() {

				if (!this.second_count) {
					this.second_count = 0;
				}

				// This should remain 1, we'll test that later
				this.second_count++;

				this.second_time = i++;
				done_count++;

				if (done_count == 2 && this.second_count == 1) {
					done();
				}
			});
		});

		it('should not constitute before a non-existing parent class', function(done) {

			var CTOne,
			    CTTwo,
			    i = 0;

			// This will inherit a class that doesn't exist yet
			CTTwo = Blast.Bound.Function.inherits('CTOne', function CTTwo() {});
			CTTwo.constitute(function doThird() {
				this.third_time = i++;
				checker();
			});

			// This is the main class
			setTimeout(function() {
				CTOne = Blast.Bound.Function.inherits(function CTOne() {});
				CTOne.constitute(function doFirst() {
					this.first_time = i++;
					checker();
				});

				CTOne.constitute(function doSecond() {
					this.second_time = i++;
					checker();
				});
			}, 10);

			// This will check if everything is happening in the correct order
			function checker() {

				if (i == 1) {
					assert.equal(CTOne.first_time, 0);
					assert.equal(CTOne.second_time, undefined);
					assert.equal(CTOne.third_time, undefined);
				} else if (i == 2) {
					assert.equal(CTOne.first_time, 0);
					assert.equal(CTOne.second_time, 1);
					assert.equal(CTOne.third_time, undefined);
				} else if (i == 3) {

					assert.equal(CTOne.first_time, 0);
					assert.equal(CTOne.second_time, 1);
					assert.equal(CTOne.third_time, undefined);

					assert.equal(CTTwo.first_time, 2);
					assert.equal(CTTwo.second_time, undefined);
					assert.equal(CTTwo.third_time, undefined);
				} else if (i == 4) {

					assert.equal(CTOne.first_time, 0);
					assert.equal(CTOne.second_time, 1);
					assert.equal(CTOne.third_time, undefined);

					assert.equal(CTTwo.first_time, 2);
					assert.equal(CTTwo.second_time, 3);
					assert.equal(CTTwo.third_time, undefined);
				} else if (i == 5) {

					assert.equal(CTOne.first_time, 0);
					assert.equal(CTOne.second_time, 1);
					assert.equal(CTOne.third_time, undefined);

					assert.equal(CTTwo.first_time, 2);
					assert.equal(CTTwo.second_time, 3);
					assert.equal(CTTwo.third_time, 4);
					done();
				}
			}
		});

		it('should execute in the expected order', function(done) {

			var DTOne,
			    DTTwo,
			    DTThree,
			    DTOther,
			    tasks = [],
			    i = 0;

			var _originalLoaded = Blast.loaded;

			Blast.loaded = function(fnc) {
				tasks.push(fnc);
			};

			// This is the main class
			DTOne = Blast.Bound.Function.inherits(function DTOne() {});
			DTOne.constitute(function doFirst() {
				this.first_time = i++;
				checker();
			});

			// This will inherit a class that doesn't exist yet
			DTThree = Blast.Bound.Function.inherits('DTTwo', function DTThree() {});
			DTThree.constitute(function doThird() {
				this.third_time = i++;
				checker();
			});

			// This is the non-existing class
			DTTwo = Blast.Bound.Function.inherits('DTOne', function DTTwo() {});
			DTTwo.constitute(function doSecond() {
				this.second_time = i++;
				checker();
			});

			// This is another, non-related class
			// This should run AFTER DTThree
			DTOther = Blast.Bound.Function.inherits(function DTOther() {});
			DTOther.constitute(function doAfterThree() {
				this.fourth_time = i++;
				checker();
			});

			Blast.loaded = _originalLoaded;

			// Simulate the 'loaded' event
			Blast.setImmediate(function forcingLoaded() {
				for (var j = 0; j < tasks.length; j++) {
					if (tasks[j]) tasks[j]();
				}
			});

			// This will check if everything is happening in the correct order
			function checker() {

				// This should always be checked
				assert.equal(DTOne.first_time,  0);
				assert.equal(DTOne.second_time, undefined);
				assert.equal(DTOne.third_time,  undefined);
				assert.equal(DTOne.fourth_time, undefined);

				if (i == 1) {
					// Already checked
				} else if (i == 2) {
					assert.equal(DTTwo.first_time, 1);
				} else if (i == 3) {
					assert.equal(DTTwo.first_time, 1);
					assert.equal(DTTwo.second_time, 2);
				} else if (i == 4) {
					assert.equal(DTTwo.first_time, 1);
					assert.equal(DTTwo.second_time, 2);

					assert.equal(DTThree.first_time, 3);
				} else if (i == 5) {
					assert.equal(DTTwo.first_time, 1);
					assert.equal(DTTwo.second_time, 2);

					assert.equal(DTThree.first_time, 3);
					assert.equal(DTThree.second_time, 4);
				} else if (i == 6) {
					assert.equal(DTTwo.first_time, 1);
					assert.equal(DTTwo.second_time, 2);

					assert.equal(DTThree.first_time, 3);
					assert.equal(DTThree.second_time, 4);
					assert.equal(DTThree.third_time, 5);
				} else if (i == 7) {
					assert.equal(DTTwo.first_time, 1);
					assert.equal(DTTwo.second_time, 2);

					assert.equal(DTThree.first_time, 3);
					assert.equal(DTThree.second_time, 4);
					assert.equal(DTThree.third_time, 5);

					assert.equal(DTOther.fourth_time, 6);
					done();
				}
			}
		});

		it('should execture constitutors added during constitution', function(done) {

			var CTM = Blast.Bound.Function.inherits(function ConstituteTestMore() {}),
			    count = 0;

			CTM.constitute(function first() {
				count++;

				this.constitute(function second() {
					count++;
					assert.equal(count, 2);
					setTimeout(moreConstitutors, 5);
				});
			});

			function moreConstitutors() {
				CTM.constitute(function third() {
					count++;
					assert.equal(count, 3);
					done();
				});
			}
		});

		it('should execute constitutors added before parent was available', function(done) {

			var GrandParent,
			    Parent,
			    Child,
			    last,
			    count = 0;

			GrandParent = Function.inherits(null, 'UnitTesting.Gamma', function Gamma() {});

			GrandParent.constitute(function() {
				last = 'GrandParent';
				count++;
				checker();
			});

			Child = Function.inherits('UnitTesting.Gamma.Parent', function Child() {});

			Child.constitute(function() {
				last = 'Child';
				count++;
				checker();
			});

			Parent = Function.inherits('UnitTesting.Gamma', function Parent() {});

			Parent.constitute(function() {
				last = 'Parent';
				count++;
				checker();
			});

			function checker() {

				if (count == 1) {
					assert.equal(last, 'GrandParent');
				} else if (count == 2) {
					assert.equal(last, 'GrandParent');
				} else if (count == 3) {
					assert.equal(last, 'Parent');
				} else if (count == 4) {
					assert.equal(last, 'GrandParent');
				} else if (count == 5) {
					assert.equal(last, 'Parent');
				} else if (count == 6) {
					assert.equal(last, 'Child');
					done();
				}
			}
		});
	});

	describe('.prepareProperty(target, key, getter, enumerable)', function() {

		it('should define a property that gets a value on first get', function() {

			var Test = Function.inherits('Informer', 'Bla.Test', function Test() {

			});

			Test.prepareProperty(function myval() {
				return Date.now();
			});

			var instance = new Test(),
			    init = instance.myval;

			assert.equal(instance.myval, init);
		});
	});
});