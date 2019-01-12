var assert = require('assert'),
    Blast;

describe('Request', function() {
	before(function() {
		Blast  = require('../index.js')();
	});

	describe('Blast.fetch(url, cb)', function() {
		this.timeout(30000);
		this.slow(1000);

		it('uses Request to download something', function(done) {

			Blast.fetch('https://www.github.com/skerit/protoblast', function gotResult(err, response, result) {

				assert.strictEqual(!!err, false);
				assert.strictEqual(result.indexOf('body') > -1, true);
				done();
			});
		});
	});
});