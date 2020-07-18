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