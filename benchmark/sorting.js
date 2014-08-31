var Blast  = require('../index.js')();

suite('Array Sorting', function() {

	function lowToHigh(a, b) {
		return a - b;
	}

	bench('#sort()          - Builtin (alphabetical)', function() {
		[17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6].sort();
	});

	bench('#sort(lowToHigh) - Builtin + function', function() {
		[17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6].sort(lowToHigh);
	});

	bench('#flashsort()', function() {
		[17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6].flashsort();
	});

});