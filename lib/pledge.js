const PENDING  = 0,
      RESOLVED = 1,
      REJECTED = 2,
      CANCELLED = 3;

const REJECTED_REASON = Symbol('rejected_reason'),
      RESOLVED_VALUE = Symbol('resolved_value'),
      START_EXECUTOR = Symbol('start_executor'),
      ON_FULFILLED = Symbol('on_fulfilled'),
      ON_CANCELLED = Symbol('on_cancelled'),
      SUB_PLEDGES = Symbol('sub_pledges'),
      ON_REJECTED = Symbol('on_rejected'),
      DO_RESOLVE = Symbol('do_resolve'),
      ON_FINALLY = Symbol('on_finally'),
      DO_FINALLY = Symbol('do_finally'),
      DO_REJECT = Symbol('do_reject'),
      EXECUTOR = Symbol('executor'),
      UPDATED = Symbol('updated'),
      CREATED = Symbol('created'),
      STARTED = Symbol('started'),
      ENDED = Symbol('ended'),
      STATE = Symbol('state'),
      FNC = Symbol('fnc');

const SCHEDULE_EXECUTOR = Symbol('schedule_executor'),
      SCHEDULE_RESOLVE = Symbol('schedule_resolve'),
      SCHEDULE_REJECT = Symbol('schedule_reject'),
      SCHEDULE_DONE = Symbol('schedule_done'),
      SCHEDULE_SOON = Symbol('schedule_soon'),
      SCHEDULE_TICK = Symbol('schedule_tick');

/**
 * The AbstractPledge Class:
 * The base class for all custom Pledge classes
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 */
const AbstractPledge = Fn.inherits('Develry.Placeholder', '@', function AbstractPledge(executor) {});

AbstractPledge.setStatic('RESOLVED_VALUE', RESOLVED_VALUE);

AbstractPledge.setProperty({

	/**
	 * The initial state is 0 (pending)
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {number}
	 */
	[STATE]: PENDING,

	/**
	 * Do not report progress by default, it's very expensive
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @type     {boolean}
	 */
	report_progress: false,

	/**
	 * The pledge count
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {number}
	 */
	[SUB_PLEDGES]: 0,

	/**
	 * An array with pledges waiting for this pledge's fulfillment go here
	 * The initial _on_fulfilled property is null
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	[ON_FULFILLED]: null,

	/**
	 * An array with pledges waiting for this pledge's rejection go here
	 * The initial _on_rejected property is null
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	[ON_REJECTED]: null,

	/**
	 * An array of tasks to perform when this pledge is cancelled
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.9.1
	 * @version  0.9.1
	 */
	[ON_CANCELLED]: null,

	/**
	 * The eventual resolved value
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 */
	[RESOLVED_VALUE]: null,

	/**
	 * When this pledge has ended
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 */
	[ENDED]: null,

	/**
	 * Last update to this pledge
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.7.1
	 * @version  0.7.1
	 *
	 * @type     {number}
	 */
	[UPDATED]: null,

	/**
	 * Debug durations
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.7.1
	 * @version  0.7.1
	 *
	 * @type     {Object}
	 */
	_durations: null,

	/**
	 * Warn when an error is not caught
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 *
	 * @type     {boolean}
	 */
	warn_uncaught_errors: true,

	/**
	 * The 'nextTick' scheduler
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.8.15
	 * @version  0.8.15
	 *
	 * @type     {Function}
	 */
	[SCHEDULE_TICK] : {value: Blast.nextTick},

	/**
	 * The 'setImmediate' scheduler
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.8.15
	 * @version  0.8.15
	 *
	 * @type     {Function}
	 */
	[SCHEDULE_SOON] : {value: Blast.setImmediate},
});

/**
 * Return the state of the pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @type     {number}
 */
AbstractPledge.setProperty(function state() {
	return this[STATE];
});

/**
 * Has this pledge finished?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.7.24
 *
 * @type     {boolean}
 */
AbstractPledge.setProperty(function is_done() {
	return this[STATE] > 0;
});

