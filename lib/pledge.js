var PENDING  = 0,
    RESOLVED = 1,
    REJECTED = 2;

/**
 * The Pledge Class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.6.4
 *
 * @param    {Function}   executor
 */
var Pledge = Fn.inherits('Informer', function Pledge(executor) {

	this._created = Date.now();

	if (!executor) {
		return;
	}

	// Store the executor
	this.executor = executor;

	// Start the executor when the event loop is empty
	this._startExecutor(false);
});

// If there are no Promises here, use Pledge as a polyfill
if (typeof Promise == 'undefined') {
	Blast.Globals.Promise = Pledge;
}

Pledge.setProperty({
	/**
	 * The initial state is 0 (pending)
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	state: PENDING,

	/**
	 * When the pledge was created
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @type     {Number}
	 */
	_created: 0,

	/**
	 * Do not report progress by default, it's very expensive
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @type     {Boolean}
	 */
	report_progress: false,

	/**
	 * The initial progress is 0
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	progress: 0,

	/**
	 * Progress parts can be used instead of manually adding percentages
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 *
	 * @type     {Number}
	 */
	progress_parts: 0,

	/**
	 * The finished number of progress parts
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 *
	 * @type     {Number}
	 */
	progress_parts_finished: 0,

	/**
	 * The pledge count
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	sub_pledges: 0,

	/**
	 * An array with pledges waiting for this pledge's fulfillment go here
	 * The initial _on_fulfilled property is null
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	_on_fulfilled: null,

	/**
	 * An array with pledges waiting for this pledge's rejection go here
	 * The initial _on_rejected property is null
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	_on_rejected: null,

	/**
	 * The eventual resolved value
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 */
	_resolved_value: null,

	/**
	 * When this pledge has ended
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 */
	_ended: null,

	/**
	 * Last update to this pledge
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.1
	 * @version  0.7.1
	 *
	 * @type     {Number}
	 */
	_updated: null,

	/**
	 * Debug durations
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.1
	 * @version  0.7.1
	 *
	 * @type     {Object}
	 */
	_durations: null,

	/**
	 * Property that could be a function to cancel the pledge
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.0
	 * @version  0.7.0
	 *
	 * @type     {Function}
	 */
	cancel: null
});

/**
 * Calculate the duration
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.4
 * @version  0.6.4
 *
 * @type     {Number}
 */
Pledge.setProperty(function duration() {

	var start = this._started || this._created,
	    end = this._ended || Date.now();

	return end - start;
});

/**
 * Calculated end time
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
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

		return new Date((this._started || this._created) + expected_duration);
	}

	return null;
});

/**
 * Determine if an object is an instance of Pledge
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @return   {Boolean}
 */
Pledge.setStatic(function isPledge(obj) {
	return !!obj && typeof obj.sub_pledges == 'number';
});

/**
 * Determine if an object is a thennable
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {Boolean}
 */
Pledge.setStatic(function isThenable(obj) {
	return !!obj && typeof obj.then == 'function';
});

/**
 * Determine if an object has the promise interface
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {Boolean}
 */
Pledge.setStatic(function hasPromiseInterface(obj) {
	return Pledge.isThenable(obj) && typeof obj.catch == 'function';
});

/**
 * Handle an old-style callback for a pledge or promise
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 */
Pledge.setStatic(function done(promise, callback) {
	var result = Pledge.prototype.done.call(promise, callback);

	if (!result) {
		result = Pledge.resolve();
	}

	return result;
});

/**
 * Cast the given value to a pledge
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Mixed}   value
 *
 * @return   {Pledge}
 */
