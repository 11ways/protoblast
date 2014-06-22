var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Array', function() {

	describe('.cast(variable)', function() {
		it('should return an array parameter without modifying it', function() {

			var original = [0,1,2,3],
			    cast = Array.cast(original);

			assert.equal(original, cast);
		});

		it('should return an empty array for a parameter with an undefined value', function() {

			var original = undefined,
			    cast = Array.cast(original);

			assert.equal(0, cast.length);
		});

		it('should return an empty array for no parameter', function() {

			var cast = Array.cast();

			assert.equal(0, cast.length);
		});

		it('should wrap a null parameter in an array', function() {

			var original = null,
			    cast = Array.cast(original);

			assert.strictEqual(null, cast[0]);
		});

		it('should wrap a string parameter in an array', function() {

			var original = "str",
			    cast = Array.cast(original);

			assert.strictEqual("str", cast[0]);
		});

		it('should wrap a number parameter in an array', function() {

			var original = 10,
			    cast = Array.cast(original);

			assert.strictEqual(10, cast[0]);
		});

		it('should wrap an object parameter in an array', function() {

			var original = {},
			    cast = Array.cast(original);

			assert.strictEqual(original, cast[0]);
		});

		it('should wrap a function parameter in an array', function() {

			var original = function(){},
			    cast = Array.cast(original);

			assert.strictEqual(original, cast[0]);
		});

		it('should cast function arguments objects to an actual array', function() {

			(function(a,b,c) {

				var cast = Array.cast(arguments);

				assert.equal(true, Array.isArray(cast), "Cast variable is not an array");
				assert.strictEqual(arguments.length, cast.length, "Cast variable does not have the same length as original arguments");
			}(1,2,3));
		});

		it('should cast other array-like objects to an actual array', function() {

			var obj = {1:1, 5:1, length: 6},
			    cast = Array.cast(obj);

			assert.equal(true, Array.isArray(cast), "Cast variable is not an array");
			assert.strictEqual(6, cast.length, "Cast variable does not have the same length as original arguments");
			assert.strictEqual(1, cast[5], "Index values don't match to the original object");
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the array', function() {
			var arr = [0,1,2];
			assert.equal('[0,1,2]', arr.toSource());
		});
	});

	describe('#first()', function() {
		it('should return the first value in the array', function() {
			assert.equal(6, [6,4,7,3,47].first());
			assert.equal(1, [1,5,99].first());
		});
	});

	describe('#last()', function() {
		it('should return the last value in the array', function() {
			assert.equal(47, [0,4,7,3,47].last());
			assert.equal(99, [0,5,99].last());
		});
	});

	describe('#shared(secondArray)', function() {
		it('should return the shared values between 2 arrays as an array', function() {

			var a = [0,1,2,47,99,100],
			    b = [2,47,55,96,200],
			    shared = a.shared(b);

			assert.equal(2, shared.length);
		});
	});

	describe('#subtract(secondArrayOrVariable)', function() {
		it('return all the values of the first array that are not in the second array', function() {

			var a = [0,1,2,47,99,100],
			    b = [2,47,55,96,200],
			    subtract = a.subtract(b),
			    subtractb = b.subtract(a);

			// The order of the subtraction is important
			assert.equal(4, subtract.length);
			assert.equal(3, subtractb.length);
		});

		it('remove the given variable from the first array', function() {

			var a = [0,1,2,47,99,100],
			    subtract = a.subtract(100);

			// The order of the subtraction is important
			assert.equal(5, subtract.length);
		});
	});

	describe('#exclusive(secondArray)', function() {
		it('return all the values that are in the first array or in the second array, but not in both', function() {

			var a = [0,1,2,47,99,100],
			    b = [2,47,55,96,200],
			    exclusive = a.exclusive(b),
			    exclusiveb = b.exclusive(a);

			// It should not matter in which order exclusive is calculated
			assert.equal(7, exclusive.length);
			assert.equal(7, exclusiveb.length);
		});
	});

	describe('#clean(valueToRemove)', function() {
		it('remove all undefined variables from the array in-place', function() {

			var a = [0,undefined,2,null,undefined,6],
			    clean = a.clean();

			// The cleaning happens in-place
			assert.equal(a, clean);

			assert.equal(4, clean.length);
		});

		it('remove all the instances of the given parameter from the array', function() {

			var a = [0,1,2,6,1,4,7,9,1],
			    clean = a.clean(1);

			// The cleaning happens in-place
			assert.equal(a, clean);

			assert.equal(6, clean.length);
		});
	});

});
