const defStat = Blast.createStaticDefiner('Function');

/**
 * A dummy function
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.3.0
 */
const DUMMY = defStat('dummy', () => {});

/**
 * A dummy function that does throw errors
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.3.6
 */
function thrower(err) {
	if (err) {
		throw err;
	}
}
defStat(thrower);

/**
 * Set a timebomb,
 * if it isn't defused in time throw an error
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.8.16
 *
 * @param    {number}   timer      Time in ms to wait before exploding
 * @param    {Function} callback   The callback to use when exploding
 *
 * @return   {Object}
 */
defStat(function timebomb(timer, callback) {

	if (typeof timer == 'function') {
		callback = timer;
		timer = 100;
	} else if (typeof timer != 'number') {
		timer = 100;
	}

	const explode = () => {
		var err = new Error('Timeout of ' + timer + 'ms was reached');

		bomb.exploded = true;

		if (callback) {
			callback(err);
		} else {
			throw err;
		}
	};

	const createTimeout = () => {
		// Set the timeout, but only if it's a finite number
		if (isFinite(timer)) {
			return setTimeout(explode, timer);
		}
	};

	let bomb = {
		defused: false,
		exploded: false,
		handle: createTimeout(),
		defuse: function defuse() {

			if (bomb.exploded) {
				return false;
			} else if (!bomb.defused) {
				clearTimeout(bomb.handle);
				bomb.defused = true;
			}

			return true;
		},
		reset: function reset() {

			if (bomb.defused || bomb.exploded) {
				return false;
			}

			clearTimeout(bomb.handle);
			bomb.handle = createTimeout();

			return true;
		}
	};

	return bomb;
});

/**
 * Run (async) functions in serie
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.8.15
 *
 * @param    {boolean}   _forceAsync   Force asynchronous behaviour [TRUE]
 * @param    {Array}     _tasks        Tasks to perform
 * @param    {Function}  _callback     Function to call when done
 */
defStat(function series(_forceAsync, _tasks, _callback) {

	var forceAsync,
	    scheduler,
	    setAsync,
	    callback,
	    handler,
	    results,
	    length,
	    tasks,
	    part,
	    keys,
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

	let PledgeClass,
	    pledge;

	if (forceAsync) {
		// If we want to force async behaviour, use setImmediate
		scheduler = this?.[Blast.asyncScheduler] || Blast.setImmediate;
		PledgeClass = this?.[Blast.flowPledgeClass] || Blast.Classes.Pledge;
	} else {
		// If we do not want to force it, use callNow
		scheduler = Blast.callNow;
		PledgeClass = Blast.Classes.Pledge.Swift;
	}

	pledge = new PledgeClass;

	// Since there is a callback that also gets the error,
	// make sure the pledge considers the error "caught"
	pledge.warn_uncaught_errors = false;

	// Normalize the tasks
	if (Obj.isPlainObject(tasks)) {

		// Get the keys
		keys = Object.keys(tasks);

		// Get the amount of tasks
		length = keys.length;

		// The result object will also be an object
		results = Obj.mapKeys(keys);
	} else {

		// Make sure everything is what it needs to be
		if (!Array.isArray(tasks)) {

			// // Keep function optimized by not leaking the `arguments` object
			let temp = new Array(arguments.length);
			for (i = 0; i < temp.length; i++) temp[i] = arguments[i];

			// Everything but the last entry should be the tasks
			// If async was set, the first one should be skipped too
			tasks = temp.slice(0+setAsync, temp.length-1);

			// The very last function should be the callback
			callback = temp[temp.length-1];
		}

		// Get the amount of tasks
		length = tasks.length;

		// The keys are numeric
		keys = Collection.Array.range(0, length);

		// The results will be an array
		results = new Array(length);
	}

	if (typeof callback !== 'function') {
		callback = function throwWhenNotCaught(err) {

			if (!err) {
				return;
			}

			if (!pledge._caught_rejection) {
				thrower(err);
			}
		};
	}

	// Tell the pledge how many parts there are
	// This includes the callback
	pledge.addProgressPart(length + 1);
	i = -1;

	// An error to know where any possible error happened
	let origin_error;

	if (Blast.DEBUG) {
		origin_error = new Error('');
	}

	handler = function blastSeriesHandler(err, result) {

		var next;

		// If something stopped this code before, do nothing
		if (stop) {
			return;
		}

		// If we get an error object, stop everything
		if (err) {
			return doRejection(err);
		}

		if (i > -1) {
			// Store the result
			results[keys[i]] = result;
		}

		// Increment the counter
		i += 1;

		if (i < length) {
			// Increment the counter
			next = keys[i];
		}

		// Report the progress
		pledge.reportProgressPart(1);

		// See if we need to do another task
		if (i < length && tasks[next]) {

			let task = tasks[next];

			scheduler(function nextSerialTask() {

				var count = 0;

				function nextHandler(err, result) {

					if (count == 1) {
						let message = 'Function.series next handler has been called multiple times';

						if (task && task.name) {
							message += ' in "' + task.name + '" task';
						}

						err = new Error(message);

						if (origin_error) {
							err.stack += '\n' + origin_error.stack;
						}
						return doRejection(err);
					} else if (count > 1) {
						// Just ignore further calls
						return;
					}

					count++;

					return handler(err, result);
				}

				try {
					if (typeof task == 'function') {
						task(nextHandler, result);
					} else {
						pledge._addProgressPledge(task);

						if (typeof task != 'object') {
							PledgeClass.resolve(task).done(nextHandler);
						} else {
							PledgeClass.prototype.handleCallback.call(task, nextHandler);
						}
					}
				} catch (err) {

					if (stop) {
						return;
					}

					return doRejection(err);
				}
			});
		} else {
			stop = true;
			scheduler(function scheduleCallback() {

				var temp;

				try {
					temp = callback(null, results);
				} catch (err) {
					return pledge.reject(err);
				}

				if (typeof temp != 'undefined') {
					results = temp;
				}

				pledge.resolve(results);
			});
		}
	};

	// Start the serial process by calling the handler a first time
	handler();

	function doRejection(err) {

		stop = true;

		if (callback.name != 'throwWhenNotCaught') {
			let temp;

			try {
				temp = callback(err);

				if (temp && temp.constructor && ~temp.constructor.name.indexOf('Error')) {
					err = temp;
				}
			} catch (err) {
				// Ignore any errors this time,
				// reject using the original error
			}

			pledge.reject(err);
		} else {
			pledge.reject(err);
			callback(err);
		}
	}

	return pledge;
});

