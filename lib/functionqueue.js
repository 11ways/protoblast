var defaultOptions = {
	enabled    : false,
	limit      : 1,
	context    : false,
	queue_drop : false,
	throttle   : 0,
	sort       : false
};

/**
 * The Function Queue Class,
 * based on Fuery
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.2.1
 *
 * @param    {Object}   options
 */
var Queue = Fn.inherits('Informer', function FunctionQueue(options) {

	options = Object.assign(defaultOptions, options);

	// Only leave `queue_drop` amount of tasks in the queue
	// if the total amount of tasks goes above this number.
	// Oldest tasks get removed
	this.queue_drop = options.queue_drop;

	// If the queue is enabled. False by default
	this.enabled = options.enabled;

	// Is there a limit to the amount of running functions?
	this.limit = options.limit;

	// The context functions should run in
	this.context = options.context;

	// Time to wait in ms
	this.throttle = options.throttle;

	// Should the queue be sorted?
	this.sort = options.sort;

	// The functions to execute
	this._queue = [];

	// Does the queue need sorting?
	this._needSort = false;

	// The functions to execute after a pause
	this._pauseQueue = [];

	// Current running functions
	this.running = 0;

	// Total executed functions
	this.startCount = 0;
	this.endCount = 0;

	// Throttle counts
	this.startThrottle = 0;
	this.endThrottle = 0;

	// Last time something ran
	this.lastexec = Date.now();
	this.lastEnd = 0;

	// Has a new check been queued yet?
	this.queuedCheck = false;
});

/**
 * Set the context added functions should run in
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.1.8
 */
Queue.setMethod(function setContext(context) {
	this.context = context;
});

/**
 * Start the queue now.
 * If a function is provided as a parameter,
 * the queue will be started once that function calls back
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.3.10
 *
 * @param    {Function}   fnc   The optional function to execute before starting
 */
Queue.setMethod(function start(fnc) {

	var that = this;

	if (this.destroyed) {
		return;
	}

	// Check the pause functions again, just in case
	that.checkPause();

	if (typeof fnc == 'function') {
		fnc(function afterStartEnabler() {
			that.enabled = true;

			Blast.setImmediate(function afterImmediate() {
				that.check();
			});
		});
	} else {
		that.enabled = true;

		Blast.setImmediate(function afterImmediate() {
			that.check();
		});
	}
});

/**
 * Add a function to the queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.7.1
 *
 * @param    {Function}   fnc      The function to queue
 * @param    {Array}      args     Arguments to pass to the function
 * @param    {Object}     options
 */
Queue.setMethod(function add(fnc, args, options) {

	var that = this,
	    called_done = false,
	    config,
	    done,
	    i;

	if (this.destroyed) {
		return;
	}

	if (this.hasBeenSeen('empty')) {
		this.unsee('empty');
	}

	if (!options || typeof options !== 'object') {
		options = {};
	}

	// If an ID is given, make sure this isn't already in the queue
	if (options.id) {
		for (i = 0; i < this._queue.length; i++) {
			if (this._queue[i].options.id == options.id) {
				return;
			}
		}
	} else {
		options.id = Date.now() + '-' + ~~(Math.random()*1000);
	}

	if (!options.weight) {
		options.weight = 100;
	}

	done = function doneFueryFunction() {

		if (called_done) {
			return;
		}

		called_done = true;

		that.running--;
		that.endCount++;
		that.endThrottle++;
		that.check(true);
	};

	config = {
		fnc       : fnc,
		done      : done,
		options   : options,
		arguments : args
	};

	if (!options.force) {
		this._queue.push(config);

		// Mark the queue as dirty
		this._needSort = true;

		Blast.setImmediate(function doDelayedCheck() {
			that.check();
		});
	} else {
		// Force this to run!
		Blast.nextTick(function onNextTick() {
			that.check(false, config);
		});
	}
});

/**
 * Force this function to run now
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.10
 * @version  0.3.10
 *
 * @param    {Function}   fnc      The function to queue
 * @param    {Array}      args     Arguments to pass to the function
 * @param    {Object}     options
 */
Queue.setMethod(function force(fnc, args, options) {

	if (this.destroyed) {
		return;
	}

	if (!options || typeof options !== 'object') {
		options = {};
	}

	// The `force` call is just a wrapper around
	// `add` with the force option set to true
	options.force = true;

	this.add(fnc, args, options);
});

/**
 * Function to sort the weighted queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.1.9
 */
function sortQueue(a, b) {
	return b.options.weight - a.options.weight;
}

