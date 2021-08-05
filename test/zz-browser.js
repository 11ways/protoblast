/* istanbul ignore file */
// Istanbul coverage is disabled for this file,
// because it would mess up the functions sent to puppeteer

let browserify = require('browserify'),
    puppeteer  = require('puppeteer'),
    libpath    = require('path'),
    assert     = require('assert'),
    Blast,
    base       = libpath.resolve(__dirname, '..'),
    http       = require('http'),
    fs         = require('fs');

let navigations = 0,
    do_coverage = !!global.__coverage__,
    coverage,
    browser,
    server,
    page,
    port;

let test_brow = browserify({debug: true}),
    mocha_file,
    test_files;

let pending_tests = [];

async function fetchCoverage() {
	let temp = await page.evaluate(function getCoverage() {
		return window.__coverage__;
	});

	if (temp) {
		coverage = temp;
	}
}

async function setLocation(path) {

	if (navigations && do_coverage) {
		await fetchCoverage;
	}

	navigations++;

	var url = 'http://127.0.0.1:' + port + path;
	await page.goto(url);

	if (coverage) {
		await page.evaluate(function setCoverage(coverage) {
			window.__coverage__ = coverage;
		}, coverage);
	}
}

function evalPage(fnc) {
	return page.evaluate(fnc);
}

function describeSuite(suite, recursive) {

	if (!recursive) {
		recursive = 0;
	}

	let title = suite.title;

	if (!recursive) {
		title += ' (Browser test)';
	}

	describe(title, function() {

		var markPassed = true;

		this.slow(75);

		if (Array.isArray(suite.suites)) {
			suite.suites.forEach(function(suite) {
				describeSuite(suite, recursive + 1);
			});
		}

		suite.tests.forEach(function(test) {

			if (test.state == 'pending') {
				it.skip(test.title, function() {});
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

describe('Browser', function() {
	this.timeout(70000);

	before(async function() {

		browser = await puppeteer.launch();
		page = await browser.newPage();

		page.on('console', function(msg) {
			var pieces = ['[BROWSER]'],
			    args = msg.args(),
			    args;

			for (arg of args) {
				let remote = arg._remoteObject;

				if (remote.type == 'string') {
					pieces.push(remote.value);
				} else if (remote.subtype == 'node') {
					pieces.push('\x1b[1m\x1b[36m<' + remote.description + '>\x1b[0m');
					//console.log(remote.preview);
				} else if (remote.className) {
					pieces.push('\x1b[1m\x1b[33m{' + remote.type + ' ' + remote.className + '}\x1b[0m');
				} else if (remote.value != null) {
					pieces.push(remote.value);
				} else {
					pieces.push(remote);
				}
			}

			console.log(...pieces);
		});

		Blast = require('../index.js')();

		mocha_file = fs.readFileSync(libpath.resolve(base, 'node_modules', 'mocha', 'mocha.js'), 'utf-8');

		test_brow.require(libpath.resolve(base, 'selenium', 'sauceindex.js'), {expose: '../index.js'});

		// Add every test file in order
		fs.readdirSync(libpath.resolve(base, 'test')).forEach(function(filename) {

			switch (filename) {
				case 'abc.js':
				case 'zz-browser.js':
				case 'stream_combined.js':
				case 'stream_delayed.js':
				case 'server_functions.js':
				case 'assets':
					return;
			}

			test_brow.add(libpath.resolve(base, 'test', filename), {debug: true});
		});

		await new Promise(function(resolve, reject) {
			server = http.createServer(function onReq(req, res) {

				var url = __Protoblast.Classes.RURL.parse(req.url);

				if (url.pathname == '/protoblast.js') {

					__Protoblast.getClientPath({
						modify_prototypes : true,
						ua                : req.headers.useragent,
						enable_coverage   : do_coverage,
					}).done(function gotClientFile(err, path) {

						if (err) {
							throw err;
						}

						res.writeHead(200, {'Content-Type': 'application/javascript'});

						fs.createReadStream(path).pipe(res);
					});

					return;
				}

				if (url.pathname == '/tests.js') {

					res.writeHead(200, {'Content-Type': 'application/javascript'});
					res.end(test_files);

					return;
				}

				if (url.pathname == '/mocha.js') {
					res.writeHead(200, {'Content-Type': 'application/javascript'});
					res.end(mocha_file);

					return;
				}

				// Serve multiple template files
				if (url.pathname == '/index.html') {

					let html = `
						<html>
							<head>
								<script src="/mocha.js"></script>
								<script src="/protoblast.js"></script>
							</head>
							<body></body>
						</html>
					`;

					res.setHeader('content-type', "text/html;charset=utf-8");

					res.end(html);
				}

			}).listen(0, '0.0.0.0', function listening() {
				port = server.address().port;
				resolve();
			});
		});
	});

	describe('Configuring browser:', function() {

		this.timeout(500000);
		this.slow(5000);

		it('preparing the test bundle', function(next) {

			// Bundle the files
			test_brow.bundle(function(err, result) {
				test_files = ''+result;
				next();
			});
		});

		it('going to index page', async function() {
			await setLocation('/index.html');
		});

		it('seting up mocha bdd', async function() {
			await evalPage('mocha.setup("bdd") && null');
		});

		it('adding testfiles', async function() {

			var prom;

			let script = 'try { ' + test_files + '} catch (err) { window.ERR = {name: err.name, message: err.message, stack: err.stack}}';

			await evalPage('var testFiles = document.createElement("script"); testFiles.innerHTML = ' + JSON.stringify(script) + ';document.head.appendChild(testFiles);')

			let result = await evalPage('window.ERR');

			if (result) {
				let err = new Error(result.message);
				err.stack = result.name + ': ' + result.message + '\n' + result.stack;
				throw err;
			}
		});

		it('adding the mocha html', async function() {

			var html = '<div id="mocha"></div>';
			//html += '<style type="text/css">' + mochaStyle + '</style>';

			await evalPage('document.body.innerHTML = ' + JSON.stringify(html));
		});

		it('runs tests in the browser', async function() {
			this.timeout(100000);

			let failures = await evalPage(function() {
				return new Promise(function(resolve, reject) {
					window.test = mocha.run(function done(failures) {
						resolve(failures);
					});
				});
			});
		});

		it('retrieved test results', async function() {

			let stats = await evalPage('window.getMochaStats()');

			stats.suites.forEach(function(suite) {
				describeSuite(suite);
			});

		});
	});

	after(async function() {

		if (do_coverage) {
			await fetchCoverage();
			fs.writeFileSync('./.nyc_output/protoblast.json', JSON.stringify(coverage));
		}

		await browser.close();
	});

});