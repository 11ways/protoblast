module.exports = function BlastPledge(Blast, Collection) {

	var PENDING  = 0,
	    RESOLVED = 1,
	    REJECTED = 2;

	/**
	 * The Pledge Class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.5.6
	 *
	 * @param    {Function}   executor
	 */
	var Pledge = Collection.Function.inherits('Informer', function Pledge(executor) {

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

	/**
	 * The initial state is 0 (pending)
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	Pledge.setProperty('state', PENDING);

	/**
	 * The initial progress is 0
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	Pledge.setProperty('progress', 0);

	/**
	 * Progress parts can be used instead of manually adding percentages
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 *
	 * @type     {Number}
	 */
	Pledge.setProperty('progress_parts', 0);

	/**
	 * The finished number of progress parts
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 *
	 * @type     {Number}
	 */
	Pledge.setProperty('progress_parts_finished', 0);

	/**
	 * The pledge count
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	Pledge.setProperty('sub_pledges', 0);

	/**
	 * An array with pledges waiting for this pledge's fulfillment go here
	 * The initial _on_fulfilled property is null
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	Pledge.setProperty('_on_fulfilled', null);

	/**
	 * An array with pledges waiting for this pledge's rejection go here
	 * The initial _on_rejected property is null
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	Pledge.setProperty('_on_rejected', null);

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

		return Blast.Bound.Function.parallel(false, tasks);
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
	 * @version  0.4.0
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
		this._started = true;

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
	 * @version  0.4.0
	 *
	 * @param    {Number}   value   A value between 0-100
	 * @param    {String}   label   An optional label
	 */
	Pledge.setMethod(function addProgress(value, label) {
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
	 * @version  0.5.2
	 *
	 * @param    {Number}   parts
	 */
	Pledge.setMethod(function reportProgressPart(parts) {

		if (parts == null) {
			parts = 1;
		}

		this.progress_parts_finished += parts;
		this.calculateProgressParts();
	});

	/**
	 * Calculate the progress based on the progress parts
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.5.2
	 * @version  0.5.2
	 */
	Pledge.setMethod(function calculateProgressParts() {

		var amount;

		// Calculate how much is already finished
		amount = this.progress_parts_finished / this.progress_parts;

		// And multiply it to get a nice percentage number
		amount = ~~(amount * 100);

		this.reportProgress(amount);
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
	 * @version  0.5.6
	 */
	Pledge.setMethod(function _doResolve(value) {

		var that = this;

		if (value && value.then) {
			return value.then(function onFulfilledResolve(value) {
				that.resolve(value);
			}, function onRejectedResolve(reason) {
				that.reject(reason);
			});
		}

		this.state = RESOLVED;
		this._resolved_value = value;

		if (this.sub_pledges !== 0) {
			while (this._on_fulfilled.length) {
				this._on_fulfilled.shift()(value);
			}

			this._on_rejected.length = 0;
		}
	});

	/**
	 * Reject with the given reason
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.5.6
	 *
	 * @param    {Error}   reason
	 */
	Pledge.setMethod(function reject(reason) {

		var result;

		if (this.state != PENDING) {
			return;
		}

		result = this._doReject(reason);

		if (!result) {
			console.warn('Uncaught Pledge error: ' + reason);
		}
	});

	/**
	 * Do the actual rejection
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.5.6
	 *
	 * @param    {Error}   reason
	 */
	Pledge.setMethod(function _doReject(reason) {

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

		if (this.sub_pledges !== 0) {
			while (this._on_rejected.length) {
				if (this._on_rejected.shift()(reason)) {
					caught_rejection = true;
				}
			}

			this._on_fulfilled.length = 0;
		}

		this._caught_rejection = caught_rejection;

		return caught_rejection;
	});

	/**
	 * Then
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.5.6
	 *
	 * @return   {Pledge}
	 */
	Pledge.setMethod(function then(on_fulfilled, on_rejected) {

		var that = this,
		    then_pledge = new this.constructor();

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
	 * @version  0.6.0
	 */
	Pledge.setMethod(['done', 'handleCallback'], function done(callback) {

		if (!callback) {
			return;
		}

		if (typeof callback != 'function') {
			throw new Error('Unable to handle callback: not a function!');
		}

		// Catch when the supplied context is changed to a non-promise
		if (!this || !this.then) {
			return Blast.nextTick(callback, null, null, this);
		}

		this.then(function onResolved(value) {
			callback(null, value);
		}, function onRejected(err) {
			callback(err);
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

	Blast.defineClass('Pledge', Pledge);
};