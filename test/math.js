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

	describe('.median(numbers)', function() {

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

		it('should use the arguments', function() {
			assert.equal(Math.median(4, 9, 3), 4);
			assert.equal(Math.median(1, 2, 4, 9), 3);
		});
	});

	describe('.mean(numbers)', function() {

		it('should return the mean value of the numbers', function() {

			var numbers = originalNumbers.slice(0),
			    result;

			result = Math.mean([1, 4, 10]);

			assert.equal(result, 5, 'The mean value should be 5');
		});

		it('should use the arguments', function() {
			assert.equal(Math.mean(1, 4, 10), 5);
		});
	});

	describe('.standardize(numbers)', function() {

		it('should return the standardized values of the input', function() {

			var output,
			    input;

			// Prepare the input values
			input = [0, 1, 3];

			// Get the standardized output
			output = Math.standardize(input);

			assert.equal(Math.mean(output), 0, 'The mean value of standardized values should always be 0');

			// The standardDeviation of standardized values should be 1,
			// but these examples give 0.999... That's just a floating point rounding error thing
		});

		it('should use the arguments', function() {
			var output;

			// Get the standardized output
			output = Math.standardize(0, 1, 3);

			assert.equal(Math.mean(output), 0, 'The mean value of standardized values should always be 0');
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

			assert.equal(15, sum);
		});

		it('should sum up all the given arguments', function() {
			assert.equal(15, Math.sum(1, 2, 3, 4, 5));
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

	describe('.calculateDistance(lat1, lon1, lat2, lon2)', function() {
		it('should calculate the distance between 2 coordinates', function() {

			var result,
			    // Lennik
			    lat1 = 50.822449,
			    lon1 = 4.153749,
			    // Gent
			    lat2 = 51.056828,
			    lon2 = 3.723817;

			result = Math.calculateDistance(lat1, lon1, lat2, lon2);

			assert.equal(result, 39833.347841518036);
		});
	});

	describe('.createSeededRng(seed)', function() {
		it('should create a seeded Random Number Generator', function() {
			var instance = Math.createSeededRng();

			assert.equal(instance.multiplier, 1664525);
			assert.equal(typeof instance.random, 'function');
		});
	});

	describe('.interpolate(numbers, newlength)', function() {
		it('should interpolate missing numbers', function() {

			var input = [0, 10],
			    three = Math.interpolate(input, 3),
			    five = Math.interpolate(input, 5);

			assert.equal(three.join(','), '0,5,10');
			assert.equal(five.join(','), '0,2.5,5,7.5,10');
		});
	});

	describe('.removeOutliers(numbers, clip)', function() {
		it('should remove outliers', function() {

			var numbers = [99, 2, 4, 5, 7, 1],
			    output = Math.removeOutliers(numbers);

			assert.equal(output.join(','), '2,4,5,7,1');
		});

		it('should clip outliers to their highest allowed value', function() {
			var numbers = [99, 2, 4, 5, 7, 1],
			    output = Math.removeOutliers(numbers, true);

			assert.equal(output.join(','), '10.5,2,4,5,7,1');
		});
	});

});