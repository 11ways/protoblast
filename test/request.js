var assert = require('assert'),
    Blast;

describe('Request', function() {
	before(function() {
		Blast  = require('../index.js')();
	});

	describe('Blast.fetch(url, cb)', function() {
		this.timeout(40000);
		this.slow(2000);

		it('uses Request to download something', function(done) {

			let url;

			if (typeof window == 'undefined') {
				url = 'https://www.github.com/skerit/protoblast';
			} else {
				url = '/index.html';
			}

			Blast.fetch(url, function gotResult(err, response, result) {

				assert.strictEqual(!!err, false);
				assert.strictEqual(result.indexOf('body') > -1, true);
				done();
			});
		});
	});

	describe('Blast.lookup(hostname, options, callback)', function() {
		it('should lookup a hostname', function(done) {

			Blast.Classes.Develry.Request.lookup('elevenways.be', (err, result) => {

				if (err) {
					return done(err);
				}

				assert.strictEqual(typeof result, 'string');
				done();
			});
		});

		it('should cache simultaneous requests', function(done) {

			// This test makes sure the temporary cached pledge gets resolved
			Function.parallel(next => {
				Blast.Classes.Develry.Request.lookup('11ways.be', (err, result) => {

					if (err) {
						return done(err);
					}

					assert.strictEqual(typeof result, 'string');
					next();
				});

			}, next => {
				Blast.Classes.Develry.Request.lookup('11ways.be', (err, result) => {

					if (err) {
						return done(err);
					}

					assert.strictEqual(typeof result, 'string');
					next();
				});

			}, done);
		});
	});
});