const Blast  = require('../index.js')();

const SwiftPledge = Pledge.Swift;

suite('Pledge', function() {

	// Benchmarking the native Promise
	bench('Promise.resolve()', async function() {
		return Promise.resolve(true);
	});

	bench('Pledge.resolve()', async function() {
		return Pledge.resolve(true);
	});

	bench('SwiftPledge.resolve()', async function() {
		return SwiftPledge.resolve(true);
	});

	bench('Promise with executor', async function () {
		return new Promise((resolve, reject) => resolve(true));
	});

	bench('Pledge with executor', async function () {
		return new Pledge((resolve, reject) => resolve(true));
	});

	bench('SwiftPledge with executor', async function () {
		return new SwiftPledge((resolve, reject) => resolve(true));
	});
});