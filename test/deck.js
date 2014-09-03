var assert = require('assert'),
    Blast;

describe('Deck', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new Deck()', function() {
		it('should return an empty deck', function() {
			var d = new Deck();

			assert.equal(0, d.insertCount);
		});
	});

	describe('#set(key, value, weight)', function() {
		it('should register the value with the given key and optional weight', function() {
			
			var d = new Deck();
			d.set('mykey', 47);

			assert.equal(47, d.get('mykey'));
		});
	});

	describe('#get(key)', function() {
		it('should return the value of the wanted key', function() {
			
			var d = new Deck();
			d.set('mykey', 47);

			assert.equal(47, d.get('mykey'));
		});
	});

	describe('#getById(key)', function() {
		it('should return the value of the wanted id', function() {
			
			var d = new Deck();
			d.set('mykey', 47);

			assert.equal(47, d.getById(0));
		});
	});

	describe('#getSorted()', function() {
		it('should return the sorted values by insert order when added without weight', function() {

			var d = new Deck();

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			assert.equal('a,b,c,d', d.getSorted().join(','));
		});

		it('should return the sorted values by weight', function() {

			var d = new Deck();

			d.push('c', 200);
			d.set('b', 'b', 300);
			d.push('d', 100);
			d.set('a', 'a', 400);

			assert.equal('a,b,c,d', d.getSorted().join(','));
		});
	});

	describe('#forEach(fnc)', function() {
		it('iterate over the sorted items with a function callback', function() {

			var d = new Deck(),
			    result = '';

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			d.forEach(function(val) {
				result += val;
			});

			assert.equal('abcd', result);
		});
	});

	describe('#some(fnc)', function() {
		it('iterate over the sorted items with a function callback, break on returned true', function() {

			var d = new Deck(),
			    result = '';

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			d.some(function(val) {
				result += val;

				if (result.length == 2) return true;
			});

			assert.equal('ab', result);
		});
	});

	describe('#every(fnc)', function() {
		it('iterate over the sorted items with a function callback, break on returned false', function() {

			var d = new Deck(),
			    result = '';

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			d.every(function(val) {
				result += val;

				if (result.length == 2) return false;
			});

			assert.equal('ab', result);
		});
	});

	describe('#createIterator()', function() {
		it('return an iterator', function() {

			var d = new Deck(),
			    iter;

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			iter = d.createIterator();

			assert.equal('Iterator', iter.constructor.name);
		});
	});

	describe('#createIteratorItems()', function() {
		it('return an iterator', function() {

			var d = new Deck(),
			    iter;

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			iter = d.createIteratorItems();

			assert.equal('Iterator', iter.constructor.name);
		});
	});

});