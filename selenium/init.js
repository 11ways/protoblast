var Blast = require('../index.js')(),
    BlastPath = require.resolve('../index.js'),
    browserify = require('browserify'),
    assert = require('assert'),
    base = __dirname + '/../',
    git = require('git-rev'),
    wd = require('wd'),
    fs = require('fs');

function pr(message) {
	console.log(message);
}

var desireds = {
	iphone: {browserName: 'iphone'},
	android: {browserName: 'android'},
	chrome: {browserName: 'chrome'},
	firefox: {browserName: 'firefox'},
	explorer: {browserName: 'internet explorer'},
	ie11: {browserName: 'internet explorer', version: '11'}
};

var browserKey = process.env.BROWSER || 'firefox';
var desired = desireds[browserKey];

if (!desired) {
	pr('Could not find browserconfig for "' + String(browserKey) + '"');
	process.exit();
}

let pending_tests = [];

describe('Async setup', function() {

	it('should work', function() {

	})
});

before(async function() {
	this.timeout(70000)

	let mochaFile  = ''+fs.readFileSync(base + '/node_modules/mocha/mocha.js'),
	    mochaStyle = ''+fs.readFileSync(base + '/node_modules/mocha/mocha.css');

	var blastPath = await Blast.getClientPath({
		enable_coverage   : true,
		modify_prototypes : true
	});

	var blastClient = ''+fs.readFileSync(blastPath);
	var mocha = mochaFile;

	var blastFile  = blastClient,
	    testBrow   = browserify(),
	    username = process.env.SAUCE_PROTOBLAST_USERNAME || process.env.SAUCE_USERNAME,
	    accessKey = process.env.SAUCE_PROTOBLAST_ACCESS_KEY || process.env.SAUCE_ACCESS_KEY;

	if (!username || !accessKey) {
		pr('Could not find username or accesskey!');
		process.exit();
	}

	// Add the sauceindex file
	testBrow.require(__dirname + '/sauceindex.js', {expose: '../index.js'});

	// Add every test file in order
	fs.readdirSync(base + '/test/').forEach(function(filename) {

		switch (filename) {
			case 'abc.js':
			case 'zz-browser.js':
			case 'stream_combined.js':
			case 'stream_delayed.js':
				return;
		}

		testBrow.add(base + '/test/' + filename);
	});

	function describeSuite(suite, browser, recursive) {

		if (!recursive) {
			recursive = 0;
		}

		describe(suite.title, function() {

			var markPassed = true;

			this.slow(75);

			if (Array.isArray(suite.suites)) {
				suite.suites.forEach(function(suite) {
					describeSuite(suite, browser, recursive + 1);
				});
			}

			suite.tests.forEach(function(test) {

				if (test.state == 'pending') {
					it.skip(test.title + ' (pending error)', function() {});

					pending_tests.push(test);
					return;
				}

				it(test.title, function() {

					if (test.state !== 'passed') {
						markPassed = false;
						var err = new Error(test.err.message);

						err.stack = test.err.name + ': ' + test.err.message + '\n' + test.err.stack;
						throw err;
					}
				});
			});
		});
	}

	describe('Configuring browser:', function() {

		var testFiles,
		    browser,
		    failures = 0;

		browser = wd.promiseChainRemote("ondemand.saucelabs.com", 80, username, accessKey);

		// Give it 500 seconds to timeout
		this.timeout(500000);
		this.slow(5000);

		it('preparing the test bundle', function(next) {

			// Bundle the files
			testBrow.bundle(function(err, result) {
				testFiles = ''+result;
				next();
			});
		});

		it('requesting a browser', function() {

			var options;

			// This can easily take 15 seconds or more
			this.slow(15000);

			options = Object.assign({}, desired);
			options.name = 'protoblast';
			options['recordVideo'] = false;
			options['captureHtml'] = true;

			return browser.init(options).setAsyncScriptTimeout(30000);
		});

		it('set git commit', function(next) {
			git.short(function(str) {
				browser.sauceJobUpdate({
					build: str
				}).nodeify(next);
			});
		});

		it('getting a blank page', function() {
			return browser.get('about:blank');
		});

		it('adding protoblast file', function() {

			this.timeout(30000);

			// Add protoblast
			return browser.safeExecute(blastFile);
		});

		it('adding mocha scripts and setup bdd', function() {
			// Add mocha
			return browser.execute(mochaFile).safeExecute('mocha.setup("bdd") && null');
		});

		it('adding testfiles', function(next) {

			var script = testFiles,
			    prom;

			script = 'try { ' + script + '} catch (err) { window.ERR = {name: err.name, message: err.message, stack: err.stack}}';
			
			prom = browser.safeExecute('var testFiles = document.createElement("script"); testFiles.innerHTML = ' + JSON.stringify(script) + ';document.head.appendChild(testFiles);')

			prom.safeExecute('window.ERR', function(err, result) {

				var errorObject;

				if (result) {

					errorObject = new Error(result.message);
					errorObject.stack = result.name + ': ' + result.message + '\n' + result.stack;

					next(errorObject);
				} else {
					next();
				}
			});
		});

		it('adding the mocha html', function() {

			var html = '<div id="mocha"></div>';
			html += '<style type="text/css">' + mochaStyle + '</style>';

			return browser.safeExecute('document.body.innerHTML = ' + JSON.stringify(html));
		});

		it('running tests on browser', function() {

			this.timeout(10000);

			// Start mocha
			return browser.execute('window.test = mocha.run(function(err, r){window.mochaIsDone = true;})')
			       .waitForConditionInBrowser('test.stats.passes > 0 && test.stats.pending === 0', 10000);
		});

		it('retrieved test results', function(next) {

			var prom;

			this.timeout(10000);

			// Get the stats
			prom = browser.safeExecute('window.getMochaStats()');

			prom.nodeify(function(err, stats) {

				var success = false;

				if (err) {
					pr(err);
					return browser.sauceJobStatus(false).nodeify(next);
				}

				stats.suites.forEach(function(suite) {
					describeSuite(suite, browser);
				});

				if (stats.failures == 0) {
					success = true;
				}

				browser.sauceJobStatus(success).quit().nodeify(next);
			});
		});
	});
});