/**
 * Process the queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.7.1
 *
 * @param    {Boolean}  set_end     Set `lastEnd` to current timestamp
 * @param    {Object}   force_next  Next object to force
 */
Queue.setMethod(function check(set_end, force_next) {

	var that = this,
	    limit,
	    time,
	    diff,
	    next,
	    args,
	    i;

	if (!force_next) {

		// If the queue isn't enabled, do nothing
		if (!this.enabled || this.destroyed) {
			this.checkPause();
			return;
		}

		// Set the end time even if nothing is queued
		if (set_end) {
			time = Date.now();
			this.lastEnd = time;
		}

		// If there is nothing in the queue, do nothing
		if (!this._queue.length) {
			if (!this.running) {
				this.emitOnce('empty');
			}
			return;
		}

		// If there is a limit, and it is met, do nothing
		if (this.limit != false && this.limit <= this.running) {
			return;
		}

		// If a check has already been queued, do nothing
		if (this.queuedCheck) {
			return;
		}

		// Throttle the queue
		if (this.throttle) {

			if (typeof this.limit == 'number') {
				limit = this.limit;
			} else {
				limit = 5;
			}

			// If enough functions have started executing, throttle the next ones
			if (this.startThrottle >= this.limit) {

				// Wait if all of the other functions haven't finished yet
				if (this.endThrottle < this.startThrottle) {
					return;
				}

				if (!time) time = Date.now();

				// If this check is requested at the end of an execution,
				// set the end time
				if (set_end) {
					diff = 0;
				} else {
					diff = time - this.lastEnd;
				}

				// Reset the throttle counts
				this.startThrottle = 0;
				this.endThrottle = 0;

				// If not enough time has passed, queue a new check
				if (diff < this.throttle || this.running) {

					this.queuedCheck = true;
					this.throttleCount = 0;

					if (!diff) {
						diff = 0;
					}

					diff = this.throttle - diff;

					return setTimeout(function qqCheck() {
						that.queuedCheck = false;
						that.check();
					}, diff);
				}
			}

			this.lastexec = time;
		}

		// Sort the queue
		if (this.sort && this._needSort) {
			this._queue.sort(sortQueue);
			this._needSort = false;
		}

		// If the queue contains too many tasks, drop the older ones
		if (this.queue_drop && this._queue.length > this.queue_drop) {
			this._queue.splice(0, this._queue.length - this.queue_drop);
		}

		// Get the next item from the top of the queue
		next = this._queue.shift();
	} else {
		next = force_next;
	}

	if (next && next.fnc) {

		// Increase the running count
		this.running++;

		// Increase the start counts
		this.startCount++;
		this.startThrottle++;

		// If the function accepts a callback, pass the done function
		if (next.fnc.length) {

			// Add the done callback function to the arguments
			args = [next.done];

			// Don't use special array functions because 'arguments' isn't an array
			if (next.arguments && next.arguments.length) {
				for (i = 0; i < next.arguments.length; i++) {
					args.push(next.arguments[i]);
				}
			}

			next.fnc.apply(this.context, args);
		} else {
			// If it does not, do the done right after
			next.fnc.call(this.context);
			next.done();
		}
	}

	// Check again
	this.check();
});

/**
 * Process the pause queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.1.9
 */
Queue.setMethod(function checkPause() {

	var next;

	// Don't do pause functions if something is still running
	// or the queue has been destroyed
	if (this.running || this.destroyed) {
		return;
	}

	// If the pause queue is empty, do nothing
	if (!this._pauseQueue.length) {
		return;
	}

	next = this._pauseQueue.shift();

	next();

	// Check again
	this.checkPause();
});

/**
 * Pause the queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.8
 * @version  0.1.9
 *
 * @param    {Function}   fnc   A function to execute after all the running
 *                              functions have finished
 */
Queue.setMethod(function pause(fnc) {

	if (this.destroyed) {
		return;
	}

	// Pause the queue
	this.enabled = false;

	if (typeof fnc == 'function') {
		// Add a function to the pause queue
		this._pauseQueue.push(fnc);
	}

	// Process the pause queue
	this.checkPause();
});

/**
 * Destroy the queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.9
 * @version  0.1.9
 */
Queue.setMethod(function destroy() {

	if (this.destroyed) {
		return;
	}

	// Flip some switches
	this.enabled = false;
	this.destroyed = true;

	// Empty the arrays
	this._queue.length = 0;
	this._pauseQueue.length = 0;
	this.context = null;
});

Blast.defineClass('FunctionQueue', Queue);