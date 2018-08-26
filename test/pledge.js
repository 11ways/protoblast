var assert = require('assert'),
    Blast,
    Pledge;

describe('Pledge', function() {
	Blast  = require('../index.js')();
	Pledge = Blast.Classes.Pledge;
	this.timeout(400);

	// before(function() {
	// 	Blast  = require('../index.js')();
	// 	Pledge = Blast.Classes.Pledge;
	// });

	describe('.constructor(executor)', function() {

		it('should create a new pledge without an executor', function() {
			var pledge = new Pledge();
		});

		it('should pass a resolve & reject function to the executor', function(done) {
			var pledge = new Pledge(function myExecutor(resolve, reject) {
				assert.equal(typeof resolve, 'function');
				assert.equal(typeof reject, 'function');
				done();
			});
		});
	});

	describe('.resolve(value)', function() {
		it('should return a pledge that gets resolved asynchronously', function(done) {

			var pledge = Pledge.resolve('some_value');

			assert.equal(pledge.state, 0);

			pledge.then(function _done(value) {
				assert.equal(value, 'some_value');
				assert.equal(pledge.state, 1);
				done();
			});
		});
	});

	describe('.reject(err)', function() {
		it('should return a pledge that gets rejected asynchronously', function(done) {

			var pledge = Pledge.reject(new Error('Bla'));

			assert.equal(pledge.state, 0);

			pledge.catch(function _done(err) {
				assert.equal(err.constructor.name, 'Error');
				assert.equal(pledge.state, 2);
				done();
			});
		});
	});

	describe('.all', function() {
		it('throws on implicit undefined', function() {
			return Pledge.all().then(
				function() {
					assert.fail();
				},
				function(error) {
					console.log
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on explicit undefined', function() {
			return Pledge.all(undefined).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on null', function() {
			return Pledge.all(null).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on 0', function() {
			return Pledge.all(0).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on false', function() {
			return Pledge.all(false).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on a number', function() {
			return Pledge.all().then(
				function() {
					assert.fail(20);
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on a boolean', function() {
			return Pledge.all(true).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on an object', function() {
			return Pledge.all({ test: 'object' }).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});

		it('should resolve all with zero promises', function (done) {
			Pledge.all([]).then(function (x) {
				assert.deepEqual(x, []);
				done();
			});
		});

		it('should return all resolved promises', function (done) {
			Pledge.all([Pledge.resolve('hello'), Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, ['hello', 'world']);
				done();
			});
		});

		it('should reject the promise if one of all is rejected', function (done) {
			Pledge.all([Pledge.resolve('hello'), Pledge.reject('bye')]).then(function () {}, function (r) {
				assert.equal(r, 'bye');
				done();
			});
		});

		it('should return all promises in order with delays', function (done) {
			Pledge.all([new Pledge(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 50);
			}), Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, ['hello', 'world']);
				done();
			});
		});

		it('should convert a non-promise to a promise', function (done) {
			Pledge.all(['hello', Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, ['hello', 'world']);
				done();
			});
		});
	});

	describe('.race', function () {
		it('should race a single resolved promise', function (done) {
			Pledge.race([Pledge.resolve('hello')]).then(function (x) {
				assert.deepEqual(x, 'hello');
				done();
			});
		});

		it('should race a single rejected promise', function (done) {
			Pledge.race([Pledge.reject('bye')]).then(function () {}, function (r) {
				assert.deepEqual(r, 'bye');
				done();
			});
		});

		it('should race two resolved promises', function (done) {
			Pledge.race([Pledge.resolve('hello'), Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, 'hello');
				done();
			});
		});

		it('should race one delayed and one resolved promise', function (done) {
			Pledge.race([new Promise(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 50);
			}), Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, 'world');
				done();
			});
		});

		it('should race one delayed and one rejected promise', function (done) {
			Pledge.race([new Pledge(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 50);
			}), Pledge.reject('bye')]).then(function () {}, function (x) {
				assert.deepEqual(x, 'bye');
				done();
			});
		});

		it('should race two delayed promises', function (done) {
			var race = Pledge.race([new Pledge(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 100);
			}), new Pledge(function (resolve) {
				setTimeout(function () {
					resolve('world');
				}, 50);
			})]);

			race.then(function (x) {
				assert.deepEqual(x, 'world');

				race.then(function(x) {
					assert.deepEqual(x, 'world');
					done();
				});
			});
		});
	});

	describe('.after(n, value)', function () {
		it('create a pledge which resolved after n seconds', function (done) {
			var start = Date.now();

			Pledge.after(10, 'test').handleCallback(function _done(err, val) {

				var elapsed = Date.now() - start;

				if (err) {
					return done(err);
				}

				assert.strictEqual(val, 'test');
				assert.strictEqual(elapsed > 9, true);
				done();
			});
		});
	});

	describe('#resolve(value)', function() {
		it('should set the value', function(done) {

			var pledge = new Pledge(),
			    calls = 0;

			pledge.then(function resolved(value) {
				assert.equal(value, 47);

				pledge.resolve(48);
				pledge.then(function resolvedAgain(value) {
					assert.equal(value, 47, 'Value changed after another resolve call');
					done();
				});
			});

			pledge.resolve(47);
		});
	});

	describe('#then(on_fulfilled, on_rejected)', function() {

		it('should call the on_fulfilled function when it is resolved', function(done) {

			var pledge = new Pledge();

			pledge.then(function resolved(value) {
				assert.equal(value, 99);
				done();
			});

			setTimeout(function() {
				pledge.resolve(99);
			}, 10);
		});

		it('should throw errors if nothing is there to catch it', function(finished) {

			var pledge = new Pledge();

			pledge.then(function resolved(value) {
				throw new Error('Catch it')
			}).catch(function gotError(err) {
				assert.equal(err.message, 'Catch it');
				finished();
			});

			pledge.resolve();
		});
	});

	describe('#finally(on_finally)', function() {
		it('should be called on success', function(done) {
			Pledge.resolve(3).finally(function() {
				assert.equal(arguments.length, 0, 'No arguments to onFinally');
				done();
			});
		});

		it('should be called on failure', function(done) {
			Pledge.reject(new Error('Finally error test')).finally(function() {
				assert.equal(arguments.length, 0, 'No arguments to onFinally');
				done();
			});
		});

		it('should not affect the result', function(done) {
			Pledge.resolve(3)
				.finally(function() {
					return 'dummy';
				})
				.then(function(result) {
					assert.equal(result, 3, 'Result was the resolved result');
					return Pledge.reject(new Error('test'));
				})
				.finally(function() {
					return 'dummy';
				})
				.catch(function(reason) {
					assert(!!reason, 'There was a reason');
					assert.equal(reason.message, 'test', 'We catched the correct error');
				})
				.finally(done);
		});

		it('should reject with the handler error if handler throws', function(done) {
			Pledge.reject(new Error('test2'))
				.finally(function() {
					throw new Error('test3');
				})
				.catch(function(reason) {
					assert.equal(reason.message, 'test3', 'The handler error was caught');
				})
				.finally(done);
		});

		it('should await any promise returned from the callback', function(done) {
			var log = [];
			Pledge.resolve()
				.then(function() {
					log.push(1);
				})
				.finally(function() {
					return Pledge.resolve()
						.then(function() {
							log.push(2);
						})
						.then(function() {
							log.push(3);
						});
				})
				.then(function() {
					log.push(4);
				})
				.then(function() {
					assert.deepEqual(log, [1, 2, 3, 4], 'Correct order of promise chain');
				})
				.catch(function(err) {
					assert(false, err);
				})
				.finally(done);
		});
	});

	describe('#handleCallback(callback)', function() {

		it('should call the callback when resolving or rejecting', function() {
			var pledge = new Pledge();

			pledge.handleCallback(function done(err, result) {
				assert.equal(err.message, 'TEST');
			});

			pledge.reject(new Error('TEST'));

			var pledge_two = new Pledge();

			pledge_two.handleCallback(function done(err, result) {
				assert.equal(result, 'result');
			});

			pledge_two.resolve('result');
		});

		it('should be aliased as #done()', function(done) {

			var pledge = new Pledge(),
			    my_err = new Error('Test');

			pledge.done(function finished(err) {
				assert.strictEqual(err, my_err);

				done();
			});

			pledge.reject(my_err);
		});

		it('should ignore falsy values', function() {
			var pledge = new Pledge();

			pledge.handleCallback(null);
			pledge.handleCallback(false);
			pledge.handleCallback(0);
			pledge.handleCallback('');
		});
	});

	describe('#race(contestant)', function() {
		it('should race another pledge', function(done) {

			var pledge;

			pledge = Pledge.after(15, 'late').race(Pledge.after(5, 'early'));

			pledge.handleCallback(function _done(err, val) {

				if (err) {
					return done(err);
				}

				assert.strictEqual(val, 'early');
				done();
			});
		});

		it('should race multiple pledges', function(done) {
			var pledge;

			pledge = Pledge.after(15, 'late').race([
				Pledge.after(25, 'also_late'),
				Pledge.after(10, 'nicetry'),
				Pledge.after(1, 'winner')
			]);

			pledge.handleCallback(function _done(err, val) {

				if (err) {
					return done(err);
				}

				assert.strictEqual(val, 'winner');
				done();
			});
		});

		it('should lose to simple values', function(done) {
			var pledge;

			pledge = Pledge.after(15, 'late').race([
				Pledge.after(25, 'also_late'),
				Pledge.after(10, 'nicetry'),
				Pledge.after(1, 'nope'),
				'direct'
			]);

			pledge.handleCallback(function _done(err, val) {

				if (err) {
					return done(err);
				}

				assert.strictEqual(val, 'direct');
				done();
			});
		});
	});

	return;

	require('promises-aplus-tests').mocha({
		resolved: function (value) {
			return Pledge.resolve(value);
		},
		rejected: function (reason) {
			return Pledge.reject(reason);
		},
		deferred: function () {
			var resolver = null,
			    rejector = null,
			    pledge;

			pledge = new Pledge(function (resolve, reject) {
				resolver = resolve;
				rejector = reject;
			});

			return {
				promise : pledge,
				resolve : resolver,
				reject  : rejector
			};
		},
		Promise: Pledge
	});
});