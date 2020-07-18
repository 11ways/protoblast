module.exports=function BlastInitOnSauce(modifyPrototype) {

	if (typeof Protoblast == 'undefined' || !Protoblast) {
		throw new Error('Protoblast was not found on the page');
	}

	return Protoblast;
};

if (window.getMochaStats) return;

function getSuites(suites) {

	var newSuites = [];

	suites.forEach(function(suite) {

		var clone = {
			title: suite.title,
			tests: [],
			suites: []
		};

		suite.tests.forEach(function(test) {

			var err = '';

			if (test.err) {
				err = {
					name: test.err.name,
					message: test.err.message,
					stack: test.err.stack
				};
			}

			var testClone = {
				async: test.async,
				duration: test.duration,
				speed: test.speed,
				state: test.state,
				sync: test.sync,
				timedOut: test.timedOut,
				title: test.title,
				type: test.type,
				err: err
			};

			clone.tests.push(testClone);
		});

		if (suite.suites && suite.suites.length) {
			clone.suites = getSuites(suite.suites);
		}

		newSuites.push(clone);
	});

	return newSuites;
}

window.getMochaStats = function getMochaStats() {

	if (!window.test) {
		throw new Error('Unable to find the global Mocha `test` object');
	}

	if (!window.test.stats) {
		throw new Error('The global Mocha `test` oject contains no stats property');
	}

	let result,
	    stats = window.test.stats,
	    suites = window.test.suite.suites;

	result = {
		passes: stats.passes,
		tests: stats.tests,
		suiteCount: stats.suites,
		duration: stats.duration,
		failures: stats.failures,
		pending: stats.pending,
		suites : getSuites(suites)
	};

	return result;
};