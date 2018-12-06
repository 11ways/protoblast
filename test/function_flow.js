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

	describe('.timebomb(timer, callback)', function() {
		this.slow(500);

		// timebomb can also work without a callback, but that can't be tested in mocha
		it('should throw an error after 100ms when no timer was given', function(done) {
			Function.timebomb(function exploded(err) {
				assert.equal('Error: Timeout of 100ms was reached', err+'');
				done();
			});
		});

		it('should throw an error after 100ms when a non-numeric timer was given', function(done) {
			Function.timebomb(null, function exploded(err) {
				assert.equal('Error: Timeout of 100ms was reached', err+'');
				done();
			});
		});

		it('should throw an error after the given amount of time', function(done) {
			Function.timebomb(10, function exploded(err) {
				assert.equal('Error: Timeout of 10ms was reached', err+'');
				done();
			});
		});

		it('should throw nothing when defused in time', function(done) {

			var bomb = Function.timebomb(50);

			setTimeout(function defuseit() {
				var result = bomb.defuse();

				assert.equal(true, result);
				assert.equal(true, bomb.defused);
				assert.equal(false, bomb.exploded);
				done();
			}, 4);
		});
	});

	describe('.series(arrayTasks, callback)', function() {
		this.slow(500);

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

		it('should not require an array of tasks', function(done) {
			Function.series(function(next) {
				next(null, 1);
			}, function(next) {
				next(null, 2);
			}, function _done(err, result) {
				if (err) {
					return done(err);
				}

				assert.deepStrictEqual(result, [1, 2]);
				done();
			});
		});

		it('should throw an error when a next handler is called multiple times', function(done) {
			Function.series(function(next) {
				next(null, 1);
				next(null, 1);
			}, function(next) {
				next(null, 2);
			}, function _done(err, result) {
				assert.strictEqual(!!err, true);
				done();
			});
		});

		it('should pass the result of the previous task to the next', function(done) {

			Function.series(function(next) {
				next(null, 1);
			}, function(next, val) {
				assert.strictEqual(val, 1);
				next(null, 2);
			}, function _done(err, result) {
				assert.strictEqual(!!err, false);
				assert.deepStrictEqual(result, [1, 2]);
				done();
			});
		});
	});

	describe('.series(objectTasks, callback)', function() {
		this.slow(500);

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
		this.slow(500);

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
		this.slow(500);

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

		it('should catch thrown errors', function(done) {

			Function.parallel({a: function(next) {
				next(null);
			}, b: function(next) {
				throw new Error();
			}}, function isdone(err) {
				assert.equal(!!err, true);
				done();
			});
		});

		it('should stop on first error', function(done) {

			Function.parallel({a: function(next) {
				setTimeout(function() {
					return next(new Error('a'));
				}, 15);
			}, b: function(next) {
				setTimeout(function() {
					return next(new Error('b'));
				}, 10);
			}, c: function(next) {
				setTimeout(function() {
					return next(new Error('c'));
				}, 5);
			}}, function isdone(err) {
				assert.equal(!!err, true);
				setTimeout(done, 10);
			});
		});

		it('should ignore next being called multiple times', function(done) {

			Function.parallel({a: function(next) {
				setTimeout(function() {
					return next(new Error('a'));
				}, 15);
			}, b: function(next) {
				setTimeout(function() {
					next(new Error('b'));
					next(new Error('b2'));
				}, 10);
			}, c: function(next) {
				setTimeout(function() {
					next(new Error('c'));
					next(new Error('c2'));
				}, 5);
			}}, function isdone(err) {
				assert.equal(!!err, true);
				setTimeout(done, 10);
			});
		});
	});

	describe('.parallel(limit, tasks, callback)', function() {
		this.slow(500);

		it('should limit the amount of tasks running side by side', function(done) {

			var tasks = [],
			    running = 0,
			    max = 0,
			    i;

			for (i = 0; i < 15; i++) {
				tasks[i] = function(next) {
					running++;

					setTimeout(function() {
						if (running > max) max = running;
						running--;
						next();
					}, 10);
				};
			}

			Function.parallel(3, tasks, function(err) {
				assert.equal(3, max, 'There were more than 3 tasks running at the same time');
				done();
			});
		});
	});

	describe('.parallel(noAsync, limit, tasks, callback)', function() {
		this.slow(500);

		it('should execute the functions immediately, without setImmediate', function(done) {

			var tasks = [],
			    running = 0,
			    max = 0,
			    i;

			for (i = 0; i < 15; i++) {
				tasks[i] = function(next) {
					running++;

					setTimeout(function() {
						running--;
						next();
					}, 10);
				};
			}

			Function.parallel(false, tasks, function(err) {
				assert.equal(15, max, 'Only ' + max + ' tasks out of 15 have already executed');

				// Now with limit
				running = 0;
				max = 0;

				Function.parallel(false, 5, tasks, function(err) {

					assert.equal(5, max, max + ' functions have executed, but expected 5');

					done();
				})
				
				max = running;
			});

			max = running;
		});

		it('should handle synchronous functions', function() {

			var counter = 0;

			Function.parallel(false, function one(next) {
				counter++;
				next();
			}, function two(next) {
				counter++;
				next();
			}, function done(err) {
				assert.equal(2, counter);
				assert.equal(false, !!err, err);
			});
		});

		it('should not fire functions twice when full synchronous', function() {

			var counter = 0;

			Function.parallel(false, function one(next) {
				counter++;
				next();
			}, function two(next) {
				counter++;
				next();
			}, function three(next) {
				counter++;
				next();
			}, function done(err) {
				assert.equal(3, counter);
				assert.equal(false, !!err, err);
			});
		});

		it('should not fire functions twice when mixed a/synchronous', function() {

			var counter = 0;

			Function.parallel(false, function one(next) {
				counter++;
				next();
			}, function two(next) {
				counter++;
				next();
			}, function three(next) {
				counter++;

				setTimeout(next, 4);
			}, function done(err) {
				assert.equal(3, counter);
				assert.equal(false, !!err, err);
			});
		});
	});

	describe('.hinder(forceAsync, worker, options)', function() {
		it('should execute the function, and wait for it to finish before executing the others', function(done) {

			var result = '',
			    hinder;

			hinder = Function.hinder(function worker(done) {
				setTimeout(function() {
					result += 'w';
					done();
				}, 20);
			});

			hinder.push(function test() {
				result += 'test';
				assert.equal('wtest', result);

				hinder.push(function afterDone() {
					done();
				});
			});
		});
	});

	describe('.while(test, task, callback)', function() {
		it('should execute task while test is true', function(done) {

			var i = 0;

			Function.while(function test() {
				return i < 5;
			}, function task(next) {
				i++;
				next();
			}, function whileIsDone() {
				assert.equal(5, i);
				done();
			});
		});

		it('should stop when an error is thrown', function(done) {

			var i = 0;

			Function.while(function test() {
				return i < 5;
			}, function task(next) {
				i++;

				if (i == 3) {
					throw new Error();
				}

				next();
			}, function whileIsDone(err) {
				assert.equal(3, i);
				assert.equal(!!err, true);

				setTimeout(done, 10);
			});
		});

		it('should stop when an error is passed to the `next` function', function(done) {

			var i = 0;

			Function.while(function test() {
				return i < 5;
			}, function task(next) {
				i++;

				if (i == 3) {
					return next(new Error());
				}

				next();
			}, function whileIsDone(err) {
				assert.equal(3, i);
				assert.equal(!!err, true);

				setTimeout(done, 10);
			});
		});
	});

	describe('.forEach(data, task, callback)', function() {
		it('should handle arrays', function(done) {

			var arr = [{nr: 1}, {nr: 2}, {nr: 3}],
			    count = 0;

			Function.forEach(arr, function task(value, index, next) {
				count++;

				assert.equal(value.nr, index+1);

				next();
			}, function finished(err) {
				assert.equal(count, 3);
				assert.equal(!!err, false);
				done();
			});
		});

		it('should stop on thrown error', function(done) {

			var arr = [{nr: 1}, {nr: 2}, {nr: 3}, {nr: 4}],
			    count = 0;

			Function.forEach(arr, function task(value, index, next) {
				count++;

				assert.equal(value.nr, index+1);

				if (index == 2) {
					throw new Error();
				}

				next();
			}, function finished(err) {

				assert.equal(!!err, true);
				
				setTimeout(done, 10);
			});
		});

		it('should execute finished function only once', function(done) {

			var arr = [{nr: 1}, {nr: 2}, {nr: 3}, {nr: 4}],
			    count = 0;

			Function.forEach(arr, function task(value, index, next) {
				count++;

				assert.equal(value.nr, index+1);

				if (index > 1) {
					return setTimeout(function() {
						next(new Error('Error ' + index));
					}, 3 + index);
				} else {
					next();
				}
			}, function finished(err) {
				assert.equal(!!err, true);
				setTimeout(done, 10);
			});
		});
	});

	describe('.forEach.parallel(data, task, callback)', function() {
		it('should do the task in parallel', function(done) {

			var data = [0,1,2,3];

			Function.forEach.parallel(data, function tast(value, index, next) {
				assert.strictEqual(value, index);
				next();
			}, done);
		});
	});

	describe('.regulate(fnc, amount, overflow)', function() {

		it('should run the application only once when only a function is given', function() {

			var once,
			    count = 0;

			var once = Function.regulate(function() {
				count++;
			});

			once();
			assert.equal(count, 1);

			once();
			assert.equal(count, 1, 'Regulate should have stopped second execution');
		});

		it('should run the application only the amount of given times', function() {

			var thrice,
			    count = 0;

			var thrice = Function.regulate(function() {
				count++;
			}, 3);

			thrice();
			assert.equal(count, 1);

			thrice();
			assert.equal(count, 2);

			thrice();
			assert.equal(count, 3);

			thrice();
			assert.equal(count, 3, 'Regulate should have stopped after the third execution');
		});

		it('should call the overflow function if runing over the maximum amount of times', function() {

			var once,
			    count = 0,
			    other = 0;

			var once = Function.regulate(function() {
				count++;
			}, function() {
				other++;
			});

			once();
			assert.equal(count, 1);
			assert.equal(other, 0);

			once();
			assert.equal(count, 1);
			assert.equal(other, 1);

			once();
			assert.equal(count, 1);
			assert.equal(other, 2);

			once();
			assert.equal(count, 1);
			assert.equal(other, 3);
		});

		it('should pass the extra times it has been called to the overflow function', function() {
			var once,
			    count = 0,
			    other = 0;

			var once = Function.regulate(function() {
				count++;
			}, function(extra_times) {
				other = extra_times;
			});

			once();
			assert.equal(count, 1);
			assert.equal(other, 0);

			once();
			assert.equal(count, 1);
			assert.equal(other, 1);

			once();
			assert.equal(count, 1);
			assert.equal(other, 2);

			once();
			assert.equal(count, 1);
			assert.equal(other, 3);
		});

		it('should throw an error when a non-function is given', function() {
			assert.throws(function() {
				Function.regulate('not a function');
			});
		});
	});

	describe('.count(fnc)', function() {
		it('adds a counter as the first argument', function() {

			var fnc = Function.count(function myFnc(counter, value) {
				if (value == null) value = 0;
				return counter + value;
			});

			assert.strictEqual(fnc(), 1);
			assert.strictEqual(fnc(), 2);
			assert.strictEqual(fnc(1), 4);
			assert.strictEqual(fnc(1), 5);
			assert.strictEqual(fnc(2), 7);
			assert.strictEqual(fnc(), 6);
		});
	});

	describe('.throttle(fnc, min_wait, immediate, rest_on_call)', function() {
		this.slow(500);

		it('should execute the function only once per given ms', function(done) {

			var start;

			var fnc = Function.throttle(function(val) {
				var elapsed = Date.now() - start;

				assert.strictEqual(val, 'val');
				assert.strictEqual(elapsed > 39, true, 'Only ' + elapsed + ' ms elapsed');

				done();

			}, 40);

			start = Date.now();

			fnc('val');
		});

		it('should execute the first call immediately if wanted', function(done) {

			var fnc = Function.throttle(function(count) {

				var elapsed = Date.now() - start;

				if (count == 1) {
					assert.strictEqual(elapsed < 10, true);
				} else {
					assert.strictEqual(elapsed > 19, true);
					done();
				}

			}, 20, true);

			var start = Date.now();

			fnc(1);
			fnc(2);
		});

		it('should skip certain calls', function(done) {

			var fnc = Function.throttle(function(count) {

				var elapsed = Date.now() - start;

				if (count == 1) {
					assert.strictEqual(elapsed < 15, true, 'A total of ' + elapsed + ' ms have elapsed, but it should have been instantly');
				} else if (count == 2) {
					throw new Error('Count 2 should have been skipped');
				} else {
					assert.strictEqual(elapsed > 19, true, 'A total of ' + elapsed + ' ms have elapsed, should have been 20 or more');
					done();
				}

			}, 25, true);

			var start = Date.now();

			fnc(1);
			fnc(2); // Will be skipped
			fnc(3);
		});
	});

	describe('.throttle(fnc, config)', function() {
		this.slow(500);

		it('should execute the function only once per given ms', function(done) {

			var start;

			var fnc = Function.throttle(function(val) {
				var elapsed = Date.now() - start;

				assert.strictEqual(val, 'val');
				assert.strictEqual(elapsed > 39, true);

				done();

			}, {minimum_wait: 40});

			start = Date.now();

			fnc('val');
		});

		it('should not share method throttle state with different instances', function(done) {

			var alpha = {name: 'alpha'},
			    beta = {name: 'beta'},
			    start,
			    test,
			    i = 0;

			test = Function.throttle(function test(val) {

				var elapsed = Date.now() - start;

				if (this.name == 'alpha') {
					assert.strictEqual(val, 'val');
				} else {
					assert.strictEqual(val, 'yes');
				}

				assert.strictEqual(elapsed > 39, true);

				i++;

				if (i == 2) {
					done();
				}
			}, {method: true, minimum_wait: 40});

			start = Date.now();
			alpha.test = test;
			beta.test = test;

			// First & only call on the alpha instance, so it'll run
			alpha.test('val');

			// First call on the beta class, won't run because...
			beta.test('nope');

			// We call it again on this instance
			beta.test('yes');
		});
	});

	describe('.createQueue(options)', function() {
		it('should create a new queue', function() {
			var queue = Function.createQueue();
			assert.strictEqual(queue.constructor.name, 'FunctionQueue');
		});
	});
});