/**
 * Has this pledge ended?
 *
 * @deprecated
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @type     {boolean}
 */
AbstractPledge.setProperty(function _ended() {
	return this.is_done;
});

/**
 * Determine if an object is an instance of Pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @return   {boolean}
 */
AbstractPledge.setStatic(function isPledge(obj) {
	return !!obj && typeof obj[SUB_PLEDGES] == 'number';
});

/**
 * Determine if an object is a thennable
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {boolean}
 */
AbstractPledge.setStatic(function isThenable(obj) {
	return !!obj && typeof obj.then == 'function';
});

/**
 * Determine if an object has the promise interface
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {boolean}
 */
AbstractPledge.setStatic(function hasPromiseInterface(obj) {
	return Pledge.isThenable(obj) && typeof obj.catch == 'function';
});

/**
 * Handle an old-style callback for a pledge or promise
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.9.3
 */
AbstractPledge.setStatic(function done(promise, callback) {

	let result;

	if (!promise || !promise.then) {
		result = this.resolve(promise);
		result.done(callback);
	} else {
		result = this.prototype.done.call(promise, callback);

		if (!result) {
			result = this.resolve();
		}
	}

	return result;
});

/**
 * Cast the given value to a pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Mixed}   value
 *
 * @return   {Pledge}
 */
AbstractPledge.setStatic(function cast(value) {

	var is_primitive = !value || Obj.isPrimitive(value);

	if (!is_primitive) {
		if (Pledge.isPledge(value)) {
			return value;
		}

		if (Pledge.hasPromiseInterface(value)) {
			let pledge = new Pledge();
			Pledge.done(value, pledge);
			return pledge;
		}
	}

	return Pledge.resolve(value);
});

/**
 * Create a new pledge and resolve it with the given value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.6
 * @version  0.8.15
 *
 * @param    {Mixed}   value
 *
 * @return   {Pledge}
 */
AbstractPledge.setStatic(function resolve(value) {

	const pledge = new this();

	pledge[SCHEDULE_TICK](function onNextTick() {
		pledge.resolve(value);
	});

	return pledge;
});

/**
 * Create a new pledge and reject it with the given value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Error}   err
 *
 * @return   {Pledge}
 */
AbstractPledge.setStatic(function reject(err) {

	const pledge = new this();

	pledge[SCHEDULE_TICK](function onNextTick() {
		pledge.reject(err);
	});

	return pledge;
});

/**
 * Create a new pledge and perform the given tasks
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Array}   tasks
 *
 * @return   {Pledge}
 */
AbstractPledge.setStatic(function all(tasks) {

	if (tasks == null || !Array.isArray(tasks)) {
		return this.reject(new Error('No valid tasks were given'));
	}

	const fn = this[FNC] || Fn;

	return fn.parallel(false, tasks);
});

/**
 * Create a new pledge and race the given tasks
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Array}   tasks
 *
 * @return   {Pledge}
 */
AbstractPledge.setStatic(function race(tasks) {
	return new this(function doPledgeRace(resolve, reject) {
		for (var i = 0; i < tasks.length; i += 1) {
			Pledge.resolve(tasks[i]).then(resolve, reject);
		}
	});
});

/**
 * Create a pledge which resolves after n milliseconds
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {number}   n
 * @param    {Mixed}    value
 *
 * @return   {Pledge}
 */
AbstractPledge.setStatic(function after(n, value) {

	var pledge = new Pledge(),
	    id;

	id = setTimeout(function doResolve() {
		pledge.resolve(value);
	}, n);

	return pledge;
});

/**
 * Schedule something to do with the resolver
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Function}    fnc
 */
AbstractPledge.setMethod(SCHEDULE_RESOLVE, function(fnc) {
	return this[SCHEDULE_TICK](fnc);
});

/**
 * Schedule something to do with the rejector
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Function}    fnc
 */
AbstractPledge.setMethod(SCHEDULE_REJECT, function(fnc) {
	return this[SCHEDULE_SOON](fnc);
});

