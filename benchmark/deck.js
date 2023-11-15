var Blast  = require('../index.js')();

suite('Deck', function() {

	var deck = new Deck(),
	    big  = new Deck(),
	    i;

	for (i = 0; i < 100; i++) {
		big.push('testval', Number.random(0,15))
	}

	bench('new Deck()', function() {
		new Deck()
	});

	bench('#set(key, value, weight)', function() {
		deck.set('mykey', 'value', 15);
	});

	bench('#get(key)', function() {
		deck.get('mykey');
	});

	bench('#getById(id)', function() {
		deck.getById(0);
	});

	bench('#getSorted() (1 value)', function() {
		deck.getSorted();
	});

	bench('#getSorted() (1 value, no cache)', function() {
		deck.getSorted();
		deck.sorted = deck.sortedItems = false;
	});

	bench('#getSorted() (100 values)', function() {
		big.getSorted();
	});

	bench('#getSorted() (100 values, no cache)', function() {
		big.getSorted();
		big.sorted = big.sortedItems = false;
	});

	bench('#getSortedItems() (100 values)', function() {
		big.getSortedItems();
	});

	bench('#getSortedItems() (100 values, no cache)', function() {
		big.getSortedItems();
		big.sorted = big.sortedItems = false;
	});

	bench('#forEach(fnc) (1 value)', function() {
		deck.forEach(function(){});
	});

	bench('#some(fnc) (1 value)', function() {
		deck.some(function(){});
	});

	bench('#every(fnc) (1 value)', function() {
		deck.every(function(){});
	});

	bench('#createIterator() (1 value)', function() {
		deck.createIterator();
	});

	bench('#createIterator() (100 values)', function() {
		big.createIterator();
	});
});

suite('Deck#push', function() {

	var deck;

	// beforeEach(function() {
	// 	deck = new Deck();
	// });

	bench('#push(value, weight)', function() {
		deck = new Deck();
		deck.push('value', 15);
	});
});