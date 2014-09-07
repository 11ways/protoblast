module.exports = function BlastInformer(Blast, Collection) {

	/**
	 * The Informer class:
	 * A queryable event emitter
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 */
	var Informer = function Informer() {

		// Functions that only listen to the type (string)
		this.simpleListeners = {};

		// Functions that listen but filter
		this.filterListeners = {};

		// list of all the types we're listening to
		this.listenTypes = [];

		// Which simple events have we seen?
		this.simpleSeen = {};

		// And which filter events have we seen?
		this.filterSeen = [];
	};

	/**
	 * Add an event listener
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 * @param    {Function}        listener
	 */
	Blast.defineValue(Informer.prototype, ['addListener', 'on'], function addListener(type, listener) {

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
			entry = listener;
		} else {
			target = this.filterListeners;

			if (typeof type.type === 'string') {
				typeName = type.type;
			} else {
				typeName = '';
			}

			filter = type;
			entry = [listener, filter];
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
	});

	/**
	 * Listen to an event once
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 * @param    {Number}          times
	 * @param    {Function}        listener
	 */
	Blast.defineValue(Informer.prototype, ['many', 'once'], function many(type, times, listener) {

		var fired = 0;

		if (typeof times !== 'number') {
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
		this.on(type, g);

		return this;
	});

	/**
	 * Add an eventListener,
	 * but fire immediately if it has been seen in the past.
	 * Past events will have a 'past' context property set to true.
	 * These will also not get the original arguments, those are lost.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 * @param    {Number}          times        Infinite by default
	 * @param    {Function}        listener
	 */
	Blast.defineValue(Informer.prototype, 'after', function after(type, times, listener) {

		var fired = 0,
		    typeName,
		    context,
		    filter;


		if (typeof times !== 'number') {
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
				console.log('Removing listener: ' + times)
				this.removeListener(type, g);
			}

			listener.apply(this, arguments);
		}

		g.listener = listener;
		this.on(type, g);

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

			// Indicate this event came from the past
			context.past = true;

			g.call(context);
		}

		return this;
	});

	/**
	 * Same as after, but with a 'times' option that defaults to once
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 * @param    {Number}          times
	 * @param    {Function}        listener
	 */
	Blast.defineValue(Informer.prototype, ['afterMany', 'afterOnce'], function afterOnce(type, times, listener) {

		if (typeof times !== 'number') {
			listener = times;
			times = 1;
		}

		return this.after(type, times, listener);
	});

	/**
	 * Remove a listener that matches the given type completely
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 * @param    {Function}        listenerToRemove
	 */
	Blast.defineValue(Informer.prototype, 'removeListener', function removeListener(type, listenerToRemove) {

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
					if (listeners[i] == listenerToRemove || listeners[i].listener == listenerToRemove) {
						temp = listeners.splice(i, 1);

						if (this.simpleListeners.removeListener) {
							this.emit('removeListener', type, temp[0]);
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
						this.emit('removeListener', type, temp[0]);
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 */
	Blast.defineValue(Informer.prototype, 'removeAllListeners', function removeAllListeners(type) {

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
					list.push(listeners[i]);
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
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 *
	 * @return   {Boolean}
	 */
	Blast.defineValue(Informer.prototype, 'hasBeenSeen', function hasBeenSeen(type) {

		var listeners,
		    typeName,
		    filter,
		    types,
		    entry,
		    doit,
		    i,
		    j;

		// Normalize the type
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

		for (i = 0; i < types.length; i++) {
			listeners = this.filterListeners[types[i]];

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
					return true;
				}
			}
		}

		return false;
	});

	/**
	 * Look for all the functions that listen to the given type/filter
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 * @param    {Boolean}         markAsSeen
	 *
	 * @return   {Array}
	 */
	Blast.defineValue(Informer.prototype, 'queryListeners', function queryListeners(type, markAsSeen) {

		var typeName,
		    result,
		    filter,
		    types,
		    entry,
		    doit,
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
		this.simpleSeen[typeName] = true;

		if (filter) {

			// Mark this filter as seen
			// @todo: this could cause memory leaks if not handled correctly
			this.filterSeen.push(filter);

			if (typeName) {
				// Check the listeners for this typeName and the nameless ones
				types = [typeName, ''];
			} else {
				// Check all the listeners
				types = this.listenTypes;
			}

			for (i = 0; i < types.length; i++) {
				listeners = this.filterListeners[types[i]];

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

			if (!listeners) {
				return result;
			}

			for (j = 0; j < listeners.length; j++) {
				result.push([listeners[j]]);
			}
		}

		return result;
	});

	/**
	 * Return an array of functions listening to this event.
	 * Like queryListeners, but only returns functions.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 *
	 * @return   {Array}
	 */
	Blast.defineValue(Informer.prototype, 'listeners', function listeners(type) {
		return this.queryListeners(type).slice(2);
	});

	/**
	 * See if there is a next item
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   type
	 */
	Blast.defineValue(Informer.prototype, 'emit', function emit(type) {

		var listeners,
		    argLength,
		    typeName,
		    context,
		    filter,
		    args,
		    err,
		    i;

		// Get all the listeners for this type/filter
		listeners = this.queryListeners(type, true);

		if (type === 'error') {

			if (listeners.length < 3) {
				err = arguments[1];

				if (err instanceof Error) {
					throw err;
				} else {
					throw TypeError('Uncaught, unspecified "error" event.');
				}
			}
		}

		// The first 2 items are the type & filter object,
		// if only those are present, no listeners were found
		if (listeners.length < 3) {
			return this;
		}

		typeName = listeners[0];
		filter = listeners[1];
		argLength = arguments.length;

		if (argLength > 3) {
			args = new Array(argLength - 1);
			for (i = 1; i < argLength; i++) {
				args[i-1] = arguments[i];
			}
		}

		for (i = 2; i < listeners.length; i++) {

			// Create an augmented context for every listener
			context = Object.create(this);
			context.type = typeName;
			context.filter = filter;

			switch (argLength) {
				// Avoid apply for up to 2 arguments
				case 1:
					listeners[i][0].call(context);
					break;
				case 2:
					listeners[i][0].call(context, arguments[1]);
					break;
				case 3:
					listeners[i][0].call(context, arguments[1], arguments[2]);
					break;
				// Use the slower apply
				default:
					listeners[i][0].apply(context, args);
			}

		}

		return this;
	});

	Blast.defineClass('Informer', Informer);
};