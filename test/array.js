var assert = require('assert'),
    Blast;

describe('Array', function() {

	var empty_array = [],
	    full_array = [0, 1, 2];

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.likeArray(variable)', function() {
		it('should return true if it is an array', function() {
			assert.equal(true, Array.likeArray(empty_array));
		});

		it('should return true if it is an arguments object', function() {
			assert.equal(true, Array.likeArray(arguments));
		});

		it('should return true if it is an array-like object', function(){
			assert.equal(true, Array.likeArray({length: 1}));
		});

		it('should return false if it is not an array-like object', function() {
			assert.equal(false, Array.likeArray(null));
			assert.equal(false, Array.likeArray({}));
			assert.equal(false, Array.likeArray(true));
			assert.equal(false, Array.likeArray('string'));
		});
	});

	describe('.cast(variable)', function() {
		it('should return an array parameter without modifying it', function() {

			var original = [0,1,2,3],
			    cast = Array.cast(original);

			assert.equal(cast, original);
		});

		it('should return an empty array for a parameter with an undefined value', function() {

			var original = undefined,
			    cast = Array.cast(original);

			assert.equal(cast.length, 0);
		});

		it('should return an empty array for no parameter', function() {

			var cast = Array.cast();

			assert.equal(cast.length, 0);
		});

		it('should wrap a null parameter in an array', function() {

			var original = null,
			    cast = Array.cast(original);

			assert.strictEqual(cast[0], null);
		});

		it('should wrap a string parameter in an array', function() {

			var original = "str",
			    cast = Array.cast(original);

			assert.strictEqual(cast[0], "str");
		});

		it('should not treat String objects as arrays', function() {

			var original = new String("str"),
			    cast = Array.cast(original);

			assert.equal(cast[0], "str");
		});

		it('should wrap a number parameter in an array', function() {

			var original = 10,
			    cast = Array.cast(original);

			assert.strictEqual(cast[0], 10);
		});

		it('should wrap an object parameter in an array', function() {

			var original = {},
			    cast = Array.cast(original);

			assert.strictEqual(cast[0], original);
		});

		it('should wrap a function parameter in an array', function() {

			var original = function(){},
			    cast = Array.cast(original);

			assert.strictEqual(cast[0], original);
		});

		it('should cast function arguments objects to an actual array', function() {

			(function(a,b,c) {

				var cast = Array.cast(arguments);

				assert.equal(Array.isArray(cast), true, "Cast variable is not an array");
				assert.strictEqual(cast.length, arguments.length, "Cast variable does not have the same length as original arguments");
			}(1,2,3));
		});

		it('should cast other array-like objects to an actual array', function() {

			var obj = {1:1, 5:1, length: 6},
			    cast = Array.cast(obj);

			assert.equal(Array.isArray(cast), true, "Cast variable is not an array");
			assert.strictEqual(cast.length, 6, "Cast variable does not have the same length as original arguments");
			assert.strictEqual(cast[5], 1, "Index values don't match to the original object");
		});
	});

	describe('.range(start, stop, step)', function() {

		it('should return an array containing arithmetic progressions', function() {
			var arr = Array.range(0, 10, 1);
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');
		});

		it('should be able to only receive the stop parameter', function() {
			var arr = Array.range(10);
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');
		});

		it('should be able to fill in the step parameter', function() {
			var arr = Array.range(0, 10);
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');
		});

		it('should honour use other steps', function() {
			var arr = Array.range(0, 10, 2);
			assert.equal(arr.join(), '0,2,4,6,8');
		});

		it('should return an empty array for impossible steps', function() {
			var arr = Array.range(0, 10, -1);
			assert.equal(arr.join(), '');
		});

		it('should allow negative steps for counting down', function() {
			var arr = Array.range(10, 0, -1);
			assert.equal(arr.join(), '10,9,8,7,6,5,4,3,2,1');
		});

		it('should default non-numeric steps to 1', function() {
			var arr = Array.range(0, 10, 'X');
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');
		});

		it('should handle string arguments', function() {

			var arr = Array.range('10');
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');

			arr = Array.range('0', '10', '1');
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');

			arr = Array.range('0', '10');
			assert.equal(arr.join(), '0,1,2,3,4,5,6,7,8,9');

			arr = Array.range('0', '10', '-1');
			assert.equal(arr.join(), '');
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

			assert.equal(src, '[]');
		});
	});

	describe('#fill(value, start, end)', function() {

		it('should fill an array completely when start or end is undefined', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(1);
			assert.equal(arr+'', '1,1,1,1,1', 'Values are not being filled correctly: ' + arr);

			brr.fill(1, undefined, undefined);

			assert.equal(brr+'', '1,1,1,1,1', '`start` & `end` should be allowed to be explicitly undefined');
		});

		it('should respect the start index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 2);
			assert.equal(arr+'', '0,0,1,1,1');

			brr.fill(0);
			brr.fill(1, '2');

			arr.fill(0);
			arr.fill(1, 6, 7);

			assert.equal(arr+'', '0,0,0,0,0', 'Should ignore start strings that are bigger than length');

			assert.equal(brr+'', '0,0,1,1,1', '`start` strings should be cast to numbers');
		});

		it('should allow negative start index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, -2);
			assert.equal(arr+'', '0,0,0,1,1');

			brr.fill(0);
			brr.fill(1, '-2');

			assert.equal(brr+'', '0,0,0,1,1', '`start` strings should be cast to numbers');
		});

		it('should respect the end index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 2, 4);
			assert.equal(arr+'', '0,0,1,1,0');

			brr.fill(0);
			brr.fill(1, '2', '4');

			assert.equal(brr+'', '0,0,1,1,0', '`end` strings should be cast to numbers');
		});

		it('should allow negative end index', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 0, -2);
			assert.equal(arr+'', '1,1,1,0,0');

			brr.fill(0);
			brr.fill(1, '0', '-2');

			assert.equal(brr+'', '1,1,1,0,0', '`end` strings should be cast to numbers');
		});

		it('should cast boolean indices to 0 or 1', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);

			arr.fill(1, false, false);
			assert.equal(arr+'', '0,0,0,0,0');

			arr.fill(1, false, true);
			assert.equal(arr+'', '1,0,0,0,0');

			arr.fill(5, true, true);
			assert.equal(arr+'', '1,0,0,0,0');
		});

		it('should set invalid start or end indices to 0', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 'a', 'b');
			assert.equal(arr+'', '0,0,0,0,0');

			arr.fill(1, 2, 'b');
			assert.equal(arr+'', '0,0,0,0,0');

			arr.fill(1, 'a', 2);
			assert.equal(arr+'', '1,1,0,0,0');
		});

		it('should never modify the length of an array', function() {

			var arr = new Array(5),
			    brr = new Array(5);

			arr.fill(0);
			arr.fill(1, 0, 10);
			assert.equal(arr+'', '1,1,1,1,1');

			brr.fill(0);
			brr.fill(1, 0, '10');
			assert.equal(brr+'', '1,1,1,1,1');
		});
	});

	describe('#move(oldIndex, newIndex)', function() {
		it('should move elements', function() {
			var arr = [0, 1, 2, 3, 4];
			arr.move(0, 3);

			assert.equal(arr.join(','), '1,2,3,0,4');
		});

		it('should find elements first', function() {

			var arr = ['a', 'b', 'c', 'd'];
			arr.move('a', 'c');

			assert.equal(arr.join(','), 'b,c,a,d');
		});

		it('should do nothing if it can\'t find the value', function() {

			var arr = ['a', 'b', 'c'];
			arr.move('a', 'x');

			assert.equal(arr.join(','), 'a,b,c');
		});

		it('should enlarge arrays if needed', function() {

			var arr = ['a', 'b', 'c'];
			arr.move(-1, 5);

			assert.equal(arr.join(','), 'a,b,,,,c');
		});

		it('should allow negative new indexes', function() {

			var arr = [0, 1, 2, 3];
			arr.move(1, -1);

			assert.equal(arr.join(','), '0,2,3,1');

		});
	});

	describe('#first(nr, page)', function() {
		it('should return the first value in the array', function() {
			assert.equal([6,4,7,3,47].first(), 6);
			assert.equal([1,5,99].first(), 1);
		});

		it('should return the wanted page', function() {

			var arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

			assert.equal(arr.first(1).length, 1, 'When given a number, first should return an array');
			assert.equal(arr.first(2), '0,1', 'Should have returned the first 2 items');
			assert.equal(arr.first(2, 1), '2,3', 'Should have returned the second page');
		});
	});

	describe('#last(nr, page)', function() {
		it('should return the last value in the array', function() {
			assert.equal([0,4,7,3,47].last(), 47);
			assert.equal([0,5,99].last(), 99);
		});

		it('should return the wanted page', function() {

			var arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

			assert.equal(arr.last(1).length, 1, 'When given a number, first should return an array');
			assert.equal(arr.last(2), '8,9', 'Should have returned the first 2 items');
			assert.equal(arr.last(2, 1), '6,7', 'Should have returned the second page');
		});
	});

	describe('#sum(property, map)', function() {

		it('should sum up all the numbers', function() {

			var arr = [0, 1, 2, 3];

			assert.equal(arr.sum(), 6);
		});

		it('should pass the values to a given function', function() {

			var arr = ['a', 'b', 'c'],
			    sum;

			sum = arr.sum(function code(value) {
				return value.charCodeAt(0);
			});

			assert.equal(sum, 294);

			assert.throws(function() {arr.sum(null, true)}, TypeError);
		});

		it('should sum a certain property of the values', function() {

			var arr = [{nr: 0}, {nr: 1}, {nr: 2}],
			    sum;

			sum = arr.sum('nr');

			assert.equal(sum, 3);
		});

		it('should sum a certain property of the values and pass it through the function', function() {

			var arr = [{nr: 'a'}, {nr: 'b'}, {nr: 'c'}],
			    sum;

			sum = arr.sum('nr', function code(value) {
				return value.charCodeAt(0);
			});

			assert.equal(sum, 294);
		});
	});

	describe('#clip(lowest, highest)', function() {
		it('should clip lowest values', function() {
			var arr = [0, 2, 55, 3, 76];
			arr.clip(3);

			assert.equal(arr.join(','), '3,3,55,3,76');
		});

		it('should clip highest values', function() {
			var arr = [0, 2, 55, 78, 64];
			arr.clip(null, 55);

			assert.equal(arr.join(','), '0,2,55,55,55');
		});
	});

	describe('#closest(goal)', function() {
		it('should return the closest value in the array', function() {
			var arr = Array.range(0, 100000, 33);

			assert.equal(arr.closest(3470), 3465);
		});

		it('should support negative goals', function() {
			var arr = Array.range(0, 100000, 33);

			assert.equal(arr.closest(-1), 0);
		});

		it('should return the first value when a non-numeric string is passed', function() {
			var arr = Array.range(0, 100000, 33);

			assert.equal(arr.closest('a'), 0);
		});
	});

	describe('#max()', function() {
		it('should return the highest value in the array', function() {
			var arr = [0, 1, 2, 3, -1, 60, 20];
			assert.equal(arr.max(), 60);
		});
	});

	describe('#min()', function() {
		it('should return the lowest value in the array', function() {
			var arr = [0, 1, 2, 3, -1, 60, 20];
			assert.equal(arr.min(), -1);
		});
	});

	describe('#insert(index, value, ...)', function() {
		it('should insert the value in the original array at the given index', function() {
			var a = [0,1,2,3],
			    inserted = a.insert(2, 'inserted');

			assert.equal(inserted, a, 'The array is not modified in place');
			assert.equal(inserted.join(), '0,1,inserted,2,3');
		});

		it('should insert all the values given', function() {
			var a = [0,1,2,3],
			    inserted = a.insert(2, 'i1', 'i2');

			assert.equal(inserted, a, 'The array is not modified in place');
			assert.equal(inserted.join(), '0,1,i1,i2,2,3');
		});

		it('should insert the values at the wanted index, even if the array is not long enough', function() {
			var a = [0,1,2,3],
			    inserted = a.insert(6, 6, 7,8);

			assert.equal(inserted, a, 'The array is not modified in place');
			assert.equal(inserted.join(), '0,1,2,3,,6,7,8');
		});
	});

	describe('#include(index, values)', function() {
		it('should include an array at the given values', function() {

			var original = [0, 1, 2, 3, 4, 5],
			    second = [99, 98, 97, 96],
			    result;

			result = original.include(2, second);

			assert.equal(result+'', '0,1,99,98,97,96,2,3,4,5');
			assert.equal(result+'', original+'', 'Original array was not modified');
			assert.equal(second+'', '99,98,97,96', 'Second array was modified');
		});

		it('should include a single value', function() {
			var original = [0,1,2],
			    result = original.include(1, 'a');

			assert.equal(result+'', '0,a,1,2');
		});

		it('should enlargen original arrays', function() {
			var original = [0,1,2],
			    result = original.include(5, 'a');

			assert.equal(result+'', '0,1,2,,,a');
		});

		it('should allow multiple arrays', function() {
			var original = [0,1,2],
			    result = original.include(3, [3,4], [5,6]);

			assert.equal(result+'', '0,1,2,3,4,5,6');
		});

		it('should append when no index is given', function() {
			var original = [0,1,2],
			    result = original.include([3,4], [5,6]);

			assert.equal(result+'', '0,1,2,3,4,5,6');
		});
	});

	describe('#flatten()', function() {
		it('should return a single dimension copy of the array', function() {

			var original = [0,1,[2,3,[4,5,[6,7]]], 8, [9,10]],
			    result = original.flatten();

			assert.equal(original.length, 5, 'Original array was modified');
			assert.equal(result.length, 11, 'Array was not flattened');
			assert.equal(original == result, false);
		});

		it('should honour the recursive limit', function() {
			var original = [0, 1, [2, [3, 4]]],
			    result = original.flatten(1);

			assert.equal(result.length, 4);
		});
	});

	describe('#unique()', function() {
		it('should return all the unique values', function() {
			var a = [1,2,1,3,6,2];

			assert.equal(a.unique().join(','), '1,2,3,6');
		});

		it('should return objects even when they have the same properties', function() {
			var a = [1,1, {a:1}, {a:1}];

			assert.equal(a.unique().join(','), '1,[object Object],[object Object]');
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

			assert.equal(a.unique('id').length, 4);
		});
	});

	describe('#shared(secondArray)', function() {
		it('should return the shared values between 2 arrays as an array', function() {

			var a = [0,1,2,47,99,100],
			    b = [2,47,55,96,200],
			    shared = a.shared(b);

			assert.equal(shared.length, 2);
		});

		it('should cast values first', function() {

			var a = ['1', '2', '3', '4'],
			    b = ['1.1', '2.0', '3.3', '4.0'],
			    shared = a.shared(b, Number);

			assert.equal(JSON.stringify(shared), '["2","4"]');
		});
	});

	describe('#subtract(secondArrayOrVariable)', function() {
		it('return all the values of the first array that are not in the second array', function() {

			var a = [0,1,2,47,99,100],
			    b = [2,47,55,96,200],
			    subtract = a.subtract(b),
			    subtractb = b.subtract(a);

			// The order of the subtraction is important
			assert.equal(subtract.length, 4);
			assert.equal(subtractb.length, 3);
		});

		it('remove the given variable from the first array', function() {

			var a = [0,1,2,47,99,100],
			    subtract = a.subtract(100);

			// The order of the subtraction is important
			assert.equal(subtract.length, 5);
		});

		it('cast the variables before subtracting', function() {

			var a = [0,1,2,47,99,100.5],
			    subtract;

			// This should cast the 100.5 to 100 before matching
			subtract = a.subtract(100, parseInt);

			// The order of the subtraction is important
			assert.equal(subtract.length, 5);
		});
	});

	describe('#exclusive(secondArray)', function() {
		it('return all the values that are in the first array or in the second array, but not in both', function() {

			var a = [0,1,2,47,99,100],
			    b = [2,47,55,96,200],
			    exclusive = a.exclusive(b),
			    exclusiveb = b.exclusive(a);

			// It should not matter in which order exclusive is calculated
			assert.equal(exclusive.length, 7);
			assert.equal(exclusiveb.length, 7);
		});
	});

	describe('#clean(valueToRemove)', function() {
		it('remove all undefined variables from the array in-place', function() {

			var a = [0,undefined,2,null,undefined,6],
			    clean = a.clean();

			// The cleaning happens in-place
			assert.equal(clean, a);

			assert.equal(clean.length, 4);
		});

		it('remove all the instances of the given parameter from the array', function() {

			var a = [0,1,2,6,1,4,7,9,1],
			    clean = a.clean(1);

			// The cleaning happens in-place
			assert.equal(clean, a);

			assert.equal(clean.length, 6);
		});
	});

	describe('#sortByPath', function() {

		it('should sort the given path', function() {

			var arr = [
				{a: 3},
				{a: 1},
				{a: 2},
				{a: 0}
			];

			arr.sortByPath('a');

			assert.equal(JSON.stringify(arr), '[{"a":3},{"a":2},{"a":1},{"a":0}]');
		});

		it('should be stable', function() {

			var arr = [
				{a: 3},
				{a: 1, s: 0},
				{a: 1, s: 1},
				{a: 0}
			];

			arr.sortByPath('a');

			assert.equal(JSON.stringify(arr), '[{"a":3},{"a":1,"s":0},{"a":1,"s":1},{"a":0}]');

		});

		it('should reverse the sort', function() {
			var arr = [
				{a: 3},
				{a: 1},
				{a: 2},
				{a: 0}
			];

			arr.sortByPath(1, 'a');

			assert.equal(JSON.stringify(arr), '[{"a":0},{"a":1},{"a":2},{"a":3}]');
		});

		it('should sort multiple paths', function() {

			var arr = [
				{a: 0, b: 1},
				{a: 0, b: 0},
				{a: 5, b: 1},
				{a: 5, b: 0}
			];

			arr.sortByPath(['a', 'b']);

			assert.equal(JSON.stringify(arr), '[{"a":5,"b":1},{"a":5,"b":0},{"a":0,"b":1},{"a":0,"b":0}]');
		});
	});

	describe('#createIterator()', function() {

		var arr = ['a', 'b', 'c', 'd'];

		it('should return an iterator', function() {

			var iter = arr.createIterator();

			assert.equal(iter.constructor.name, 'Iterator');
		});

		it('should iterate', function() {

			var iter = arr.createIterator(),
			    val,
			    abc = '';

			while (iter.hasNext()) {
				val = iter.next().value;
				abc += val;
			}

			assert.equal(abc, 'abcd');
		});
	});

});
