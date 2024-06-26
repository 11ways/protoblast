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

		it('should allow inheritance without a constructor', function() {

			let NCClass = Function.inherits(function NCClass(value) {
				this.value = value;
			});

			let NoConstructor = Function.inherits('NCClass', 'NoConstructor');

			assert.strictEqual(NoConstructor.name, 'NoConstructor');

			let instance = new NoConstructor('test-nc');

			assert.strictEqual(instance.value, 'test-nc');
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

			var Grandparent = Blast.Bound.Function.inherits('Informer', 'Grandparent', function Grandparent() {}),
			    order = [];

			Grandparent.setStatic(function returnOne() {
				return 1;
			});

			// Inherit parent, which doesn't exist yet
			var Grandchild = Blast.Bound.Function.inherits('Grandparent.Parent', function Grandchild() {});

			Grandchild.constitute(function() {
				order.push('constituting-grandchild');
			});

			// Even though Parent doesn't exist, it should have the returnOne from the grandparent
			assert.equal(Grandchild.returnOne(), 1);

			// Now create the parent
			var Parent = Blast.Bound.Function.inherits('Grandparent', function Parent() {});

			order.push('created-parent');

			assert.equal(Parent.returnOne(), 1);

			order.push('setting-returntwo-on-parent');


			// Add a static method to that
			Parent.setStatic(function returnTwo() {
				return 2;
			});

			setTimeout(function() {
				// The grandchild will only have returnTwo on the next tick
				assert.strictEqual(Grandchild.returnTwo(), 2);

				assert.deepStrictEqual(order, [
					'created-parent',
					'setting-returntwo-on-parent',
					'constituting-grandchild'
				]);

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

		it('should inherit the class from a namespace yet to be made', function(done) {

			let Child = Function.inherits('Protoblast.Namespace.Rule', function Child() {});
			let Parent = Function.inherits('Informer', 'Protoblast.Namespace.Rule', function Rule() {});

			setTimeout(function() {

				assert.equal(Child.super, Parent, 'The Child class did not correctly inherit from the Parent');

				done();
			}, 20);
		});

		it('should work around crappy ES6 class constructor limitations', () => {

			class Kak {
				did_test = 0;
		
				constructor() {
					this.seen_kak = true;
				}
		
				test() {
					this.did_test++;
				}
			}

			assert.strictEqual(Kak.children, undefined, 'A vanilla ES6 class should not have a static `children` property');
		
			let kak = new Kak();
			assert.strictEqual(kak.seen_kak, true);
		
			const Unkaked = Function.inherits(Kak, function Unkaked() {
				this.seen_unkaked = true;
			});

			let counter = 0;

			Unkaked.postInherit(function test() {
				this.counter = ++counter;
			});

			assert.strictEqual(Kak.children.length, 1, 'After inheriting, the parent should have a `children` property');
			assert.notStrictEqual(Kak.children, Unkaked.children, 'The parent & child class are sharing the same `children` property!');
			assert.strictEqual(Unkaked.counter, 1);
		
			let unkaked = new Unkaked();
			assert.strictEqual(unkaked.seen_unkaked, true);
			assert.strictEqual(unkaked.seen_kak, true);
			assert.strictEqual(Unkaked.children?.length, undefined);
		
			const DeeperUnkaked = Function.inherits(Unkaked, function DeeperUnkaked() {
				DeeperUnkaked.super.call(this);
				this.is_deep = true;
			});
		
			let deeper = new DeeperUnkaked();
			assert.strictEqual(deeper.seen_unkaked, true);
			assert.strictEqual(deeper.seen_kak, true);
			assert.strictEqual(deeper.is_deep, true);
			assert.strictEqual(Unkaked.children?.length, 1);
			assert.strictEqual(DeeperUnkaked.counter, 2);
		
			class DeepKak extends Kak {
				constructor() {
					super(...arguments);
					this.is_still_kak = true;
				}
			};
		
			let deep_kak = new DeepKak();
			assert.strictEqual(deep_kak.seen_kak, true);
			assert.strictEqual(deep_kak.is_still_kak, true);

			const UnkakedChildByName = Function.inherits('DeeperUnkaked', 'UnkakedChildByName');
			let unkaked_child_by_name = new UnkakedChildByName();
			assert.strictEqual(unkaked_child_by_name.seen_unkaked, true);
			assert.strictEqual(unkaked_child_by_name.seen_kak, true);
			assert.strictEqual(unkaked_child_by_name.is_deep, true);
			assert.strictEqual(UnkakedChildByName.counter, 3);

			const NestedUnkaked = Function.inherits('Unkaked', 'Nested.Unkaked', 'NestedUnkaked');
			assert.strictEqual(NestedUnkaked.namespace, 'Nested.Unkaked');
			assert.strictEqual(DeeperUnkaked.counter, 2);
			assert.strictEqual(UnkakedChildByName.counter, 3);
			assert.strictEqual(NestedUnkaked.counter, 4);

			const DeepNested = Function.inherits('Nested.Unkaked.NestedUnkaked', 'DeepNested');
			assert.strictEqual(Blast.Classes.Nested.Unkaked.DeepNested, DeepNested);
			assert.strictEqual(DeepNested.counter, 5);

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

	describe('#decorateMethod(decorator, key, fnc)', function() {

		it('should decorate a method', async function() {

			var Test = Function.inherits(function DecoratorTest() {});

			Test.decorateMethod(Blast.Decorators.memoize(), function timestamp() {
				return Date.now();
			});

			let time = Date.now();

			let one = new Test();

			let first = one.timestamp(),
			    second = one.timestamp();

			await Pledge.after(5);

			assert.strictEqual(first >= time, true);
			assert.strictEqual(second, first);
			assert.strictEqual(one.timestamp(), first);

			let two = new Test();

			let third = two.timestamp();

			assert.notStrictEqual(first, third);
			assert.strictEqual(two.timestamp(), third);
		});

		describe('memoize({ignore_arguments: true})', function() {
			it('should ignore all arguments', async function() {

				var Test = Function.inherits(function DecoratorTestIgnoreArgs() {});

				Test.decorateMethod(Blast.Decorators.memoize({ignore_arguments: true}), function timestamp() {
					return Date.now();
				});

				let time = Date.now();
				let one = new Test();

				await Pledge.after(2);

				let first = one.timestamp();

				await Pledge.after(2);

				let second = one.timestamp('whatever');
				let third = one.timestamp('ok');

				await Pledge.after(2);

				let fourth = one.timestamp(false);

				assert.strictEqual(first >= time, true);
				assert.strictEqual(second, first);
				assert.strictEqual(third, first);
				assert.strictEqual(fourth, first);

				let two = new Test();

				assert.notStrictEqual(two.timestamp(), first);

			});
		});

		describe('memoize({ignore_arguments: true, ignore_callbacks: true})', function() {
			it('should ignore all arguments but sitll fire callbacks', function(done) {

				var Test = Function.inherits(function DecoratorTestIgnoreArgs() {});

				Test.decorateMethod(Blast.Decorators.memoize({ignore_arguments: true, ignore_callbacks: true}), function timestamp(callback) {

					callback(null, Date.now());
				});

				let time = Date.now();
				let one = new Test();

				let first,
				    second,
				    third;

				Function.series(async function first(next) {
					await Pledge.after(2);

					one.timestamp(function(err, val) {
						first = val;
						next();
					});
				}, async function second(next) {
					await Pledge.after(2);

					one.timestamp(function(err, val) {
						second = val;
						next();
					});
				}, async function third(next) {
					await Pledge.after(2);

					one.timestamp('x', function(err, val) {
						third = val;
						next();
					});
				}, function(err) {

					if (err) {
						throw err;
					}

					assert.strictEqual(second, first);
					assert.strictEqual(third, first);

					done();
				});
			});
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
				checker(this, 'CTTwo: doThird');
			});

			// This is the main class
			setTimeout(function() {
				CTOne = Blast.Bound.Function.inherits(function CTOne() {});
				CTOne.constitute(function doFirst() {
					this.first_time = i++;
					checker(this, 'CTOne: doFirst');
				});

				CTOne.constitute(function doSecond() {
					this.second_time = i++;
					checker(this, 'CTOne: doSecond');
				});
			}, 10);

			// This will check if everything is happening in the correct order
			function checker(constructor, creator) {

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

			let current_source,
			    current_class;

			// This is the main class
			DTOne = Blast.Bound.Function.inherits(function DTOne() {});
			DTOne.constitute(function doFirst() {
				this.first_time = i++;
				checker('DTOne', this);
			});

			// This will inherit a class that doesn't exist yet
			DTThree = Blast.Bound.Function.inherits('DTTwo', function DTThree() {});
			DTThree.constitute(function doThird() {
				this.third_time = i++;
				checker('DTThree', this);
			});

			// This is the non-existing class
			DTTwo = Blast.Bound.Function.inherits('DTOne', function DTTwo() {});
			DTTwo.constitute(function doSecond() {
				this.second_time = i++;
				checker('DTTwo', this);
			});

			// This is another, non-related class
			// This originall ran AFTER DTThree,
			// but since 2024 it will run before it.
			DTOther = Blast.Bound.Function.inherits(function DTOther() {});
			DTOther.constitute(function doAfterThree() {
				this.fourth_time = i++;
				checker('DTOther', this);
			});

			// Simulate the 'loaded' event
			Blast.setImmediate(function forcingLoaded() {
				for (var j = 0; j < tasks.length; j++) {
					if (tasks[j]) tasks[j]();
				}
			});

			// This will check if everything is happening in the correct order
			function checker(source, _current_class) {

				current_source = source;
				current_class = _current_class;

				// This should always be checked
				assertProperty(DTOne, 'DTOne', 'first_time',  0);
				assertProperty(DTOne, 'DTOne', 'second_time', undefined);
				assertProperty(DTOne, 'DTOne', 'third_time',  undefined);
				assertProperty(DTOne, 'DTOne', 'fourth_time', undefined);

				if (i == 1) {
					// Already checked
				} else if (i == 2) {
					assertProperty(DTTwo, 'DTTwo', 'first_time', 1);
				} else if (i == 3) {
					assertProperty(DTTwo, 'DTTwo', 'first_time', 1);
					assertProperty(DTTwo, 'DTTwo', 'second_time', 2);
				} else if (i == 4) {
					assertProperty(DTTwo, 'DTTwo', 'first_time', 1);
					assertProperty(DTTwo, 'DTTwo', 'second_time', 2);

					assertProperty(DTThree, 'DTThree', 'first_time', 3);
				} else if (i == 5) {
					assertProperty(DTTwo, 'DTTwo', 'first_time', 1);
					assertProperty(DTTwo, 'DTTwo', 'second_time', 2);

					assertProperty(DTThree, 'DTThree', 'first_time', 3);
					assertProperty(DTThree, 'DTThree', 'second_time', 4);
				} else if (i == 6) {
					assertProperty(DTTwo, 'DTTwo', 'first_time', 1);
					assertProperty(DTTwo, 'DTTwo', 'second_time', 2);

					assertProperty(DTThree, 'DTThree', 'first_time', 3);
					assertProperty(DTThree, 'DTThree', 'second_time', 4);
					assertProperty(DTThree, 'DTThree', 'third_time', 5);
				} else if (i == 7) {
					assertProperty(DTTwo, 'DTTwo', 'first_time', 1);
					assertProperty(DTTwo, 'DTTwo', 'second_time', 2);

					assertProperty(DTThree, 'DTThree', 'first_time', 3);
					assertProperty(DTThree, 'DTThree', 'second_time', 4);
					assertProperty(DTThree, 'DTThree', 'third_time', 5);

					assertProperty(DTOther, 'DTOther', 'fourth_time', 6);
					done();
				}
			}

			function assertProperty(context, name, property, amount) {
				let error = name + '.' + property + ' should be ' + amount + ', but it is ' + context[property] + '. Called by ' + current_class.name;
				assert.equal(context[property], amount, error);
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

		it('should handle constitutors added during a loading cycle', async () => {

			let Base = Function.inherits('Informer', 'Delayed', function Base() {});
			Base.constitute(() => {});

			let Alpha = Function.inherits('Delayed.Base', function Alpha() {});
			let Beta = Function.inherits('Delayed.Base', function Beta() {});

			return Function.parallel((next) => {
				Alpha.constitute(() => {
					Blast.executeAfterLoadingCycle(next);
				});
			}, (next) => {
				Beta.constitute(() => next());
			}, () => {});
		});
	});

	describe('.postInherit(task)', () => {

		it('should execute the task immediately after inheriting', () => {

			let PostInheritBase = Blast.Bound.Function.inherits(function PostInheritBase() {});

			let done_count = 0;
			let i = 0;

			PostInheritBase.postInherit(function doFirst() {

				if (!this.first_count) {
					this.first_count = 0;
				}

				// This should remain 1, we'll test that later
				this.first_count++;

				this.first_time = i++;
				done_count++;
			});

			assert.strictEqual(done_count, 1);
			assert.strictEqual(PostInheritBase.first_count, 1);

			PostInheritBase.postInherit(function doSecond() {

				if (!this.second_count) {
					this.second_count = 0;
				}

				// This should remain 1, we'll test that later
				this.second_count++;

				this.second_time = i++;
				done_count++;
			});

			assert.strictEqual(done_count, 2);
			assert.strictEqual(PostInheritBase.first_count, 1);
			assert.strictEqual(PostInheritBase.second_count, 1);

			let PostInheritChild = Blast.Bound.Function.inherits('PostInheritBase', function PostInheritChild() {});

			assert.strictEqual(done_count, 4);
			assert.strictEqual(PostInheritChild.first_count, 1);
			assert.strictEqual(PostInheritChild.second_count, 1);
		});

		it('should not postInherit before a non-existing parent class', function(done) {

			var CTOne,
			    CTTwo,
			    i = 0;

			// This will inherit a class that doesn't exist yet
			CTTwo = Blast.Bound.Function.inherits('PICTOne', function CTTwo() {});
			CTTwo.constitute(function doThird() {
				this.third_time = i++;
				checker();
			});

			// This is the main class
			setTimeout(function() {
				CTOne = Blast.Bound.Function.inherits(function PICTOne() {});
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

		it('should exectute postInheritors added during postInheriting', function(done) {

			var CTM = Blast.Bound.Function.inherits(function PITestMore() {}),
			    count = 0;

			CTM.postInherit(function first() {
				count++;

				this.postInherit(function second() {
					count++;
					assert.equal(count, 2);
					setTimeout(moreConstitutors, 5);
				});
			});

			function moreConstitutors() {
				CTM.postInherit(function third() {
					count++;
					assert.equal(count, 3);
					done();
				});
			}
		});

		it('should execute postInheritors added before parent was available', function(done) {

			var GrandParent,
			    Parent,
			    Child,
			    last,
			    count = 0;

			GrandParent = Function.inherits(null, 'UnitTesting.GammaPI', function GammaPI() {});

			GrandParent.postInherit(function() {
				last = 'GrandParent';
				count++;
				checker(last);
			});

			Child = Function.inherits('UnitTesting.GammaPI.Parent', function Child() {});

			Child.postInherit(function() {
				last = 'Child';
				count++;
				checker(last);
			});

			Parent = Function.inherits('UnitTesting.GammaPI', function Parent() {});

			Parent.postInherit(function() {
				last = 'Parent';
				count++;
				checker(last);
			});

			function checker(last) {

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

			let counter = 0;

			var Test = Function.inherits('Informer', 'Bla.Test', function Test() {

			});

			Test.prepareProperty(function myval() {
				return counter++;
			});

			var instance = new Test(),
			    init = instance.myval;

			assert.equal(instance.myval, init);
		});

		it('should not be set when called on the prototype', function() {

			let first = new Blast.Classes.Bla.Test.Test(),
			    second = new Blast.Classes.Bla.Test.Test();

			let val_1 = first.myval;

			let val_2 = second.myval;

			assert.notStrictEqual(val_1, val_2, 'The values of 2 different instances should be different');

			let val_3 = Blast.Classes.Bla.Test.Test.prototype.myval;
			let fourth = new Blast.Classes.Bla.Test.Test();

			assert.notStrictEqual(fourth.myval, val_3);
		});
	});

	describe('#getDescendants()', () => {
		it('should return all the descendants of a class as an array', () => {

			const RootRole = Function.inherits('Informer', 'RootRole');

			RootRole.postInherit(function afterInherit() {
				// A type_name or type_path is required,
				// and this is actually not (yet) automatically set by Protoblast
				this.type_name = this.name.underscore();
			});

			const RootRoleChild = Function.inherits('RootRole', 'RootRoleChild');
			const RootRoleSecondChild = Function.inherits('RootRole', 'RootRoleSecondChild');
			const RootRoleGrandChild = Function.inherits('RootRoleChild', 'RootRoleGrandChild');

			let children = RootRole.getDescendants();
			assert.strictEqual(children.length, 3);
		});

		it('should do the same for classes in a namespace', () => {

			const NsRole = Function.inherits('RootRole', 'Nested', 'NestedRole');
			const NestedChild = Function.inherits('Nested.NestedRole', 'NestedChild');
			const NestedGrandChild = Function.inherits('Nested.NestedChild', 'NestedGrandChild');

			let children = NsRole.getDescendants();
			assert.strictEqual(children.length, 2);

			let root_children = Blast.Classes.RootRole.getDescendants();
			assert.strictEqual(root_children.length, 6);
		});
	});

	describe('#getDescendantsDict()', () => {
		it('should return all the descendants in an Object dictionary', () => {

			let children = Blast.Classes.RootRole.getDescendantsDict();

			let keys = Object.keys(children);

			assert.strictEqual(keys.length, 6);

			assert.deepStrictEqual(keys, [
				'root_role_child',
				'root_role_grand_child',
				'root_role_second_child',
				'nested.nested_role',
				'nested.nested_child',
				'nested.nested_grand_child'
			]);
		});
	});

	describe('#setProperty(getter)', function() {

		var Alpha,
		    Beta,
		    Delta;

		it('should set a getter with the name of the getter function', function() {

			Alpha = Function.inherits(function GetterAlpha() {});

			Alpha.setProperty(function my_name() {
				return this.constructor.name;
			});

			Beta = Function.inherits('GetterAlpha', function GetterBeta() {});

			Beta.setProperty(function my_name() {
				return 'overridden_' + this.constructor.name;
			});

			var a = new Alpha();
			var b = new Beta();

			assert.equal(a.my_name, 'GetterAlpha');
			assert.equal(b.my_name, 'overridden_GetterBeta');
		});

		it('should be able to call a getter\'s parent', function() {

			Delta = Function.inherits('GetterAlpha', function GetterDelta() {});

			Delta.setProperty(function my_name() {
				return 'super_' + my_name.super.call(this);
			});

			var d = new Delta();

			assert.equal(d.my_name, 'super_GetterDelta');
		});

		it('should also define setters', function() {

			Alpha.setProperty(function setted_getter() {
				return this._setted_getter;
			}, function setSettedGetter(value) {
				return this._setted_getter = value * 10;
			});

			var a = new Alpha();

			assert.equal(a.setted_getter, null);

			// Our setter should multiply this
			a.setted_getter = 1;

			assert.equal(a.setted_getter, 10);
		});

		it('should inherit setters from parents', function() {
			Delta.setProperty(function setted_getter() {
				return this._setted_getter * 2;
			});

			var d = new Delta();

			assert.equal(isNaN(d.setted_getter), true, 'Result should be NaN');
			d.setted_getter = 5;

			// The setter should have been inherited (does x10)
			// then the getter does a x2
			assert.equal(d.setted_getter, 100);
		});

		it('should be able to call a setter\'s parent', function() {
			Beta.setProperty(function setted_getter() {
				return setted_getter.super.call(this);
			}, function setSettedGetter(value) {
				return setSettedGetter.super.call(this, value + 1);
			});

			var b = new Beta();

			assert.equal(b.setted_getter, null);

			b.setted_getter = 1;

			assert.equal(b.setted_getter, 20);
		});

		it('should handle inheritance', function() {

			var TestIGA = Function.inherits(function TestIGA() {});

			TestIGA.setProperty(function my_data() {

				if (!this._my_data) {
					this._my_data = {};
				}

				return this._my_data;
			});

			let TestIGB = Function.inherits('TestIGA', function TestIGB() {}),
			    TestIGC = Function.inherits('TestIGB', function TestIGC() {}),
			    TestIGD = Function.inherits('TestIGA', function TestIGD() {});

			let a = new TestIGA(),
			    b = new TestIGB(),
			    c = new TestIGC(),
			    d = new TestIGD();

			assert.strictEqual(typeof a.my_data, 'object');
			assert.strictEqual(typeof b.my_data, 'object');
			assert.strictEqual(typeof c.my_data, 'object');
			assert.strictEqual(typeof d.my_data, 'object');

			assert.notStrictEqual(b.my_data, a.my_data);
			assert.notStrictEqual(c.my_data, b.my_data);

			assert.notStrictEqual(d.my_data, a.my_data);
			assert.notStrictEqual(d.my_data, b.my_data);
			assert.notStrictEqual(d.my_data, c.my_data);

			a.my_data.name = 'a';
			d.my_data.name = 'd';

			assert.strictEqual(a.my_data.name, 'a');
			assert.strictEqual(b.my_data.name, undefined);
			assert.strictEqual(c.my_data.name, undefined);
			assert.strictEqual(d.my_data.name, 'd');
		});

		it.skip('should not work if it is called on the prototype itself', function() {

			var TestPA = Function.inherits(function TestPA() {});

			TestPA.setProperty(function my_data() {

				if (!this._my_data) {
					this._my_data = {};
				}

				return this._my_data;
			});

			let a = new TestPA();

			assert.notStrictEqual(a.my_data, null);
			assert.strictEqual(typeof a.my_data, 'object');

			// Access the getter through the prototype
			// It should NOT harm things here
			TestPA.prototype.my_data;

			assert.strictEqual(TestPA.prototype.my_data, undefined, 'The getter should not execute on the prototype itself');

			let b = new TestPA();

			assert.notStrictEqual(b.my_data, TestPA.prototype.my_data);

		});
	});

	
	describe('#setProperty(obj)', function() {

		it('should set multiple simple properties', function() {

			var ObjProps = Function.inherits(function ObjProps() {});

			ObjProps.setProperty({
				a: 'a',
				b: 'b',
				c: 'c'
			});

			let instance = new ObjProps();

			assert.strictEqual(instance.a, 'a');
			assert.strictEqual(instance.b, 'b');
			assert.strictEqual(instance.c, 'c');

			instance.b = 'test';

			assert.strictEqual(instance.b, 'test');

			let other = new ObjProps();

			assert.strictEqual(other.b, 'b', 'Should still be "b" and not "test"');
		});
	});

	describe('#enforceProperty(setter)', function() {
		var AlphaE;

		before(function() {
			AlphaE = Function.inherits(function AlphaE() {});
			AlphaE.enforceProperty(function enforced(value) {
				return value || 'default';
			});

			AlphaE.enforceProperty(function reference(value) {
				return value || [];
			});
		});

		it('should enforce the value on initial get', function() {

			var a = new AlphaE();

			assert.strictEqual(a.enforced, 'default');

			a.enforced = 'custom';

			assert.strictEqual(a.enforced, 'custom');

			a.enforced = false;

			assert.strictEqual(a.enforced, 'default');
		});

		it('should return the same set value', function() {

			var b = new AlphaE(),
			    arr = b.reference;

			assert.strictEqual(Array.isArray(arr), true);
			assert.strictEqual(b.reference, arr);

			let new_obj = {};
			b.reference = new_obj;

			assert.strictEqual(b.reference, new_obj);
		});

		it('should not do anything when called on the prototype', function() {

			let proto_value = AlphaE.prototype.reference;

			let a = new AlphaE();

			assert.notStrictEqual(a.reference, proto_value);
			assert.strictEqual(proto_value, undefined);
		});
	});
});