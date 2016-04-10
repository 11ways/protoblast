var assert = require('assert'),
    Blast;

describe('FunctionQueue', function() {

	var queue,
	    result = '',
	    timer_start,
	    timer_end;

	before(function() {
		Blast = require('../index.js')();

		queue = new FunctionQueue();

		// Limit to 1 function at a time
		queue.limit = 1;
	});

	describe('new FunctionQueue()', function() {
		it('should return a new FunctionQueue instance', function() {
			assert.equal(true, (new FunctionQueue) instanceof FunctionQueue);
		});
	});

	describe('#setContext(ctx)', function() {
		it('should set the context the tasks fun in', function(done) {

			var q = new FunctionQueue(),
			    ctx = {a: 'hello'};

			q.setContext(ctx);

			q.add(function task() {
				assert.equal(this.a, ctx.a);
				done();
			});

			q.start();
		});
	});

	describe('#add(task)', function() {
		it('should add the tasks to the queue', function() {
			queue.add(function taskone(next) {

				// First task starts the timer
				timer_start = Date.now();

				setTimeout(function() {
					result += '1';
					next();
				}, 20);
			});

			queue.add(function tasktwo(next) {
				setTimeout(function() {
					result += '2';
					next();
				}, 10);
			});

			queue.add(function taskthree(next) {
				setTimeout(function() {
					result += '3';

					// Last task stops the timer
					timer_end = Date.now();

					next();
				}, 20);
			});
		});

		it('should not add the task if the id has already been seen', function(done) {
			var q = new FunctionQueue(),
			    result = '';

			q.add(function task(next) {
				result += '1';
				next();
			}, null, {id: 'a'});

			q.add(function task(next) {
				result += '1';
				next();
			}, null, {id: 'a'});

			q.add(function tasktwo(next) {
				result += '2';
				next();

				assert.equal(result, '12');
				done();
			}, null, {id: 'b'});

			q.start();
		});
	});

	describe('#start()', function() {
		it('should start the queued tasks', function(done) {

			// Add one more task
			queue.add(function lasttask(next) {

				var total = timer_end - timer_start;

				assert.equal('123', result, 'Tasks did not run in order');
				assert.equal(true, total > 49, 'Tasks ended too early, not limited?');
				done();
			});

			queue.start();
		});

		it('should start the queued tasks as soon as the start function calls back', function(done) {
			var q = new FunctionQueue(),
			    result = '';

			q.add(function(next) {
				result += '1';
				next();
				done();
			});

			q.start(function(next) {
				setTimeout(function() {
					assert.equal(result, '', 'The added tasks should not run before the start function calls back');
					next();
				}, 5);
			});
		});

		it('should sort the queue if needed', function(done) {
			var q = new FunctionQueue({sort: true}),
			    result = '';

			q.add(function(next) {
				result += 'c';
				next();
			}, null, {weight: 10});

			q.add(function(next) {
				result += 'a';
				next();
			}, null, {weight: 999});

			q.add(function(next) {
				result += 'b';
				next();
			}, null, {weight: 50});

			q.add(function(next) {
				assert.equal(result, 'abc', 'The queue was not sorted');
				next();
				done();
			}, null, {weight: -10});

			q.start();
		});
	});

	describe('#destroy()', function() {
		it('should stop the queue and not start anything new', function() {

			var result = '';

			// Destroy the queue
			queue.destroy();

			// Try adding a new tasks
			queue.add(function() {
				result += 'test';
			});

			// Destroying multiple times shouldn't do anything special
			queue.destroy();

			// Pausing after it was destroyed also does nothing
			queue.pause();

			// Starting it again after it has been destroyed also should do nothing
			queue.start();

			assert.equal(result, '');
		});
	});
});