/**
 * Schedule something to do with the executor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Function}    fnc
 */
AbstractPledge.setMethod(SCHEDULE_EXECUTOR, function(fnc) {
	return this[SCHEDULE_SOON](fnc);
});

/**
 * Schedule something to do with handling the result
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Function}    fnc
 */
AbstractPledge.setMethod(SCHEDULE_DONE, function(...args) {
	return this[SCHEDULE_TICK](...args);
});

/**
 * Add progress amount (dummy)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {number}   value   A value between 0-100
 * @param    {string}   label   An optional label
 */
AbstractPledge.setMethod(function addProgress(value, label) {});

/**
 * Add an amount of progress parts used for calculating the progress (dummy)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {number}   parts
 */
AbstractPledge.setMethod(function addProgressPart(parts) {});

/**
 * Finish an amount of progress parts (dummy)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {number}   parts
 */
AbstractPledge.setMethod(function reportProgressPart(parts) {});

/**
 * Add progress pledge (dummy)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Pledge}   pledge
 */
AbstractPledge.setMethod(function _addProgressPledge(pledge) {});

/**
 * Cancel the pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(function cancel() {

	if (!this.isPending()) {
		return;
	}

	this[STATE] = CANCELLED;

	// Always do the on-cancel tasks as swiftly as possible
	return Swift.all(this[ON_CANCELLED]).finally(() => this[DO_FINALLY]());
});

/**
 * Do the given task when this pledge is cancelled
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(function onCancelled(task) {

	if (typeof task != 'function') {
		return;
	}

	if (!this.isPending()) {

		if (this.isCancelled() && task) {
			task();
		}

		return;
	}

	if (!this[ON_CANCELLED]) {
		this[ON_CANCELLED] = [];
	}

	this[ON_CANCELLED].push(next => Swift.done(task(), next));
});

/**
 * Do all the finally callbacks
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(DO_FINALLY, function doFinally() {
	while (this[ON_FINALLY]?.length) {
		this[ON_FINALLY].shift()();
	}
});

/**
 * Has this pledge been resolved?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(function isResolved() {
	return this[STATE] === RESOLVED;
});

/**
 * Has this pledge been rejected?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(function isRejected() {
	return this[STATE] === REJECTED;
});

/**
 * Has this pledge been cancelled?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(function isCancelled() {
	return this[STATE] === CANCELLED;
});

/**
 * Is this pledge still pending?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.1
 * @version  0.9.1
 */
AbstractPledge.setMethod(function isPending() {
	return this[STATE] === PENDING;
});

/**
 * The BasePledge Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.6.4
 *
 * @param    {Function}   executor
 */
const Pledge = Fn.inherits(AbstractPledge, function Pledge(executor) {

	this[CREATED] = Date.now();

	if (!executor) {
		return;
	}

	// Store the executor
	this[EXECUTOR] = executor;

	// Start the executor when the event loop is empty
	this[START_EXECUTOR](false);
});

Pledge.setProperty({

	/**
	 * When the pledge was created
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @type     {number}
	 */
	[CREATED]: 0,

	/**
	 * The initial progress is 0
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {number}
	 */
	progress: 0,

	/**
	 * Progress parts can be used instead of manually adding percentages
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 *
	 * @type     {number}
	 */
	progress_parts: 0,

	/**
	 * The finished number of progress parts
	 *
	 * @author   Jelle De Loecker <jelle@elevenways.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 *
	 * @type     {number}
	 */
	progress_parts_finished: 0,

});

/**
 * Calculate the duration
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.4
 * @version  0.6.4
 *
 * @type     {number}
 */
Pledge.setProperty(function duration() {

	var start = this[STARTED] || this[CREATED],
	    end = this[ENDED] || Date.now();

	return end - start;
});

/**
 * Calculated end time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.4
 * @version  0.6.4
 *
 * @type     {Date}
 */
