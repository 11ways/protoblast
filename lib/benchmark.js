let callGarbageCollection,
    performanceNow,
    performance,
    nowOverhead,
    polystart,
    hrtime,
    v8,
    vm,
    gc;

if (Blast.isNode) {
	v8 = require('v8');
	vm = require('vm');
	v8.setFlagsFromString('--expose_gc');
	gc = vm.runInNewContext('gc');
	callGarbageCollection = () => {
		if (gc) gc();
	}
} else {
	callGarbageCollection = () => {};
}

// Get the performance object, if it exists
performance = Blast.Globals.performance || {};

// Get the performance.now function
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

		// Because performance.now should return the time passed since
		// the beginning of the session, we need to set a starting reference
		polystart = process.hrtime();

		// In node we can use hrtime
		performanceNow = function performanceNow() {
			var time = process.hrtime(polystart);
			return time[0] * 1e3 + time[1] / 1e6;
		};
	} else {

		polystart = (new Date()).getTime();

		performanceNow = function performanceNow() {
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

// Default test sizes
Blast.benchmark_sync_sizes = [5, 10, 120, 120, 240, 240, 240, 480];
Blast.benchmark_async_sizes = [120, 120, 120, 240, 240, 480];

/**
 * Do some simple benchmarking
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {Function}   fn
 * @param    {Function}   acb
 */
Blast.defineStatic('Function', 'benchmark', function benchmark(fn, acb) {

	callGarbageCollection();

	if (fn.length == 0) {
		return doSyncBench(fn, acb);
	}

	return doAsyncBench(fn, acb);
});

/**
 * This function determines the ms overhead cost of calling a
 * function the given amount of time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.9.3
 *
 * @param    {number}   runs
 */
function getFunctionOverhead(runs) {

	var result,
	    dummy,
	    start,
	    i;

	// The dummy has to return something,
	// or it'll get insanely optimized
	dummy = Function('return 1');

	// Call dummy now to get it jitted
	dummy();

	start = Blast.performanceNow();

	for (i = 0; i < runs; i++) {
		dummy();
	}

	result = Blast.performanceNow() - start;

	// When doing coverage this can increase a lot, giving weird results
	if (result > 1) {
		result = 0.5;
	}

	callGarbageCollection();

	return result;
}

/**
 * The synchronous benchmark tester
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.9.3
 *
 * @param    {Function}   fn
 * @param    {number}     runs            Expected runs per 50ms
 * @param    {number}     iterOverhead    Expected overhead per runs-amount
 *
 * @return   {Object}
 */
function syncTest(fn, runs, iterOverhead) {

	var elapsed,
	    samples,
	    onemore,
	    result,
	    sizes,
	    total,
	    start,
	    shard,
	    r,
	    i;

	// The wanted milliseconds per test
	sizes = Blast.benchmark_sync_sizes;
	samples = [];
	result = {};
	total = 0;
	r = 0;

	for (r = 0; r < sizes.length; r++) {

		// Calculate how many times we should execute the test
		shard = 1 + ~~((runs/50)*sizes[r]);

		// Log the starting time
		start = Blast.performanceNow();

		// Actually execute the function "shard" amount of times
		for (i = 0; i < shard; i++) {
			fn();
		}

		// Get the elapsed time
		elapsed = Blast.performanceNow() - start;

		callGarbageCollection();

		// Remove the function call overhead
		elapsed = elapsed - (shard * (iterOverhead/runs));

		samples.push(~~((shard/elapsed)*1000));
		total += shard;

		// Only the first 6 tests are mandatory
		if (r > 5) {
			// If the last sample is not the best, stop further tests
			if (samples.indexOf(Bound.Array.max(samples)) !== r) {

				// If this already "one more" test, break
				if (onemore) {
					break;
				}

				onemore = true;
			}
		}
	}

	result.iterations   = total;
	result.max          = Bound.Array.max(samples);
	result.ops          = result.max;
	result.median       = Bound.Math.median(samples.slice(1));
	result.mean         = Bound.Math.mean(samples.slice(1));
	result.deviation    = ~~Bound.Math.deviation(samples.slice(1), true);
	result.samplecount  = samples.length;
	result.samplehit    = (samples.indexOf(Bound.Array.max(samples))+1);

	return result;
}

/**
 * The asynchronous benchmark tester
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.5.9
 *
 * @param    {Function}   fn
 * @param    {number}     testruns         Expected runs per 200ms
 * @param    {number}     asyncOverhead    Expected overhead per runs-amount
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

	sizes = Blast.benchmark_async_sizes;
	samples = [];
	result = {};
	total = 0;
	r = 0;

	Fn.doWhile(function measureBatch(next) {

		// Calculate how many times to do the test
		shard = 1 + ~~((testruns/300)*sizes[r]);

		callGarbageCollection();

		Fn.doAmount(shard, fn, function done(err, runs, elapsed) {
			elapsed = elapsed - (shard * (asyncOverhead/testruns));
			samples.push(~~((shard/elapsed)*1000));
			total += shard;
			callGarbageCollection();
			next();
		});

	}, function test() {

		// Increment the counter after every loop
		r++;

		// Only the first 4 tests are mandatory
		if (r > 4) {
			if (samples.indexOf(Bound.Array.max(samples)) !== r) {
				return false;
			}
		}

		return r < sizes.length;

	}, function finish() {

		result.iterations  = total;
		result.max         = Bound.Array.max(samples);
		result.ops         = result.max;
		result.median      = Bound.Math.median(samples.slice(1));
		result.mean        = Bound.Math.mean(samples.slice(1));
		result.deviation   = ~~Bound.Math.deviation(samples.slice(1), true);
		result.samplecount = samples.length;
		result.samplehit   = (samples.indexOf(Bound.Array.max(samples))+1);

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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
	    runs,
	    name;

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
		result.name = fn.name || '';
		callback(null, result);
	} else {
		name = fn.name || '';
		if (name) name = 'for "' + name + '" ';

		console.log('Benchmark ' + name + 'did ' + Bound.Number.humanize(result.ops) + '/s (' + Bound.Number.humanize(result.iterations) + ' iterations)');
	}

	return result;
}

var benchQueue = [],
    benchRunning = 0;

/**
 * Function that sets up the asynchronous benchmark
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.6.0
 *
 * @param    {Function}   fn
 * @param    {Function}   callback
 *
 * @return   {Object}
 */
function doAsyncBench(fn, callback) {

	if (benchRunning > 0) {
		let args = [...arguments];
		benchQueue.push(args);
		return;
	}

	let pledge = new Classes.Pledge.Swift();

	benchRunning++;

	// See how many times we can get it to run for 300ms
	Fn.doTime(300, fn, function(err, runs, elapsed) {

		// See how the baseline latency is like
		Blast.getEventLatencyBaseline(function(err, median) {
			asyncTest(fn, runs, median+(getFunctionOverhead(runs)*8), function asyncDone(err, result) {

				var next,
				    name;

				if (err) {
					pledge.reject(err);
				} else {
					pledge.resolve(result);
				}

				// Call the callback
				if (callback) {
					result.name = fn.name || '';
					callback(err, result);
				} else {
					name = fn.name || '';
					if (name) name = 'for "' + name + '" ';

					console.log('Benchmark ' + name + 'did ' + Bound.Number.humanize(result.ops) + '/s (' + Bound.Number.humanize(result.iterations) + ' iterations)');
				}

				benchRunning--;

				// Schedule a next benchmark
				if (benchRunning == 0 && benchQueue.length > 0) {

					// Get the top of the queue
					next = benchQueue.shift();

					Blast.setImmediate(function() {
						doAsyncBench.apply(null, next);
					});
				}
			});
		});
	});

	return pledge;
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
		baselineMedian = Bound.Math.median(baselineSamples);
		baselineMean = Bound.Math.mean(baselineSamples);
	}

	Blast.setImmediate(function() {
		callback(null, baselineMedian, baselineMean, baselineMinimum);
	});
};

/**
 * Get the current event loop latency
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
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
				median = Bound.Math.median(samples);

				if (argcount > 2) {
					mean = Bound.Math.mean(samples);

					if (argcount > 3) {
						lowest = Bound.Math.lowest(samples);
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
 * @author   Jelle De Loecker <jelle@elevenways.be>
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

Blast.benchmark = Fn.benchmark;