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