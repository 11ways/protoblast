var assert = require('assert'),
    Blast;

describe('Iterator', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new Iterator()', function() {
		it('should return a new iterator', function() {

			var arr = [],
			    iter = new Iterator(arr);

			assert.equal(0, iter._iterNextIndex);
		});
	});

	describe('hasNext()', function() {
		it('should see if there is a next item', function() {

			var arr = ['a', 'b', 'c'],
			    iter = new Iterator(arr);

			assert.equal(true, iter.hasNext());
		});
	});

	describe('next()', function() {
		it('should return the next item', function() {

			var arr = ['a', 'b', 'c'],
			    iter = new Iterator(arr),
			    test = '';

			while(iter.hasNext()) {
				test += iter.next().value;
			}

			assert.equal('abc', test);
		});

		it('should also work on objects', function() {

			var obj = {a: 'x', b: 'y', c: 'z'},
			    iter = new Iterator(obj),
			    test = '';

			while(iter.hasNext()) {
				test += iter.next().value;
			}

			assert.equal('xyz', test);
		});
	});

	describe('reset()', function() {
		it('should move the iterator to the beginning', function() {

			var arr = ['a', 'b'],
			    iter = new Iterator(arr),
			    test = '';

			// Move to the end
			iter.next();
			iter.next();

			assert.equal(false, iter.hasNext());

			// Reset, move to the beginning
			iter.reset();

			assert.equal(true, iter.hasNext());
		});
	});
});