Pledge.setProperty(function due_date() {

	if (!this.progress_parts && !this.progress) {
		return null;
	}

	let duration = this.duration;

	if (duration > 0) {

		let expected_duration;

		if (this.progress_parts) {
			expected_duration = (duration / (this.progress_parts_finished || 1)) * this.progress_parts;
		} else if (this.progress) {
			expected_duration = duration * (100 / this.progress);
		}

		return new Date((this[STARTED] || this[CREATED]) + expected_duration);
	}

	return null;
});

/**
 * Start the executor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.6.4
 *
 * @param    {boolean}   do_async   Do the executor asynchronously
 */
Pledge.setMethod(START_EXECUTOR, function _startExecutor(do_async) {

	// Don't start the executor twice!
	if (this[STARTED]) {
		return;
	}

	if (do_async === true) {
		return this[SCHEDULE_EXECUTOR](() => this[START_EXECUTOR]());
	}

	// Indicate the resolver has started
	this[STARTED] = Date.now();

	// Don't do anything if there is no executor
	if (!this[EXECUTOR]) {
		return;
	}

	// Do the resolver in the current pledge context
	this[EXECUTOR](value => this.resolve(value), reason => this.reject(reason));
});

/**
 * Add progress amount
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.7.0
 *
 * @param    {number}   value   A value between 0-100
 * @param    {string}   label   An optional label
 */
Pledge.setMethod(function addProgress(value, label) {

	if (!this.report_progress) {
		return;
	}

	return this.reportProgress((this.progress || 0) + value, label);
});

/**
 * Report progress
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @param    {number}   value   A value between 0-100
 * @param    {string}   label   An optional label
 */
Pledge.setMethod(function reportProgress(value, label) {
	this.progress = value;
	return this.progress;
});

/**
 * Add an amount of progress parts used for calculating the progress
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.2
 * @version  0.5.2
 *
 * @param    {number}   parts
 */
Pledge.setMethod(function addProgressPart(parts) {

	if (!this.report_progress) {
		return;
	}

	if (parts == null) {
		parts = 1;
	}

	this.progress_parts += parts;
	this.calculateProgressParts();
});

/**
 * Finish an amount of progress parts
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.2
 * @version  0.7.1
 *
 * @param    {number}   parts
 */
Pledge.setMethod(function reportProgressPart(parts) {

	if (!this.report_progress) {
		return;
	}

	if (parts == null) {
		parts = 1;
	}

	// Get the current timestamp
	let now = Date.now();

	// Get the previous update timestamp
	let last_update = this[UPDATED] || this[CREATED] || now;

	// Set the new updated time
	this[UPDATED] = now;

	if (!this._durations) {
		this._durations = {};
	}

	this._durations[this.progress_parts_finished] = now - last_update;

	this.progress_parts_finished += parts;
	this.calculateProgressParts();
});

/**
 * Calculate the progress based on the progress parts
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.2
 * @version  0.6.3
 */
Pledge.setMethod(function calculateProgressParts() {

	var amount;

	if (this[STATE] == PENDING) {
		// Calculate how much is already finished
		amount = this.progress_parts_finished / this.progress_parts;

		// And multiply it to get a nice percentage number
		amount = ~~(amount * 100);
	} else {
		amount = 100;
	}

	this.reportProgress(amount);
});

/**
 * Add progress pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @param    {Pledge}   pledge
 */
Pledge.setMethod(function _addProgressPledge(pledge) {

	if (!this.report_progress) {
		return;
	}

	if (!Pledge.isPledge(pledge)) {
		return false;
	}

	this.addProgressPart(pledge.progress_parts);
	this.reportProgressPart(pledge.progress_parts_finished);

	let that = this,
	    other_addProgressPart = pledge.addProgressPart,
	    other_reportProgressPart = pledge.reportProgressPart;

	pledge.addProgressPart = function addProgressPart(parts) {
		that.addProgressPart(parts);
		other_addProgressPart.call(this, parts);
	};

	pledge.reportProgressPart = function reportProgressPart(parts) {
		that.reportProgressPart(parts);
		other_reportProgressPart.call(this, parts);
	};
});

