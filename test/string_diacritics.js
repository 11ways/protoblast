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

			// Look for any word?
			rx = 'whaat is that'.diacriticRegex(true, true);
			assert.strictEqual(rx.test('ìs'), true);
		});

		it('should leave regular symbols alone', function() {
			var input = 'Ⓦhy #',
			    rx = 'why #'.diacriticRegex(true);

			assert.strictEqual(rx.test(input), true);

			rx = 'Why #'.diacriticRegex(false);
			assert.strictEqual(rx.test(input), true);
		});
	});

	describe('#containsHebrew()', function() {
		it('should return a boolean', function() {
			assert.strictEqual("׆".containsHebrew(), true);
			assert.strictEqual("a".containsHebrew(), false);
		});
	});

	describe('#containsJapanese()', function() {
		it('should return a boolean', function() {
			assert.strictEqual("々".containsJapanese(), true);
			assert.strictEqual("a".containsJapanese(), false);
		});
	});
});