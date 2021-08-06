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
		if (process.env.SLOWTEST) {
			console.log('  »» WARNING «« Time-sensitive error ignored due to SLOWTEST:', err);
		} else {
			throw err;
		}
	}
};