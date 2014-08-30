var Blast  = require('../index.js')();

suite('Math', function() {

	bench('#lowest(arr, amount)', function() {
		Math.lowest([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6], 4);
	});

	bench('#highest(arr, amount)', function() {
		Math.highest([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6], 4);
	});

	bench('#sum(arr)', function() {
		Math.sum([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#mean(arr)', function() {
		Math.mean([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#standardize(arr)', function() {
		Math.standardize([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#variance(arr)', function() {
		Math.variance([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#covariance(arrX, arrY)', function() {
		Math.covariance([17, 17, 3, 2, 4, 8, 1, 0, 3], [1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#pearson(arrX, arrY)', function() {
		Math.pearson([17, 17, 3, 2, 4, 8, 1, 0, 3], [1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#spearman(arrX, arrY)', function() {
		Math.spearman([17, 17, 3, 2, 4, 8, 1, 0, 3], [1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#deviation(arr)', function() {
		Math.deviation([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#standardDeviation(arr)', function() {
		Math.standardDeviation([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

	bench('#median(arr)', function() {
		Math.median([17, 17, 3, 2, 4, 8, 1, 0, 3, 1, 7, 12, 6, 13, 2, 14, 6]);
	});

});