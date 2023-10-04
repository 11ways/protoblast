var assert = require('assert'),
    Blast;

describe('Deck', function() {

	var itDeck;

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new Deck()', function() {
		it('should return an empty deck', function() {
			var d = new Deck();

			assert.equal(d.insertCount, 0);
		});
	});

	describe('Deck.create()', function() {
		it('should return a new, empty deck', function() {
			var d = Deck.create();

			assert.equal(d.insertCount, 0);
		});
	});

	describe('#set(key, value, weight)', function() {
		it('should register the value with the given key and optional weight', function() {
			
			var d = new Deck();
			d.set('mykey', 47);

			assert.equal(d.get('mykey'), 47);

			assert.strictEqual(d.size, 1);
		});
	});

	describe('#has(key)', function() {
		it('should return true or false, depending on the key being present', function() {
			
			var d = new Deck();
			d.set('mykey', 47);
			d.set('undef', undefined);

			assert.equal(d.has('mykey'), true);
			assert.equal(d.has('undef'), true);
			assert.equal(d.has('madeup'), false);

			assert.strictEqual(d.size, 2);
		});
	});

	describe('#get(key)', function() {
		it('should return the value of the wanted key', function() {
			
			var d = new Deck();
			d.set('mykey', 47);

			assert.equal(d.get('mykey'), 47);
		});
	});

	describe('#get(key, defaultValue)', function() {
		it('should return the key\'s value if present, or set the defaultValue', function() {

			var d = new Deck();
			d.set('predef', 1);

			assert.equal(d.get('predef', 99), 1);
			assert.equal(d.get('nodef', 99), 99);
			assert.equal(d.get('nodef', 55), 99);
		});

		it('should execute defaultValue functions', function() {

			var d = new Deck();

			assert.equal(d.get('nodef', Object), ''+{});
		});
	});

	describe('#getById(key)', function() {
		it('should return the value of the wanted id', function() {

			var d = new Deck();
			d.set('mykey', 47);

			assert.equal(d.getById(0), 47);
		});
	});

	describe('#remove(key)', function() {
		it('should remove an entry', function() {

			var d = new Deck();
			d.set('a', 1);
			d.set('b', 2);
			d.set('c', 3);

			var c = 0;

			d.forEach(function eachEntry(value, key, index, item) {
				c++;
			});

			assert.strictEqual(c, 3);
			assert.strictEqual(d.size, 3);

			d.remove('b');

			c = 0;

			d.forEach(function eachEntry(value, key, index, item) {
				c++;
			});

			assert.strictEqual(c, 2);

			assert.strictEqual(d.has('b'), false);

			assert.strictEqual(d.size, 2);
		});
	});

	describe('#clear()', function() {
		it('should remove all entries', () => {

			let d = new Deck();
			d.set('a', 1);
			d.set('b', 2);

			assert.strictEqual(d.size, 2);

			d.set('c', 3);
			assert.strictEqual(d.size, 3);

			d.remove('a');
			assert.strictEqual(d.size, 2);

			d.clear();
			assert.strictEqual(d.size, 0);

			let value = d.get('a');

			assert.strictEqual(value, undefined);

		});
	});

	describe('#getSorted()', function() {
		it('should return the sorted values by insert order when added without weight', function() {

			var d = new Deck();

			d.set('a', 'a');
			d.set('b', 'b');
			d.push('c');
			d.push('d');

			assert.equal(d.getSorted().join(','), 'a,b,c,d');

			assert.strictEqual(d.size, 4);
		});

		it('should return the sorted values by weight', function() {

			var d = new Deck();

			d.push('c', 200);
			d.set('b', 'b', 300);
			d.push('d', 100);
			d.set('a', 'a', 400);

			assert.equal(d.getSorted().join(','), 'a,b,c,d');
			assert.strictEqual(d.size, 4);
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

			assert.equal(result, 'abcd');
			assert.strictEqual(d.size, 4);
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

			assert.equal(result, 'ab');
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

			assert.equal(result, 'ab');
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

			assert.equal(iter.constructor.name, 'Iterator');
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

			assert.equal(iter.constructor.name, 'Iterator');
		});
	});

	describe('#next() - Iterator protocol', function() {
		it('should return items upon each call, sorted by their weight', function() {

			itDeck = new Deck();

			itDeck.push('val1');
			itDeck.push('last', 0);
			itDeck.push('val2');
			itDeck.push('first', 500);

			assert.equal(itDeck.next().value, 'first');
			assert.equal(itDeck.next().value, 'val1');
			assert.equal(itDeck.next().value, 'val2');
			assert.equal(itDeck.next().value, 'last');
			assert.equal(itDeck.next().done, true);
		});
	});

	describe('#reset() - Iterator protocol', function() {
		it('should reset the iterator index', function() {

			itDeck.reset();

			assert.equal(itDeck.next().value, 'first');
			assert.equal(itDeck.next().value, 'val1');
			assert.equal(itDeck.next().value, 'val2');
			assert.equal(itDeck.next().value, 'last');
			assert.equal(itDeck.next().done, true);
		});
	});

	describe('#hasNext() - Iterator protocol', function() {
		it('should return true if there is a next item available', function() {

			itDeck.reset();

			assert.equal(itDeck.next().value, 'first');
			assert.equal(itDeck.hasNext(), true);
			assert.equal(itDeck.next().value, 'val1');
			assert.equal(itDeck.next().value, 'val2');
			assert.equal(itDeck.next().value, 'last');
			assert.equal(itDeck.hasNext(), false);
			assert.equal(itDeck.next().done, true);
		});
	});

	describe('#toDry() & .unDry()', function() {

		it('should be used when DRY-ing the object', function() {

			var d = new Deck(),
			    dry,
			    json,
			    undry;

			d.push('val1');
			d.push('first', 500);
			d.set('mykey', 'keyval');

			json = JSON.stringify(d);
			dry = JSON.dry(d);

			assert.equal(dry.length < json.length, true, 'Dry string is larger than regular JSON string');
			assert.equal(!!dry.length, true, 'Dry string is empty');

			undry = JSON.undry(dry);

			assert.equal(undry instanceof Deck, true);
			assert.equal(undry.get('mykey'), 'keyval');
			assert.equal(undry.insertCount, d.insertCount);
		});
	});

	describe('#clone()', function() {

		it('should clone the deck (but not the values)', function() {

			var temp,
			    clone,
			    ori = new Deck(),
			    i;

			ori.push('a', 10);
			ori.push('b', 9);
			ori.push('0', 900);

			temp = ori.getSorted();

			// Test sorting before (heavier values come first)
			assert.equal(temp.join(','), '0,a,b');

			// Clone the original deck
			clone = ori.clone();

			// Fuck with the original object's weight
			for (i = 0; i < ori.array.length; i++) {
				ori.array[i].weight = 10;
			}

			ori.sorted = ori.sortedItems = false;

			temp = ori.getSorted();

			// Everything has the same weight, so order should be insertion order
			assert.equal(temp.join(','), 'a,b,0');

			// Now get the sorted items of the clone
			temp = clone.getSorted();

			// Those should still be the original order
			assert.equal(temp.join(','), '0,a,b');
		});
	});
});