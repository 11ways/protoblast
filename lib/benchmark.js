module.exports = function BlastBenchmark(Blast, Collection) {

	var performanceNow,
	    performance,
	    hrtime,
	    nowOverhead;

	performance = Blast.Globals.performance || {};

	performanceNow =
		performance.now       ||
		performance.mozNow    ||
		performance.msNow     ||
		performance.oNow      ||
		performance.webkitNow;

	if (performanceNow) {
		// If it was found, we need to bind it to the original object
		performanceNow = performanceNow.bind(performance);
	} else {
		if (Blast.Globals.process && Blast.Globals.process.hrtime) {
			// In node we can use hrtime
			performanceNow = function() {
				var time = process.hrtime();
				return time[0] * 1e3 + time[1] / 1e6;
			};
		} else {
			performanceNow = function() {
				return (new Date()).getTime();
			};
		}
	}

	if (Blast.Globals.process && Blast.Globals.process.hrtime) {
		hrtime = Blast.Globals.process.hrtime;
	} else {
		hrtime = function hrtime(previousTime) {
			var now  = performanceNow()/10e3,
			    sec  = ~~(now),
			    nano = (now%1)*10e9;

			if (previousTime) {
				sec = sec - previousTime[0];
				nano = nano - previousTime[1];

				if (nano < 0) {
					sec--;
					nano += 10e9;
				}
			}

			return [sec, nano];
		};
	}

	Blast.performanceNow = performanceNow;
	Blast.hrtime = hrtime;

	/**
	 * Do some simple benchmarking
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fn
	 * @param    {Function}   acb
	 */
	Blast.benchmark = function benchmark(fn, acb) {

		if (fn.length == 0) {
			return doSyncBench(fn, acb);
		}

		return doAsyncBench(fn, acb);
	};

	/**
	 * This dummy function contains no logic,
	 * it's just to test the cost of calling a function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	function dummy(){}

	/**
	 * This function determines the ms overhead cost of calling a
	 * function the given amount of time
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Number}   runs
	 */
	function getFunctionOverhead(runs) {

		var start,
		    i;

		// Call dummy now to get it jitted
		dummy();

		start = Blast.performanceNow();

		for (i = 0; i < runs; i++) {
			dummy();
		}

		return Blast.performanceNow() - start;
	}

	function syncTest(fn, runs, iterOverhead) {

		var elapsed,
		    samples,
		    result,
		    sizes,
		    total,
		    start,
		    shard,
		    r,
		    i;

		sizes = [1, 10, 120, 120, 120, 240, 240, 480];
		samples = [];
		result = {};
		total = 0;
		r = 0;

		for (r = 0; r < sizes.length; r++) {

			shard = 1 + ~~((runs/50)*sizes[r]);

			start = Blast.performanceNow();

			for (i = 0; i < shard; i++) {
				fn();
			}

			// Get the elapsed time
			elapsed = Blast.performanceNow() - start;

			// Remove the function call overhead
			elapsed = elapsed - (shard * (iterOverhead/runs));

			samples.push(~~((shard/elapsed)*1000));
			total += shard;

			// Only the first 5 tests are mandatory
			if (r > 4) {
				if (samples.indexOf(Blast.Bound.Array.max(samples)) !== r) {
					break;
				}
			}
		}

		result.iterations = total;
		result.max = Blast.Bound.Array.max(samples);
		result.ops = result.max;
		result.median = Blast.Bound.Math.median(samples.slice(1));
		result.mean = Blast.Bound.Math.mean(samples.slice(1));
		result.deviation = ~~Blast.Bound.Math.deviation(samples.slice(1), true);
		result.samplecount = samples.length;
		result.samplehit = (samples.indexOf(Blast.Bound.Array.max(samples))+1);

		return result;
	}

	function doSyncBench(fn, acb) {

		var start,
		    fnOverhead,
		    pretotal,
		    result,
		    runs;

		runs = 0;

		// For the initial test, to determine how many iterations we should
		// test later, we just use Date.now()
		start = Date.now();

		// See how many times we can get it to run in 200ms
		// This doesn't need to be precise yet. We don't use these results
		// for the ops count because Date.now() takes time, too
		do {
			fn();
			runs++;
			pretotal = Date.now() - start;
		} while (pretotal < 50);

		// See how long it takes to run an empty function
		fnOverhead = getFunctionOverhead(runs);

		result = syncTest(fn, runs, fnOverhead);

		if (acb) {
			acb(result.max, result);
		}

		return result;
	}

	function doAsyncBench(fn, acb) {

		var start,
		    fnOverhead,
		    pretotal,
		    result,
		    runs;

		runs = 0;

		// For the initial test, to determine how many iterations we should
		// test later, we just use Date.now()
		start = Date.now();

	}

	/**
	 * Do the task callback at least once,
	 * and then until the test function returns falsy
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}
	 */
	Blast.doWhile = function doWhile(test, task, callback) {

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
	};

	Blast.whenCalm = function whenCalm() {

		var handler,
		    samples,
		    prev,
		    runs,
		    min;

		samples = [];
		runs = 0;
		min = Infinity;

		console.time('Searchforcalm')

		handler = function handler() {

			var now = Blast.performanceNow(),
			    elapsed = now - prev,
			    deviation,
			    lowdev,
			    set,
			    low;

			// Keep tabs on the minimum wait time possible
			if (elapsed < min) {
				min = elapsed;
			}
			
			samples.push(elapsed);

			runs++;

			if (runs % 5 === 0) {

				if (runs > 50 && elapsed !== min) {

					// Calculate the deviation of the lowest half of the samples
					low = Blast.Bound.Math.lowest(samples, samples.length/2);
					lowdev = Blast.Bound.Math.deviation(low, true);

					if (lowdev < 20) {

						// Get the minimum elapsed time from the last 5 runs
						set = Blast.Bound.Math.lowest(samples.last(5));

						// Get the deviation the three
						deviation = Blast.Bound.Math.deviation([min, elapsed, set], true);

						console.log('lowdev: ' + lowdev + ' - dev: ' + deviation + ' - elapsed: ' + elapsed)

						if (deviation < 40) {
							console.log('Found calm moment after ' + runs + ' runs: ' + elapsed);
							console.timeEnd('Searchforcalm')
							return;
						}
					}
				}

				setTimeout(function() {

					prev = Blast.performanceNow();

					Blast.setImmediate(function() {
						handler();
					});

				}, ~~(4+Math.pow(1+elapsed, 2)));

				return;
			} else {
				prev = now;
			}

			Blast.setImmediate(function() {
				handler();
			});
		};

		prev = Blast.performanceNow();

		Blast.setImmediate(function() {
			handler();
		});
	};

	/**
	 * Do the task callback for the given amount of ms,
	 * meant for benchmarking purposes
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Object}
	 */
	Blast.doTime = function doTime(ms, task, callback) {

		var recursion,
		    handler,
		    result,
		    start,
		    time,
		    runs,
		    trap;

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		trap = 0;
		runs = 0;
		recursion = 0;

		handler = function handler() {

			var currentTrap = trap;

			runs++;
			recursion++;

			time = Date.now() - start;

			// If we have not yet reached the minimum amount of time
			// this function should run, keep on running it
			if (time < ms) {

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
				Blast.setImmediate(function() {
					callback(null, runs, time);
				});
			}
		};

		// Use setImmediate so we're sure the function will yield at least once
		Blast.setImmediate(function() {
			start = Date.now();
			task(handler);
		});
	};

	Blast.series = function series(tasks, callback) {

		var handler,
		    results,
		    i;

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		i = -1;
		results = [];

		handler = function handler(err, result) {

			var next;

			// If we get an error object, stop everything
			if (err) {
				return callback(err);
			}

			if (i > -1) {
				// Store the result
				results[i] = result;
			}

			// Increment the counter
			next = ++i;

			// See if we need to do another task
			if (tasks[next]) {
				Blast.setImmediate(function() {
					tasks[next](handler);
				});
			} else {
				Blast.setImmediate(function() {
					callback(null, results);
				});
			}
		};

		handler();
	};

};