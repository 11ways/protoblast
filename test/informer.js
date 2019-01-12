var assert = require('assert'),
    Blast;

describe('Informer', function() {

	var tester,
	    removeCount,
	    counter,
	    extra,
	    anon,
	    demo;

	before(function() {
		Blast  = require('../index.js')();
		tester = new Informer();
		removeCount = 0;
		counter = 0;
		extra = 0;
		anon = 0;
		demo = 0;
	});

	describe('new Informer()', function() {
		it('should return a new informer', function() {
			assert.equal(0, tester.filterSeen.length);
		});

		it('should emit an event when new listeners are added', function(done) {

			var test = new Informer();

			test.on('newListener', function(type) {
				assert.equal('test', type);
				done();
			});

			test.on('test', function(){});
		});
	});

	describe('.isInformer(obj)', function() {
		it('should return true for pure informers', function() {
			assert.equal(Informer.isInformer(tester), true);
		});

		it('should return true for children', function() {
			var q = new Blast.Classes.FunctionQueue();
			assert.equal(Informer.isInformer(q), true);
		});

		it('should return false for regular objects', function() {
			assert.equal(Informer.isInformer({}), false);
			assert.equal(Informer.isInformer(null), false);
			assert.equal(Informer.isInformer(1), false);
		});

		it('should return true for multiple inheritance', function() {
			var Test = Function.inherits(['Array', 'Informer'], function MInformerTest() {});
			var b = new Test();

			assert.equal(Informer.isInformer(b), true);

			// Should this ever become true,
			// something probably has gone wrong with the inheritance
			assert.equal(b instanceof Informer, false);
		});
	});

	describe('.setAfterMethod(filter, key, method)', function() {

		var instance,
		    MyClass;

		it('should set the given method on the class', function() {

			var fnc;

			// Create the test class
			MyClass = Function.inherits('Informer', function MyAfterTestClass() {});

			// Add the method
			fnc = MyClass.setAfterMethod('ready', function someMethodName(a, b, c) {});

			assert.equal(fnc.length, 3);
			assert.equal(fnc.name, 'someMethodName');
		});

		it('should wait execution until the event has been seen', function(next) {

			var result;

			MyClass.setAfterMethod('ready', function secondMethod(a) {
				result = a;
			});

			instance = new MyClass();

			instance.secondMethod('shouldRunAfterReady');

			// Result should still be undefined!
			assert.equal(result, undefined, 'Method set using `setAfterMethod` ran before the event was fired');

			setTimeout(function doEmitting() {

				// Result should still be undefined!
				assert.equal(result, undefined, 'Method set using `setAfterMethod` ran before the event was fired');

				// Emit the event
				instance.emit('ready');

				// Result should now be set!
				assert.equal(result, 'shouldRunAfterReady', 'Method set using `setAfterMethod` did not run after event was fired');

				next();
			}, 10);
		});

		it('should also be able to use filter objects', function(next) {

			var result;

			MyClass.setAfterMethod({a: 'x'}, function thirdMethod(a) {
				result = a;
			});

			instance = new MyClass();

			instance.thirdMethod('shouldRunAfterFilter');

			// Result should still be undefined!
			assert.equal(result, undefined, 'Method set using `setAfterMethod` ran before the event was fired');

			setTimeout(function doEmitting() {

				// Result should still be undefined!
				assert.equal(result, undefined, 'Method set using `setAfterMethod` ran before the event was fired');

				// Emit the event
				instance.emit({a: 'x', b: 'y'});

				// Result should now be set!
				assert.equal(result, 'shouldRunAfterFilter', 'Method set using `setAfterMethod` did not run after filter event was fired');

				next();
			}, 10);
		});

		it('should set methods that return pledges', function(next) {

			var pledge_result,
			    result,
			    pledge;

			MyClass.setAfterMethod('ready', function pledgeMethod(a) {
				result = a;
				return a;
			});

			instance = new MyClass();

			pledge = instance.pledgeMethod('done');

			pledge.then(function gotValue(a) {
				pledge_result = a;
			});

			assert.equal(Blast.Classes.Pledge.isPledge(pledge), true, 'Method did not return a pledge');

			// Result should still be undefined!
			assert.equal(result, undefined, 'Method set using `setAfterMethod` ran before the event was fired');

			setTimeout(function doEmitting() {

				// Result should still be undefined!
				assert.equal(result, undefined, 'Method set using `setAfterMethod` ran before the event was fired');

				// Emit the event
				instance.emit('ready');

				setTimeout(function() {
					// Result should now be set!
					assert.equal(result, 'done', 'Method set using `setAfterMethod` did not run after filter event was fired');
					assert.equal(pledge_result, 'done', 'Pledge did not fire then');

					next();
				}, 5);
			}, 5);
		});
	});

	describe('#addListener(type, listener)', function() {

		it('should have an alias named `on`', function() {
			assert.equal(Informer.prototype.addListener, Informer.prototype.on);
		});

		it('should throw an error if the listener is not a function', function() {

			var caught = 0;

			try {
				tester.addListener('nofnc', {});
			} catch (err) {
				caught++;
			}

			assert.equal(1, caught, 'No error was thrown');
		});
	});

	describe('#addListener("typeName", listener)', function() {

		it('should store simple listeners', function() {
			tester.addListener('simple', function(){
				counter++;
			});

			assert.equal(1, tester.simpleListeners.simple.length);
		});
	});

	describe('#addListener({}, listener)', function() {

		before(function() {
			tester.addListener('demo', function(){counter++});
		});

		it('should store filter listeners', function() {

			tester.addListener({type: 'demo', extra: 'extra'}, function() {
				counter++;
				extra++;
				demo++;
			});

			assert.equal(1, tester.filterListeners.demo.length);
		});

		it('should store filter listeners with nameless types', function() {
			tester.addListener({extra: 'extra'}, function() {
				counter++;
				extra++;
			});

			assert.equal(1, tester.filterListeners[''].length);
		});
	});

	describe('#addListener("type", listener) - asynchronous', function() {

		it('should perform the listeners in serie', function(done) {
			var aTest = new Blast.Classes.Informer(),
			    val = 0;

			aTest.on('test', function t1() {

				var next = this.wait('series'),
				    curval = val; // Get the value as it is now (should be 0)

				Blast.setImmediate(function() {
					val = curval + 1;
					next();
				});
			});

			aTest.on('test', function t2() {

				var next = this.wait('series'),
				    curval = val; // Get the value as it is now (should run after t1 is done, so is 1)

				Blast.setImmediate(function() {
					val = curval + 1;
					next();
				});
			});

			aTest.emit('test', function() {
				assert.equal(val, 2);
				done();
			});
		});
	});

	describe('#addListener("type", listener) -- stop propagation', function() {

		it('should stop propagation', function() {

			var aTest = new Blast.Classes.Informer(),
			    val = 0;

			aTest.on('test', function t1() {

				// Increment the value
				val++;

				// Stop propagation
				this.stop();
			});

			// Add some other listeners
			aTest.on('test', function shouldnotrun() {
				// Increment value
				val++;
			});

			// Add some other listeners
			aTest.on('test', function shouldnotruneither() {
				// Increment value
				val++;
			});

			aTest.emit('test');
			assert.equal(1, val);

			aTest.emit('test');
			assert.equal(2, val);
		});
	});

	describe('#addListener("typeName", listener, context)', function() {

		it('should fire the listener with the given context', function() {

			var aTest = new Blast.Classes.Informer(),
			    context = {othercontext: true};

			aTest.on('test', function() {
				assert.equal(true, this.othercontext);
			}, context);
		});
	});

	/**
	 * Emitting data
	 */
	describe('#emit("simple", data, ...)', function() {
		it('should execute the simple listeners synchronously', function() {
			tester.emit('simple');
			assert.equal(1, counter);
		});

		// With this we mean: no filter listeners with more filters thant just "type"
		it('should not execute any filter listener', function() {
			tester.addListener({type: 'simple', extra: '1'}, function(){counter++});

			// Should execute the simple listener from the first test,
			// and not the new one!
			tester.emit('simple');

			assert.equal(2, counter);
		});

		it('should pass the arguments to the listener', function() {

			var argcount;

			tester.addListener('argcount', function() {
				argcount = arguments.length;
			});

			tester.emit('argcount', 'one');
			assert.equal(1, argcount);

			tester.emit('argcount', 'one', 'two');
			assert.equal(2, argcount);

			tester.emit('argcount', 'one', 'two', 'three');
			assert.equal(3, argcount);

			tester.emit('argcount', 'one', 'two', 'three', 'four');
			assert.equal(4, argcount);
		});

		it('should augment the Informer context with event type name', function() {

			var foundType;

			tester.addListener('croatoan', function() {
				foundType = this.type;
			});

			tester.emit('croatoan');
			assert.equal('croatoan', foundType);
		});

		it('should throw en error if the event being emitted is an error, and no error listener is present', function() {

			var caught = 0;

			try {
				tester.emit('error', new Error());
			} catch (err) {
				caught++;
			}

			assert.equal(1, caught, 'Error was not thrown');
		});

		it('should store the event even if there are no listeners', function() {

			var emitter = new Informer();

			emitter.emit('bla', 1);

			assert.strictEqual(emitter.hasBeenSeen('bla'), true);
		});
	});

	describe('#emit({...}, data, ...)', function() {

		it('should also execute simple listeners that match its "type"', function()  {

			var simpleDemo = 0,
			    foundTypeName,
			    foundTypeObj;

			tester.addListener('demo', function() {
				foundTypeName = this.type;
				foundTypeObj = this.filter;
				simpleDemo++;
			});

			// Counter should still be 2
			assert.equal(2, counter, '`counter` should still be 2, but was ' + counter);

			// emit demo type
			tester.emit({type: 'demo', extra: 1});

			// Even now, counter should still be 2
			assert.equal(3, counter, '`counter` should 3, because of listener set in `before`, but was ' + counter);
			assert.equal(1, simpleDemo, '`simpleDemo` should 1, because of listener we just set, but was ' + simpleDemo);

			assert.equal('demo', foundTypeName, 'Context type name should be "demo", was "' + foundTypeName + '"');
			assert.equal(1, foundTypeObj.extra, 'Context filter is not correct');
		});

		it('should execute the filter listeners synchronously', function() {

			// This should increase the counter by 3,
			// as this matches 3 listeners 
			tester.emit({type: 'demo', extra: 'extra'});

			assert.equal(6, counter, '`counter` should 6, but was ' + counter);
			assert.equal(2, extra, '`extra` should be 2, but was ' + extra);
			assert.equal(1, demo, '`demo` should be 1, but was ' + demo);
		});
	});

	describe('#removeListener(type, fnc)', function() {

		var fncOne = function one(){rCount++},
		    fncTwo = function two() {rCount++},
		    fncThree = function three() {check++},
		    sType  = 'simpleType',
		    fType  = {type: 'fType', extra: 'extra'},
		    rCount = 0,
		    check = 0;

		before(function() {
			tester.on('removeListener', function() {
				removeCount++;
			});
		});

		it('should throw an error if the listener is not a function', function() {

			var caught = 0;

			try {
				tester.removeListener('nofnc', {});
			} catch (err) {
				caught++;
			}

			assert.equal(1, caught, 'No error was thrown');
		});

		it('should remove the listener listening to the simple string type', function() {

			// Add the listener
			tester.on(sType, fncOne);
			tester.on(sType, fncThree);

			// Emit it once
			tester.emit(sType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');
			assert.equal(1, check, 'The function appears to not be listening at all');

			// Remove another listener
			tester.removeListener(sType, fncTwo);

			// Emit sType again, counter should increase
			tester.emit(sType);

			assert.equal(2, rCount, 'The wrong function appears to have been removed');
			assert.equal(2, check, 'The wrong function appears to have been removed');

			// Now remove the listener
			tester.removeListener(sType, fncOne);

			// Emit it again, it should remain 1
			tester.emit(sType);

			assert.equal(2, rCount, 'The listener function fired after it should have been removed');
			assert.equal(3, check, 'Another function was wrongfully removed');
		});

		it('should emit the "removeListener" event', function() {
			assert.equal(removeCount > 0, true, 'removeListener never fired');
		});

		it('should remove the listener listening to a filter (same object)', function() {

			// Reset the rCount
			rCount = 0;

			// Add the listener
			tester.on(fType, fncTwo);
			tester.on(fType, fncThree);

			// Emit it once
			tester.emit(fType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');
			assert.equal(4, check, 'The extra function appears to not be listening at all');

			// Remove another listener
			tester.removeListener(fType, fncOne);

			// Emit fType again, counter should increase
			tester.emit(fType);

			assert.equal(2, rCount, 'The wrong function appears to have been removed');
			assert.equal(5, check, 'The wrong function appears to have been removed');

			// Now remove the listener
			tester.removeListener(fType, fncTwo);

			// Emit it again, it should remain 1
			tester.emit(fType);

			assert.equal(2, rCount, 'The listener function fired after it should have been removed');
			assert.equal(6, check, 'Another function was wrongfully removed');
		});

		it('should remove the listener listening to a filter (alike object)', function() {

			// Reset the rCount
			rCount = 0;

			// Add the listener
			tester.on(fType, fncTwo);

			// Emit it once
			tester.emit({type: 'fType', extra: 'extra'});

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Remove another listener
			tester.removeListener({type: 'fType', extra: 'extra'}, fncOne);

			// Emit fType again, counter should increase
			tester.emit({type: 'fType', extra: 'extra'});

			assert.equal(2, rCount, 'The wrong function appears to have been removed');

			// Now remove the listener
			tester.removeListener({type: 'fType', extra: 'extra'}, fncTwo);

			// Emit it again, it should remain 1
			tester.emit({type: 'fType', extra: 'extra'});

			assert.equal(2, rCount, 'The listener function fired after it should have been removed');
		});
	});

	describe('#removeAllListeners(type)', function() {

		var fncOne = function one(){rCount++},
		    fncTwo = function two() {rCount++},
		    fncThree = function three() {check++},
		    sType  = 'simpleType',
		    fType  = {type: 'fType', extra: 'extra'},
		    rCount = 0,
		    check = 0;

		before(function() {
			removeCount = 0;
		});

		it('should remove all the listeners listening to the simple string type', function() {

			// Add the listener
			tester.on(sType, fncOne);
			tester.on(sType, fncTwo);
			tester.on(sType, fncThree);

			// Emit it once
			tester.emit(sType);

			// Make sure it is listening
			assert.equal(2, rCount, 'The function appears to not be listening at all');
			assert.equal(1, check, 'The function appears to not be listening at all');

			// Remove another listener
			tester.removeAllListeners(sType);

			// Emit sType again, nothing should increase
			tester.emit(sType);

			assert.equal(2, rCount, 'The listener function fired after it should have been removed');
			assert.equal(1, check, 'The listener function fired after it should have been removed');
		});

		it('should emit the "removeListener" event', function() {
			assert.equal(removeCount > 0, true, 'removeListener never fired');
		});

		it('should remove all the listeners listening to the filter', function() {

			// Reset the counters
			rCount = 0;
			check = 0;

			// Add the listener
			tester.on(fType, fncOne);
			tester.on(fType, fncTwo);
			tester.on(fType, fncThree);

			// Emit it once
			tester.emit(fType);

			// Make sure it is listening
			assert.equal(2, rCount, 'The function appears to not be listening at all');
			assert.equal(1, check, 'The function appears to not be listening at all');

			// Remove another listener
			tester.removeAllListeners(fType);

			// Emit fType again, nothing should increase
			tester.emit(fType);

			assert.equal(2, rCount, 'The listener function fired after it should have been removed');
			assert.equal(1, check, 'The listener function fired after it should have been removed');
		});

		it('should remove all listeners of the type name (even objects), when the type to remove is a string', function() {

			var typeName = 'commonType',
			    fType = {type: typeName, extra: 'extra'};

			// Reset the counters
			rCount = 0;
			check = 0;

			// Add the listener
			tester.on(typeName, fncOne);
			tester.on(fType, fncOne);
			tester.on(fType, fncTwo);
			tester.on(fType, fncThree);

			// Emit it once
			tester.emit(fType);
			tester.emit(typeName);

			// Make sure it is listening
			assert.equal(4, rCount, 'The function appears to not be listening at all (' + rCount + ')');
			assert.equal(1, check, 'The function appears to not be listening at all');

			// Remove another listener
			tester.removeAllListeners(typeName);

			// Emit fType again, nothing should increase
			tester.emit(fType);
			tester.emit(typeName);

			assert.equal(4, rCount, 'The listener function fired after it should have been removed');
			assert.equal(1, check, 'The listener function fired after it should have been removed');
		});

	});

	describe('#many("type", times, fnc)', function() {

		var fncOne = function one(){rCount++},
		    sType  = 'simpleTypeMany',
		    rCount = 0;

		it('should listen only once when no times has been given', function() {

			tester.many(sType, fncOne);
			tester.emit(sType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Fire it again, it should have been removed by now!
			tester.emit(sType);

			assert.equal(1, rCount, 'The listener function fired after it should have been removed');
		});

		it('should listen the supplied amount of times', function() {

			// Reset the counter
			rCount = 0;

			tester.many(sType, 3, fncOne);

			tester.emit(sType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Fire it again, it should have been removed by now!
			tester.emit(sType);
			tester.emit(sType);

			assert.equal(3, rCount, 'The listener function was removed too soon');

			// Emit it once more, it should already be gone
			tester.emit(sType);
			assert.equal(3, rCount, 'The listener function fired after it should have been removed');
		});

		it('should be able to be removed before it has run x amount of times', function() {

			// Reset the counter
			rCount = 0;

			tester.many(sType, 5, fncOne);

			tester.emit(sType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Fire it again, it should have been removed by now!
			tester.emit(sType);
			tester.emit(sType);

			assert.equal(3, rCount, 'The listener function was removed too soon');

			tester.removeListener(sType, fncOne);

			// Emit it once more, it should already be gone
			tester.emit(sType);
			assert.equal(3, rCount, 'The listener function fired after it should have been removed');
		});
	});

	describe('#many({...}, times, fnc)', function() {

		var fncOne = function one(){rCount++},
		    fType  = {type: 'fTypeMany', extra: 'extra'},
		    rCount = 0;

		it('should throw an error if the listener is not a function', function() {

			var caught = 0;

			try {
				tester.many('nofnc', {});
			} catch (err) {
				caught++;
			}

			assert.equal(1, caught, 'No error was thrown');
		});

		it('should listen only once when no times has been given', function() {

			tester.many(fType, fncOne);
			tester.emit(fType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Fire it again, it should have been removed by now!
			tester.emit(fType);

			assert.equal(1, rCount, 'The listener function fired after it should have been removed');
		});

		it('should listen the supplied amount of times', function() {

			// Reset the counter
			rCount = 0;

			tester.many(fType, 3, fncOne);

			tester.emit(fType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Fire it again, it should have been removed by now!
			tester.emit(fType);
			tester.emit(fType);

			assert.equal(3, rCount, 'The listener function was removed too soon');

			// Emit it once more, it should already be gone
			tester.emit(fType);
			assert.equal(3, rCount, 'The listener function fired after it should have been removed');
		});

		it('should be able to be removed before it has run x amount of times', function() {

			// Reset the counter
			rCount = 0;

			tester.many(fType, 5, fncOne);

			tester.emit(fType);

			// Make sure it is listening
			assert.equal(1, rCount, 'The function appears to not be listening at all');

			// Fire it again, it should have been removed by now!
			tester.emit(fType);
			tester.emit(fType);

			assert.equal(3, rCount, 'The listener function was removed too soon');

			tester.removeListener(fType, fncOne);

			// Emit it once more, it should already be gone
			tester.emit(fType);
			assert.equal(3, rCount, 'The listener function fired after it should have been removed');
		});
	});

	describe('#after(type, listener)', function() {

		it('should fire after being attached if an event has been emitted in the past', function() {

			var afterCount = 0,
			    wasPast = false;

			tester.emit('pastEvent', "test");
			tester.after('pastEvent', function() {
				afterCount++;
				wasPast = this.past;
			});

			assert.equal(1, afterCount, 'Listener did not fire for past event');
			assert.equal(true, wasPast, 'Context did not indicate it came from the past');

			tester.emit('pastEvent', "test");

			assert.equal(2, afterCount, 'Listener did not fire for new event');
			assert.equal(false, !!wasPast, 'Context indicated it came from the past, but it did not');
		});

		it('should throw an error when the listener is not a function', function() {

			var error;

			try {
				tester.after('nofunction', 1, null)
			} catch(err) {
				error = err;
			}

			assert.equal(true, !!error);
		});

		it('should wait if the event has not been seen yet', function(done) {

			var a = 0;

			tester.after('futureEvent', function() {
				assert.equal(0, a);
				done();
			});

			a = 10;

			setTimeout(function() {
				a = 0;
				tester.emit('futureEvent');
			}, 10);
		});

		it('should also work with filter objects', function(done) {

			var a = 0,
			    finished = false;

			tester.after({type:'afterObject', future: 'a'}, function(type) {
				assert.equal(0, a);

				if (finished) {
					return done();
				}

				finished = true;
			});

			a = 10;

			setTimeout(function() {
				a = 0;
				tester.emit({type: 'afterObject', future: 'a'});

				tester.after({type: 'afterObject'}, function() {

					if (finished) {
						return done();
					}

					finished = true;
				});
			}, 10);
		});
	});

	describe('#afterOnce(type, listener)', function() {

		it('should fire after being attached if an event has been emitted in the past', function() {

			var afterCount = 0,
			    wasPast = false;

			tester.emit('pastEvent', "test");
			tester.afterOnce('pastEvent', function() {
				afterCount++;
				wasPast = this.past;
			});

			assert.equal(1, afterCount, 'Listener did not fire for past event');
			assert.equal(true, wasPast, 'Context did not indicate it came from the past');

			tester.emit('pastEvent', "test");

			assert.equal(1, afterCount, 'Listener fired even though it should have been removed');
		});
	});

	describe('#listeners(type)', function() {

		var sType  = 'listenTest',
		    fType  = {type: 'listenTest', expanded: 'expanded'},
		    rCount = 0;

		it('should return all functions listening to the given type', function() {

			tester.on(sType, function(){});
			tester.on(fType, function(){});

			assert.equal(tester.listeners(fType).length, 2, 'Should only have 2 listeners');
			assert.equal(tester.listeners(sType).length, 1, 'Should only have 1 listener');
		});

		it('should mess with the seen entries', function() {

			var tester = new Informer();

			tester.on('test', function() {});

			assert.equal(tester.listeners('test').length, 1);
			assert.equal(tester.hasBeenSeen('test'), false);
		});
	});

	describe('#unsee(type)', function() {

		it('should unsee the given string type', function() {
			var tester = new Informer();

			tester.emit('test', 'alpha');

			assert.equal(tester.hasBeenSeen('test'), true);

			tester.unsee('test');

			assert.equal(tester.hasBeenSeen('test'), false);
		});

		it('should unsee the filter type', function() {
			var tester = new Informer();

			tester.emit({
				type  : 'test',
				extra : 'extra'
			}, 'alpha');

			assert.equal(tester.hasBeenSeen('test'), true);
			assert.equal(tester.hasBeenSeen({extra: 'extra'}), true);

			tester.unsee({extra: 'test'});
			assert.equal(tester.hasBeenSeen({extra: 'extra'}), true);

			tester.unsee({extra: 'extra'});
			assert.equal(tester.hasBeenSeen({extra: 'extra'}), false);

			tester.emit({
				type  : 'test',
				extra : 'extra'
			}, 'alpha');

			// A simple string unsee should also remove from the filterseen
			tester.unsee('test');
			assert.equal(tester.hasBeenSeen({extra: 'extra'}), false);
		});
	});

	describe('#emitOnce(type, data)', function() {
		it('should emit the event only once', function() {
			var tester = new Informer(),
			    result = 0;

			tester.on('test', function onTest() {
				result++;
			});

			tester.emitOnce('test');
			assert.equal(result, 1);

			tester.emitOnce('test');
			assert.equal(result, 1);
		});

		it('should emit it again after it has been unseen', function() {

			var tester = new Informer(),
			    result = 0;

			tester.on('test', function onTest() {
				result++;
			});

			tester.emitOnce('test');
			assert.equal(result, 1);

			tester.emitOnce('test');
			assert.equal(result, 1);

			tester.unsee('test');

			tester.emitOnce('test');
			assert.equal(result, 2);

			tester.emitOnce('test');
			assert.equal(result, 2);
		});
	});

	describe('#forwardEvent(type, target, context)', function() {
		it('should forward the single event to another informer', function(done) {

			var source = new Informer(),
			    target = new Informer();

			target.on('alpha', function() {
				done();
			});

			target.on('beta', function() {
				done(new Error('Wrong event type has been forwarded'));
			});

			source.forwardEvent('alpha', target);
			source.emit('alpha')
		});

		// @TODO: still need to figure out if this should be a default or not
		it.skip('should also forward `unsee` calls', function() {

			var source = new Informer(),
			    target = new Informer();

			source.forwardEvent('alpha', target);
			source.emit('alpha');

			assert.strictEqual(target.hasBeenSeen('alpha'), true);

			source.unsee('alpha');

			assert.strictEqual(source.hasBeenSeen('alpha'), false, 'Original event was not unseen');
			assert.strictEqual(target.hasBeenSeen('alpha'), false, 'Unsee call was not forwarded');

		});
	});

	describe('#forwardEvent(target)', function() {
		it('should forward all events', function(done) {

			var count  = 0,
			    source = new Informer(),
			    target = new Informer();

			target.on('one', function() {
				count++;
			});

			target.on('two', function() {
				count++;
			});

			target.on('three', function() {
				count++;

				if (count == 3) {
					done();
				} else {
					done(new Error('Not all events fired'));
				}
			});

			source.forwardEvent(target);

			source.emit('one');
			source.emit('two');
			source.emit('three');
		});
	});
});