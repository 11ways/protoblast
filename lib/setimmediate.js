// Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
module.exports = function BlastImmediate(Blast, Collection) {

	"use strict";

	var global = Blast.Globals,
	    realSetImmediate,
	    timeout_counter = 0,
	    realNextTick,
	    timeouts = {},
	    resolved;

	if (global.nextTick) {
		realNextTick = global.nextTick;
	} else if (global.process && global.process.nextTick) {
		realNextTick = global.process.nextTick;
	} else if (typeof Promise !== 'undefined' && Promise.resolve) {
		resolved = Promise.resolve();
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

	/**
	 * Clear a blast timeout
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.2.1
	 * @version   0.2.1
	 *
	 * @param     {Number}     id     The id to clear
	 */
	Blast.clearTimeout = function clearTimeout(id) {
		delete timeouts[id];
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

	if (global.setImmediate) {
		realSetImmediate = global.setImmediate.bind(global);
		var clearImmediate = global.clearImmediate.bind(global);
	} else {

		var nextHandle = 1; // Spec says greater than zero
		var tasksByHandle = {};realSetImmediate
		var currentlyRunningATask = false;
		var doc = global.document;
		var realSetImmediate;

		function addFromSetImmediateArguments(args) {
			tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
			return nextHandle++;
		}

		// This function accepts the same arguments as setImmediate, but
		// returns a function that requires no arguments.
		function partiallyApplied(handler) {

			var args,
			    i;

			// Keep function optimized by not leaking the `arguments` object
			args = new Array(arguments.length-1);
			for (i = 0; i < args.length; i++) args[i] = arguments[i+1];

			return function doHandler() {
				if (typeof handler === "function") {
					handler.apply(undefined, args);
				} else {
					(new Function("" + handler))();
				}
			};
		}

		function runIfPresent(handle) {
			// From the spec: "Wait until any invocations of this algorithm started before this one have completed."
			// So if we're currently running a task, we'll need to delay this invocation.
			if (currentlyRunningATask) {
				// Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
				// "too much recursion" error.
				setTimeout(partiallyApplied(runIfPresent, handle), 0);
			} else {
				var task = tasksByHandle[handle];
				if (task) {
					currentlyRunningATask = true;
					try {
						task();
					} finally {
						clearImmediate(handle);
						currentlyRunningATask = false;
					}
				}
			}
		}

		function clearImmediate(handle) {
			delete tasksByHandle[handle];
		}

		function installNextTickImplementation() {
			realSetImmediate = function setImmediateNexttick() {
				var handle = addFromSetImmediateArguments(arguments);
				process.nextTick(partiallyApplied(runIfPresent, handle));
				return handle;
			};
		}

		function canUsePostMessage() {
			// The test against `importScripts` prevents this implementation from being installed inside a web worker,
			// where `global.postMessage` means something completely different and can't be used for this purpose.
			if (global.postMessage && !global.importScripts) {
				var postMessageIsAsynchronous = true;
				var oldOnMessage = global.onmessage;
				global.onmessage = function() {
					postMessageIsAsynchronous = false;
				};
				global.postMessage("", "*");
				global.onmessage = oldOnMessage;
				return postMessageIsAsynchronous;
			}
		}

		function installPostMessageImplementation() {
			// Installs an event handler on `global` for the `message` event: see
			// * https://developer.mozilla.org/en/DOM/window.postMessage
			// * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

			var messagePrefix = 'setImmediate$' + Math.random() + '$';
			var onGlobalMessage = function(event) {
				if (event.source === global &&
					typeof event.data === "string" &&
					event.data.indexOf(messagePrefix) === 0) {
					runIfPresent(+event.data.slice(messagePrefix.length));
				}
			};

			if (global.addEventListener) {
				global.addEventListener("message", onGlobalMessage, false);
			} else {
				global.attachEvent("onmessage", onGlobalMessage);
			}

			realSetImmediate = function setImmediatePostmessage() {
				var handle = addFromSetImmediateArguments(arguments);
				global.postMessage(messagePrefix + handle, "*");
				return handle;
			};
		}

		function installMessageChannelImplementation() {
			var channel = new MessageChannel();
			channel.port1.onmessage = function onmessage(event) {
				var handle = event.data;
				runIfPresent(handle);
			};

			realSetImmediate = function setImmediateMessageChannel() {
				var handle = addFromSetImmediateArguments(arguments);
				channel.port2.postMessage(handle);
				return handle;
			};
		}

		function installReadyStateChangeImplementation() {
			var html = doc.documentElement;
			realSetImmediate = function setImmediateStatechange() {
				var handle = addFromSetImmediateArguments(arguments);
				// Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
				// into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
				var script = doc.createElement("script");
				script.onreadystatechange = function onreadystatechange() {
					runIfPresent(handle);
					script.onreadystatechange = null;
					html.removeChild(script);
					script = null;
				};
				html.appendChild(script);
				return handle;
			};
		}

		function installSetTimeoutImplementation() {
			realSetImmediate = function setImmediateTimeout() {
				var handle = addFromSetImmediateArguments(arguments);
				setTimeout(partiallyApplied(runIfPresent, handle), 0);
				return handle;
			};
		}

		// Don't get fooled by e.g. browserify environments.
		if ({}.toString.call(global.process) === "[object process]") {
			// For Node.js before 0.9
			installNextTickImplementation();

		} else if (canUsePostMessage()) {
			// For non-IE10 modern browsers
			installPostMessageImplementation();

		} else if (global.MessageChannel) {
			// For web workers, where supported
			installMessageChannelImplementation();

		} else if (doc && "onreadystatechange" in doc.createElement("script")) {
			// For IE 6–8
			installReadyStateChangeImplementation();

		} else {
			// For older browsers
			installSetTimeoutImplementation();
		}
	}

	/**
	 * A nextTick that can set the context
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.5.1
	 * @version   0.5.1
	 *
	 * @param     {Function}   task
	 * @param     {Object}     context
	 */
	Blast.nextTick = function nextTick(task, context) {

		var args = [],
		    i;

		if (arguments.length > 2) {
			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
		}

		return realNextTick.call(global, function doTask() {
			task.apply(context, args);
		});
	};

	/**
	 * A setImmediate that can set the context
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.5.1
	 * @version   0.5.1
	 *
	 * @param     {Function}   task
	 * @param     {Object}     context
	 */
	Blast.setImmediate = function setImmediate(task, context) {

		var args = [],
		    i;

		if (arguments.length > 2) {
			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
		}

		return realSetImmediate.call(global, function doTask() {
			task.apply(context, args);
		});
	}

	Blast.defineGlobal('clearImmediate', clearImmediate);
};