var Blast  = require('../index.js')();

suite ('Array (builtins)', function() {

	bench('#slice(0)', function() {
		[17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6].slice(0);
	});

	bench('#slice()', function() {
		[17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6].slice();
	});

});

suite('Array', function() {

	var arr = [0,1,2,3,10,30,90, "string", {}],
	    ins = [0,1,2,3,4],
	    sec = [1,4,9,80],
	    dup = [0,1,3,4,1,2,4,9,6,5,7,1,2,3,6,7,8],
	    unclean = [1,4,,9,3,,4,,7,8,,10,,6,,98,,,6,1,,2];

	bench('.cast("string")', function() {
		Array.cast("string");
	});

	bench('.cast([])', function() {
		Array.cast([]);
	});

	bench('.cast()', function() {
		Array.cast();
	});

	bench('.range(start, stop, step)', function() {
		Array.range(0,10,1);
	});

	bench('#toSource()', function() {
		arr.toSource();
	});

	bench('#first()', function() {
		arr.first();
	});

	bench('#last()', function() {
		arr.last();
	});

	bench('#closest(goal)', function() {
		arr.closest(50);
	});

	bench('#unique()', function() {
		dup.unique();
	});

	bench('#shared(arr)', function() {
		ins.shared(sec);
	});

	bench('#subtract(arr)', function() {
		ins.subtract(sec);
	});

	bench('#exclusive(arr)', function() {
		ins.exclusive(sec);
	});

	bench('#clean()', function() {
		unclean.clean(undefined);
	});

	bench('#createIterator()', function() {
		ins.createIterator();
	});
});

suite('Array#insert', function() {

	var ins, one;

	beforeEach(function() {
		ins = [0,1,2,3,4,5];
		one = [0];
	});

	bench('#insert(index, value) - Existing index', function() {
		ins.insert(2, 'ins');
	});

	bench('#insert(index, value) - Non-existing index', function() {
		one.insert(9, 'ins');
	});
});