/**
 * Run (async) functions in parallel
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.8.15
 */
defStat(function parallel(_forceAsync, _limit, _tasks, _callback) {

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
	    tasks,
	    limit,
	    part,
	    skip,
	    args,
	    keys,
	    stop,
	    i;

	stillStarting = true;
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

	let PledgeClass,
	    pledge;

	if (forceAsync) {
		// If we want to force async behaviour, use setImmediate
		scheduler = this?.[Blast.asyncScheduler] || Blast.setImmediate;
		PledgeClass = this?.[Blast.flowPledgeClass] || Blast.Classes.Pledge;
	} else {
		// If we do not want to force it, use callNow
		scheduler = Blast.callNow;
		PledgeClass = Blast.Classes.Pledge.Swift;
	}

	pledge = new PledgeClass;

	if (typeof limit === 'number') {
		if (limit > 0) {
			setLimit = true;
			skip += 1;
		} else {
			setLimit = false;
			skip = 1;
		}
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
		tasks = Object.values(tasks, keys);

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
		keys = Bound.Array.range(0, length);

		// The results will be an array
		results = new Array(length);
	}

	if (typeof callback !== 'function') {
		callback = function throwWhenNotCaught(err) {

			if (!err) {
				return;
			}

			if (!pledge._caught_rejection) {
				thrower(err);
			}
		};
	}

	// Since there is a callback that also gets the error,
	// make sure the pledge considers the error "caught"
	pledge.warn_uncaught_errors = false;

	// If no tasks were given, call the callback
	if (!length) {
		scheduler(scheduleCallback);

		return pledge;
	}

	// Count the number of async functions currently running
	running = 0;
	started = 0;

	// Tell the pledge how many parts there are to begin with
	// This includes the callback
	pledge.addProgressPart(length + 1);

	// An error to know where any possible error happened
	let origin_error;

	if (Blast.DEBUG) {
		origin_error = new Error('');
	}

	handler = function blastParallelHandler(i, err, result) {

		var next;

		// If something stopped this code before, do nothing
		if (stop) {
			return;
		}

		running--;

		// If we get an error object, stop everything
		if (err) {
			return doRejection(err);
		}

		// Store the result
		results[keys[i]] = result;

		// Report the progress
		pledge.reportProgressPart(1);

		// If we need to start any other functions, do it now
		if (!stillStarting && started < length) {

			running++;
			next = started++;
			let task = tasks[next];

			scheduler(function scheduleNextTask() {

				var count = 0;

				function nextHandler(err, val) {

					if (count == 1) {
						let message = 'Function.series next handler has been called multiple times';

						if (task && task.name) {
							message += ' in "' + task.name + '" task';
						}

						err = new Error(message);

						if (origin_error) {
							err.stack += '\n' + origin_error.stack;
						}
						return doRejection(err);
					} else if (count > 1) {
						// Just ignore further calls
						return;
					}

					count++;

					return handler(next, err, val);
				}

				try {
					if (typeof task == 'function') {
						task(nextHandler);
					} else {
						pledge._addProgressPledge(task);

						if (typeof task != 'object') {
							PledgeClass.resolve(task).done(nextHandler);
						} else {
							PledgeClass.prototype.handleCallback.call(task, nextHandler);
						}
					}
				} catch (err) {

					if (stop) {
						return;
					}

					doRejection(err);
				}
			});
		} else {

			// Only call the callback when nothing is running,
			// and when we're not still starting (non-async mode)
			if (running == 0 && (!stillStarting || started == length)) {
				stop = true;
				scheduler(scheduleCallback);
			}
		}
	};

	// Go over every tasks
	for (let index = 0; index < tasks.length; index++) {
		let fnc = tasks[index];

		running++;
		started++;

		// Execute the function
		scheduler(function scheduleNextTask() {

			function nextHandler(err, val) {
				handler(index, err, val);
			}

			try {

				if (typeof fnc == 'function') {
					fnc(nextHandler);
				} else {
					pledge._addProgressPledge(fnc);

					if (typeof fnc != 'object') {
						PledgeClass.resolve(fnc).done(nextHandler);
					} else {
						PledgeClass.prototype.handleCallback.call(fnc, nextHandler);
					}
				}
			} catch (err) {

				// Do nothing if the callback has already been called once
				if (stop) {
					return;
				}

				doRejection(err);
			}
		});

		if (setLimit && running >= limit) {
			break;
		}
	}

	stillStarting = false;

	function scheduleCallback() {

		var temp;

		try {
			temp = callback(null, results);
		} catch (err) {
			return pledge.reject(err);
		}

		if (typeof temp != 'undefined') {
			results = temp;
		}

		pledge.reportProgress(100);
		pledge.resolve(results);
	}

	function doRejection(err) {

		stop = true;

		if (callback.name != 'throwWhenNotCaught') {

			let temp;

			try {
				temp = callback(err);

				if (temp && temp.constructor && ~temp.constructor.name.indexOf('Error')) {
					err = temp;
				}
			} catch (err) {
				// Ignore any errors this time,
				// reject using the original error
			}

			pledge.reject(err);
		} else {
			pledge.reject(err);
			callback(err);
		}
	}

	return pledge;
});

