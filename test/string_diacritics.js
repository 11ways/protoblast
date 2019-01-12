var assert = require('assert'),
    Blast;

describe('String Diacritics', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#romanize()', function() {
		it('should convert diacritics & strip combining marks', function() {

			var input = 'ⓌḢꜲṰ ìs thát',
			    result = input.romanize();

			assert.strictEqual(result, 'WHAAT is that');
		});
	});

	describe('#diacriticRegex(insensitive, any)', function() {
		it('should create a regex that will ignore accents', function() {

			var input = 'ⓌḢꜲṰ ìs thát',
			    rx;

			// Create case insensitive regex
			rx = 'whaat'.diacriticRegex(true);
			assert.strictEqual(rx.test(input), true);

			rx = 'WHAAT'.diacriticRegex(true);
			assert.strictEqual(rx.test(input), true);

			// Create case sensitive regex
			rx = 'whaat'.diacriticRegex(false);
			assert.strictEqual(rx.test(input), false);

			rx = 'WHAAT'.diacriticRegex(false);
			assert.strictEqual(rx.test(input), true);
		});
	});
});