/**
 * Get a function that will resolve this pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {Function}
 */
Pledge.setMethod(function getResolverFunction() {
	return (err, result) => {
		if (err) {
			this.reject(err);
		} else {
			this.resolve(result);
		}
	};
});

/**
 * Get the resolved value of this pledge.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @return   {*}
 */
Pledge.setMethod(function getResolvedValue() {

	if (this[STATE] != RESOLVED) {
		return this;
	}

	return this[RESOLVED_VALUE];
});

/**
 * Get the rejected reason of this pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {*}
 */
Pledge.setMethod(function getRejectedReason() {

	if (this[STATE] != REJECTED) {
		return;
	}

	return this[REJECTED_REASON];
});

/**
 * Resolve with the given value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.5.6
 */
Pledge.setMethod(function resolve(value) {

	if (this[STATE] != PENDING) {
		return;
	}

	if (value === this) {
		throw new TypeError('A pledge cannot be resolved with itself.');
	}

	this[DO_RESOLVE](value);
});

/**
 * Do the actual resolving
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.6.4
 */
Pledge.setMethod(DO_RESOLVE, function _doResolve(value) {

	var that = this;

	if (value && value.then) {

		this._addProgressPledge(value);

		return value.then(function onFulfilledResolve(value) {
			that.resolve(value);
		}, function onRejectedResolve(reason) {
			that.reject(reason);
		});
	}

	this[STATE] = RESOLVED;
	this[RESOLVED_VALUE] = value;
	this[ENDED] = Date.now();

	this[SCHEDULE_RESOLVE](function resolveOnNextTick() {
		if (that[SUB_PLEDGES] !== 0) {
			while (that[ON_FULFILLED].length) {
				that[ON_FULFILLED].shift()(value);
			}

			that[ON_REJECTED].length = 0;
		}
	});

	if (this.report_progress) {
		this.calculateProgressParts();
	}
});

/**
 * Reject with the given reason
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.8.1
 *
 * @param    {Error}   reason
 */
Pledge.setMethod(function reject(reason) {

	if (this[STATE] != PENDING) {
		return;
	}

	const that = this;

	this[SCHEDULE_REJECT](function doRejection() {
		let result = that[DO_REJECT](reason, false);

		if (!result && that.warn_uncaught_errors) {
			console.warn('Uncaught Pledge error:', reason);
		}
	});
});

/**
 * Do the actual rejection
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.6.4
 *
 * @param    {Error}   reason
 * @param    {boolean} do_async
 */
Pledge.setMethod(DO_REJECT, function _doReject(reason, do_async) {

	var that = this,
	    caught_rejection = false;

	if (reason && reason.then) {
		return reason.then(function onFulfilledReject(value) {
			that.reject(value);
		}, function onRejectedReject(reason) {
			that.reject(reason);
		});
	}

	this[STATE] = REJECTED;
	this[REJECTED_REASON] = reason;
	this[ENDED] = Date.now();

	function resolveOnNextTick() {

		if (that[SUB_PLEDGES] !== 0) {
			while (that[ON_REJECTED].length) {
				if (that[ON_REJECTED].shift()(reason)) {
					caught_rejection = true;
				}
			}

			that[ON_FULFILLED].length = 0;
		}
	}

	if (do_async) {
		this[SCHEDULE_TICK](resolveOnNextTick);
		return true;
	}

	resolveOnNextTick();

	return caught_rejection;
});

/**
 * Then
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.7.1
 *
 * @return   {Pledge}
 */
