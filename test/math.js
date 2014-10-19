var assert = require('assert'),
    Blast;

describe('Math', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	var originalNumbers = [17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]; // Sum is 116

	describe('.toSource()', function() {
		it('should return the source code representation of the Math object', function() {
			assert.equal('Math', Math.toSource());
		});
	});

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

	describe('.lowest(numbers, amount)', function() {
		it('should return the wanted amount of numbers', function() {

			var numbers = [1,99,3,470,5,2,63],
			    lowest  = Math.lowest(numbers, 3);

			assert.equal('1,2,3', lowest.join(','));
		});
	});

	describe('.highest(numbers, amount)', function() {
		it('should return the wanted amount of numbers', function() {

			var numbers = [1,99,3,470,5,2,63],
			    highest  = Math.highest(numbers, 3);

			assert.equal('63,99,470', highest.join(','));
		});
	});

	describe('.clip(numbers, lowest, highest)', function() {
		it('should return array with clipped numbers', function() {

			var numbers = [1,99,3,470,5,2,63],
			    clipped  = Math.clip(numbers, 3, 5);

			assert.equal('3,5,3,5,5,3,5', clipped.join(','));
			assert.equal('1,99,3,470,5,2,63', numbers.join(','), 'Original array was modified');
		});
	});

	describe('.sum(numbers)', function() {
		it('should sum up all the numbers', function() {

			var numbers = [1,2,3,4,5],
			    sum  = Math.sum(numbers);

			assert.equal(15, sum);
		});
	});

});