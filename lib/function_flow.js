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
	 * @version  0.1.2
	 */
	Blast.defineStatic('Function', 'series', function series(tasks, callback) {

		var handler,
		    results,
		    keys,
		    temp,
		    i;

		// Normalize the tasks
		if (Collection.Object.isObject(tasks)) {

			// The result object will also be an object
			results = {};

			// Get the keys
			keys = Object.keys(tasks);
		} else {

			// The results will be an array
			results = [];

			// Make sure everything is what it needs to be
			if (!Array.isArray(tasks)) {

				// Convert the arguments to a regular array
				temp = Blast.Bound.Array.cast(arguments);

				// Everything but the last entry should be the tasks
				tasks = Blast.Bound.Array.first(temp, temp.length-1);

				// The very last function should be the callback
				callback = Blast.Bound.Array.last(temp);
			}

			// The keys are numeric
			keys = Blast.Bound.Array.range(0, tasks.length);
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
	});

	/**
	 * Run (async) functions in parallel
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	Blast.defineStatic('Function', 'parallel', function parallel(limit, tasks, callback) {

		var setLimit,
		    handler,
		    results,
		    running,
		    started,
		    length,
		    args,
		    keys,
		    i;

		if (typeof limit === 'number') {
			setLimit = true;
		} else {

			// Because we need to do some argument shuffling, already clone it
			args = Blast.Bound.Array.cast(arguments);

			setLimit = false;
			callback = tasks;
			tasks = limit;
		}

		// Normalize the tasks
		if (Collection.Object.isObject(tasks)) {

			// The result object will also be an object
			results = {};

			// Get the keys
			keys = Object.keys(tasks);
		} else {

			// The results will be an array
			results = [];

			// Make sure everything is what it needs to be
			if (!Array.isArray(tasks)) {

				// Convert the arguments to a regular array
				if (!args) {
					args = Blast.Bound.Array.cast(arguments);
				}

				// Everything but the last entry should be the tasks
				// If the limit was set, the first one should be skipped too
				tasks = args.slice(0+setLimit, args.length-1);

				// The very last function should be the callback
				callback = Blast.Bound.Array.last(args);
			}

			// The keys are numeric
			keys = Blast.Bound.Array.range(0, tasks.length);
		}

		if (typeof callback !== 'function') {
			callback = dummy;
		}

		// Count the number of async functions currently running
		running = 0;
		started = 0;
		length = tasks.length;

		// Go over every tasks
		tasks.every(function(fnc, index) {

			running++;
			started++;

			// Execute the function
			Blast.setImmediate(function() {
				fnc(function nextHandler(err, val) {
					handler(index, err, val);
				});
			});

			if (setLimit && running >= limit) {
				return false;
			}

			return true;
		});

		handler = function handler(i, err, result) {

			var next;

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
					tasks[next](function nextHandler(err, val) {
						handler(next, err, val);
					});
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

};