Pledge.setMethod(function then(on_fulfilled, on_rejected) {

	var that = this,
	    then_pledge = new Pledge();

	// Create the arrays only when listeners are added
	if (this[SUB_PLEDGES] == 0) {
		this[ON_FULFILLED] = [];
		this[ON_REJECTED] = [];
	}

	this[SUB_PLEDGES]++;

	this[ON_FULFILLED].push(function onFulfilled(value) {

		var result;

		try {
			if (on_fulfilled) {
				result = on_fulfilled(value);
			} else {
				result = value;
			}

			then_pledge.resolve(result);
		} catch (reason) {
			then_pledge.reject(reason);
		}
	});

	this[ON_REJECTED].push(function onRejected(reason) {

		var caught_rejection = false,
		    result;

		try {
			if (on_rejected) {
				result = on_rejected(reason);
				caught_rejection = true;
				that._caught_rejection = true;
			} else {
				result = reason;
			}

			// This was wrong in earlier versions:
			// you RESOLVE chained promises, not reject
			then_pledge.resolve();
		} catch (reason) {
			then_pledge.reject(reason);
		}

		return caught_rejection;
	});

	if (this[STATE] == RESOLVED) {
		this[DO_RESOLVE](this[RESOLVED_VALUE]);
	} else if (this[STATE] == REJECTED) {
		this[DO_REJECT](this[REJECTED_REASON]);
	}

	return then_pledge;
});

/**
 * Catch
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @return   {Pledge}
 */
Pledge.setMethod('catch', function _catch(on_rejected) {
	return this.then(null, on_rejected);
});

/**
 * When the promise is settled, whether fulfilled or rejected,
 * the specified callback function is executed
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.6
 * @version  0.9.1
 *
 * @param    {Function}   on_finally
 *
 * @return   {Pledge}
 */
Pledge.setMethod('finally', function _finally(on_finally) {

	let constructor = this.constructor;

	if (this.isPending() || this.isCancelled()) {
		if (!this[ON_FINALLY]) {
			this[ON_FINALLY] = [];
		}

		// We keep this in an array in case the pledge gets cancelled
		this[ON_FINALLY].push(on_finally);

		if (this.isCancelled()) {
			return this[DO_FINALLY]();
		}
	}

	return this.then(
		function afterResolved(value) {
			return constructor.resolve(on_finally()).then(function() {
				return value;
			});
		},
		function afterRejected(reason) {
			return constructor.resolve(on_finally()).then(function() {
				return constructor.reject(reason);
			});
		}
	);
});

/**
 * Handle an old-style callback
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.5.0
 * @version  0.7.0
 *
 * @return   {Pledge}
 */
Pledge.setMethod(['done', 'handleCallback'], function done(callback) {

	if (!callback) {
		return this;
	}

	if (typeof callback != 'function') {
		if (Pledge.isPledge(callback)) {
			let pledge = callback;

			callback = function forwardToPledge(err, result) {
				if (err) {
					pledge.reject(err);
				} else {
					pledge.resolve(result);
				}
			}
		} else {
			throw new Error('Unable to handle callback: not a function or Pledge!');
		}
	}

	// Catch when the supplied context is changed to a non-promise
	if (!this || !this.then) {
		return Blast.nextTick(callback, null, null, this);
	}

	return this.then(function onResolved(value) {
		return callback(null, value);
	}, function onRejected(err) {
		return callback(err);
	});
});

/**
 * Race this pledge with another one
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Pledge}   contestant
 */
Pledge.setMethod(function race(contestant) {
	var contest = Pledge.race([this].concat(contestant));
	return contest;
});

/**
 * The LazyPledge Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @param    {Function}   executor
 */
var Lazy = Fn.inherits('Pledge', function LazyPledge(executor) {
	this[EXECUTOR] = executor;
});

/**
 * Then
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @return   {Pledge}
 */
Lazy.setMethod(function then(on_fulfilled, on_rejected) {

	var result = then.super.call(this, on_fulfilled, on_rejected);

	if (typeof this[EXECUTOR] != 'function') {
		this.reject(new Error('No valid executor has been given'));
	} else {
		this[START_EXECUTOR]();
	}

	return result;
});

/**
 * The Timeout Pledge Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.10
 *
 * @param    {Function}   executor
 * @param    {number}     timeout
 * @param    {string}     message
 */
