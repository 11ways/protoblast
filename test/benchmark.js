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

			assert.equal(true, result.iterations > 1);
			assert.equal(true, result.max > 1);
			assert.equal(true, result.ops > 1);
			assert.equal(true, result.median > 1);
			assert.equal(true, result.mean > 1);
			assert.equal(true, isFinite(result.deviation));
			assert.equal(true, isFinite(result.samplecount));
			assert.equal(true, isFinite(result.samplehit));
			assert.equal(true, captured.length > 0);
			assert.equal(true, captured.indexOf('indexOfTest') > 0, 'Function name was not found in the captured message');
		});
	});
});