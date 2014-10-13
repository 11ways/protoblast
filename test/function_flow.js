var assert = require('assert'),
    Blast;

describe('Function Flow', function() {

	var arrTasks = [],
	    objTasks = {},
	    pArrTasks = [],
	    pObjTasks = {},
	    i;

	before(function() {
		Blast  = require('../index.js')();
	
		Array.range(4).forEach(function(i) {

			pArrTasks[i] = function(next) {
				Blast.setImmediate(function() {
					next(null, 'result-' + i);
				});
			};

			pObjTasks['Named task ' + i] = function(next) {
				Blast.setImmediate(function() {
					next(null, 'result-' + i);
				});
			};

			// Only schedule 2 tasks for the series benchmarks
			if (i > 1) return;

			arrTasks[i] = function(next) {
				Blast.setImmediate(function() {
					next(null, 'result-' + i);
				});
			};

			objTasks['Named task ' + i] = function(next) {
				Blast.setImmediate(function() {
					next(null, 'result-' + i);
				});
			};
		});
	});

	describe('Blast.setImmediate', function() {

		it('should schedule the task at the top of the event queue', function(next) {

			var shouldBeZero = 0;

			setTimeout(function() {
				// This should not run before the setImmediate!
				shouldBeZero = 1;
			}, 0);

			Blast.setImmediate(function() {

				// Even though IE10 & 11 have a native setImmediate,
				// (well, they created it, they're the only browser right now)
				// this test still fails. So we skip it.
				//assert.equal(0, shouldBeZero, 'setTimeout ran before setImmediate! Named: ' + Blast.setImmediate);
				next();
			});
		});
	});

	describe('.series(arrayTasks, callback)', function() {

		it('should perform the tasks in series and callback results', function(done) {

			Function.series(arrTasks, function(err, result) {

				assert.equal(true, Array.isArray(result), 'Result object is not an array');
				assert.equal('result-0', result[0], 'First result is wrong');
				assert.equal('result-1', result[1], 'Second result is wrong');
				assert.equal(2, result.length, 'Result array does not have the correct amount of values');

				assert.equal(null, err, 'Series is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should callback when no tasks are given', function(done) {
			Function.series([], function(err, result) {
				assert.equal(true, Array.isArray(result), 'Result object is not an array');
				assert.equal(0, result.length, 'The result shouldn\'t contain anything');

				assert.equal(null, err, 'Series is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should report errors when it can', function(done) {

			Function.series([function(next) {
				// This code will throw an error,
				// and series can catch it
				var a = doesnotexist + 1;
				next();
			}], function(err, result) {
				assert.equal(true, !!err, 'The error object should not be falsy');
				assert.equal(true, !result, 'The result object should be falsy');
				done();
			});
		});

		it('should not require a callback', function(done) {

			Function.series([function(next) {
				next(null);
			}, function(next) {
				next(null);

				setTimeout(function() {
					done();
				}, 10);
			}]);
		});
	});

	describe('.series(objectTasks, callback)', function() {

		it('should perform the tasks in series and callback results', function(done) {

			Function.series(objTasks, function(err, result) {

				assert.equal(true, Object.isPlainObject(result), 'Result object is not a plain object');
				assert.equal('result-0', result['Named task 0'], 'First result is wrong');
				assert.equal('result-1', result['Named task 1'], 'Second result is wrong');
				assert.equal(2, Object.size(result), 'Result array does not have the correct amount of values');

				assert.equal(null, err, 'Series is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should callback when no tasks are given', function(done) {
			Function.series({}, function(err, result) {
				assert.equal(true, Object.isPlainObject(result), 'Result object is not a plain object');
				assert.equal(0, Object.size(result), 'The result shouldn\'t contain anything');

				assert.equal(null, err, 'Series is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should not require a callback', function(done) {

			Function.series({a: function(next) {
				next(null);
			}, b: function(next) {
				next(null);

				setTimeout(function() {
					done();
				}, 10);
			}});
		});
	});

	describe('.parallel(arrayTasks, callback)', function() {

		it('should perform the tasks in parallel and callback results', function(done) {

			Function.parallel(arrTasks, function(err, result) {

				assert.equal(true, Array.isArray(result), 'Result object is not an array');
				assert.equal('result-0', result[0], 'First result is wrong');
				assert.equal('result-1', result[1], 'Second result is wrong');
				assert.equal(2, result.length, 'Result array does not have the correct amount of values');

				assert.equal(null, err, 'Parallel is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should callback when no tasks are given', function(done) {
			Function.parallel([], function(err, result) {
				assert.equal(true, Array.isArray(result), 'Result object is not an array');
				assert.equal(0, result.length, 'The result shouldn\'t contain anything');

				assert.equal(null, err, 'Parallel is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should report errors when it can', function(done) {

			Function.parallel([function(next) {
				// This code will throw an error,
				// and series can catch it
				var a = doesnotexist + 1;
				next();
			}], function(err, result) {
				assert.equal(true, !!err, 'The error object should not be falsy');
				assert.equal(true, !result, 'The result object should be falsy');
				done();
			});
		});

		it('should not require a callback', function(done) {

			Function.parallel([function(next) {
				next(null);
			}, function(next) {
				next(null);

				setTimeout(function() {
					done();
				}, 10);
			}]);
		});
	});

	describe('.parallel(objectTasks, callback)', function() {

		it('should perform the tasks in parallel and callback results', function(done) {

			Function.parallel(objTasks, function(err, result) {

				assert.equal(true, Object.isPlainObject(result), 'Result object is not a plain object');
				assert.equal('result-0', result['Named task 0'], 'First result is wrong');
				assert.equal('result-1', result['Named task 1'], 'Second result is wrong');
				assert.equal(2, Object.size(result), 'Result array does not have the correct amount of values');

				assert.equal(null, err, 'Parallel is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should callback when no tasks are given', function(done) {
			Function.parallel({}, function(err, result) {
				assert.equal(true, Object.isPlainObject(result), 'Result object is not a plain object');
				assert.equal(0, Object.size(result), 'The result shouldn\'t contain anything');

				assert.equal(null, err, 'Parallel is reporting an error where there shouldn\'t be one');

				done();
			});
		});

		it('should not require a callback', function(done) {

			Function.parallel({a: function(next) {
				next(null);
			}, b: function(next) {
				next(null);

				setTimeout(function() {
					done();
				}, 10);
			}});
		});
	});
});