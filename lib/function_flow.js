module.exports = function BlastFunctionFlow(Blast, Collection) {

	/**
	 * Call a function right now.
	 * Meant to be used in response to setImmediate.
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 */
	Blast.callNow = function callNow(fnc) {
		fnc();
	};

	/**
	 * A dummy function
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.2
	 * @version  0.3.0
	 */
	Blast.defineStatic('Function', 'dummy', Function());

	/**
	 * A dummy function that does throw errors
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.4
	 * @version  0.3.6
	 */
	function thrower(err) {
		if (err) {
			throw err;
		}
	}
	Blast.defineStatic('Function', 'thrower', thrower);

	/**
	 * Set a timebomb,
	 * if it isn't defused in time throw an error
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Number}   timer      Time in ms to wait before exploding
	 * @param    {Function} callback   The callback to use when exploding
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'timebomb', function timebomb(timer, callback) {

		var bomb;

		if (typeof timer == 'function') {
			callback = timer;
			timer = 100;
		} else if (typeof timer != 'number') {
			timer = 100;
		}

		bomb = {
			defused: false,
			exploded: false,
			handle: setTimeout(function explode() {
				var err = new Error('Timeout of ' + timer + 'ms was reached');

				exploded = true;

				if (callback) {
					callback(err);
				} else {
					throw err;
				}
			}, timer),
			defuse: function defuse() {

				if (bomb.exploded) {
					return false;
				} else if (!bomb.defused) {
					clearTimeout(bomb.handle);
					bomb.defused = true;
				}

				return true;
			}
		};

		return bomb;
	});

	/**
	 * Run (async) functions in serie
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.2
	 * @version  0.1.9
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
		    stop,
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
			keys = Collection.Array.range(0, tasks.length);

			// The results will be an array
			results = new Array(tasks.length);
		}

		if (typeof callback !== 'function') {
			callback = thrower;
		}

		i = -1;

		handler = function blastSeriesHandler(err, result) {

			var next;

			// If something stopped this code before, do nothing
			if (stop) {
				return;
			}

			// If we get an error object, stop everything
			if (err) {
				stop = true;
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

						if (stop) {
							return;
						}

						stop = true;
						return callback(err);
					}
				});
			} else {
				stop = true;
				scheduler(function scheduleCallback() {
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
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.2
	 * @version  0.4.0
	 */
	Blast.defineStatic('Function', 'parallel', function parallel(_forceAsync, _limit, _tasks, _callback) {

		var stillStarting,
		    forceAsync,
		    argLength,
		    scheduler,
		    callback,
		    setLimit,
		    handler,
		    results,
		    running,
		    started,
		    length,
		    pledge,
		    tasks,
		    limit,
		    skip,
		    args,
		    keys,
		    stop,
		    i;

		stillStarting = true;
		argLength = arguments.length;
		skip = 0;
		pledge = new Blast.Classes.Pledge();

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
			limit = null;
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
			callback = thrower;
		}

		// If no tasks were given, call the callback
		if (!length) {
			scheduler(function scheduleCallback() {
				callback(null, results);
				pledge.resolve(results);
			});

			return pledge;
		}

		// Count the number of async functions currently running
		running = 0;
		started = 0;

		handler = function blastParallelHandler(i, err, result) {

			var next;

			// If something stopped this code before, do nothing
			if (stop) {
				return;
			}

			running--;

			// If we get an error object, stop everything
			if (err) {
				stop = true;
				pledge.reject(err);
				return callback(err);
			}

			// Store the result
			results[keys[i]] = result;

			// If we need to start any other functions, do it now
			if (!stillStarting && started < length) {

				running++;
				next = started++;

				scheduler(function scheduleNextTask() {
					try {
						tasks[next](function nextHandler(err, val) {
							handler(next, err, val);
						});
					} catch (err) {
						stop = true;
						pledge.reject(err);
						return callback(err);
					}
				});
			} else {

				// Only call the callback when nothing is running,
				// and when we're not still starting (non-async mode)
				if (!stillStarting && running == 0) {
					stop = true;
					scheduler(function scheduleCallback() {
						callback(null, results);
						pledge.resolve(results);
					});
				}
			}
		};

		// Go over every tasks
		tasks.every(function everyTask(fnc, index) {

			running++;
			started++;

			// Execute the function
			scheduler(function scheduleNextTask() {

				try {
					fnc(function nextHandler(err, val) {
						handler(index, err, val);
					});
				} catch (err) {

					// Do nothing if the callback has already been called once
					if (stop) {
						return;
					}

					stop = true;
					pledge.reject(err);
					return callback(err);
				}
			});

			if (setLimit && running >= limit) {
				return false;
			}

			return true;
		});

		stillStarting = false;

		return pledge;
	});

	/**
	 * Do `task` while `test` returns falsy
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
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
	 * and then while the test function returns falsy
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.4
	 * @version  0.1.6
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'doUntil', function doUntil(task, test, callback) {
		return Blast.Collection.Function.asyncLoop(true, false, test, task, callback);
	});

	/**
	 * Do `task` while `test` returns truthy
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
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
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'doWhile', function doWhile(task, test, callback) {
		return Blast.Collection.Function.asyncLoop(true, true, test, task, callback);
	});

	/**
	 * Do `task` for each entry in data serially
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	function forEach(data, task, callback) {

		var wrapTask,
		    isArray,
		    subject,
		    test,
		    len,
		    i;

		isArray = Array.isArray(data);
		i = -1;

		if (isArray) {
			subject = data;

			wrapTask = function wrapTask(next) {
				task(subject[i], i, next);
			};
		} else {
			subject = Blast.Bound.Object.dissect(data);

			wrapTask = function wrapTask(next) {
				task(subject[i].value, subject[i].key, next);
			};
		}

		len = subject.length;
		test = function test() {
			return ++i < len;
		};

		return Blast.Collection.Function['while'](test, wrapTask, callback);
	}

	/**
	 * Do `task` for each entry in data in parallel
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @param    {Function}   test
	 * @param    {Function}   task
	 * @param    {Function}   callback
	 */
	forEach.parallel = function forEachParallel(data, task, callback) {

		var tasks = [];

		if (Array.isArray(data)) {
			data.forEach(function eachEntry(entry, index) {
				tasks.push(function doEntry(next) {
					task(entry, index, next);
				});
			});
		} else {
			Blast.Bound.Object.each(data, function eachEntry(entry, key) {
				tasks.push(function doEntry(next) {
					task(entry, key, next);
				});
			});
		}

		return Blast.Collection.Function.parallel(tasks, callback);
	};

	Blast.defineStatic('Function', 'forEach', forEach);

	/**
	 * Do an async loop,
	 * other loop functions call this
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.4
	 * @version  0.3.2
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
			callback = thrower;
		}

		isFnc = typeof testFnc === 'function';

		handler = function handler(err) {

			if (err) {
				return callback(err);
			}

			if (isFnc) {
				Blast.setImmediate(function doAsyncTask() {
					if (matchValue == !!testFnc()) {
						try {
							taskFnc(handler);
						} catch (err) {
							callback(err);
						}
					} else {
						callback();
					}
				});
			}
		};

		// Schedule it at the bottom of the event queue
		// (nextTick would schedule it at the top)
		Blast.setImmediate(function startAsyncLoop() {

			// Set the start time for the first task
			obj.start = Blast.performanceNow();

			// Execute the task first if it should happen at least once
			if (atleastOnce) {
				try {
					taskFnc(handler);
				} catch (err) {
					callback(err);
				}
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
	 * Execute the worker. Whan it is done, execute any possible tasks
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.4
	 * @version  0.2.0
	 */
	Blast.defineStatic('Function', 'hinder', function hinder(forceAsync, worker, options) {

		var scheduler,
		    finished,
		    result,
		    tasks,
		    done,
		    obj;

		if (typeof forceAsync === 'function') {
			options = worker;
			worker = forceAsync;
			forceAsync = true;
		}

		if (options == null) {
			options = {};
		}

		if (Array.isArray(options)) {
			tasks = options;
			options = {};
		} else {
			tasks = [];
		}

		if (forceAsync) {
			// If we want to force async behaviour, use setImmediate
			scheduler = Blast.setImmediate;
		} else {
			// If we do not want to force it, use callNow
			scheduler = Blast.callNow;
		}

		finished = false;

		obj = {
			tasks: tasks,
			onerror: null,
			push: function push(task) {
				if (finished) {
					scheduler(function doTask() {
						task.apply(obj, result);
					});
				} else {
					tasks.push(task);
				}

				return obj;
			}
		};

		done = function done(err) {

			var i;

			result = [];

			for (i = 0; i < arguments.length; i++) {
				result.push(arguments[i]);
			}

			if (err != null) {
				if (obj.onerror) {
					obj.onerror(err);
				}
			}

			finished = true;

			for (i = 0; i < tasks.length; i++) {
				tasks[i].apply(obj, result);
			}
		};

		// Schedule the worker function
		scheduler(function doWorker() {
			worker.call(obj, done);
		});

		return obj;
	});

	/**
	 * Run the task for the given amount,
	 * or given ms if set. (Does amount if set, or ms, not both)
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
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
			callback = thrower;
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

					Blast.setImmediate(function doTaskImmediate() {
						task(handler);
					});
				}
			} else {

				elapsed = Date.now() - start;

				Blast.setImmediate(function doCallbackImmediate() {
					callback(null, runs, elapsed);
				});
			}
		};

		// Use setImmediate so we're sure the function will yield at least once
		Blast.setImmediate(function doStartTaskImmediate() {
			start = Date.now();
			task(handler);
		});
	});

	/**
	 * Do the task function for the given amount of ms,
	 * mostly meant for benchmarking purposes.
	 * The task can be synchronous: once in a while a `setImmediate` is used
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
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
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
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

	/**
	 * Add a counter argument to a function
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.6
	 * @version  0.1.6
	 *
	 * @param    {Function}   fnc
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'count', function count(fnc) {

		var count = 0;

		return function wrapper() {

			// Turn the arguments into an array
			var args = Blast.Bound.Array.cast(arguments);

			count++;

			// Add the counter to the top
			args.unshift(count);

			// Call the function
			return fnc.apply(this, args);
		};
	});

	/**
	 * Make sure the callback can only be called a given amount of times
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.6
	 * @version  0.1.6
	 *
	 * @param    {Function}   fnc
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'regulate', function regulate(fnc, amount) {

		var count = 0;

		if (!amount) {
			amount = 1;
		}

		return function wrapper() {

			count++;

			if (count > amount) {
				return;
			}

			return fnc.apply(this, arguments);
		};
	});

	/**
	 * Make sure the callback will only be called once per given ms
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.9
	 * @version  0.3.6
	 *
	 * @param    {Function}   fnc           Function to throttle
	 * @param    {Number}     minimum_wait  Minimum time to wait between executions
	 * @param    {Boolean}    immediate     If true, execute the first execution immediately
	 * @param    {Boolean}    reset_on_call Reset the counter on each call
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'throttle', function throttle(fnc, minimum_wait, immediate, reset_on_call) {

		var last_exec_time = 0,
		    queued;

		if (!minimum_wait) {
			minimum_wait = 5;
		}

		return function wrapper() {

			var prev_exec_time = last_exec_time,
			    ms_since_last_exec,
			    that,
			    args,
			    now;

			// Get the current timestamp
			now = Date.now();

			// If there was no last execution yet,
			// and we don't have to execute immediately on the first call,
			// set the last and prev timestamps to NOW
			if (!last_exec_time && !immediate) {
				last_exec_time = now;
				prev_exec_time = now;
			}

			// On the first (non-immediate) call, diff will be zero
			ms_since_last_exec = now - prev_exec_time;

			// If there has been no execution yet, or the waiting time is over
			if (!last_exec_time || (ms_since_last_exec > minimum_wait)) {

				if (queued) {
					clearTimeout(queued);
				}

				if (reset_on_call === true) {
					// If reset_on_call is true the waiting time starts again,
					// the call will be queued in the next if block
					ms_since_last_exec = 0;
				} else {
					fnc.apply(this, arguments);
					last_exec_time = now;
					return;
				}
			}

			if (ms_since_last_exec < minimum_wait) {
				args = arguments;
				that = this;

				if (queued) {
					clearTimeout(queued);
				}

				queued = setTimeout(function throttleQueue() {
					queued = null;
					last_exec_time = Date.now();
					fnc.apply(that, args);
				}, minimum_wait - ms_since_last_exec);
			}
		};
	});

	/**
	 * Create and return a new FunctionQueue
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @return   {FunctionQueue}
	 */
	Blast.defineStatic('Function', 'createQueue', function createQueue(options) {
		return new Blast.Classes.FunctionQueue(options);
	});
};