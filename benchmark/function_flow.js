var Blast  = require('../index.js')();

suite('Function Flow', function() {

	var arrTasks = [],
	    objTasks = {},
	    pArrTasks = [],
	    pObjTasks = {},
	    i;

	Array.range(4).forEach(function(i) {

		pArrTasks[i] = function(next) {
			Blast.setImmediate(function() {
				next(null);
			});
		};

		pObjTasks['Named task ' + i] = function(next) {
			Blast.setImmediate(function() {
				next(null);
			});
		};

		// Only schedule 2 tasks for the series benchmarks
		if (i > 1) return;

		arrTasks[i] = function(next) {
			Blast.setImmediate(function() {
				next(null);
			});
		};

		objTasks['Named task ' + i] = function(next) {
			Blast.setImmediate(function() {
				next(null);
			});
		};
	});

	bench('.series(arrayTasks, callback) - 2 tasks', function(next) {
		Function.series(arrTasks, function(err, result) {
			next();
		});
	});

	bench('.series(objectTasks, callback) - 2 tasks', function(next) {
		Function.series(objTasks, function(err, result) {
			next();
		});
	});

	bench('.parallel(arrayTasks, callback) - 4 tasks', function(next) {
		Function.parallel(pArrTasks, function(err, result) {
			next();
		});
	});

	bench('.parallel(objectTasks, callback) - 4 tasks', function(next) {
		Function.parallel(pObjTasks, function(err, result) {
			next();
		});
	});

	bench('.parallel(2, arrayTasks, callback) - 4 tasks', function(next) {
		Function.parallel(pArrTasks, function(err, result) {
			next();
		});
	});

	bench('.parallel(2, objectTasks, callback) - 4 tasks', function(next) {
		Function.parallel(pObjTasks, function(err, result) {
			next();
		});
	});

});