Pledge.setStatic(function cast(value) {

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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Mixed}   value
 *
 * @return   {Pledge}
 */
Pledge.setStatic(function resolve(value) {

	var pledge = new this();

	Blast.nextTick(function onNextTick() {
		pledge.resolve(value);
	});

	return pledge;
});

/**
 * Create a new pledge and reject it with the given value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Error}   err
 *
 * @return   {Pledge}
 */
Pledge.setStatic(function reject(err) {

	var pledge = new this();

	Blast.nextTick(function onNextTick() {
		pledge.reject(err);
	});

	return pledge;
});

/**
 * Create a new pledge and perform the given tasks
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Array}   tasks
 *
 * @return   {Pledge}
 */
Pledge.setStatic(function all(tasks) {

	if (tasks == null || !Array.isArray(tasks)) {
		return this.reject(new Error('No valid tasks were given'));
	}

	return Fn.parallel(false, tasks);
});

/**
 * Create a new pledge and race the given tasks
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Array}   tasks
 *
 * @return   {Pledge}
 */
Pledge.setStatic(function race(tasks) {
	return new this(function doPledgeRace(resolve, reject) {
		for (var i = 0; i < tasks.length; i += 1) {
			Pledge.resolve(tasks[i]).then(resolve, reject);
		}
	});
});

/**
 * Create a pledge which resolves after n milliseconds
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Number}   n
 * @param    {Mixed}    value
 *
 * @return   {Pledge}
 */
Pledge.setStatic(function after(n, value) {

	var pledge = new Pledge(),
	    id;

	id = setTimeout(function doResolve() {
		pledge.resolve(value);
	}, n);

	return pledge;
});

/**
 * Start the executor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.6.4
 *
 * @param    {Boolean}   do_async   Do the executor asynchronously
 */
Pledge.setMethod(function _startExecutor(do_async) {

	var that = this;

	// Don't start the executor twice!
	if (this._started) {
		return;
	}

	if (do_async === true) {
		return Blast.setImmediate(function makeAsync() {
			that._startExecutor();
		});
	}

	// Indicate the resolver has started
	this._started = Date.now();

	// Don't do anything if there is no executor
	if (!this.executor) {
		return;
	}

	// Do the resolver in the current pledge context
	this.executor(function resolve(value) {
		that.resolve(value);
	}, function reject(reason) {
		that.reject(reason);
	});
});

/**
 * Add progress amount
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.7.0
 *
 * @param    {Number}   value   A value between 0-100
 * @param    {String}   label   An optional label
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @param    {Number}   value   A value between 0-100
 * @param    {String}   label   An optional label
 */
Pledge.setMethod(function reportProgress(value, label) {
	this.progress = value;
	return this.progress;
});

/**
 * Add an amount of progress parts used for calculating the progress
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.2
 * @version  0.5.2
 *
 * @param    {Number}   parts
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.2
 * @version  0.7.1
 *
 * @param    {Number}   parts
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
	let last_update = this._updated || this._created || now;

	// Set the new updated time
	this._updated = now;

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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.2
 * @version  0.6.3
 */
Pledge.setMethod(function calculateProgressParts() {

	var amount;

	if (this.state == PENDING) {
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
 * @author   Jelle De Loecker   <jelle@develry.be>
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
 * Resolve with the given value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.5.6
 */
Pledge.setMethod(function resolve(value) {

	if (this.state != PENDING) {
		return;
	}

	if (value === this) {
		throw new TypeError('A pledge cannot be resolved with itself.');
	}

	this._doResolve(value);
});

/**
 * Do the actual resolving
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.6.4
 */
Pledge.setMethod(function _doResolve(value) {

	var that = this;

	if (value && value.then) {

		this._addProgressPledge(value);

		return value.then(function onFulfilledResolve(value) {
			that.resolve(value);
		}, function onRejectedResolve(reason) {
			that.reject(reason);
		});
	}

	this.state = RESOLVED;
	this._resolved_value = value;
	this._ended = Date.now();

	Blast.nextTick(function resolveOnNextTick() {
		if (that.sub_pledges !== 0) {
			while (that._on_fulfilled.length) {
				that._on_fulfilled.shift()(value);
			}

			that._on_rejected.length = 0;
		}
	});

	if (this.report_progress) {
		this.calculateProgressParts();
	}
});

/**
 * Reject with the given reason
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.7.1
 *
 * @param    {Error}   reason
 */
Pledge.setMethod(function reject(reason) {

	var that = this,
	    result;

	if (this.state != PENDING) {
		return;
	}

	Blast.setImmediate(function doRejection() {
		result = that._doReject(reason, false);

		if (!result) {
			console.warn('Uncaught Pledge error:', reason);
		}
	});
});

/**
 * Do the actual rejection
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.6.4
 *
 * @param    {Error}   reason
 * @param    {Boolean} do_async
 */
Pledge.setMethod(function _doReject(reason, do_async) {

	var that = this,
	    caught_rejection = false;

	if (reason && reason.then) {
		return reason.then(function onFulfilledReject(value) {
			that.reject(value);
		}, function onRejectedReject(reason) {
			that.reject(reason);
		});
	}

	this.state = REJECTED;
	this._rejected_reason = reason;
	this._ended = Date.now();

	function resolveOnNextTick() {

		if (that.sub_pledges !== 0) {
			while (that._on_rejected.length) {
				if (that._on_rejected.shift()(reason)) {
					caught_rejection = true;
				}
			}

			that._on_fulfilled.length = 0;
		}
	}

	if (do_async) {
		Blast.nextTick(resolveOnNextTick);
		return true;
	}

	resolveOnNextTick();

	return caught_rejection;
});

/**
 * Then
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.7.1
 *
 * @return   {Pledge}
 */
Pledge.setMethod(function then(on_fulfilled, on_rejected) {

	var that = this,
	    then_pledge = new Pledge();

	// Create the arrays only when listeners are added
	if (this.sub_pledges == 0) {
		this._on_fulfilled = [];
		this._on_rejected = [];
	}

	this.sub_pledges++;

	this._on_fulfilled.push(function onFulfilled(value) {

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

	this._on_rejected.push(function onRejected(reason) {

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

	if (this.state == RESOLVED) {
		this._doResolve(this._resolved_value);
	} else if (this.state == REJECTED) {
		this._doReject(this._rejected_reason);
	}

	return then_pledge;
});

/**
 * Catch
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.6
 * @version  0.5.6
 *
 * @param    {Function}   on_finally
 *
 * @return   {Pledge}
 */
Pledge.setMethod('finally', function _finally(on_finally) {

	var constructor = this.constructor;

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
 * @author   Jelle De Loecker   <jelle@develry.be>
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
 * @author   Jelle De Loecker   <jelle@develry.be>
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @param    {Function}   executor
 */
var Lazy = Collection.Function.inherits('Pledge', function LazyPledge(executor) {
	this.executor = executor;
});

/**
 * Then
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.3
 * @version  0.6.3
 *
 * @return   {Pledge}
 */
Lazy.setMethod(function then(on_fulfilled, on_rejected) {

	var result = then.super.call(this, on_fulfilled, on_rejected);

	if (typeof this.executor != 'function') {
		this.reject(new Error('No valid executor has been given'));
	} else {
		this._startExecutor();
	}

	return result;
});

/**
 * The Timeout Pledge Class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   executor
 * @param    {Number}     timeout
 * @param    {String}     message
 */
var Timeout = Collection.Function.inherits('Pledge', function TimeoutPledge(executor, timeout, message) {

	const that = this;

	if (typeof executor == 'number') {
		message = timeout;
		timeout = executor;
		executor = null;
	}

	this.executor = executor;

	setTimeout(function checkTimeout() {

		if (that.state != PENDING) {
			return;
		}

		if (!message) {
			message = 'Timeout of ' + timeout + 'ms was reached';
		}

		let error = new Error(message);

		that.reject(error);

	}, timeout);
});

Blast.defineClass('Pledge', Pledge);
Blast.defineClass('LazyPledge', Lazy);

Pledge.Lazy = Lazy;
Pledge.Timeout = Timeout;