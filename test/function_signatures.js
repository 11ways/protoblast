var assert = require('assert'),
    Signatureless,
    Blast;

describe('Signatures', function() {

	before(function() {
		Blast  = require('../index.js')();

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