module.exports = function BlastFunctionFlow(Blast, Collection) {

	/**
	 * A dummy function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	Blast.defineStatic('Function', 'dummy', function dummy() {});

	/**
	 * Run (async) functions in serie
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.3
	 */
	Blast.defineStatic('Function', 'series', function series(tasks, callback) {

		var handler,
		    results,
		    keys,
		    temp,
		    i;

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
				tasks = Blast.Bound.Array.first(temp, temp.length-1);

				// The very last function should be the callback
				callback = Blast.Bound.Array.last(temp);
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

		handler = function handler(err, result) {

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
				Blast.setImmediate(function() {

					try {
						tasks[next](handler);
					} catch (err) {
						return callback(err);
					}
				});
			} else {
				Blast.setImmediate(function() {
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
	 * @version  0.1.2
	 */
	Blast.defineStatic('Function', 'parallel', function parallel(limit, tasks, callback) {

		var argLength,
		    setLimit,
		    handler,
		    results,
		    running,
		    started,
		    length,
		    args,
		    keys,
		    stop,
		    i;

		argLength = arguments.length;

		if (typeof limit === 'number') {
			setLimit = true;
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
				tasks = args.slice(0+setLimit, argLength-1);

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
			Blast.setImmediate(function() {
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
			Blast.setImmediate(function() {

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

		handler = function handler(i, err, result) {

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

				Blast.setImmediate(function() {
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
					Blast.setImmediate(function() {
						callback(null, results);
					});
				}
			}
		};
	});

	/**
	 * Do the task callback at least once,
	 * and then until the test function returns falsy
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'doWhile', function doWhile(test, task, callback) {

		var handler,
		    obj,
		    i;

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		handler = function handler(err) {

			if (err) {
				return callback(err);
			}

			if (test()) {
				Blast.setImmediate(function() {
					task(handler);
				});
			} else {
				callback();
			}
		};

		// Schedule it at the bottom of the event queue
		// (nextTick would schedule it at the top)
		Blast.setImmediate(function() {

			// Set the start time for the first task
			obj.start = Blast.performanceNow();

			task(handler);
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