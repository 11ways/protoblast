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

		var dummy = Collection.Function.dummy,
		    start,
		    i;

		// Call dummy now to get it jitted
		Collection.Function.dummy();

		start = Blast.performanceNow();

		for (i = 0; i < runs; i++) {
			dummy();
		}

		return Blast.performanceNow() - start;
	}

	/**
	 * The synchronous benchmark tester
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fn
	 * @param    {Number}     runs            Expected runs per 50ms
	 * @param    {Number}     iterOverhead    Expected overhead per runs-amount
	 *
	 * @return   {Object}
	 */
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

	/**
	 * The asynchronous benchmark tester
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fn
	 * @param    {Number}     testruns         Expected runs per 200ms
	 * @param    {Number}     asyncOverhead    Expected overhead per runs-amount
	 * @param    {Function}   callback         Callback to pass the result object to
	 */
	function asyncTest(fn, testruns, asyncOverhead, callback) {

		var samples,
		    result,
		    sizes,
		    total,
		    start,
		    shard,
		    r,
		    i;

		sizes = [120, 120, 120, 240, 240, 480];
		samples = [];
		result = {};
		total = 0;
		r = 0;

		Collection.Function.doWhile(function test() {

			// Increment the counter after every loop
			r++;

			// Only the first 4 tests are mandatory
			if (r > 4) {
				if (samples.indexOf(Blast.Bound.Array.max(samples)) !== r) {
					return false;
				}
			}

			return r < sizes.length;

		}, function measureBatch(next) {

			shard = 1 + ~~((testruns/200)*sizes[r]);

			Collection.Function.doAmount(shard, fn, function(err, runs, elapsed) {
				elapsed = elapsed - (shard * (asyncOverhead/testruns));
				samples.push(~~((shard/elapsed)*1000));
				total += shard;

				next();
			});

		}, function finish() {

			result.iterations = total;
			result.max = Blast.Bound.Array.max(samples);
			result.ops = result.max;
			result.median = Blast.Bound.Math.median(samples.slice(1));
			result.mean = Blast.Bound.Math.mean(samples.slice(1));
			result.deviation = ~~Blast.Bound.Math.deviation(samples.slice(1), true);
			result.samplecount = samples.length;
			result.samplehit = (samples.indexOf(Blast.Bound.Array.max(samples))+1);

			if (callback) {
				callback(null, result);
			} else {
				console.log(result);
			}
		});
	}

	/**
	 * Function that sets up the synchronous benchmark
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fn
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	function doSyncBench(fn, callback) {

		var start,
		    fnOverhead,
		    pretotal,
		    result,
		    runs;

		runs = 0;

		// For the initial test, to determine how many iterations we should
		// test later, we just use Date.now()
		start = Date.now();

		// See how many times we can get it to run for 50ms
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

		if (callback) {
			callback(null, result);
		}

		return result;
	}

	/**
	 * Function that sets up the asynchronous benchmark
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @param    {Function}   fn
	 * @param    {Function}   callback
	 *
	 * @return   {Object}
	 */
	function doAsyncBench(fn, callback) {

		var fnOverhead,
		    pretotal,
		    result;

		// See how many times we can get it to run for 200ms
		Collection.Function.doTime(200, fn, function(err, runs, elapsed) {

			// See how the baseline latency is like
			Blast.getEventLatencyBaseline(function(err, median) {
				asyncTest(fn, runs, median+(getFunctionOverhead(runs)*8), callback);
			});
		});
	}

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

};