var assert = require('assert'),
    Blast;

describe('Math', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	var originalNumbers = [17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]; // Sum is 116

	describe('.Median(numbers)', function() {

		it('should return the median value of the numbers without changing the original array', function() {

			var numbers = originalNumbers.slice(0),
			    pre = ''+numbers,
			    post,
			    result;

			result = Math.median(numbers);
			post = ''+numbers;

			assert.equal(6, result, 'Median value is wrong');
			assert.equal(pre, post, 'The original array was modified');

		});

	});

	describe('#toSource()', function() {
		it('should return the source code representation of the Math object', function() {
			assert.equal('Math', Math.toSource());
		});
	});

});