/**
 * Do several tasks in waterfall style
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 */
defStat(function waterfall(...tasks) {

	let PledgeClass = this?.[Blast.flowPledgeClass] || Blast.Classes.Pledge,
	    scheduler = this?.[Blast.asyncScheduler] || Blast.setImmediate,
	    pledge = new PledgeClass;

	const doTask = (index, previous_value) => {

		let task = tasks[index];
		let next_value;

		if (typeof task == 'function') {
			try {
				next_value = task(previous_value);
			} catch (err) {
				return pledge.reject(err);
			}
		} else {
			next_value = task;
		}

		PledgeClass.done(next_value, (err, result) => {

			if (err) {
				return pledge.reject(err);
			}

			if (index == tasks.length - 1) {
				return pledge.resolve(result);
			}

			scheduler(() => doTask(index + 1, result));
		});
	};

	scheduler(() => doTask(0));

	return pledge;
});

/**
 * Do `task` while `test` returns falsy
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {Function}   test
 * @param    {Function}   task
 * @param    {Function}   callback
 *
 * @return   {Object}
 */
defStat(function until(test, task, callback) {
	return this.asyncLoop(false, false, test, task, callback);
});

/**
 * Do the task callback at least once,
 * and then while the test function returns falsy
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.6
 *
 * @param    {Function}   test
 * @param    {Function}   task
 * @param    {Function}   callback
 *
 * @return   {Object}
 */
