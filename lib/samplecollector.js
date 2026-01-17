const BlastMath = Bound.Math;

/**
 * Collect samples and do something with them
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.9.6
 *
 * @param    {Object}   options
 */
const SampleCollector = Fn.inherits(null, 'Develry', function SampleCollector(options) {
	this.options = options = options || {};
	this.max_samples = options.max_samples || 10;
	this.cache = options.cache || false;

	// Create the ring buffer for storing samples
	this.ring = new Classes.Develry.RingBuffer(this.max_samples);

	if (options.pre_fill !== false) {
		
		let value = 0;

		if (typeof options.pre_fill == 'number') {
			value = options.pre_fill;
		}

		// Pre-fill the ring buffer
		for (let i = 0; i < this.max_samples; i++) {
			this.ring.push(value);
		}
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
 * The length property returns the number of samples in the ring buffer
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.9.6
 */
SampleCollector.setProperty(function length() {
	return this.ring.length;
});

/**
 * The samples property returns an array of all samples.
 * Uses cached array that gets invalidated when cache is cleared.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.9.6
 */
SampleCollector.setProperty(function samples() {

	if (this._samplesArray == null) {
		this._samplesArray = this.ring.toArray();
	}

	return this._samplesArray;
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
 * @version  0.9.6
 */
SampleCollector.setMethod(function clearCache() {

	this.new_value_counter = 0;
	this.has_cached_values = false;

	// Invalidate the samples array cache
	this._samplesArray = null;

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
 * @version  0.9.6
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

	// Invalidate the samples array cache when adding a new value
	this._samplesArray = null;

	// Simply push to the ring buffer - it handles the circular behavior
	this.ring.push(value);
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

/**
 * Return an object for JSON-Dry serialization
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @return   {Object}
 */
SampleCollector.setMethod(function toDry() {
	return {
		value: {
			options : this.options,
			samples : this.samples,
		},
	};
});

/**
 * Reconstruct a SampleCollector from JSON-Dry serialized data
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.6
 * @version  0.9.6
 *
 * @param    {Object}   value
 *
 * @return   {SampleCollector}
 */
SampleCollector.setStatic(function unDry(value) {

	let options = Object.assign({}, value.options, {pre_fill: false});
	let collector = new SampleCollector(options);

	for (let sample of value.samples) {
		collector.add(sample);
	}

	return collector;
});