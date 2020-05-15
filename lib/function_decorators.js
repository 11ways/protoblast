module.exports = function BlastDecorators(Blast, Collection) {

	var cache_key = Symbol('memoize_cache');

	Blast.Decorators = {};

	/**
	 * Method memoizer using the Cache class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.5
	 *
	 * @param    {Object}   config
	 */
	Blast.Decorators.memoize = function memoize(config) {
		if (!config) {
			config = {};
		}

		config.cache_class = config.cache_class || Blast.Classes.Develry.Cache;
		config.cache_key   = config.cache_key   || cache_key;
		config.max_length  = config.max_length  || 15;

		return function memoizer(options) {

			var descriptor = options.descriptor,
			    method     = descriptor.value;

			// Overwrite the value
			descriptor.value = (function memoizeMethod() {

				var callback,
				    checksum,
				    context,
				    result,
				    found,
				    cache,
				    last = arguments.length - 1,
				    args,
				    end,
				    key;

				if (config.ignore_callbacks && typeof arguments[last] == 'function') {
					callback = arguments[last];
					end = last;
				} else {
					end = last + 1;
				}

				if (config.ignore_arguments) {
					args = [];
					key = 'mem_' + options.key + '_all';
				} else {
					args = Array.prototype.slice.call(arguments, 0, end);
					checksum = Object.checksum(args, false);
					key = 'mem_' + options.key + '_' + checksum;
				}

				if (config.static) {
					context = this.constructor;
				} else {
					context = this;
				}

				if (!context[config.cache_key]) {
					context[config.cache_key] = new config.cache_class({max_length: config.max_length});
				}

				cache = context[config.cache_key];

				if (cache.has(key)) {
					result = cache.get(key);
					found = true;
				}

				if (callback) {

					// If the value was already found, callback on the next tick
					if (found) {
						if (result && result.then) {
							result.then(function donePromise(value) {
								callback.apply(null, value);
							});

							return;
						} else {
							return Blast.nextTick(function done() {
								callback.apply(null, result);
							});
						}
					}

					// Not yet found, so add an intercepted callback
					args.push(function interceptCallback(err) {

						if (err) {
							cache.set(key, [err], config.max_age);
							return callback(err);
						}

						let args = [],
						    i;

						for (i = 0; i < arguments.length; i++) {
							args.push(arguments[i]);
						}

						cache.set(key, args, config.max_age);
						callback.apply(null, args);
						pledge.resolve(args);
					});

					let pledge = new Blast.Classes.Pledge();
					cache.set(key, pledge, config.max_age);

					return method.apply(this, args);
				} else if (!found) {
					result = method.apply(this, args);
					cache.set(key, result, config.max_age);
				}

				return result;
			});

			return options;
		};
	};

	/**
	 * Method throttler
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.7.0
	 *
	 * @param    {Object|Number}   config   Config object or timeout in ms
	 */
	Blast.Decorators.throttle = function throttle(config) {

		if (typeof config == 'number') {
			config = {
				minimum_wait : config
			};
		} else if (!config) {
			config = {};
		}

		config.minimum_wait  = config.minimum_wait  || 5;
		config.immediate     = config.immediate     || false;
		config.reset_on_call = config.reset_on_call || false;
		config.delay         = config.delay         || 0;

		if (config.method == null) {
			config.method = true;
		}

		return function throttler(options) {

			var descriptor = options.descriptor;

			// Overwrite the value
			descriptor.value = Collection.Function.throttle(descriptor.value, config);

			return options;
		};
	};

	/**
	 * Call method multiple times if the argument is an array
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.7.1
	 * @version  0.7.1
	 *
	 * @param    {Object}   config
	 */
	Blast.Decorators.loopOverArgument = function loopOverArgument(config) {

		return function loopOverArgument(options) {

			var fnc = options.descriptor.value;

			options.descriptor.value = function loopOverArgument(arg) {

				if (Array.isArray(arg)) {
					let i;

					for (i = 0; i < arg.length; i++) {
						fnc.call(this, arg[i]);
					}

					return;
				}

				return fnc.call(this, arg);
			}

			return options;
		};
	};

};