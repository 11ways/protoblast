var Blast = require('../index.js')(),
    BlastPath = require.resolve('../index.js'),
    assert = require('assert'),
    base = __dirname + '/../',
    git = require('git-rev'),
    wd = require('wd'),
    fs = require('fs');

function pr(message) {
	console.log(message);
}

var desireds = {
	chrome: {browserName: 'chrome'},
	firefox: {browserName: 'firefox'},
	explorer: {browserName: 'internet explorer'},
	ie7: {browserName: 'internet explorer', version: '7'},
	ie8: {browserName: 'internet explorer', version: '9'},
	ie9: {browserName: 'internet explorer', version: '9'},
	ie10: {browserName: 'internet explorer', version: '10'}
};

var browserKey = process.env.BROWSER || 'chrome';
var desired = desireds[browserKey];

var blastPath = Blast.getClientPath(true);
var blastClient = ''+fs.readFileSync(blastPath);
var mocha = ''+fs.readFileSync(base + 'node_modules/mocha/mocha.js');

var browserify = require('browserify');

var blastFile  = ''+fs.readFileSync(Blast.getClientPath(true)),
    mochaFile  = ''+fs.readFileSync(base + '/node_modules/mocha/mocha.js'),
    mochaStyle = ''+fs.readFileSync(base + '/node_modules/mocha/mocha.css'),
    testBrow   = browserify(),
    username = process.env.SAUCE_USERNAME,
    accessKey = process.env.SAUCE_ACCESS_KEY;

// Add the sauceindex file
testBrow.require(__dirname + '/sauceindex.js', {expose: '../index.js'});

// Add every test file in order
fs.readdirSync(base + '/test/').forEach(function(filename) {
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

	// Don't timeout, it can take a while
	this.timeout(0);
	this.slow(2500);

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
		options['record-video'] = false;
		options['capture-html'] = true;

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
		// Add protoblast
		return browser.safeExecute(blastFile);
	});

	it('adding mocha scripts and setup bdd', function() {
		// Add mocha
		return browser.execute(mochaFile).safeExecute('mocha.setup("bdd")');
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
