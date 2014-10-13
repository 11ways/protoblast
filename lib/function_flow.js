module.exports = function BlastFunctionFlow(Blast, Collection) {

	/**
	 * Call a function right now.
	 * Meant to be used in response to setImmediate.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 */
	Blast.callNow = function callNow(fnc) {
		fnc();
	};

	/**
	 * A dummy function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	function dummy() {};
	Blast.defineStatic('Function', 'dummy', dummy);

	/**
	 * Run (async) functions in serie
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.3
	 *
	 * @param    {Boolean}   _forceAsync   Force asynchronous behaviour [TRUE]
	 * @param    {Array}     _tasks        Tasks to perform
	 * @param    {Function}  _callback     Function to call when done
	 */
	Blast.defineStatic('Function', 'series', function series(_forceAsync, _tasks, _callback) {

		var forceAsync,
		    scheduler,
		    setAsync,
		    callback,
		    handler,
		    results,
		    tasks,
		    keys,
		    temp,
		    i;

		// Normalize parameters
		if (typeof _forceAsync == 'boolean') {
			forceAsync = _forceAsync;
			tasks      = _tasks;
			callback   = _callback;

			// Remember to ignore the first entry of the `arguments`
			setAsync = 1;
		} else {
			forceAsync = true;
			tasks      = _forceAsync;
			callback   = _tasks;
			setAsync   = 0;
		}

		if (forceAsync) {
			// If we want to force async behaviour, use setImmediate
			scheduler = Blast.setImmediate;
		} else {
			// If we do not want to force it, use callNow
			scheduler = Blast.callNow;
		}

		// Normalize the tasks
		if (Collection.Object.isPlainObject(tasks)) {

			// Get the keys
			keys = Object.keys(tasks);

			// The result object will also be an object
			results = Collection.Object.mapKeys(keys);
		} else {

			// Make sure everything is what it needs to be
			if (!Array.isArray(tasks)) {

				// // Keep function optimized by not leaking the `arguments` object
				temp = new Array(arguments.length);
				for (i = 0; i < temp.length; i++) temp[i] = arguments[i];

				// Everything but the last entry should be the tasks
				// If async was set, the first one should be skipped too
				tasks = temp.slice(0+setAsync, temp.length-1);

				// The very last function should be the callback
				callback = temp[temp.length-1];
			}

			// The keys are numeric
			keys = Blast.Bound.Array.range(0, tasks.length);

			// The results will be an array
			results = new Array(tasks.length);
		}

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		i = -1;

		handler = function blastSeriesHandler(err, result) {

			var next;

			// If we get an error object, stop everything
			if (err) {
				return callback(err);
			}

			if (i > -1) {
				// Store the result
				results[keys[i]] = result;
			}

			// Increment the counter
			next = keys[++i];

			// See if we need to do another task
			if (tasks[next]) {
				scheduler(function nextSerialTask() {

					try {
						tasks[next](handler);
					} catch (err) {
						return callback(err);
					}
				});
			} else {
				scheduler(function() {
					callback(null, results);
				});
			}
		};

		// Start the serial process by calling the handler a first time
		handler();
	});

	/**
	 * Run (async) functions in parallel
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 */
	Blast.defineStatic('Function', 'parallel', function parallel(_forceAsync, _limit, _tasks, _callback) {

		var forceAsync,
		    argLength,
		    scheduler,
		    callback,
		    setLimit,
		    handler,
		    results,
		    running,
		    started,
		    length,
		    tasks,
		    limit,
		    skip,
		    args,
		    keys,
		    stop,
		    i;

		argLength = arguments.length;
		skip = 0;

		if (typeof _forceAsync === 'boolean') {
			forceAsync = _forceAsync;
			limit = _limit;
			tasks = _tasks;
			callback = _callback
			skip = 1;
		} else {
			forceAsync = true;
			limit = _forceAsync;
			tasks = _limit;
			callback = _tasks;
		}

		if (forceAsync) {
			// If we want to force async behaviour, use setImmediate
			scheduler = Blast.setImmediate;
		} else {
			// If we do not want to force it, use callNow
			scheduler = Blast.callNow;
		}

		if (typeof limit === 'number') {
			setLimit = true;
			skip += 1;
		} else {

			// Don't leak the arguments object
			args = new Array(argLength);
			for (i = 0; i < argLength; i++) args[i] = arguments[i];

			setLimit = false;
			callback = tasks;
			tasks = limit;
		}

		// Normalize the tasks
		if (Collection.Object.isPlainObject(tasks)) {

			// Get the keys
			keys = Object.keys(tasks);

			// Turn tasks into an array
			tasks = Collection.Object.values(tasks, keys);

			// The result object will also be an object
			results = Collection.Object.mapKeys(keys);

			// Get the amount of tasks
			length = tasks.length;
		} else {

			// Make sure everything is what it needs to be
			if (!Array.isArray(tasks)) {

				// Convert the arguments to a regular array
				if (!args) {
					args = new Array(argLength);
					for (i = 0; i < argLength; i++) args[i] = arguments[i];
				}

				// Everything but the last entry should be the tasks
				// If the limit was set, the first one should be skipped too
				tasks = args.slice(0+skip, argLength-1);

				// The very last function should be the callback
				callback = args[argLength-1];
			}

			// Get the amount of tasks
			length = tasks.length;

			// The keys are numeric
			keys = Blast.Bound.Array.range(0, length);

			// The results will be an array
			results = new Array(length);
		}

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		// If no tasks were given, call the callback
		if (!length) {
			scheduler(function() {
				callback(null, results);
			});

			return;
		}

		// Count the number of async functions currently running
		running = 0;
		started = 0;

		// Go over every tasks
		tasks.every(function(fnc, index) {

			running++;
			started++;

			// Execute the function
			scheduler(function() {

				try {
					fnc(function nextHandler(err, val) {
						handler(index, err, val);
					});
				} catch (err) {
					stop = true;
					return callback(err);
				}
			});

			if (setLimit && running >= limit) {
				return false;
			}

			return true;
		});

		handler = function blastParallelHandler(i, err, result) {

			var next;

			// If something stopped this code before, do nothing
			if (stop) {
				return;
			}

			running--;

			// If we get an error object, stop everything
			if (err) {
				return callback(err);
			}

			// Store the result
			results[keys[i]] = result;

			// If we need to start any other functions, do it now
			if (started < length) {

				running++;
				next = started++;

				scheduler(function() {
					try {
						tasks[next](function nextHandler(err, val) {
							handler(next, err, val);
						});
					} catch (err) {
						stop = true;
						return callback(err);
					}
				});
			} else {

				if (running == 0) {
					scheduler(function() {
						callback(null, results);
					});
				}
			}
		};
	});

	/**
	 * Do `task` while `test` returns falsy
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'until', function until(test, task, callback) {
		return Blast.Collection.Function.asyncLoop(false, false, test, task, callback);
	});

	/**
	 * Do the task callback at least once,
	 * and then while the test function returns truthy
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'doUntil', function doUntil(test, task, callback) {
		return Blast.Collection.Function.asyncLoop(true, true, test, task, callback);
	});


	/**
	 * Do `task` while `test` returns truthy
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'while', function _while(test, task, callback) {
		return Blast.Collection.Function.asyncLoop(false, true, test, task, callback);
	});

	/**
	 * Do the task callback at least once,
	 * and then while the test function returns truthy
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'doWhile', function doWhile(test, task, callback) {
		return Blast.Collection.Function.asyncLoop(true, true, test, task, callback);
	});

	/**
	 * Do an async loop,
	 * other loop functions call this
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Boolean}    atleastOnce   Should the taskFnc run at least once?
	 * @param    {Boolean}    matchValue    Should testFnc return be truthy or falsy?
	 * @param    {Function}   testFnc
	 * @param    {Function}   taskFnc
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'asyncLoop', function asyncLoop(atleastOnce, matchValue, testFnc, taskFnc, callback) {

		var handler,
		    isFnc,
		    obj,
		    i;

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		isFnc = typeof testFnc === 'function';

		handler = function handler(err) {

			if (err) {
				return callback(err);
			}

			if (isFnc) {
				if (matchValue == !!testFnc()) {
					Blast.setImmediate(function() {
						taskFnc(handler);
					});
				} else {
					callback();
				}
			} else {

			}
		};

		// Schedule it at the bottom of the event queue
		// (nextTick would schedule it at the top)
		Blast.setImmediate(function() {

			// Set the start time for the first task
			obj.start = Blast.performanceNow();

			// Execute the task first if it should happen at least once
			if (atleastOnce) {
				taskFnc(handler);
			} else {
				// Execute the handler to do the test first
				handler();
			}
		});

		obj = {
			start: null
		};

		return obj;
	});

	/**
	 * Run the task for the given amount,
	 * or given ms if set. (Does amount if set, or ms, not both)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}     amount    The minimum number of times to run
	 * @param    {Number}     ms        The minimum number of ms to run, if amount is not set
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 */
	Blast.defineStatic('Function', 'doUnitTime', function doUnitTime(amount, ms, task, callback) {

		var recursion,
		    getCount,
		    elapsed,
		    handler,
		    result,
		    target,
		    start,
		    time,
		    runs,
		    trap,
		    max;

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		if (amount) {

			// The max amount is a number of iterations
			max = amount;

			// The current iteration is just the run count
			getCount = function getCount() {
				return runs;
			};
		} else {

			// The max amount is a number of ms
			max = ms;

			// The current iteration is the time passed since the start
			getCount = function getCount() {
				return Date.now() - start;
			};
		}

		trap = 0;
		runs = 0;
		recursion = 0;

		handler = function handler() {

			var currentTrap = trap;

			runs++;
			recursion++;

			time = getCount();

			// If we have not yet reached the minimum amount of time
			// this function should run, keep on running it
			if (time < max) {

				if (recursion < 3000) {

					// Infinite recursion is bad, but a little can't hurt
					task(handler);

					// If we're in the same trap, decrease the counter
					if (currentTrap == trap) {
						recursion--;
					}

				} else {
					// We need to reset the recusrion
					recursion = 0;
					trap++;

					Blast.setImmediate(function() {
						task(handler);
					});
				}
			} else {

				elapsed = Date.now() - start;

				Blast.setImmediate(function() {
					callback(null, runs, elapsed);
				});
			}
		};

		// Use setImmediate so we're sure the function will yield at least once
		Blast.setImmediate(function() {
			start = Date.now();
			task(handler);
		});
	});

	/**
	 * Do the task function for the given amount of ms,
	 * mostly meant for benchmarking purposes.
	 * The task can be synchronous: once in a while a `setImmediate` is used
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}     ms        The minimum number of ms to run
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 */
	Blast.defineStatic('Function', 'doTime', function doTime(ms, task, callback) {
		return Collection.Function.doUnitTime(0, ms, task, callback);
	});

	/**
	 * Do the task function the given amount of times.
	 * The task can be synchronous: once in a while a `setImmediate` is used
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}     amount        The minimum number of times to run
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 */
	Blast.defineStatic('Function', 'doAmount', function doAmount(amount, task, callback) {
		return Collection.Function.doUnitTime(amount, 0, task, callback);
	});
};