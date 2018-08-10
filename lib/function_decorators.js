module.exports = function BlastDecorators(Blast, Collection) {

	var cache_key = Symbol('memoize_cache');

	Blast.Decorators = {};

	/**
	 * Method memoizer using the Cache class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
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
			descriptor.value = (function() {

				var checksum = Object.checksum([...arguments], false),
				    result,
				    key = 'mem_' + options.key + '_' + checksum;

				if (!this[config.cache_key]) {
					this[config.cache_key] = new config.cache_class({max_length: config.max_length});
				} else if (this[config.cache_key].has(key)) {
					return this[config.cache_key].get(key);
				}

				result = method.apply(this, arguments);
				this[config.cache_key].set(key, result);

				return result;
			});

			return options;
		};
	};

};