defStat(function doUntil(task, test, callback) {
	return this.asyncLoop(true, false, test, task, callback);
});

/**
 * Do `task` while `test` returns truthy
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {Function}   test
 * @param    {Function}   task
 * @param    {Function}   callback
 *
 * @return   {Object}
 */
defStat('while', function _while(test, task, callback) {
	return this.asyncLoop(false, true, test, task, callback);
});

/**
 * Do the task callback at least once,
 * and then while the test function returns truthy
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.4
 *
 * @param    {Function}   test
 * @param    {Function}   task
 * @param    {Function}   callback
 *
 * @return   {Object}
 */
defStat(function doWhile(task, test, callback) {
	return this.asyncLoop(true, true, test, task, callback);
});

/**
 * Do `task` for each entry in data serially
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
		subject = Obj.dissect(data);

		wrapTask = function wrapTask(next) {
			task(subject[i].value, subject[i].key, next);
		};
	}

	len = subject.length;
	test = function test() {
		return ++i < len;
	};

	return Fn['while'](test, wrapTask, callback);
}

/**
 * Do `task` for each entry in data in parallel
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.8
 * @version  0.5.9
 *
 * @param    {Array|Object}   data
 * @param    {Function}       task
 * @param    {Function}       callback
 */
forEach.parallel = function forEachParallel(limit, data, task, callback) {

	var tasks = [];

	if (typeof limit != 'number') {
		callback = task;
		task = data;
		data = limit;
		limit = 0;
	}

	if (Array.isArray(data)) {
		data.forEach(function eachEntry(entry, index) {
			tasks.push(function doEntry(next) {
				task(entry, index, next);
			});
		});
	} else {
		Obj.each(data, function eachEntry(entry, key) {
			tasks.push(function doEntry(next) {
				task(entry, key, next);
			});
		});
	}

	return Fn.parallel(limit, tasks, callback);
};

defStat('forEach', forEach);

/**
 * Do an async loop,
 * other loop functions call this
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.7.21
 *
 * @param    {boolean}    atleastOnce   Should the taskFnc run at least once?
 * @param    {boolean}    matchValue    Should testFnc return be truthy or falsy?
 * @param    {Function}   testFnc
 * @param    {Function}   taskFnc
 * @param    {Function}   callback
 *
 * @return   {Object}
 */
