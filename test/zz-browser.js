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
let tests_js_file;

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

return;

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
				case 'form_data.js':
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

				if (url.pathname == '/tests.js') {
					res.writeHead(200, {'Content-Type': 'application/javascript'});
					res.end(tests_js_file);

					return;
				}

				// Serve multiple template files
				if (url.pathname == '/index.html') {

					let html = `
						<html>
							<head>
								<script>window.onerror = function(err) {

									let message = err.message;

									if (typeof err == 'string') {
										message = err;
									}
									window.ERR = {name: err.name, message: message, stack: err.stack, type: typeof err};

									if (!window.all_errors) {
										window.all_errors = [];
									}

									window.all_errors.push(window.ERR);
								}</script>
								<script>window.__is_protoblast_unit_test = true;</script>
								<script src="/mocha.js"></script>
								<script>mocha.setup("bdd")</script>
					`;

					if (process.env.SLOWTEST) {
						html += '\t\t\t<script>window.__is_slowtest = true;</script>';
					}

					html += `
								<script src="/protoblast.js"></script>
								<script src="/tests.js"></script>
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

			let called = false;

			// Bundle the files
			test_brow.bundle(function(err, result) {

				if (called) {
					console.warn(' »» Browserify\'s bundle() method called back twice!');
					return;
				}

				called = true;

				if (err) {
					return next(err);
				}

				test_files = ''+result;

				if (test_files.indexOf('getMochaStats') == -1) {
					return next(new Error('Browserify did not bundle all files, sauceindex.js is missing'));
				}

				next();
			});
		});

		it('setup testfiles', async function() {

			let new_promisify = `var promisify = function(fnc_to_promisify) {

				return function() {
					let args = Array.prototype.slice.call(arguments);
			
					return new Promise(function(resolve, reject) {
						function customCallback(err) {
			
							if (err) {
								return reject(err)
							}
			
							var results = Array.prototype.slice.call(arguments);
							results.shift();
			
							return resolve(results.length === 1 ? results[0] : results) 
						}
						
						args.push(customCallback);
						fnc_to_promisify.apply(this, args)
					});
				};
			}`.replaceAll('\n', ' ');

			// Out out the blue `promisify` does not work anymore.
			test_files = test_files.replaceAll(`const { promisify } = require('util')`, new_promisify)

			tests_js_file = 'window.ERR = false; try {' + test_files + '} catch (err) { window.ERR = {name: err.name, message: err.message, stack: err.stack}}';
		});

		it('going to index page', async function() {
			await setLocation('/index.html');
		});


		it('loading javascript testfiles', async function() {

			let all_errors = await evalPage('window.all_errors');

			let result = await evalPage('window.ERR');

			if (result) {
				let err = new Error('Error adding testfiles, browser error was: ' + result.message);
				err.stack = result.name + ': ' + result.message + '\n' + result.stack;

				try {
					let parsed = Error.parseStack(err);

					let first = parsed[0];
					let lines = script.split('\n');
					let sliced = lines.slice(first.line-15, first.line+15);
					console.log('Error was at:');
					console.log(sliced.join('\n'))
				} catch (more_errors) {
					// Ignore
				}

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

			assert.strictEqual(failures, 0);
		});

		it('retrieved test results', async function() {

			let bla = await evalPage('window.ERR');
			console.log('BLA:', bla);

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