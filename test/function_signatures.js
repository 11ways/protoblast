const { Classes } = require('json-dry');
const { errors } = require('puppeteer');

var assert = require('assert'),
    Signatureless,
    Blast,
	Types;

describe('Signatures', function() {

	before(function() {
		Blast  = require('../index.js')();
		Types = Blast.Types;

		Signatureless = Function.inherits(function Signatureless() {});

		Signatureless.setMethod(function multiply(a, b) {
			return a * b;
		});
	});

	describe('.setTypedMethod(argument_types, method)', function() {
		it('should add method signatures', function() {

			const ClassA = Function.inherits('Signatureless', 'SignaturelessA');
			let instance = new ClassA();

			let result = instance.multiply(5, 2);

			assert.strictEqual(result, 10, 'It should use the non-typed method by default');

			ClassA.setTypedMethod([String, Number], function multiply(str, amount) {

				let result = '',
				    i;
				
				for (i = 0; i < amount; i++) {
					result += str;
				}

				return result;
			});

			assert.strictEqual(instance.multiply(5, 2), 10, 'It should have used the default method because no signatures matched');
			assert.strictEqual(instance.multiply('a', 2), 'aa', 'It should have used the signatured method');

			ClassA.setTypedMethod([String, String], function multiply(str, str_two) {
				return str + '*' + str_two;
			});

			assert.strictEqual(instance.multiply('a', 'b'), 'a*b');
		});

		it('should allow for optional arguments', function() {

			const ClassC = Function.inherits('Signatureless', 'SignaturelessC');
			let instance = new ClassC();

			ClassC.setTypedMethod([Blast.Types.String, Blast.Types.Number.optional()], function multiply(str, amount = 3) {
				let result = '';

				for (i = 0; i < amount; i++) {
					result += str;
				}

				return result;
			});

			ClassC.setTypedMethod([Blast.Types.String, Blast.Types.Number.optional()], function add(a, b) {
				return '' + a + b;
			});

			assert.strictEqual(instance.multiply('a', 5), 'aaaaa');
			assert.strictEqual(instance.multiply('b'), 'bbb');
			assert.strictEqual(instance.add('a', 1), 'a1');

			assert.throws(() => instance.add());
			assert.throws(() => instance.add(1, 1));

			ClassC.setTypedMethod([Blast.Types.Number, Blast.Types.Number], function add(a, b) {
				return a + b;
			});

			assert.strictEqual(instance.add(1, 1), 2);

			assert.throws(() => instance.add(/r/i, 1));
		});

		it('should allow the use of types before the class exists', function() {

			const ClassD = Function.inherits(function SignatureClassD() {});

			ClassD.setTypedMethod([Blast.Types.SignatureClassE], function test(instance) {
				return true;
			});

			let instance = new ClassD();
			
			assert.throws(() => instance.test(false));

			const ClassE = Function.inherits(function SignatureClassE() {});
			let e_instance = new ClassE();

			let result = instance.test(e_instance);

			assert.strictEqual(result, true);
		});

		it('should throw an error when a signature is not found', function() {

			const ClassF = Function.inherits(function SignatureClassF() {});

			ClassF.setTypedMethod([String, Boolean], function test(str, bool) {
				return true;
			});

			let instance = new ClassF();
			let error;

			try {
				instance.test('', '');
			} catch (err) {
				error = err;
			}

			assert.strictEqual(!!error, true, 'An error was expected');
			assert.strictEqual(error.message, 'Failed to find "test" method matching signature `String,String`');
		});

		it('should correctly handle null values', function() {

			const ClassH = Function.inherits(function SignatureClassH() {});

			ClassH.setTypedMethod([Number, Number], function add(a, b) {
				return a + b;
			});

			let instance = new ClassH();
			let result;
			let error;

			try {
				instance.add(1, null);
			} catch (err) {
				error = err;
			}

			assert.strictEqual(!!error, true);
			assert.strictEqual(error.message, 'Failed to find "add" method matching signature `Number,null`');
			
			try {
				instance.add(1, undefined);
			} catch (err) {
				error = err;
			}

			assert.strictEqual(!!error, true);
			assert.strictEqual(error.message, 'Failed to find "add" method matching signature `Number,undefined`');

			result = instance.add(1, 1);
			assert.strictEqual(result, 2);
		});

		it('should support OR groups', function() {

			const ClassOrA = Function.inherits(function SignatureClassOrA() {});

			ClassOrA.setTypedMethod([Types.Number.or(String), Types.Number], function multiply(a, b) {
				return a * b;
			});

			let instance = new ClassOrA();
			let result;

			result = instance.multiply(2, 2);
			assert.strictEqual(result, 4);

			result = instance.multiply('2', 2);
			assert.strictEqual(result, 4);

			assert.throws(() => instance.multiply(2, '2'));
		});

		it('should support OR groups for types that do not exist yet', function() {

			const ClassOrB = Function.inherits(function SignatureClassOrB() {});

			ClassOrB.setTypedMethod([Types.Number.or(Types.SignatureClassOrC.or(Types.SignatureClassOrD)), Types.Number], function test(a, b) {
				return a.constructor.name + '-' + b;
			});

			let instance = new ClassOrB();
			let result = instance.test(1, 1);

			assert.strictEqual(result, 'Number-1');

			const ClassOrC = Function.inherits(function SignatureClassOrC() {});
			result = instance.test(new ClassOrC(), 2);

			assert.strictEqual(result, 'SignatureClassOrC-2');

			assert.throws(() => instance.test('', 1));

			const ClassOrD = Function.inherits(function SignatureClassOrD() {});
			result = instance.test(new ClassOrD(), 3);
			assert.strictEqual(result, 'SignatureClassOrD-3');
		});

		it('should support AND groups', function() {

			const ClassAndA = Function.inherits('Signatureless', function SignatureClassAndA() {});
			const ClassAndB = Function.inherits('Signatureless', function SignatureClassAndB() {});

			ClassAndA.setTypedMethod([Types.Signatureless.and(Types.SignatureClassAndB), Types.Number], function test(a, b) {
				return a.constructor.name + '-' + b;
			});

			let signatureless = new Signatureless();
			let instance_a = new ClassAndA();
			let instance_b = new ClassAndB();

			let result = instance_a.test(instance_b, 1);
			assert.strictEqual(result, 'SignatureClassAndB-1');

			assert.throws(() => instance_a.test(signatureless, 1));
		});

		it('should support the Any type', function() {

			const ClassAnyA = Function.inherits('Signatureless', function SignatureClassAnyA() {});

			ClassAnyA.setTypedMethod([Types.Any], function anyNonNull(a) {
				return a.constructor.name;
			});

			ClassAnyA.setTypedMethod([Types.Any.nullable()], function anyNullable(a) {
				return a?.constructor?.name || 'null';
			});

			let instance = new ClassAnyA();

			assert.strictEqual(instance.anyNonNull(1), 'Number');
			assert.strictEqual(instance.anyNonNull(''), 'String');

			assert.strictEqual(instance.anyNullable(1), 'Number');
			assert.strictEqual(instance.anyNullable(null), 'null');

			assert.throws(() => instance.anyNonNull(null));
			assert.throws(() => instance.anyNonNull(undefined));
			assert.throws(() => instance.anyNullable(undefined));
		});

		it('should support the many specifier', function() {

			const ClassManyA = Function.inherits('Signatureless', function SignatureClassManyA() {});

			ClassManyA.setTypedMethod([Types.String.array()], function manyString(strings) {
				return strings.join(',');
			});

			let instance = new ClassManyA();

			assert.strictEqual(instance.manyString(['a', 'b']), 'a,b');
			assert.strictEqual(instance.manyString('a'), 'a');

			assert.throws(() => instance.manyString(['a', 1]));
			assert.throws(() => instance.manyString(['a', null]));
			assert.throws(() => instance.manyString(['a', undefined]));
			assert.throws(() => instance.manyString([]));
		});
	});

	describe('.setTypedMethod(argument_types, return_type, method)', function() {
		it('should throw an error when the return type is wrong', function() {

			const ClassG = Function.inherits(function SignatureClassG() {});

			ClassG.setTypedMethod([String, String], [Number], function addNumberStrings(a, b) {
				return a+b;
			});

			let instance = new ClassG();
			let error;

			try {
				instance.addNumberStrings('1', '2');
			} catch (err) {
				error = err;
			}

			assert.strictEqual(!!error, true, 'An error was expected');
			assert.strictEqual(error.message, 'Method "addNumberStrings" should return type `Number`, but tried to return `String`');

		});
	});

	describe('.setTypedStatic(argument_types, method)', function() {
		it('should add static method signatures', function() {

			const ClassB = Function.inherits('Signatureless', 'SignaturelessB');
			let instance = new ClassB();

			ClassB.setStatic(function testme(a, b) {
				return 'default ' + a + '-' + b;
			});

			ClassB.setTypedStatic([Number, Number], function testme(a, b) {
				return a + b;
			});

			assert.strictEqual(ClassB.testme('a', 'b'), 'default a-b');
			assert.strictEqual(ClassB.testme(1, 2), 3);

		});
	});

	describe('.instrumentMethod(method, before, after)', function() {
		it('should add instrumentation to existing methods', function() {

			let InstrumentBase = Function.inherits('Informer', 'InstrumentBaseA');

			InstrumentBase.setMethod(function test() {

				if (!this.counter) {
					this.counter = 0;
				}

				this.counter++;
			});

			let first = new InstrumentBase();
			first.test();

			assert.strictEqual(first.counter, 1);

			first.test();
			assert.strictEqual(first.counter, 2);

			let before = 0,
			    after = 0;

			InstrumentBase.instrumentMethod('test', () => {
				before++;
			}, () => {
				after++;
			});

			first.test();
			assert.strictEqual(first.counter, 3);
			assert.strictEqual(before, 1);
			assert.strictEqual(after, 1);

			let InstrumentChild = Function.inherits('InstrumentBaseA', 'InstrumentBaseChildA');

			let second = new InstrumentChild();

			second.test();

			assert.strictEqual(second.counter, 1);
			assert.strictEqual(before, 2);
			assert.strictEqual(after, 2);

			InstrumentChild.setMethod(function test(do_parent = false) {
				if (!this.counter) {
					this.counter = 0;
				}

				this.counter += 10;

				if (do_parent) {
					test.super.call(this);
				}
			});

			assert.strictEqual(Blast.hasSignatureWrapperMethod(InstrumentChild.prototype, 'test'), true, 'The test method should have a signature wrapper');

			before = 0;
			after = 0;

			second.test();

			assert.strictEqual(second.counter, 11);
			assert.strictEqual(before, 1, 'Before should be 1, but it was ' + before);
			assert.strictEqual(after, 1);

			// Now test it with a super call
			second.test(true);

			assert.strictEqual(second.counter, 22);
			assert.strictEqual(before, 2);
			assert.strictEqual(after, 2);
		});

		it('should handle instrumentation among ancestors', () => {

			let Instrumented1 = Function.inherits('Informer', 'Instrumented1');
			let Instrumented2 = Function.inherits('Instrumented1', 'Instrumented2');
			let Instrumented3 = Function.inherits('Instrumented2', 'Instrumented3');
			let Instrumented4 = Function.inherits('Instrumented3', 'Instrumented4');

			let test_1 = 0;
			let test_1_before = 0;
			let test_1_before_3 = 0;
			let test_1_before_4 = 0;

			Instrumented1.setMethod(function test1() {
				test_1++;
			});

			let i_one = new Instrumented1();
			let i_two = new Instrumented2();
			let i_three = new Instrumented3();
			let i_four = new Instrumented4();

			i_one.test1();
			i_two.test1();
			i_three.test1();
			i_four.test1();

			assert.strictEqual(test_1, 4);
			assert.strictEqual(test_1_before, 0);

			Instrumented1.instrumentMethod('test1', function i1_test1() {
				test_1_before++;
			});

			i_one.test1();
			i_two.test1();
			i_three.test1();
			i_four.test1();

			assert.strictEqual(test_1, 8);
			assert.strictEqual(test_1_before, 4);

			Instrumented3.instrumentMethod('test1', function i3_test1() {
				test_1_before_3++;
			});

			i_one.test1();

			assert.strictEqual(test_1, 9);
			assert.strictEqual(test_1_before, 5);
			assert.strictEqual(test_1_before_3, 0);

			i_two.test1();

			assert.strictEqual(test_1, 10);
			assert.strictEqual(test_1_before, 6);
			assert.strictEqual(test_1_before_3, 0);

			i_three.test1();

			assert.strictEqual(test_1, 11);
			assert.strictEqual(test_1_before, 7);
			assert.strictEqual(test_1_before_3, 1);

			i_four.test1();

			assert.strictEqual(test_1, 12);
			assert.strictEqual(test_1_before, 8);
			assert.strictEqual(test_1_before_3, 2);

			Instrumented4.instrumentMethod('test1', function i4_test1() {
				test_1_before_4++;
			});

			i_one.test1();

			assert.strictEqual(test_1, 13);
			assert.strictEqual(test_1_before, 9);
			assert.strictEqual(test_1_before_3, 2);

			i_two.test1();

			assert.strictEqual(test_1, 14);
			assert.strictEqual(test_1_before, 10);
			assert.strictEqual(test_1_before_3, 2);

			i_three.test1();

			assert.strictEqual(test_1, 15);
			assert.strictEqual(test_1_before, 11);
			assert.strictEqual(test_1_before_3, 3);
			assert.strictEqual(test_1_before_4, 0);

			i_four.test1();

			assert.strictEqual(test_1, 16);
			assert.strictEqual(test_1_before, 12);
			assert.strictEqual(test_1_before_3, 4);
			assert.strictEqual(test_1_before_4, 1);

			let typed_3 = 0;

			Instrumented3.setTypedMethod([Types.Number], function test1(num) {
				typed_3 += num;
			});

			i_one.test1(10);

			assert.strictEqual(test_1, 17);
			assert.strictEqual(test_1_before, 13);
			assert.strictEqual(test_1_before_3, 4);
			assert.strictEqual(typed_3, 0);

			i_two.test1(10);

			assert.strictEqual(test_1, 18);
			assert.strictEqual(test_1_before, 14);
			assert.strictEqual(test_1_before_3, 4);
			assert.strictEqual(typed_3, 0);

			i_three.test1(10);

			assert.strictEqual(typed_3, 10);
			assert.strictEqual(test_1, 18);
			assert.strictEqual(test_1_before, 15);
			assert.strictEqual(test_1_before_3, 5);
			assert.strictEqual(test_1_before_4, 1);

			i_four.test1(10);

			assert.strictEqual(typed_3, 20);
			assert.strictEqual(test_1, 18);
			assert.strictEqual(test_1_before, 16);
			assert.strictEqual(test_1_before_3, 6);
			assert.strictEqual(test_1_before_4, 2);

			let typed_4 = 0;

			Instrumented4.setTypedMethod([Types.Number, Types.Boolean.optional()], function test1(num, do_super) {

				typed_4 += num;

				if (do_super) {
					test1.super.call(this, num);
				}
			});

			i_one.test1(10);

			assert.strictEqual(test_1, 19);
			assert.strictEqual(test_1_before, 17);
			assert.strictEqual(test_1_before_3, 6);
			assert.strictEqual(typed_3, 20);
			assert.strictEqual(typed_4, 0);
			assert.strictEqual(test_1_before_4, 2);

			i_two.test1(10);

			assert.strictEqual(test_1, 20);
			assert.strictEqual(test_1_before, 18);
			assert.strictEqual(test_1_before_3, 6);
			assert.strictEqual(typed_3, 20);
			assert.strictEqual(typed_4, 0);
			assert.strictEqual(test_1_before_4, 2);

			i_three.test1(10);

			assert.strictEqual(typed_3, 30);
			assert.strictEqual(test_1, 20);
			assert.strictEqual(test_1_before, 19);
			assert.strictEqual(test_1_before_3, 7);
			assert.strictEqual(test_1_before_4, 2);
			assert.strictEqual(typed_4, 0);

			i_four.test1(10);

			assert.strictEqual(typed_3, 30);
			assert.strictEqual(test_1, 20);
			assert.strictEqual(test_1_before, 20);
			assert.strictEqual(test_1_before_3, 8);
			assert.strictEqual(test_1_before_4, 3);
			assert.strictEqual(typed_4, 10);

			i_four.test1(5, true);

			assert.strictEqual(typed_3, 35);
			assert.strictEqual(test_1, 20);
			assert.strictEqual(test_1_before, 21);
			assert.strictEqual(test_1_before_3, 9);
			assert.strictEqual(test_1_before_4, 4);
			assert.strictEqual(typed_4, 15);
		});
	});
});