defStat(function asyncLoop(atleastOnce, matchValue, testFnc, taskFnc, callback) {

	let obj = {
		start: null,
	};

	if (typeof callback !== 'function') {
		callback = thrower;
	}

	const isFnc = typeof testFnc === 'function';

	let scheduler = this?.[Blast.asyncScheduler] || Blast.setImmediate;

	let handler = function handler(err) {

		if (err) {
			return callback(err);
		}

		if (isFnc) {
			scheduler(function doAsyncTask() {
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
	scheduler(function startAsyncLoop() {

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

	return obj;
});

/**
 * Execute the worker. Whan it is done, execute any possible tasks
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.7.21
 */
defStat(function hinder(forceAsync, worker, options) {

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
		scheduler = this?.[Blast.asyncScheduler] || Blast.setImmediate;
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}     amount    The minimum number of times to run
 * @param    {number}     ms        The minimum number of ms to run, if amount is not set
 * @param    {Function}   task
 * @param    {Function}   callback
 */
defStat(function doUnitTime(amount, ms, task, callback) {

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

			if (recursion < 1000) {

				// Infinite recursion is bad, but a little can't hurt
				task(handler);

				// If we're in the same trap, decrease the counter
				if (currentTrap == trap) {
					recursion--;
				}

			} else {
				// We need to reset the recursion
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}     ms        The minimum number of ms to run
 * @param    {Function}   task
 * @param    {Function}   callback
 */
defStat(function doTime(ms, task, callback) {
	return Fn.doUnitTime(0, ms, task, callback);
});

/**
 * Do the task function the given amount of times.
 * The task can be synchronous: once in a while a `setImmediate` is used
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {number}     amount        The minimum number of times to run
 * @param    {Function}   task
 * @param    {Function}   callback
 */
defStat(function doAmount(amount, task, callback) {
	return Fn.doUnitTime(amount, 0, task, callback);
});

/**
 * Add a counter argument to a function
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.6
 * @version  0.1.6
 *
 * @param    {Function}   fnc
 *
 * @return   {Function}
 */
defStat(function count(fnc) {

	var count = 0;

	return function wrapper() {

		// Turn the arguments into an array
		var args = Bound.Array.cast(arguments);

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.6
 * @version  0.5.5
 *
 * @param    {Function}   fnc        Function to regulate
 * @param    {number}     amount     Maximum amount of times it can be called
 * @param    {Function}   overflow   Function that will receive extra calls
 *
 * @return   {Function}
 */
defStat(function regulate(fnc, amount, overflow) {

	var count = 0;

	if (typeof fnc != 'function') {
		throw new TypeError('Function.regulate requires a valid function');
	}

	if (typeof amount == 'function') {
		overflow = amount;
		amount = null;
	}

	if (!amount) {
		amount = 1;
	}

	function wrapper() {

		var args = Bound.Array.cast(arguments);

		count++;
		wrapper.call_count = count;

		if (count > amount) {
			if (overflow) {
				overflow.call(this, count - amount, args);
			}
			return;
		}

		return fnc.apply(this, args);
	};

	wrapper.call_count = 0;

	return wrapper;
});

/**
 * Make sure the callback will only be called once per given ms
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.9
 * @version  0.7.1
 *
 * @param    {Function}   fnc           Function to throttle
 * @param    {number}     minimum_wait  Minimum time to wait between executions
 * @param    {boolean}    immediate     If true, execute the first execution immediately
 * @param    {boolean}    reset_on_call Reset the counter on each call
 *
 * @return   {Function}
 */
defStat(function throttle(fnc, minimum_wait, immediate, reset_on_call) {

	var last_exec_time = Symbol('last_exec_time'),
	    queued = Symbol('queued'),
	    config,
	    state;

	if (!minimum_wait || typeof minimum_wait != 'object') {
		config = {
			minimum_wait  : minimum_wait,
			immediate     : immediate,
			reset_on_call : reset_on_call
		};
	} else {
		config = minimum_wait;
	}

	state = {};
	state[last_exec_time] = 0;
	state[queued] = null;

	if (!config.minimum_wait) {
		config.minimum_wait = 5;
	}

	return function wrapper() {

		var prev_exec_time,
		    ms_since_last_exec,
		    minimum_wait = config.minimum_wait,
		    context,
		    timer,
		    that,
		    args,
		    now;

		if (config.method) {
			context = this;
		} else {
			context = state;
		}

		prev_exec_time = context[last_exec_time];

		// Get the current timestamp
		now = Date.now();

		// If there was no last execution yet,
		// and we don't have to execute immediately on the first call,
		// set the last and prev timestamps to NOW
		if (reset_on_call || (!context[last_exec_time] && !config.immediate)) {
			context[last_exec_time] = now;
			prev_exec_time = now;
		}

		// On the first (non-immediate) call, diff will be zero
		ms_since_last_exec = now - prev_exec_time;

		// If there has been no execution yet, or the waiting time is over
		if (!context[last_exec_time] || (ms_since_last_exec > minimum_wait)) {

			if (context[queued]) {
				clearTimeout(context[queued]);
			}

			if (config.reset_on_call === true) {
				// If reset_on_call is true the waiting time starts again,
				// the call will be queued in the next if block
				ms_since_last_exec = 0;
			} else {
				fnc.apply(this, arguments);
				context[last_exec_time] = now;
				return;
			}
		}

		if (ms_since_last_exec < minimum_wait) {
			args = arguments;
			that = this;

			if (context[queued]) {
				clearTimeout(context[queued]);
			}

			timer = minimum_wait - ms_since_last_exec;

			// If a delay is configured,
			// make sure the function isn't called before that
			if (config.delay && timer < config.delay) {
				timer = config.delay;
			}

			context[queued] = setTimeout(function throttleQueue() {

				// Update the now timestamp
				now = Date.now();

				// Diff again
				ms_since_last_exec = now - prev_exec_time;

				// Sometimes it still fired too early!
				// So set a new timeout
				if (ms_since_last_exec < minimum_wait) {
					return context[queued] = setTimeout(throttleQueue, minimum_wait - ms_since_last_exec);
				}

				context[queued] = null;
				context[last_exec_time] = now;
				fnc.apply(that, args);

			}, timer);
		}
	};
});

/**
 * Create and return a new FunctionQueue
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.8
 * @version  0.1.8
 *
 * @return   {FunctionQueue}
 */
defStat(function createQueue(options) {
	return new Classes.FunctionQueue(options);
});