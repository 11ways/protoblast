var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Deck', function() {

	describe('new Iterator()', function() {
		it('should return a new iterator', function() {

			var arr = [],
			    iter = new Iterator(arr);

			assert.equal(0, iter.nextIndex);
		});
	});

	describe('hasNext()', function() {
		it('should see if there is a next item', function() {

			var arr = ['a', 'b', 'c'],
			    iter = new Iterator(arr),
			    test = '';

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
});