var assert = require('assert'),
    Blast;

describe('Map', function() {

	before(function() {
		Blast = require('../index.js')();
	});

	describe('#toDry()', function() {
		it('should serialize the input', function() {

			const original = new Map();
			original.set('a', 1);
			original.set('b', 2);

			let dried = JSON.dry(original);

			let revived = JSON.undry(dried);

			assert.strictEqual(revived.size, 2);
		});
	});
});