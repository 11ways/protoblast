global.ensureTimeout = function ensureTimeout(callback, ms) {

	let start = Date.now();

	setTimeout(function doCallback() {

		let elapsed = Date.now() - start;

		if (elapsed < ms) {
			return setTimeout(doCallback, ms - elapsed);
		}

		callback();
	}, ms)
};

// This also works on the browser side of the tests thanks to browserify
global.EOL = require('os').EOL;

const assert = require('assert');

global.strictEqualTimeSensitive = function strictEqualTimeSensitive(actual, expected, message) {

	try {
		assert.strictEqual(actual, expected, message);
	} catch (err) {
		if (process.env.SLOWTEST || global.__is_slowtest) {
			console.log('  »» WARNING «« Time-sensitive error ignored due to SLOWTEST:', err);
		} else {
			throw err;
		}
	}
};

// If the actual object contains MORE keys than expected, that's ok!
global.deepAlike = function deepAlike(actual, expected) {

	let expected_entry,
	    actual_entry,
	    key,
	    i;

	for (i = 0; i < expected.length; i++) {
		expected_entry = expected[i];
		actual_entry = actual[i];

		for (key in expected) {
			if (actual_entry[key] !== expected_entry[key]) {
				throw new Error('Entries at index ' + i + ' do not match key ' + key + '\n' + actual_entry[key] + ' !== ' + expected_entry[key]);
			}
		}
	}

};