var Timeout = Fn.inherits('Pledge', function TimeoutPledge(executor, timeout, message) {

	const that = this;

	if (typeof executor == 'number') {
		message = timeout;
		timeout = executor;
		executor = null;
	}

	if (typeof timeout != 'number') {
		timeout = +timeout;
	}

	if (!timeout) {
		timeout = 0;
	}

	setTimeout(function checkTimeout() {

		if (that[STATE] != PENDING) {
			return;
		}

		if (!message) {
			message = 'Timeout of ' + timeout + 'ms was reached';
		}

		let error = new Error(message);

		that.reject(error);

	}, timeout);

	TimeoutPledge.super.call(this, executor);
});

/**
 * The SwiftPledge Class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.9.3
 *
 * @param    {Function}   executor
 */
const Swift = Fn.inherits(Pledge, function SwiftPledge(executor) {
	if (executor != null) {
		this[EXECUTOR] = executor;
		this[START_EXECUTOR](false);
	}
});

const SwiftObject = Object.create(Bound.Function);
SwiftObject[Blast.flowPledgeClass] = Swift;
SwiftObject[Blast.asyncScheduler] = Blast.callNow;
Swift[FNC] = SwiftObject;

/**
 * Handle an old-style callback for a pledge or promise
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
Swift.setStatic(function done(value, callback) {

	// Pass through falsy or non-object values
	if (!value || typeof value != 'object') {
		return callback(null, value);
	}

	// Pass non-thenables through
	if (!value.then) {
		return callback(null, value);
	}

	// See if we can rip the values out of Pledge instances
	if (value[STATE] == RESOLVED) {
		return callback(null, value[RESOLVED_VALUE]);
	}

	value.then(val => callback(null, val), callback);
});

/**
 * Do the given tasks in parallel
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {*}   tasks
 *
 * @return   {Pledge.Swift|*}
 */
Swift.setStatic(function parallel(tasks) {
	let result = SwiftObject.parallel(false, tasks);
	return Swift.execute(result);
});

/**
 * Map the given variable
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Object|Array}   input
 * @param    {Function}       task
 *
 * @return   {Pledge.Swift|*}
 */
Swift.setStatic(function map(input, task) {

	if (!input || typeof input != 'object') {
		return input;
	}

	let mapped;

	if (Array.isArray(input)) {
		mapped = input.map(task);
	} else {
		mapped = {};

		for (let key in input) {
			mapped[key] = task(input[key], key);
		}
	}

	return Swift.parallel(mapped);
});

/**
 * Cast the given value to a pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Mixed}   value
 *
 * @return   {SwiftPledge}
 */
Swift.setStatic(function cast(value) {

	if (!value || typeof value == 'function') {
		return Swift.resolve(value);
	}

	let result = Swift.execute(value);

	if (result && result instanceof Swift) {
		return result;
	}

	return Swift.resolve(result);
});

/**
 * Execute the given function and return the value as swiftly as possible.
 * If no promise is given, the value will be returned as is.
 * If the given value is not a function, it will be returned as is.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Mixed}   value
 *
 * @return   {Pledge.Swift|*}
 */
Swift.setStatic(function execute(value) {

	if (typeof value == 'function') {
		value = value();
	}

	if (value && value.then) {

		if (value[STATE] == RESOLVED) {
			return execute(value[RESOLVED_VALUE]);
		}

		return Swift.resolve(value);
	}

	return value;
});

/**
 * Do a single waterfall task
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
const doWaterfallTask = (pledge, tasks, index, max_index, previous_value) => {

	let task = tasks[index],
	    next_value;

	if (typeof task == 'function') {
		try {
			next_value = task(previous_value);
		} catch (err) {
			return pledge.reject(err);
		}
	} else {
		next_value = task;
	}

	Swift.done(next_value, (err, result) => {

		if (err) {
			return pledge.reject(err);
		}

		if (index == max_index) {
			return pledge.resolve(result);
		}

		doWaterfallTask(pledge, tasks, index + 1, max_index, result);
	});
};

/**
 * Perform a swift waterfall
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.9.3
 *
 * @return   {SwiftPledge|Mixed}
 */
