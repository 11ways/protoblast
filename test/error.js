var assert = require('assert'),
    Blast;

describe('Error', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.unDry() & #toDry()', function() {
		it('should be able to stringify & revive an error', function() {

			var e = new Error('msg'),
			    str = JSON.dry(e),
			    revive = JSON.undry(str);

			assert.equal(revive.message, e.message, 'Message is not equal');
			assert.equal(revive.stack, e.stack, 'Stack is not equal');
		});
	});
});

describe('Develry.Error', function() {
	let CustomError,
	    DeepError;

	describe('Inheritance', function() {
		it('should be able to be inherited', function(done) {

			CustomError = Function.inherits('Develry.Error', function CustomError(message) {
				CustomError.super.call(this, message);
			});

			DeepError = Function.inherits('Develry.CustomError', function DeepError(message) {
				DeepError.super.call(this, 'Deep error "' + message + '"');
			});

			CustomError.constitute(function() {
				done();
			});
		});
	});

	describe('#stack', function() {

		it('should return the correct stack trace', function() {

			var original = new Error('TEST'),
			    custom = new CustomError('TEST'),
			    deep = new DeepError('TEST');

			// They should have almost the same stack, so just compare the length
			assert.strictEqual(custom.stack.split('\n').length, original.stack.split('\n').length);
			assert.strictEqual(deep.stack.split('\n').length, original.stack.split('\n').length);
		});

	});

});