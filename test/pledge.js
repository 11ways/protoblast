var assert = require('assert'),
    Blast,
    Pledge;

describe('Pledge', function() {
	Blast  = require('../index.js')();
	Pledge = Blast.Classes.Pledge;
	this.timeout(5000);

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

	describe('.isPledge(variable)', function() {
		it('should return a boolean', function() {

			var pledge = new Pledge(),
			    lazy   = new Blast.Classes.LazyPledge();

			assert.strictEqual(Pledge.isPledge(pledge), true);
			assert.strictEqual(Pledge.isPledge(lazy), true);

			var promise = new Promise(function(resolve) {
				resolve(1);
			});

			assert.strictEqual(Pledge.isPledge(promise), false);
			assert.strictEqual(Pledge.isPledge(null), false);
			assert.strictEqual(Pledge.isPledge(false), false);
			assert.strictEqual(Pledge.isPledge(1), false);
		});
	});

	describe('.isThenable(variable)', function() {
		it('should see if the given object has a `then` function', function() {

			var pledge = new Pledge(),
			    lazy   = new Blast.Classes.LazyPledge();

			let promise = new Promise(function(resolve) {
				resolve(true);
			});

			let thennable = {
				then: function(fnc) {
					fnc(true)
				}
			};

			assert.strictEqual(Pledge.isThenable(pledge), true);
			assert.strictEqual(Pledge.isThenable(lazy), true);
			assert.strictEqual(Pledge.isThenable(promise), true);
			assert.strictEqual(Pledge.isThenable(thennable), true);

			let not_thennable = {
				then: true
			};

			assert.strictEqual(Pledge.isThenable(not_thennable), false);
			assert.strictEqual(Pledge.isThenable(true), false);
			assert.strictEqual(Pledge.isThenable({}), false);
			assert.strictEqual(Pledge.isThenable(null), false);
			assert.strictEqual(Pledge.isThenable(), false);
		});
	});

	describe('.hasPromiseInterface(variable)', function() {
		it('should see if the given object has a `then` & `catch` function', function() {

			var pledge = new Pledge(),
			    lazy   = new Blast.Classes.LazyPledge();

			let promise = new Promise(function(resolve) {
				resolve(true);
			});

			assert.strictEqual(Pledge.hasPromiseInterface(pledge), true);
			assert.strictEqual(Pledge.hasPromiseInterface(lazy), true);
			assert.strictEqual(Pledge.hasPromiseInterface(promise), true);

			let promise_interface = {
				then: function(fnc) {
					fnc(true);
				},
				catch: function(fnc) {
					fnc(null);
				}
			};

			assert.strictEqual(Pledge.hasPromiseInterface(promise_interface), true);

			let thennable = {
				then: function(fnc) {
					fnc(true)
				}
			};

			let not_thennable = {
				then: true
			};

			assert.strictEqual(Pledge.hasPromiseInterface(thennable), false);
			assert.strictEqual(Pledge.hasPromiseInterface(not_thennable), false);
			assert.strictEqual(Pledge.hasPromiseInterface(true), false);
			assert.strictEqual(Pledge.hasPromiseInterface({}), false);
			assert.strictEqual(Pledge.hasPromiseInterface(null), false);
			assert.strictEqual(Pledge.hasPromiseInterface(), false);
		});
	});

	describe('.done(thennable, callback)', function() {
		it('should call the callback when the thennable is done', function(done) {

			var promise = new Promise(function(resolve) {
				setTimeout(function() {
					resolve(47);
				}, 5);
			});

			Pledge.done(promise, function _done(err, result) {
				assert.strictEqual(err, null);
				assert.strictEqual(result, 47);
				done();
			});
		});

		it('should call the callback with an error', function(done) {

			let error = new Error('ERR');

			var promise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(error);
				}, 5);
			});

			Pledge.done(promise, function _done(err) {
				assert.strictEqual(err, error);
				done();
			});
		});
	});

	describe('.done(thennable, pledge)', function() {
		it('should resolve the given pledge', function(done) {

			let promise = new Promise(function(resolve) {
				setTimeout(function() {
					resolve(46);
				}, 5);
			});

			let pledge = new Pledge();

			Pledge.done(promise, pledge);

			pledge.then(function(result) {
				assert.strictEqual(result, 46);
				done();
			});
		});

		it('should also forward rejections', function(done) {

			let error = new Error('ERR');

			let promise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(error);
				}, 10);
			});

			let pledge = new Pledge();

			Pledge.done(promise, pledge);

			pledge.catch(function(err) {
				assert.strictEqual(err, error);
				done();
			});
		});
	});

	describe('.done(mixed, callback)', function() {
		it('should callback with the mixed value', function(done) {

			Pledge.done(47, function _done(err, result) {

				if (err) {
					return done(err);
				}

				assert.strictEqual(result, 47);
				done();
			});
		});
	});

	describe('.cast(variable)', function() {
		it('should cast the given promise to a pledge', function(done) {

			var pledge = new Pledge(),
			    lazy   = new Blast.Classes.LazyPledge();

			// These should just return the same variable
			assert.strictEqual(Pledge.cast(pledge), pledge);
			assert.strictEqual(Pledge.cast(lazy), lazy);

			var promise = new Promise(function(resolve) {
				resolve(1);
			});

			let casted = Pledge.cast(promise);

			assert.notStrictEqual(casted, promise);
			assert.strictEqual(Pledge.isPledge(casted), true);

			casted.then(function(value) {
				assert.strictEqual(value, 1);
				done();
			});
		});

		it('should simply resolve to regular values', function(done) {

			Blast.Bound.Function.parallel(function primitive(next) {

				let pledge = Pledge.cast('test');

				pledge.then(function(val) {
					assert.strictEqual(val, 'test');
					next();
				});

			}, function obj(next) {

				let obj = {},
				    pledge = Pledge.cast(obj);

				pledge.then(function(val) {
					assert.strictEqual(val, obj);
					next();
				});

			}, function(err) {

				if (err) {
					throw err;
				}

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

		it('should convert a non-promise to a promise', async function() {
			let x = await Pledge.all(['hello', Pledge.resolve('world')]);
			assert.deepEqual(x, ['hello', 'world']);
		});

		it('should do the tasks in order', async () => {
			pledgeAllTestOne(Pledge, true);
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
				strictEqualTimeSensitive(x, 'hello');
				done();
			});
		});

		it('should race one delayed and one resolved promise', function (done) {
			Pledge.race([new Promise(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 50);
			}), Pledge.resolve('world')]).then(function (x) {
				strictEqualTimeSensitive(x, 'world');
				done();
			});
		});

		it('should race one delayed and one rejected promise', function (done) {
			Pledge.race([new Pledge(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 50);
			}), Pledge.reject('bye')]).then(function () {}, function (x) {
				strictEqualTimeSensitive(x, 'bye');
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
				strictEqualTimeSensitive(x, 'world');

				race.then(function(x) {
					strictEqualTimeSensitive(x, 'world');
					done();
				});
			});
		});
	});

	describe('.after(n, value)', function () {
		it('create a pledge which resolves after n seconds', function (done) {
			var start = Date.now();

			Pledge.after(11, 'test').handleCallback(function _done(err, val) {

				var elapsed = Date.now() - start;

				if (err) {
					return done(err);
				}

				assert.strictEqual(val, 'test');

				// We check for 10ms, because node.js has a rounding issue regarding timers :/
				if (elapsed < 10) {
					return done(new Error('Callback should have executed after at least 10ms, but it has been only ' + elapsed + 'ms'));
				}

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

		it('should always call the callbacks asynchronously', function(done) {

			var pledge = new Pledge(),
			    one = false,
			    two = false;

			pledge.then(function(val) {
				one = val;

				pledge.then(function(val) {
					two = val;
				});

				assert.strictEqual(two, false, 'Second callback fired too early');

				setTimeout(function() {

					let pledge = Pledge.resolve('OK'),
					    three = false;

					pledge.then(function(val) {
						three = val;
					});

					assert.strictEqual(three, false, 'Third callback fired too early');

					setTimeout(done, 5);
				}, 5)
			});

			pledge.resolve('done');
			assert.strictEqual(one, false, 'First callback fired too early');
		});
	});

	describe('#getResolverFunction()', function() {
		it('should return a function that will resolve the original pledge', async () => {

			let pledge = new Pledge();
			let callback = pledge.getResolverFunction();

			callback(null, 22);

			let result = await pledge;

			assert.strictEqual(result, 22);
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

	describe('#cancel()', () => {
		it('should cancel the pledge and call `finally`', async () => {
			return pledgeCancelTestOne(Pledge);
		});

		it('should call the onCancel queued tasks first', async () => {
			return pledgeCancelTestTwo(Pledge);
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

				strictEqualTimeSensitive(val, 'early');
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

				strictEqualTimeSensitive(val, 'winner');
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

				strictEqualTimeSensitive(val, 'direct');
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

describe('LazyPledge', function() {

	Blast  = require('../index.js')();
	var LazyPledge = Blast.Classes.LazyPledge;
	this.timeout(800);

	describe('.constructor(executor)', function() {

		it('should pass a resolve & reject function to the executor', function(done) {
			var pledge = new LazyPledge(function myExecutor(resolve, reject) {
				assert.equal(typeof resolve, 'function');
				assert.equal(typeof reject, 'function');
				done();
			});

			pledge.then(function(){});
		});
	});

	describe('.then()', function() {
		it('should only call the executor once the `then` method has been called', function(done) {

			var resolved = null;

			var lazy = new LazyPledge(function task(resolve, reject) {
				resolved = true;
				resolve(47);
			});

			setTimeout(function() {

				assert.strictEqual(resolved, null, 'LazyPledge started before being called upon');

				lazy.then(function(value) {
					assert.strictEqual(value, 47);
					done();
				});
			}, 10);
		});
	});
});

describe('TimeoutPledge', function() {

	Blast  = require('../index.js')();
	const TimeoutPledge = Blast.Classes.TimeoutPledge;
	this.timeout(800);

	describe('.constructor(executor)', function() {

		it('should pass a resolve & reject function to the executor', function(done) {
			var pledge = new TimeoutPledge(function myExecutor(resolve, reject) {
				assert.equal(typeof resolve, 'function');
				assert.equal(typeof reject, 'function');
				resolve();
				done();
			}, 1000);

			pledge.then(function(){});
		});
	});

	describe('.reject()', function() {
		it('should automatically reject after a certain amount of time', function(done) {

			let timeout = new TimeoutPledge(function task(resolve, reject) {
				// Not resolving! Ha!
			}, 10);

			timeout.catch(err => {
				assert.strictEqual(!!err, true);
				done();
			});
		});
	});
});

describe('Swift', function() {

	describe('.all(tasks)', () => {
		it('should do the tasks immediately', async () => {
			pledgeAllTestOne(Pledge.Swift, false);
		});
	});

	describe('.cast(input)', () => {

		it('should convert a normal Pledge to a Swift pledge', async () => {

			let normal = new Pledge();
			normal.resolve(97);

			let nr = await normal;
			assert.strictEqual(nr, 97);

			let swift = Pledge.Swift.cast(normal);

			assert.strictEqual(swift instanceof Pledge.Swift, true);

			let sync_result;

			Pledge.Swift.done(swift, (err, res) => sync_result = res);
			assert.strictEqual(sync_result, 97);
		});
	});

	describe('.done(pledge)', () => {
		it('should synchronously call already resolved pledges', async () => {

			let pledge = new Pledge.Swift();
			pledge.resolve(47);

			let result;

			Pledge.Swift.done(pledge, (err, res) => result = res);

			assert.strictEqual(result, 47);
		});

		it('should synchronously call next with non-promise values', () => {
			let result;
			Pledge.Swift.done(47, (err, res) => result = res);
			assert.strictEqual(result, 47);
		});
	});

	describe('.execute(task)', async () => {

		it('should return the actual value if no async task was given', () => {
			assert.strictEqual(Pledge.Swift.execute(1), 1);

			let arr = [];
			assert.strictEqual(Pledge.Swift.execute(arr), arr);
		});

		it('should unroll swift pledges', async () => {

			let pledge = new Pledge.Swift();
			pledge.resolve(47);

			assert.strictEqual(Pledge.Swift.execute(pledge), 47);
		});
	});

	describe('.waterfall(...tasks)', async () => {
		it('should return the actual value if no async tasks were given', () => {
			let result = Pledge.Swift.waterfall(1, 2, 3);
			assert.strictEqual(result, 3);
		});

		it('should handle asynchronous tasks', async () => {

			let result = await Pledge.Swift.waterfall(
				47,
				val => {
					let pledge = new Pledge();

					setTimeout(() => {
						pledge.resolve(val - 5);
					}, 1);

					return pledge;
				}
			);

			assert.strictEqual(result, 42);
		});

		it('should always return errors using a pledge', async () => {

			let result = Pledge.Swift.waterfall(
				47,
				val => {
					throw new Error('Sync error!');
				}
			);

			assert.strictEqual(result instanceof Pledge, true);

			let error;

			try {
				await result;
			} catch (err) {
				error = err;
			}

			assert.strictEqual(error.message, 'Sync error!');

			result = Pledge.Swift.waterfall(
				47,
				val => {
					let pledge = new Pledge.Swift();
					pledge.reject(new Error('Sync rejection!'));
					return pledge;
				}
			);

			assert.strictEqual(result instanceof Pledge, true);

			try {
				await result;
			} catch (err) {
				error = err;
			}

			assert.strictEqual(error.message, 'Sync rejection!');

			result = Pledge.Swift.waterfall(
				47,
				val => {
					let pledge = new Pledge.Swift();
					setTimeout(() => pledge.reject(new Error('Async rejection!')), 1);
					return pledge;
				}
			);

			assert.strictEqual(result instanceof Pledge, true);

			try {
				await result;
			} catch (err) {
				error = err;
			}

			assert.strictEqual(error.message, 'Async rejection!');
		});
	});

	describe('#cancel()', () => {
		it('should cancel the pledge and call `finally`', async () => {
			return pledgeCancelTestOne(Pledge.Swift);
		});

		it('should call the onCancel queued tasks first', async () => {
			return pledgeCancelTestTwo(Pledge.Swift);
		});
	});
});

async function pledgeAllTestOne(constructor, do_wait = true) {

	let finished_one = false,
	    finished_two = false,
	    finished_three = false;

	let counter = 1;

	let tasks = [];
	tasks.push((next) => {
		finished_one = counter++;
	});

	tasks.push((next) => {
		finished_two = counter++;
	});

	tasks.push((next) => {
		finished_three = counter++;
	});

	constructor.all(tasks);

	if (do_wait) {
		await Pledge.after(3);
	}

	assert.strictEqual(finished_one, 1);
	assert.strictEqual(finished_two, 2);
	assert.strictEqual(finished_three, 3);
}

async function pledgeCancelTestOne(constructor) {

	let pledge = new constructor();
	let then_called = false,
		catch_called = false,
		finally_called = false;

	pledge.then(() => {
		then_called = true;
	});

	pledge.catch(() => {
		catch_called = true;
	});

	pledge.finally(() => {
		finally_called = true;
	});

	pledge.cancel();
	assert.strictEqual(pledge.isCancelled(), true);

	pledge.resolve(false);
	assert.strictEqual(pledge.isCancelled(), true);

	await Pledge.after(3);

	assert.strictEqual(then_called, false);
	assert.strictEqual(catch_called, false);
	assert.strictEqual(finally_called, true);
}

async function pledgeCancelTestTwo(constructor) {
	let pledge = new constructor();

	let then_called = false,
	    catch_called = false,
	    finally_called = false,
	    cancel_called = false,
	    cancel_two_called = false,
	    cancel_two_pledge = new Pledge.Swift(),
	    finally_pledge = new Pledge.Swift();

	let counter = 1;

	pledge.then(() => {
		then_called = counter++;
	});

	pledge.catch(() => {
		catch_called = counter++;
	});

	pledge.finally(() => {
		finally_called = counter++;
		finally_pledge.resolve();
	});

	pledge.onCancelled(() => {
		cancel_called = counter++;
	});

	pledge.onCancelled(async () => {
		cancel_two_called = counter++;
		cancel_two_pledge.resolve();
	});

	pledge.cancel();
	assert.strictEqual(pledge.isCancelled(), true);

	pledge.resolve(false);
	assert.strictEqual(pledge.isCancelled(), true);

	assert.strictEqual(then_called, false);
	assert.strictEqual(catch_called, false);
	assert.strictEqual(cancel_called, 1);

	await cancel_two_pledge;
	assert.strictEqual(cancel_two_called, 2);

	await finally_pledge;
	assert.strictEqual(finally_called, 3);

	let final_finally = false,
	    final_pledge = new Pledge.Swift();

	pledge.finally(() => {
		final_finally = counter++;
		final_pledge.resolve();
	});

	await final_pledge;

	assert.strictEqual(final_finally, 4);
}