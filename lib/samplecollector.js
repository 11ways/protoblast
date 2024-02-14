const BlastMath = Bound.Math;

/**
 * Collect samples and do something with them
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Object}   options
 */
const SampleCollector = Fn.inherits(null, 'Develry', function SampleCollector(options) {
	this.options = options = options || {};
	this.max_samples = options.max_samples || 10;
	this.cache = options.cache || false;

	if (options.pre_fill !== false) {
		
		let value = 0;

		if (typeof options.pre_fill == 'number') {
			value = options.pre_fill;
		}

		this.samples = new Array(this.max_samples);
		this.samples.fill(value);
		this.length = this.max_samples;
	} else {
		this.samples = [],
		this.length = 0;
	}
	
	if (this.cache) {
		if (typeof this.cache == 'number') {
			this.change_cache_after = this.cache;
		} else {
			this.change_cache_after = Math.max(this.max_samples / 3, 10);
		}
	} else {
		this.change_cache_after = 0;
	}

	this.clearCache();
});

/**
 * Add a getter that uses the sample
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
SampleCollector.setStatic(function addMathGetter(name, fnc) {

	if (typeof name == 'object') {
		let key;

		for (key in name) {
			this.addMathGetter(key, name[key]);
		}

		return;
	}

	this.setMethod(name, function _mathCalculator() {

		if (this.change_cache_after > 0) {

			let result = this.cached_values[name];

			if (result == null) {
				this.has_cached_values = true;
				this.cached_values[name] = result = fnc(this.samples);
			}

			return result;
		}

		return fnc(this.samples);
	});
});

/**
 * Clear the cache
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
SampleCollector.setMethod(function clearCache() {

	this.new_value_counter = 0;
	this.has_cached_values = false;

	this.cached_values = {
		lowest      : null,
		highest     : null,
		mean        : null,
		standardize : null,
		variance    : null,
		deviation   : null,
		median      : null,
		lowpass     : null,
	};
});

/**
 * Add a sample
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {number}   value
 */
SampleCollector.setMethod(function add(value) {

	if (this.change_cache_after > 0) {
		this.new_value_counter++;

		if (this.has_cached_values && this.new_value_counter > this.change_cache_after) {
			this.clearCache();
		}
	}

	let length = ++this.length;

	if (length > this.max_samples) {
		this.samples.shift();
		this.length = length - 1;
	}

	this.samples.push(value);
});

/**
 * Create a timer
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @return   {Function}
 */
SampleCollector.setMethod(function createTimer() {

	let start = Date.now();

	return () => {
		this.add(Date.now() - start);
	}
});

/**
 * Add some getters
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
SampleCollector.addMathGetter({
	lowest      : BlastMath.lowest,
	highest     : BlastMath.highest,
	mean        : BlastMath.mean,
	standardize : BlastMath.standardize,
	variance    : BlastMath.variance,
	deviation   : BlastMath.deviation,
	median      : BlastMath.median,
	lowpass     : BlastMath.lowpass,
});