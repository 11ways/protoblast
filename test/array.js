var assert = require('assert'),
    Blast;

describe('Array', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

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

		it('should not treat String objects as arrays', function() {

			var original = new String("str"),
			    cast = Array.cast(original);

			assert.equal("str", cast[0]);
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

	describe('.range(start, stop, step)', function() {

		it('should return an array containing arithmetic progressions', function() {
			var arr = Array.range(0, 10, 1);
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());
		});

		it('should be able to only receive the stop parameter', function() {
			var arr = Array.range(10);
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());
		});

		it('should be able to fill in the step parameter', function() {
			var arr = Array.range(0, 10);
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());
		});

		it('should honour use other steps', function() {
			var arr = Array.range(0, 10, 2);
			assert.equal('0,2,4,6,8', arr.join());
		});

		it('should return an empty array for impossible steps', function() {
			var arr = Array.range(0, 10, -1);
			assert.equal('', arr.join());
		});

		it('should allow negative steps for counting down', function() {
			var arr = Array.range(10, 0, -1);
			assert.equal('10,9,8,7,6,5,4,3,2,1', arr.join());
		});

		it('should default non-numeric steps to 1', function() {
			var arr = Array.range(0, 10, 'X');
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());
		});

		it('should handle string arguments', function() {

			var arr = Array.range('10');
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());

			arr = Array.range('0', '10', '1');
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());

			arr = Array.range('0', '10');
			assert.equal('0,1,2,3,4,5,6,7,8,9', arr.join());

			arr = Array.range('0', '10', '-1');
			assert.equal('', arr.join());
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the array', function() {

			var arr = [0,1,2],
			    src = arr.toSource(),
			    match;

			if ('[0,1,2]' == src || '[0, 1, 2]' == src) {
				match = true;
			}

			assert.equal(match, true, 'Source does not match');

			src = arr.toSource(true);
			assert.equal(4, src.count('\n'));

			src = [].toSource();

			assert.equal('[]', src);
		});
	});

	describe('#fill(value, start, end)', function() {

		it('should fill an array completely when start or end is undefined', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(1);
			assert.equal('1,1,1,1,1', arr+'', 'Values are not being filled correctly: ' + arr);

			brr.fill(1, undefined, undefined);

			assert.equal('1,1,1,1,1', brr+'', '`start` & `end` should be allowed to be explicitly undefined');
		});

		it('should respect the start index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 2);
			assert.equal('0,0,1,1,1', arr+'');

			brr.fill(0);
			brr.fill(1, '2');

			arr.fill(0);
			arr.fill(1, 6, 7);

			assert.equal('0,0,0,0,0', arr+'', 'Should ignore start strings that are bigger than length');

			assert.equal('0,0,1,1,1', brr+'', '`start` strings should be cast to numbers');
		});

		it('should allow negative start index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, -2);
			assert.equal('0,0,0,1,1', arr+'');

			brr.fill(0);
			brr.fill(1, '-2');

			assert.equal('0,0,0,1,1', brr+'', '`start` strings should be cast to numbers');
		});

		it('should respect the end index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 2, 4);
			assert.equal('0,0,1,1,0', arr+'');

			brr.fill(0);
			brr.fill(1, '2', '4');

			assert.equal('0,0,1,1,0', brr+'', '`end` strings should be cast to numbers');
		});

		it('should allow negative end index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 0, -2);
			assert.equal('1,1,1,0,0', arr+'');

			brr.fill(0);
			brr.fill(1, '0', '-2');

			assert.equal('1,1,1,0,0', brr+'', '`end` strings should be cast to numbers');
		});

		it('should cast boolean indices to 0 or 1', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);

			arr.fill(1, false, false);
			assert.equal('0,0,0,0,0', arr+'');

			arr.fill(1, false, true);
			assert.equal('1,0,0,0,0', arr+'');

			arr.fill(5, true, true);
			assert.equal('1,0,0,0,0', arr+'');
		});

		it('should set invalid start or end indices to 0', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 'a', 'b');
			assert.equal('0,0,0,0,0', arr+'');

			arr.fill(1, 2, 'b');
			assert.equal('0,0,0,0,0', arr+'');

			arr.fill(1, 'a', 2);
			assert.equal('1,1,0,0,0', arr+'');
		});

		it('should never modify the length of an array', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 0, 10);
			assert.equal('1,1,1,1,1', arr+'');

			brr.fill(0);
			brr.fill(1, 0, '10');
			assert.equal('1,1,1,1,1', brr+'');
		});

	});

	describe('#first(nr, page)', function() {
		it('should return the first value in the array', function() {
			assert.equal(6, [6,4,7,3,47].first());
			assert.equal(1, [1,5,99].first());
		});

		it('should return the wanted page', function() {

			var arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

			assert.equal(1, arr.first(1).length, 'When given a number, first should return an array');
			assert.equal('0,1', arr.first(2), 'Should have returned the first 2 items');
			assert.equal('2,3', arr.first(2, 1), 'Should have returned the second page');
		});
	});

	describe('#last(nr, page)', function() {
		it('should return the last value in the array', function() {
			assert.equal(47, [0,4,7,3,47].last());
			assert.equal(99, [0,5,99].last());
		});

		it('should return the wanted page', function() {

			var arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

			assert.equal(1, arr.last(1).length, 'When given a number, first should return an array');
			assert.equal('8,9', arr.last(2), 'Should have returned the first 2 items');
			assert.equal('6,7', arr.last(2, 1), 'Should have returned the second page');
		});
	});

	describe('#sum(property, map)', function() {

		it('should sum up all the numbers', function() {

			var arr = [0, 1, 2, 3];

			assert.equal(6, arr.sum());
		});

		it('should pass the values to a given function', function() {

			var arr = ['a', 'b', 'c'],
			    sum;

			sum = arr.sum(function code(value) {
				return value.charCodeAt(0);
			});

			assert.equal(294, sum);

			assert.throws(function() {arr.sum(null, true)}, TypeError);
		});

		it('should sum a certain property of the values', function() {

			var arr = [{nr: 0}, {nr: 1}, {nr: 2}],
			    sum;

			sum = arr.sum('nr');

			assert.equal(3, sum);
		});

		it('should sum a certain property of the values and pass it through the function', function() {

			var arr = [{nr: 'a'}, {nr: 'b'}, {nr: 'c'}],
			    sum;

			sum = arr.sum('nr', function code(value) {
				return value.charCodeAt(0);
			});

			assert.equal(294, sum);
		});
	});

	describe('#closest(goal)', function() {
		it('should return the closest value in the array', function() {
			var arr = Array.range(0, 100000, 33);

			assert.equal(3465, arr.closest(3470));
		});

		it('should support negative goals', function() {
			var arr = Array.range(0, 100000, 33);

			assert.equal(0, arr.closest(-1));
		});

		it('should return the first value when a non-numeric string is passed', function() {
			var arr = Array.range(0, 100000, 33);

			assert.equal(0, arr.closest('a'));
		});
	});

	describe('#max()', function() {
		it('should return the highest value in the array', function() {
			var arr = [0, 1, 2, 3, -1, 60, 20];
			assert.equal(60, arr.max());
		});
	});

	describe('#min()', function() {
		it('should return the lowest value in the array', function() {
			var arr = [0, 1, 2, 3, -1, 60, 20];
			assert.equal(-1, arr.min());
		});
	});

	describe('#insert(index, value, ...)', function() {
		it('should insert the value in the original array at the given index', function() {
			var a = [0,1,2,3],
			    inserted = a.insert(2, 'inserted');

			assert.equal(a, inserted, 'The array is not modified in place');
			assert.equal('0,1,inserted,2,3', inserted.join());
		});

		it('should insert all the values given', function() {
			var a = [0,1,2,3],
			    inserted = a.insert(2, 'i1', 'i2');

			assert.equal(a, inserted, 'The array is not modified in place');
			assert.equal('0,1,i1,i2,2,3', inserted.join());
		});

		it('should insert the values at the wanted index, even if the array is not long enough', function() {
			var a = [0,1,2,3],
			    inserted = a.insert(6, 6, 7,8);

			assert.equal(a, inserted, 'The array is not modified in place');
			assert.equal('0,1,2,3,,6,7,8', inserted.join());
		});
	});

	describe('#include(index, values)', function() {
		it('should include an array at the given values', function() {

			var original = [0, 1, 2, 3, 4, 5],
			    second = [99, 98, 97, 96],
			    result;

			result = original.include(2, second);

			assert.equal('0,1,99,98,97,96,2,3,4,5', result+'');
			assert.equal(result+'', original+'', 'Original array was not modified');
			assert.equal('99,98,97,96', second+'', 'Second array was modified');
		});

		it('should include a single value', function() {
			var original = [0,1,2],
			    result = original.include(1, 'a');

			assert.equal('0,a,1,2', result+'');
		});

		it('should enlargen original arrays', function() {
			var original = [0,1,2],
			    result = original.include(5, 'a');

			assert.equal('0,1,2,,,a', result+'');
		});

		it('should allow multiple arrays', function() {
			var original = [0,1,2],
			    result = original.include(3, [3,4], [5,6]);

			assert.equal('0,1,2,3,4,5,6', result+'');
		});
	});

	describe('#flatten()', function() {
		it('should return a single dimension copy of the array', function() {

			var original = [0,1,[2,3,[4,5,[6,7]]], 8, [9,10]],
			    result = original.flatten();

			assert.equal('0,1,2,3,4,5,6,7,8,9,10', original+'');
			assert.equal(false, original == result);
		});

		it('should return objects even when they have the same properties', function() {
			var a = [1,1, {a:1}, {a:1}];

			assert.equal('1,[object Object],[object Object]', a.unique().join(','));
		});
	});

	describe('#unique()', function() {
		it('should return all the unique values', function() {
			var a = [1,2,1,3,6,2];

			assert.equal('1,2,3,6', a.unique().join(','));
		});

		it('should return objects even when they have the same properties', function() {
			var a = [1,1, {a:1}, {a:1}];

			assert.equal('1,[object Object],[object Object]', a.unique().join(','));
		});
	});

	describe('#unique(path)', function() {
		it('should return all the unique values', function() {
			var a = [
				{id: 'a'},
				{id: 'b'},
				{id: 'a'},
				{id: 'c'},
				{id: 'a'},
				{id: 'c'},
				{id: 'd'},
			];

			assert.equal(4, a.unique('id').length);
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

	describe('#employ(args, obj, function)', function() {
		it('apply the given function', function() {

			var args = [[1, 'a'], [2, 'b'], [3, 'c']],
			    result = '';

			args.employ(['$1', '$0'], function(character, number) {
				result += character + number;
			});

			assert.equal('a1b2c3', result);
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

	describe('#createIterator()', function() {

		var arr = ['a', 'b', 'c', 'd'];

		it('should return an iterator', function() {

			var iter = arr.createIterator();

			assert.equal('Iterator', iter.constructor.name);
		});

		it('should iterate', function() {

			var iter = arr.createIterator(),
			    val,
			    abc = '';

			while (iter.hasNext()) {
				val = iter.next().value;
				abc += val;
			}

			assert.equal('abcd', abc);
		});
	});

});