Swift.setStatic(function waterfall(...tasks) {
	let pledge = new Swift();

	doWaterfallTask(pledge, tasks, 0, tasks.length - 1, null);

	if (pledge[STATE] == RESOLVED) {
		return pledge[RESOLVED_VALUE];
	}

	return pledge;
});

/**
 * Create a new SwiftPledge and resolve it with the given value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Mixed}   value
 *
 * @return   {Pledge}
 */
Swift.setStatic(function resolve(value) {
	let result = new this();
	result.resolve(value);
	return result;
});

/**
 * Start the executor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {boolean}   do_async   Do the executor asynchronously
 */
Swift.setMethod(START_EXECUTOR, function _startExecutor(do_async) {

	// Don't start the executor twice!
	if (this[STARTED]) {
		return;
	}

	// Don't do anything if there is no executor
	if (!this[EXECUTOR]) {
		return;
	}

	this[STARTED] = true;

	if (do_async === true) {
		return Blast.nextGroupedImmediate(() => this[START_EXECUTOR]());
	}

	// Do the resolver in the current pledge context
	this[EXECUTOR](value => this.resolve(value), reason => this.reject(reason));
});

/**
 * Do the actual resolving
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 */
Swift.setMethod(DO_RESOLVE, function _doResolve(value) {

	if (value && value.then) {
		return value.then(value => this.resolve(value), reason => this.reject(reason));
	}

	this[STATE] = RESOLVED;
	this[RESOLVED_VALUE] = value;

	if (this[SUB_PLEDGES] !== 0) {
		while (this[ON_FULFILLED].length) {
			this[ON_FULFILLED].shift()(value);
		}

		this[ON_REJECTED].length = 0;
	}

	this[DO_FINALLY]();
});

/**
 * Reject with the given reason
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Error}   reason
 */
Swift.setMethod(function reject(reason) {

	if (this[STATE] != PENDING) {
		return;
	}

	this[DO_REJECT](reason);
	this[DO_FINALLY]();
});

/**
 * Do the actual rejection
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @param    {Error}   reason
 */
Swift.setMethod(DO_REJECT, function _doReject(reason) {

	let caught_rejection = false;

	if (reason && reason.then) {
		return reason.then(value => this.reject(value), reason => this.reject(reason));
	}

	this[STATE] = REJECTED;
	this[REJECTED_REASON] = reason;

	if (this[SUB_PLEDGES] !== 0) {
		while (this[ON_REJECTED].length) {
			if (this[ON_REJECTED].shift()(reason)) {
				caught_rejection = true;
			}
		}

		this[ON_FULFILLED].length = 0;
	}

	return caught_rejection;
});

/**
 * Then
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 *
 * @return   {Pledge}
 */
Swift.setMethod(function then(on_fulfilled, on_rejected) {

	// Create the arrays only when listeners are added
	if (this[SUB_PLEDGES] == 0) {
		this[ON_FULFILLED] = [];
		this[ON_REJECTED] = [];
	}

	this[SUB_PLEDGES]++;

	if (on_fulfilled) {
		this[ON_FULFILLED].push(on_fulfilled);
	}

	if (on_rejected) {
		this[ON_REJECTED].push(on_rejected);
	}

	if (this[STATE] == RESOLVED) {
		this[DO_RESOLVE](this[RESOLVED_VALUE]);
	} else if (this[STATE] == REJECTED) {
		this[DO_REJECT](this[REJECTED_REASON]);
	}

	return this;
});

/**
 * Create an already resolved pledge
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.15
 * @version  0.8.15
 */
function createResolved(PledgeClass) {
	PledgeClass.setStatic('RESOLVED', PledgeClass.resolve(true), false);
}

Blast.defineClass('Pledge', Pledge);
Blast.defineClass('LazyPledge', Lazy);
Blast.defineClass('SwiftPledge', Swift);

createResolved(Pledge);
createResolved(Swift);

Pledge.Lazy = Lazy;
Pledge.Timeout = Timeout;
Pledge.Swift = Swift;