module.exports = function BlastFnQueue(Blast, Collection) {

	/**
	 * The Function Queue Class,
	 * based on Fuery
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 */
	var Queue = Collection.Function.inherits('Informer', function FunctionQueue() {
		// If the queue is enabled. False by default
		this.enabled = false;

		// The functions to execute
		this._queue = [];

		// The functions to execute after a pause
		this._pauseQueue = [];

		// Current running functions
		this.running = 0;

		// Is there a limit to the amount of running functions?
		this.limit = 1;

		// The context functions should run in
		this.context = false;

		// Last time something ran
		this.lastexec = Date.now();

		// Time to wait in ms
		this.throttle = 0;

		// Has a new check been queued yet?
		this.queuedCheck = false;

		// Should the queue be sorted?
		this.sort = false;
	});

	/**
	 * Set the context added functions should run in
	 *
	 * @author   Jelle De Loecker   <jellekipdola.be>
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
	 * @author   Jelle De Loecker   <jellekipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @param    {Function}   fnc   The optional function to execute before starting
	 */
	Queue.setMethod(function start(fnc) {

		var that = this;

		// Check the pause functions again, just in cace
		that.checkPause();

		if (typeof fnc == 'function') {
			fnc(function afterStartEnabler() {
				that.enabled = true;
				that.check();
			});
		} else {
			that.enabled = true;
			that.check();
		}
	});

	/**
	 * Add a function to the queue
	 *
	 * @author   Jelle De Loecker   <jellekipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @param    {Function}   fnc      The function to queue
	 * @param    {Array}      args     Arguments to pass to the function
	 * @param    {Object}     options
	 */
	Queue.setMethod(function add(fnc, args, options) {

		var that = this,
		    done,
		    i;

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
			that.running--;
			that.check();
		};

		this._queue.push({
			fnc: fnc,
			done: done,
			options: options,
			arguments: args
		});

		this.check();
	});

	/**
	 * Process the queue
	 *
	 * @author   Jelle De Loecker   <jellekipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 */
	Queue.setMethod(function check() {

		var that = this,
		    time,
		    diff,
		    next,
		    args,
		    i;

		// If the queue isn't enabled, do nothing
		if (!this.enabled) {
			this.checkPause();
			return;
		}

		// If there is nothing in the queue, do nothing
		if (!this._queue.length) {
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

		// Sort the queue
		if (this.sort) {
			this._queue.sort(function sortQueue(a, b) {
				return b.options.weight - a.options.weight;
			});
		}

		// Throttle the queue
		if (this.throttle) {
			time = Date.now();
			diff = time - this.lastexec;

			// If not enough time has passed, queue a new check
			if (diff < this.throttle) {

				this.queuedCheck = true;

				return setTimeout(function qqCheck() {
					that.queuedCheck = false;
					that.check();
				}, diff);
			}

			this.lastexec = time;
		}

		// Get the next item from the top of the queue
		next = this._queue.shift();

		if (next && next.fnc) {

			// Increase the running count
			this.running++;

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
	 * @author   Jelle De Loecker   <jellekipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 */
	Queue.setMethod(function checkPause() {

		var next;

		// Don't do pause functions if something is still running
		if (this.running) {
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
	 * @author   Jelle De Loecker   <jellekipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @param    {Function}   fnc   A function to execute after all the running
	 *                              functions have finished
	 */
	Queue.setMethod(function pause(fnc) {

		// Pause the queue
		this.enabled = false;

		if (typeof fnc == 'function') {
			// Add a function to the pause queue
			this._pauseQueue.push(fnc);
		}

		// Process the pause queue
		this.checkPause();
	});

	Blast.defineClass('FunctionQueue', Queue);
};