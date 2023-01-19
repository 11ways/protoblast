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
});