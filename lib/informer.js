module.exports = function BlastInformer(Blast, Collection) {

	/**
	 * The Informer class:
	 * A queryable event emitter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 */
	var Informer = Collection.Function.inherits(function Informer() {});

	// Functions that only listen to the type (string)
	Informer.prepareStaticProperty('simpleListeners', Object);

	// Functions that listen but filter
	Informer.prepareStaticProperty('filterListeners', Object);

	// List of all the types we're listening to
	Informer.prepareStaticProperty('listenTypes', Array);

	// Functions that only listen to the type (string)
	Informer.setProperty(function simpleListeners() {
		return this._simpleListeners || (this._simpleListeners = {});
	});

	// Functions that listen but filter
	Informer.setProperty(function filterListeners() {
		return this._filterListeners || (this._filterListeners = {});
	});

	// List of all the types we're listening to
	Informer.setProperty(function listenTypes() {
		return this._listenTypes || (this._listenTypes = []);
	});

	// Which simple events have we seen?
	Informer.setProperty(function simpleSeen() {
		return this._simpleSeen || (this._simpleSeen = {});
	});

	// And which filter events have we seen?
	Informer.setProperty(function filterSeen() {
		return this._filterSeen || (this._filterSeen = []);
	});

	/**
	 * Determine if an object is an instance of Informer
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.5
	 * @version  0.3.10
	 *
	 * @return   {Boolean}
	 */
	Informer.setStatic(function isInformer(obj) {
		return !!obj && obj.simpleListeners != null;
	});

	/**
	 * Set a prototype method on the given constructor
	 * that will wait for the given event (filter).
	 * The method will always return a promise in the form of the Pledge class.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.4.0
	 *
	 * @param    {Object|String}   filter   The event filter
	 * @param    {String}          key      Name to use (defaults to method name)
	 * @param    {Function}        method   The method to set
	 *
	 * @return   {Function}
	 */
	Informer.setStatic(function setAfterMethod(filter, key, method) {

		var wrapper,
		    args;

		if (typeof key == 'function') {
			method = key;
			key = method.name;
		}

		// Get the names of the arguments of the method to set
		args = Collection.Function.getArgumentNames(method);

		// Create the wrapper
		wrapper = Collection.Function.create(key, args, function wrapper() {

			var that = this,
			    pledge = new Blast.Classes.Pledge,
			    args = arguments;

			this.afterOnce(filter, function done() {

				var result;

				try {
					result = method.apply(that, args);
					pledge.resolve(result);
				} catch (err) {
					pledge.reject(err);
				}
			});

			return pledge;
		});

		// Set the wrapper as the new method
		return this.setMethod(key, wrapper);
	});

	/**
	 * Set a prototype method on the given constructor
	 * that will execute the task once and cache the result.
	 * The method will always return a promise in the form of the Pledge class.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.4.0
	 * @version  0.5.0
	 *
	 * @param    {String}          key      Name to use (defaults to method name)
	 * @param    {Function}        method   The method to set
	 *
	 * @return   {Function}
	 */
	Informer.setStatic(function setCacheMethod(key, method) {

		var arg_names,
		    wrapper;

		if (typeof key == 'function') {
			method = key;
			key = method.name;
		}

		// Get the names of the arguments of the method to set
		arg_names = Collection.Function.getArgumentNames(method);

		// Create the wrapper
		wrapper = Collection.Function.create(key, arg_names, function wrapper() {

			var that = this,
			    first_call,
			    new_args,
			    callback,
			    pledge,
			    args = arguments,
			    i;

			// Extract the callback
			if (args.length && typeof args[args.length - 1] == 'function') {
				callback = args[args.length - 1];
			}

			// If the _method_cache object doesn't exist yet,
			// make it now
			if (this._method_cache == null) {
				this._method_cache = {};
			}

			if (!this._method_cache[key]) {
				// This is the first time the method has been called!
				pledge = new Blast.Classes.Pledge;
				this._method_cache[key] = pledge;
				first_call = true;
			} else {
				pledge = this._method_cache[key];
			}

			// If there already is a pledge in the method cache object,
			// use it to add this call
			pledge.then(function doMethod(result) {
				callback(null, result);
			});

			pledge.catch(function doMethod(err) {
				callback(err);
			});

			// This return will only be called if it's not the first time
			if (!first_call) {
				return pledge;
			}

			new_args = [];

			for (i = 0; i < args.length - 1; i++) {
				new_args.push(args[i]);
			}

			new_args.push(function done(err, result) {

				if (err) {
					return pledge.reject(err);
				}

				pledge.resolve(result);
			});

			method.apply(that, new_args);

			return pledge;
		});

		// Set the wrapper as the new method
		return this.setMethod(key, wrapper);
	});

	/**
	 * Try/catch function, return error object or null
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @param    {Function}   fnc
	 * @param    {Object}     context
	 * @param    {Array}      args
	 *
	 * @return   {Error}
	 */
	function tryCatch(fnc, context, args) {

		try {
			// Start execusting the function
			switch (args.length) {
				// Avoid apply for up to 3 arguments
				case 1:
					fnc.call(context, args[0]);
					break;
				case 2:
					fnc.call(context, args[0], args[1]);
					break;
				case 3:
					fnc.call(context, args[0], args[1], args[2]);
					break;
				case 4:
					fnc.call(context, args[0], args[1], args[2], args[3]);
					break;
				// Use the slower apply
				default:
					fnc.apply(context, args);
			}
		} catch (err) {
			return err;
		}

		return null;
	}

	/**
	 * Add an event listener
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {String|Object}   type
	 * @param    {Function}        listener
	 * @param    {Object}          context
	 *
	 * @return   {Informer}
	 */
	function addListener(type, listener, context) {

		var typeName,
		    filter,
		    target,
		    entry;

		// Throw an error if no valid listener function is given
		if (typeof listener !== 'function') {
			throw TypeError('listener must be a function');
		}

		// Get the typename & filter data
		if (typeof type === 'string') {
			target = this.simpleListeners;
			typeName = type;
			entry = [listener, null, context||null];
		} else {
			target = this.filterListeners;

			if (typeof type.type === 'string') {
				typeName = type.type;
			} else {
				typeName = '';
			}

			filter = type;
			entry = [listener, filter, context||null];
		}

		// Emit the 'newListener' event
		if (this.simpleListeners.newListener || this.filterListeners.newListener) {
			this.emit('newListener', type, listener.listener ? listener.listener : listener, typeName);
		}

		if (!target[typeName]) {
			target[typeName] = [];
			this.listenTypes.push(typeName);
		}

		target[typeName].push(entry);

		return this;
	}

	// Add the listener method to the class constructor
	Informer.setStatic(['addListener', 'on'], addListener);

	// Add the listener method to the class prototype
	Informer.setMethod(['addListener', 'on'], addListener);

	/**
	 * Forward events to another informer
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.8
	 * @version  0.1.8
	 *
	 * @param    {String|Object}   type
	 * @param    {Object}          target
	 * @param    {Object}          context
	 *
	 * @return   {Informer}
	 */
	Informer.setMethod(function forwardEvent(type, target, context) {
		return this.addListener(type, function onEvent() {

			var args = Blast.Bound.Array.cast(arguments);
			args.unshift(this.fullType);

			target.emit.apply(target, args);
		}, context);
	});

	/**
	 * Listen to an event once
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {String|Object}   type
	 * @param    {Number}          times
	 * @param    {Function}        listener
	 * @param    {Object}          context
	 */
	Informer.setMethod(['many', 'once'], function many(type, times, listener, context) {

		var fired = 0;

		if (typeof times !== 'number') {
			context = listener,
			listener = times;
			times = 1;
		}

		// Throw an error if no valid listener function is given
		if (typeof listener !== 'function') {
			throw TypeError('listener must be a function');
		}

		function g() {

			// If the maximum amount of listens has been reached
			if (++fired == times) {
				this.removeListener(type, g);
			}

			listener.apply(this, arguments);
		}

		g.listener = listener;
		this.on(type, g, context);

		return this;
	});

	/**
	 * Add an eventListener,
	 * but fire immediately if it has been seen in the past.
	 * Past events will have a 'past' context property set to true.
	 * These will also not get the original arguments, those are lost.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.8
	 *
	 * @param    {String|Object}   type
	 * @param    {Number}          times        Infinite by default
	 * @param    {Function}        listener
	 */
	Informer.setMethod(function after(type, times, listener, context) {

		var fired = 0,
		    typeName,
		    context,
		    filter;

		if (typeof times !== 'number') {
			context = listener;
			listener = times;
			times = -1;
		}

		// Throw an error if no valid listener function is given
		if (typeof listener !== 'function') {
			throw TypeError('listener must be a function');
		}

		function g() {

			// If the maximum amount of listens has been reached
			if (++fired == times) {
				this.removeListener(type, g);
			}

			listener.apply(this, arguments);
		}

		g.listener = listener;
		this.on(type, g, context);

		// Now see if it has been seen before!
		if (this.hasBeenSeen(type)) {

			// Normalize the type
			if (typeof type === 'string') {
				typeName = type;
			} else {
				filter = type;
				if (typeof type.type === 'string') {
					typeName = type.type;
				} else {
					typeName = '';
				}
			}

			// Create a new context object
			context = Object.create(this);

			// Set the type info
			context.type = typeName;
			context.filter = filter;
			context.that = this;

			// Indicate this event came from the past
			context.past = true;

			g.call(context);
		}

		return this;
	});

	/**
	 * Same as after, but with a 'times' option that defaults to once
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {String|Object}   type
	 * @param    {Number}          times
	 * @param    {Function}        listener
	 * @param    {Object}          context
	 */
	Informer.setMethod(['afterMany', 'afterOnce'], function afterOnce(type, times, listener, context) {

		if (typeof times !== 'number') {
			context = listener;
			listener = times;
			times = 1;
		}

		return this.after(type, times, listener, context);
	});

	/**
	 * Remove a listener that matches the given type completely
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {String|Object}   type
	 * @param    {Function}        listenerToRemove
	 */
	Informer.setMethod(function removeListener(type, listenerToRemove) {

		var listeners,
		    typeName,
		    filter,
		    temp,
		    doit,
		    key,
		    i;

		// Throw an error if no valid listener function is given
		if (typeof listenerToRemove !== 'function') {
			throw TypeError('listener must be a function');
		}

		// Normalize the type
		if (typeof type === 'string') {

			listeners = this.simpleListeners[type];

			if (listeners && listeners.length) {
				for (i = listeners.length-1; i >= 0; i--) {
					if (listeners[i][0] == listenerToRemove || listeners[i][0].listener == listenerToRemove) {
						temp = listeners.splice(i, 1);

						if (this.simpleListeners.removeListener) {
							// Emit an event, with a null value as last argument,
							// so the removed function won't be seen as a callback
							this.emit('removeListener', type, temp[0], null);
						}
					}
				}
			}

			return this;
		}

		filter = type;
		if (typeof type.type === 'string') {
			typeName = type.type;
		} else {
			typeName = '';
		}

		listeners = this.filterListeners[typeName];

		if (listeners && listeners.length) {
			for (i = listeners.length-1; i >= 0; i--) {

				// The function must match exactly
				if (listeners[i][0] == listenerToRemove || listeners[i][0].listener == listenerToRemove) {

					temp = false;

					// If the filter object does not match exactly, inspect it key by key
					if (type !== listeners[i][1]) {
						doit = true;

						for (key in listeners[i][1]) {
							if (listeners[i][1][key] != type[key]) {
								doit = false;
								break;
							}
						}

						if (doit) {
							temp = listeners.splice(i, 1);
						}
					} else {
						temp = listeners.splice(i, 1);
					}

					if (temp && this.simpleListeners.removeListener) {
						this.emit('removeListener', type, temp[0], null);
					}
				}
			}
		}

		return this;
	});

	/**
	 * Remove all listeners for this type.
	 * If the type is a string, all filter listeners listening to this type
	 * will also be removed!
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 */
	Informer.setMethod(function removeAllListeners(type) {

		var listeners,
		    typeName,
		    filter,
		    list,
		    doit,
		    key,
		    i;

		// Normalize the type
		if (typeof type === 'string') {

			listeners = this.simpleListeners[type];

			if (listeners && listeners.length) {

				// Prepare a new array, all listeners to be removed will be stored here first
				list = [];
				for (i = 0; i < listeners.length; i++) {
					list.push(listeners[i][0]);
				}

				// Now actually remove the listeners
				for (i = 0; i < list.length; i++) {
					this.removeListener(type, list[i]);
				}
			}

			// Get all the filter listeners that listen to this type name
			listeners = this.filterListeners[type];

			if (listeners && listeners.length) {
				list = [];
				for (i = 0; i < listeners.length; i++) {
					list.push(listeners[i]);
				}

				for (i = 0; i < list.length; i++) {
					this.removeListener(list[i][1], list[i][0]);
				}
			}

			return this;
		}

		filter = type;
		if (typeof type.type === 'string') {
			typeName = type.type;
		} else {
			typeName = '';
		}

		listeners = this.filterListeners[typeName];

		if (listeners && listeners.length) {

			// Prepare a new array, all listeners to be removed will be stored here first
			list = [];

			for (i = 0; i < listeners.length; i++) {

				// If the filter object does not match exactly, inspect it key by key
				if (type !== listeners[i][1]) {
					doit = true;

					for (key in listeners[i][1]) {
						if (listeners[i][1][key] != type[key]) {
							doit = false;
							break;
						}
					}

					if (!doit) {
						continue;
					}
				}
				
				list.push(listeners[i]);
			}

			// Now remove everything we found
			for (i = 0; i < list.length; i++) {
				this.removeListener(list[i][1], list[i][0]);
			}
		}

		return this;
	});

	/**
	 * Check if the given type has been seen
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.3.10
	 *
	 * @param    {String|Object}   type
	 *
	 * @return   {Boolean}
	 */
	Informer.setMethod(function hasBeenSeen(type) {

		var listeners,
		    typeName,
		    filter,
		    types,
		    entry,
		    doit,
		    key,
		    i;

		// The check is very simple if the type is just a string
		if (typeof type === 'string') {
			if (this.simpleSeen[type]) {
				return true;
			}

			return false;
		}

		filter = type;
		if (typeof type.type === 'string') {
			typeName = type.type;
		} else {
			typeName = '';
		}

		if (typeName) {
			// Check the listeners for this typeName and the nameless ones
			types = [typeName, ''];
		} else {
			// Check all the listeners
			types = this.listenTypes;
		}

		for (i = 0; i < this.filterSeen.length; i++) {

			// Get the entry, which exists of the listener and the object
			entry = this.filterSeen[i];

			// Doit is true by default
			doit = true;

			for (key in filter) {
				// All the listened-to keys must be found inside the
				// emitted filter. (The emitted filter may contain more)
				if (entry[key] != filter[key]) {
					doit = false;
					break;
				}
			}

			if (doit) {
				return true;
			}
		}

		return false;
	});

	/**
	 * Unsee an event type or filter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.0
	 * @version  0.3.10
	 *
	 * @param    {String|Object}   type
	 */
	Informer.setMethod(function unsee(type) {

		var filter,
		    entry,
		    count,
		    doit,
		    key,
		    i;

		if (typeof type == 'string') {
			this.simpleSeen[type] = false;

			// Create a filter object for the filterSeen removal
			filter = {
				type : type
			};
		} else {
			filter = type;
			type = filter.type;

			// See if we should set the simpleSeen entry to false, too
			// (This is only done when "type" is the only property in the filter)
			if (type != null) {
				count = 0;

				for (key in filter) {
					count++;
					if (count > 1) {
						break;
					}
				}

				// If the filter only contained a 'type' property,
				// the simpleSeen entry must also be set to false
				if (count == 1) {
					this.simpleSeen[type] = false;
				}
			}
		}

		for (i = this.filterSeen.length - 1; i >= 0; i--) {
			entry = this.filterSeen[i];

			// Doit is true by default
			doit = true;

			for (key in filter) {
				// All the listened-to keys must be found inside the
				// emitted filter. (The emitted filter may contain more)
				if (entry[key] != filter[key]) {
					doit = false;
					break;
				}
			}

			if (doit) {
				// Remove this seen entry
				this.filterSeen.splice(i, 1);
			}
		}

	});

	/**
	 * Look for all the functions that listen to the given type/filter
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.5.1
	 *
	 * @param    {String|Object}   type
	 * @param    {Boolean}         mark_as_seen
	 *
	 * @return   {Array}
	 */
	Informer.setMethod(function queryListeners(type, mark_as_seen) {

		var listeners,
		    typeName,
		    result,
		    filter,
		    types,
		    entry,
		    doit,
		    cstr,
		    temp,
		    key,
		    i,
		    j;

		// Normalize the type
		if (typeof type === 'string') {
			typeName = type;
		} else {
			filter = type;
			if (typeof type.type === 'string') {
				typeName = type.type;
			} else {
				typeName = '';
			}
		}

		// All listeners will be added to this
		result = [typeName, filter];

		// Mark this typeName as seen
		if (mark_as_seen) {
			this.simpleSeen[typeName] = true;
		}

		if (filter) {

			// Mark this filter as seen
			// @todo: this could cause memory leaks if not handled correctly
			if (mark_as_seen) {
				this.filterSeen.push(filter);
			}

			if (typeName) {
				// Check the listeners for this typeName and the nameless ones
				types = [typeName, ''];
			} else {
				// Check all the listeners
				types = this.listenTypes;

				// Check class specific listen types
				if (this.constructor.classWideEvents) {
					for (cstr = this.constructor; cstr; cstr = cstr.super) {
						if (cstr.listenTypes) {
							types = cstr.listenTypes.concat(types);
						}
					}
				}
			}

			for (i = 0; i < types.length; i++) {
				listeners = this.filterListeners[types[i]];

				// Check class specific filter listeners
				if (this.constructor.classWideEvents) {
					for (cstr = this.constructor; cstr; cstr = cstr.super) {
						if (cstr.filterListeners && (temp = cstr.filterListeners[types[i]])) {
							if (listeners) {
								listeners = listeners.concat(temp);
							} else {
								listeners = temp;
							}
						}
					}
				}

				// If no listeners were found here, continue
				if (!listeners) continue;

				for (j = 0; j < listeners.length; j++) {

					// Get the entry, which exists of the listener and the object
					entry = listeners[j];

					// Doit is false by default
					doit = true;

					for (key in entry[1]) {
						// All the listened-to keys must be found inside the
						// emitted filter. (The emitted filter may contain more)
						if (entry[1][key] != filter[key]) {
							doit = false;
							break;
						}
					}

					if (doit) {
						result.push(entry);
					}
				}
			}
		}

		if (typeName) {
			listeners = this.simpleListeners[typeName];

			// Check class specific simple listeners
			if (this.constructor.classWideEvents) {
				for (cstr = this.constructor; cstr; cstr = cstr.super) {
					if (cstr.simpleListeners && (temp = cstr.simpleListeners[typeName])) {
						if (listeners) {
							listeners = listeners.concat(temp);
						} else {
							listeners = temp;
						}
					}
				}
			}

			if (!listeners) {
				return result;
			}

			for (j = 0; j < listeners.length; j++) {
				result.push(listeners[j]);
			}
		}

		return result;
	});

	/**
	 * Return an array of functions listening to this event.
	 * Like queryListeners, but only returns functions.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 *
	 * @return   {Array}
	 */
	Informer.setMethod(function listeners(type) {
		return this.queryListeners(type, false).slice(2);
	});

	/**
	 * See if there is a next item
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.9
	 *
	 * @param    {String|Object}   type
	 */
	Informer.setMethod(function emit(type) {

		var that = this,
		    shouldBeStopped,
		    listeners,
		    argLength,
		    typeName,
		    subtasks,
		    isAsync,
		    context,
		    filter,
		    tasks,
		    args,
		    err,
		    cb,
		    i;

		// Get all the listeners for this type/filter
		listeners = this.queryListeners(type, true);

		if (type === 'error') {

			if (listeners.length < 3) {
				err = arguments[1];

				if (err instanceof Error) {
					throw err;
				} else {
					throw TypeError('Uncaught, unspecified "error" event: ' + err);
				}
			}
		}

		// Get the possible callback
		cb = arguments[arguments.length-1];

		// There is no callback if the last argument isn't a function
		if (typeof cb !== 'function') {
			cb = null;
		} else if (listeners.length < 3) {
			// The first 2 items are the type & filter object,
			// if only those are present, no listeners were found
			if (cb != null) {
				Blast.setImmediate(function noListenersFound() {
					cb();
				});
			}

			return this;
		}

		typeName = listeners[0];
		filter = listeners[1];
		argLength = arguments.length;

		// Do not leak the arguments object
		args = new Array(argLength - 1);
		for (i = 1; i < argLength; i++) args[i-1] = arguments[i];

		tasks = [];
		subtasks = [];

		listeners.forEach(function eachListener(list, index) {

			var listener,
			    context,
			    config,
			    octx;

			// Skip the first 2 items
			if (index < 2) return;

			listener = list[0];
			octx = context = list[2];

			// Create an augmented context for every listener
			context = Object.create(context || that);
			context.fullType = type;
			context.type = typeName;
			context.filter = filter;
			context.wait = wait;
			context.stop = stop;
			context.that = octx || that;

			// Store async config in another object,
			// to save from any more augmentations
			context.asyncConfig = {};
			config = context.asyncConfig;

			tasks[tasks.length] = function doListener(next) {

				var err;

				if (shouldBeStopped) {
					return next();
				}

				// Execute the listener, catch any errors it might throw
				err = tryCatch(listener, context, args);

				if (err) {
					return next(err);
				}

				if (context.ListenerSaysStop) {
					shouldBeStopped = true;
					return next();
				}

				if (config.async) {
					isAsync = true;
				}

				// If it's not asynchronous, or already finished, return now
				if (!config.async || config.ListenerIsDone) {
					return next();
				}

				// Series-functions should just call next themselves
				if (config.async === 'series') {
					config.ListenerCallback = next;
					return;
				}

				subtasks[subtasks.length] = function parallelHandler(nextSub) {

					if (config.ListenerIsDone) {
						return nextSub(config.err);
					}

					config.ListenerCallback = nextSub;
				};

				// Pre-emptively call next for parallel functions,
				// those callbacks will be caught later
				next();
			};
		});

		// Run the functions (but do it immediately, `series` should use
		// Blast.callNow instead of setImmediate)
		Collection.Function.series(false, tasks, function seriesDone(err) {

			// Stop now when there is no callback
			if (cb == null) {

				// Throw the error when no callback is given
				if (err) Blast.setImmediate(function throwError() {
					throw err;
				});

				return;
			}

			if (!subtasks.length) {
				return cb(err, shouldBeStopped);
			}

			Collection.Function.parallel(false, subtasks, function parallelDone(subErr) {

				if (err && subErr) {
					err = [err, subErr];
				}

				cb(err, shouldBeStopped);
			});
		});

		return this;
	});

	/**
	 * A method to indicate we have to wait for it to finish,
	 * because it is asynchronous.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @return   {Function}   The function to call when done
	 */
	function wait(type) {

		var that = this,
		    config = this.asyncConfig;

		if (type !== 'series') {
			type = 'parallel';
		}

		// Indicate we're going to have to wait
		config.async = type;

		function next(err) {
			config.err = err;
			config.ListenerIsDone = true;

			if (config.ListenerCallback) {
				config.ListenerCallback(err);
			}
		};

		return next;
	}

	/**
	 * Stop, do not call any more listeners
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 */
	function stop() {
		this.ListenerSaysStop = true;
	}

	/**
	 * Emit an event if it hasn't been emitted before
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type   An object containing identifiers
	 */
	Informer.setMethod(function emitOnce(type, data) {
		if (!this.hasBeenSeen(type)) {
			this.emit(type, data);
		}
	});

	Blast.defineClass('Informer', Informer);
};