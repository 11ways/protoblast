module.exports = function BlastPledge(Blast, Collection) {

	/**
	 * The Pledge Class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
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
		this._startExecutor(true);
	});

	/**
	 * The initial state is 0 (pending)
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @type     {Number}
	 */
	Pledge.setProperty('state', 0);

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
	 * Resolve with the given value
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	Pledge.setMethod(function resolve(value) {

		this.state = 1;
		this._resolved_value = value;

		this._doResolve(value);
	});

	/**
	 * Do the actual resolving
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
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
	 * @version  0.4.0
	 */
	Pledge.setMethod(function reject(reason) {

		this.state = 2;
		this._rejected_reason = reason;

		this._doReject(reason);
	});

	/**
	 * Do the actual rejection
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	Pledge.setMethod(function _doReject(reason) {

		var that = this;

		if (reason && reason.then) {
			return reason.then(function onFulfilledReject(value) {
				that.reject(value);
			}, function onRejectedReject(reason) {
				that.reject(reason);
			});
		}

		if (this.sub_pledges !== 0) {
			while (this._on_rejected.length) {
				this._on_rejected.shift()(reason);
			}

			this._on_fulfilled.length = 0;
		}
	});

	/**
	 * Then
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 */
	Pledge.setMethod(function then(on_fulfilled, on_rejected) {

		var then_pledge = new Pledge();

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

			var result;

			try {
				if (on_rejected) {
					result = on_rejected(reason);
				} else {
					result = reason;
				}

				then_pledge.reject(result);
			} catch (reason) {
				then_pledge.reject(reason);
			}

		});

		if (this.state == 1) {
			this._doResolve(this._resolved_value);
		} else if (this.state == 2) {
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
	 */
	Pledge.setMethod('catch', function _catch(on_rejected) {
		return this.then(null, on_rejected);
	});

};