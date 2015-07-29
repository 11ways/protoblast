var assert = require('assert'),
    Blast;

describe('Benchmark', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('Function.benchmark(fnc)', function() {
		it('should benchmark the given function', function() {

			var old = console.log,
			    captured;

			console.log = function(message) {
				captured = message;
			}

			var result = Function.benchmark(function indexOfTest() {
				'test'.indexOf('t');
			});

			console.log = old;

			assert.equal(result.iterations > 1, true);
			assert.equal(result.max > 1, true);
			assert.equal(result.ops > 1, true);
			assert.equal(result.median > 1, true);
			assert.equal(result.mean > 1, true);
			assert.equal(isFinite(result.deviation), true);
			assert.equal(isFinite(result.samplecount), true);
			assert.equal(isFinite(result.samplehit), true);
			assert.equal(captured.length > 0, true);
			assert.equal(captured.indexOf('indexOfTest') > 0, true, 'Function name was not found in the captured message');
		});
	});
});