module.exports = function BlastImmediate(Blast, Collection) {

	"use strict";

	var global = Blast.Globals,
	    realClearImmediate = global.clearImmediate || global.msClearImmediate,
	    realSetImmediate = global.setImmediate || global.msSetImmediate,
	    realNextTick = global.nextTick,
	    handles = {};

	// Ensure a nextTick implementation
	if (!realNextTick) {
		if (global.process && global.process.nextTick) {
			realNextTick = global.process.nextTick;
		} else if (typeof Promise !== 'undefined' && Promise.resolve) {
			let resolved = Promise.resolve();
			realNextTick = function nextTick(callback) {
				resolved.then(callback);
			};
		} else if (typeof Image !== 'undefined') {
			realNextTick = function nextTick(callback) {
				var img = new Image;
				img.onerror = callback;
				img.src = 'data:image/png,' + Math.random();
			};
		} else {
			realNextTick = function nextTick(callback) {
				return setTimeout(callback, 0);
			};
		}
	}

	function canUsePostMessage() {
		// The test against `importScripts` prevents this implementation from
		// being installed inside a web worker, where `global.postMessage` means
		// something completely different and can't be used for this purpose.
		// Don't use on chrome either, because it's causes some GC issues
		if (!Blast.isChrome && global.postMessage && !global.importScripts) {
			var is_async = true,
			    old_onmessage = global.onmessage;

			global.onmessage = function() {
				is_async = false;
			};

			global.postMessage('', '*');
			global.onmessage = old_onmessage;

			return is_async;
		}
	};

	// Ensure a setImmediate implementation
	if (!realSetImmediate) {
		let addSchedule;

		realSetImmediate = function setImmediate(fnc) {

			var handle,
			    args;

			if (arguments.length > 1) {
				let original_fnc = fnc,
				    i;

				args = [];

				for (i = 1; i < arguments.length; i++) {
					args.push(arguments[i]);
				}

				fnc = function callFunction() {
					original_fnc.apply(null, args);
				};
			}

			handle = Blast.storeHandle('immediate', fnc);
			addSchedule(handle);
			return handle;
		};

		realClearImmediate = function clearImmediate(handle) {
			return Blast.clearHandle('immediate', handle);
		};

		if (global.MessageChannel) {
			let channel = new global.MessageChannel();

			channel.port1.onmessage = function immediateMC(e) {
				Blast.runHandle('immediate', +e.data);
			};

			addSchedule = function addSchedule(handle) {
				channel.port2.postMessage(handle);
			};
		} else if (canUsePostMessage()) {
			let prefix = 'setImmediate$' + Math.random() + '$';

			global.addEventListener('message', function immediatePM(e) {
				if (e.source === global && typeof e.data == 'string' && e.data.indexOf(prefix) == 0) {
					Blast.runHandle('immediate', +e.data.slice(prefix.length));
				}
			}, false);

			addSchedule = function addSchedule(handle) {
				global.postMessage(prefix + handle, '*');
			};
		} else {
			addSchedule = function addSchedule(handle) {
				setTimeout(function immediateST() {
					Blast.runHandle('immediate', handle);
				}, 0);
			};
		}
	}

	/**
	 * Clear a blast handle
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.3
	 * @version   0.6.3
	 *
	 * @param     {String}     type   The type of handle
	 * @param     {Number}     id     The id to clear
	 */
	Blast.clearHandle = function clearHandle(type, id) {

		if (!handles[type]) {
			return false;
		}

		return handles[type].delete(id);
	};

	/**
	 * Store something and return a handle
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.3
	 * @version   0.6.3
	 *
	 * @param     {String}     type   The type of handle
	 * @param     {Mixed}      data   The data to store
	 *
	 * @return    {Number}
	 */
	Blast.storeHandle = function storeHandle(type, data) {

		var id;

		if (!handles[type]) {
			handles[type] = new Map();
			handles[type].count = 0;
		}

		id = handles[type].count++;

		handles[type].set(id, data);

		return id;
	};

	/**
	 * Run the given handle
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.3
	 * @version   0.6.3
	 *
	 * @param     {String}     type   The type of handle
	 * @param     {Number}     id     The handle id
	 *
	 * @return    {Number}
	 */
	Blast.runHandle = function runHandle(type, id) {

		if (!handles[type]) {
			return false;
		}

		let fnc = handles[type].get(id);

		try {
			fnc();
		} finally {
			handles[type].delete(id);
		}
	};

	/**
	 * Perform task at the given timestamp
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.2.1
	 * @version   0.5.1
	 *
	 * @param     {Function}   task         The function to execute
	 * @param     {Number}     timestamp    When to execute the task
	 *
	 * @return    {Number}
	 */
	Blast.setSchedule = function setSchedule(task, timestamp) {
		return setTimeout(task, timestamp - Date.now());
	};

	/**
	 * Clear a scheduled task
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.2.1
	 * @version   0.5.1
	 *
	 * @param     {Number}     id   The id to clear
	 */
	Blast.clearSchedule = function clearSchedule(id) {
		return clearTimeout(id);
	};

	/**
	 * A nextTick that can set the context
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.5.1
	 * @version   0.6.3
	 *
	 * @param     {Function}   task
	 * @param     {Object}     context
	 */
	Blast.nextTick = function nextTick(task, context) {

		if (arguments.length > 1) {

			let args = [],
			    i;

			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}

			return realNextTick.call(global, function doTickTaskWithArgs() {
				task.apply(context, args);
			});
		} else {
			return realNextTick.call(global, function doTickTask() {
				task();
			});
		}
	};

	/**
	 * A setImmediate that can set the context
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.5.1
	 * @version   0.6.1
	 *
	 * @param     {Function}   task
	 * @param     {Object}     context
	 */
	Blast.setImmediate = function setImmediate(task, context) {

		var args,
		    i;

		if (typeof task != 'function') {
			throw new TypeError('"callback" argument must be a function');
		}

		if (arguments.length > 2) {
			args = [];

			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
		}

		return realSetImmediate.call(global, function doTask() {
			task.apply(context, args);
		});
	}

	Blast.defineGlobal('clearImmediate', realClearImmediate);

	if (Blast.Globals.requestIdleCallback) {
		Blast.requestIdleCallback = Blast.Globals.requestIdleCallback.bind(Blast.Globals);
		Blast.cancelIdleCallback = Blast.Globals.cancelIdleCallback.bind(Blast.Globals);
		return;
	}

	/**
	 * A requestIdleCallback polyfill
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.2
	 * @version   0.6.2
	 *
	 * @param     {Function}   task
	 * @param     {Object}     options
	 */
	Blast.requestIdleCallback = function requestIdleCallback(task, options) {

		var request_start = Date.now(),
		    timeout_time,
		    grace_period = 0,
		    did_timeout = false,
		    lap_start = request_start,
		    round = 0,
		    wait = 1,
		    id = idle_counter++;

		if (!options) {
			options = {};
		}

		if (Blast.isBrowser) {
			// Browser timeouts minimum is about 4ms
			wait = 4;

			// Start with a greater grace period
			grace_period = 2;
		}

		// Limit the amount of requests that can be made per second
		if (request_start - last_idle < 30) {
			wait += 15;
		}

		last_idle = request_start;

		// If a timeout is defined,
		// calculate at what time it should have timed out
		if (options.timeout) {
			timeout_time = options.timeout + request_start;
		} else {
			timeout_time = Infinity;
		}

		idles[id] = true;

		setTimeout(function didTimeout() {

			var now       = Date.now(),
			    elapsed   = now - lap_start,
			    left      = grace_period + (wait - elapsed),
			    remaining;

			if (!idles[id]) {
				return;
			}

			// Update the last_idle timestamp
			last_idle = now;

			round++;

			if (left >= 0) {
				remaining = 45 + left;
			} else if (now >= timeout_time) {
				remaining = 0;
				did_timeout = true;
			} else {

				// Increase the grace period up to a maximum of 5ms
				// each time we have to retry
				if (grace_period < 5) {
					grace_period++;
				}

				// Add the time left (negative value) to 10ms
				wait = Math.min(20 - left, 50);

				lap_start = now;

				setTimeout(didTimeout, wait);
				return;
			}

			task({
				didTimeout    : did_timeout,
				timeRemaining : function timeRemaining() {
					return Math.max(0, remaining - (Date.now() - now));
				}
			});

			// Update the last_idle timestamp
			last_idle = Date.now();

			delete idles[id];
		}, wait);

		return id;
	};

	/**
	 * A cancelIdleCallback polyfill
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.6.2
	 * @version   0.6.2
	 *
	 * @param     {Number}   id
	 */
	Blast.cancelIdleCallback = function cancelIdleCallback(id) {
		delete idles[id];
	};
};