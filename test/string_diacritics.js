var assert = require('assert'),
    Blast;

describe('String Diacritics', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.romanize()', function() {
		it('should convert diacritics & strip combining marks', function() {

			var input = 'ⓌḢꜲṰ ìs thát',
			    result = input.romanize();

			assert.strictEqual(result, 'WHAAT is that');
		});
	});
});