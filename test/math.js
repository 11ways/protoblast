var assert = require('assert'),
    Blast;

describe('Math', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	var originalNumbers = [17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]; // Sum is 116

	describe('.toSource()', function() {
		it('should return the source code representation of the Math object', function() {
			assert.equal(Math.toSource(), 'Math');
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

			assert.equal(result, 6, 'Median value is wrong');
			assert.equal(post, pre, 'The original array was modified');

		});
	});

	describe('.lowest(numbers, amount)', function() {

		it('should return the lowest number', function() {
			var numbers = [99,6,41,32,7];
			assert.equal(Math.lowest(numbers), 6);
		});

		it('should return the wanted amount of numbers', function() {

			var numbers = [1,99,3,470,5,2,63],
			    lowest  = Math.lowest(numbers, 3);

			assert.equal(lowest.join(','), '1,2,3');
		});
	});

	describe('.highest(numbers, amount)', function() {

		it('should return the highest number', function() {
			var numbers = [99,6,41,32,7];
			assert.equal(Math.highest(numbers), 99);
		});

		it('should return the wanted amount of numbers', function() {

			var numbers = [1,99,3,470,5,2,63],
			    highest  = Math.highest(numbers, 3);

			assert.equal(highest.join(','), '63,99,470');
		});
	});

	describe('.clip(numbers, lowest, highest)', function() {
		it('should return array with clipped numbers', function() {

			var numbers = [1,99,3,470,5,2,63],
			    clipped  = Math.clip(numbers, 3, 5);

			assert.equal(clipped.join(','), '3,5,3,5,5,3,5');
			assert.equal(numbers.join(','), '1,99,3,470,5,2,63', 'Original array was modified');
		});
	});

	describe('.sum(numbers)', function() {
		it('should sum up all the numbers', function() {

			var numbers = [1,2,3,4,5],
			    sum  = Math.sum(numbers);

			assert.equal(sum, 15);
		});
	});

	describe('.overlaps(a1, b1, a2, b2)', function() {
		it('should see if the given ranges overlap', function() {

			assert.equal(Math.overlaps(3,7, 1, 4), true);
			assert.equal(Math.overlaps(3,7, 1, 3), true);
			assert.equal(Math.overlaps(3,7, 6, 10), true);
			assert.equal(Math.overlaps(1,3, 6, 10), false);
			assert.equal(Math.overlaps(1,3, -10, 0), false);
			assert.equal(Math.overlaps(10,20, 1, 9), false);
			assert.equal(Math.overlaps(10,20, 1, 11), true);
		});
	});

});