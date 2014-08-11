module.exports = function BlastBenchmark(Blast, Collection) {

	var performanceNow,
	    performance,
	    nowOverhead,
	    polystart,
	    hrtime;

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

			polystart = process.hrtime();

			// In node we can use hrtime
			performanceNow = function() {
				var time = process.hrtime(polystart);
				return time[0] * 1e3 + time[1] / 1e6;
			};
		} else {

			polystart = (new Date()).getTime();

			performanceNow = function() {
				return (new Date()).getTime() - polystart;
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

	var baselineMinimum = Infinity,
	    baselineSamples = [],
	    baselineCycles  = 0,
	    baselineMedian  = 0,
	    baselinePrev    = 0,
	    baselineMean;

	/**
	 * Get the event loop latency baseline for the current environments
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   callback
	 */
	Blast.getEventLatencyBaseline = function getEventLatencyBaseline(callback) {

		var wait,
		    now;

		if (baselineCycles < 6) {

			now = Blast.performanceNow();
			wait = 5;

			baselineCycles++;

			Blast.getEventLatency(function(err, median, mean, lowest) {

				if (lowest < baselineMinimum) {
					baselineMinimum = lowest;
				}

				baselineSamples.push(lowest);

				// When the process or browser is just starting up,
				// the event loop will be busy any way, so delay the tests
				if (now < 600) {
					wait += 500 - (now / 2);
				}

				// Add the median latency of last time
				wait += ~~(baselinePrev*10);

				if (wait > 1000) {
					wait = 1000;
				}

				setTimeout(function() {
					Blast.setImmediate(function() {
						Blast.getEventLatencyBaseline(callback);
					});
				}, wait);

				baselinePrev = median;
			});

			return;
		}

		if (baselineCycles === 6) {
			baselineMedian = Blast.Bound.Math.median(baselineSamples);
			baselineMean = Blast.Bound.Math.mean(baselineSamples);
		}

		Blast.setImmediate(function() {
			callback(null, baselineMedian, baselineMean, baselineMinimum);
		});
	};

	/**
	 * Get the current event loop latency
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   callback
	 */
	Blast.getEventLatency = function getEventLatency(callback) {

		var argcount,
		    handler,
		    samples,
		    median,
		    lowest,
		    mean,
		    runs,
		    prev;

		argcount = callback.length;
		samples = [];
		runs = 0;

		handler = function handler() {

			var elapsed,
			    now;

			now = Blast.performanceNow();
			elapsed = now - prev;

			// Increase the run count
			runs++;

			// Add this sample
			samples.push(elapsed);

			if (runs === 6) {

				if (argcount > 1) {
					median = Blast.Bound.Math.median(samples);

					if (argcount > 2) {
						mean = Blast.Bound.Math.mean(samples);

						if (argcount > 3) {
							lowest = Blast.Bound.Math.lowest(samples);
						}
					}
				}

				return callback(null, median, mean, lowest);
			}

			prev = Blast.performanceNow();

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
	 * Execute the given function when the event queue is nearly empty
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   callback
	 */
	Blast.whenCalm = function whenCalm(callback) {

		// Get the baseline latency
		Blast.getEventLatencyBaseline(function(err, median, mean, lowest) {
			Blast.getEventLatency(function(err, currentMedian) {

				if (currentMedian < mean || (currentMedian / mean) < 1.6) {
					callback();
				} else {
					setTimeout(function() {
						Blast.whenCalm(callback);
					}, 4 + ~~(currentMedian*3));
				}
			});
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