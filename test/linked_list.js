let assert = require('assert'),
    Blast;

const ALPHA = Symbol('alpha'),
      BETA = Symbol('beta'),
      DELTA = Symbol('delta'),
      GAMMA = Symbol('gamma'),
      EPSILON = Symbol('epsilon'),
      ZETA = Symbol('zeta'),
      ETA = Symbol('eta');

describe('LinkedList', function() {

	before(() => {
		Blast = require('../index.js')();
	});

	describe('#push(element)', () => {
		it('should push an element', () => {

			let arr = new Blast.Classes.Develry.LinkedList();

			arr.push(1);
			arr.push(2);
			arr.push(3);

			equals(arr.size, 3);
		});
	});

	describe('#at(index)', () => {

		it('should get the element at the given index', () => {

			let arr = new Blast.Classes.Develry.LinkedList();

			arr.push(1);
			arr.push(2);
			arr.push(3);

			equals(arr.at(0), 1);
			equals(arr.at(1), 2);

			equals(arr.at(-5), undefined);
		});
	});

	describe('#includes(element)', () => {

		it('should return a boolean', () => {

			let arr = new Blast.Classes.Develry.LinkedList();

			arr.push(1);
			arr.push(2);
			arr.push(3);

			equals(arr.includes(1), true);
			equals(arr.includes(2), true);
			equals(arr.includes(3), true);
			equals(arr.includes(4), false);

			arr.unshift(4);
			arr.unshift(5);
			equals(arr.includes(4), true);
		});
	});

	describe('#unshift(element)', () => {

		it('should prepend an element', () => {

			let arr = new Blast.Classes.Develry.LinkedList();

			arr.push(1);
			arr.push(2);
			arr.push(3);

			arr.unshift(-1);
			arr.unshift(-2);

			equals(arr.at(0), -2);
			equals(arr.at(1), -1);

			arr.unshift(-3);
			arr.unshift(-4);

			equals(arr.at(0), -4);
			equals(arr.at(1), -3);
		});
	});

	describe('#indexOf(element)', () => {

		it('should get the index of the given element', () => {

			let arr = new Blast.Classes.Develry.LinkedList();

			arr.push(ALPHA);
			arr.push(BETA);
			arr.push(DELTA);

			equals(arr.indexOf(ALPHA), 0);
			equals(arr.indexOf(BETA), 1);

			arr.unshift(ZETA); // -1
			arr.unshift(ETA);  // -2

			equals(arr.at(2), ALPHA);
			equals(arr.at(3), BETA);

			equals(arr.at(1), ZETA);
			equals(arr.at(0), ETA);

			equals(arr.indexOf(ALPHA), 2);
			equals(arr.indexOf(BETA), 3);
			equals(arr.indexOf(DELTA), 4);
			equals(arr.indexOf(ZETA), 1);
			equals(arr.indexOf(ETA), 0);

			equals(arr.indexOf(GAMMA), -1);
		});
	});

	describe('#toArray()', () => {

		it('should return an array', () => {

			let arr = new Blast.Classes.Develry.LinkedList();

			arr.push(1);
			arr.push(2);
			arr.push(3);

			equals(arr.toArray()[0], 1);
			equals(arr.toArray()[1], 2);
			equals(arr.toArray()[2], 3);
		});
	});
});

describe('LinkedMap', function() {

	before(() => {
		Blast = require('../index.js')();
	});

	describe('#set(key, value)', () => {
		it('should set an element', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);

			equals(map.size, 2);
		});
	});

	describe('#has(key)', () => {
		it('should return true if the given key is present', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', false);

			equals(map.has('alpha'), true);
			equals(map.has('beta'), true);
			equals(map.has('gamma'), false);
		});
	});

	describe('#get(key)', () => {
		it('should return the value associated with the key', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', false);

			equals(map.get('alpha'), 1);
			equals(map.get('beta'), false);
			equals(map.get('gamma'), undefined);
		});
	});

	describe('#unshift(key, value)', () => {
		it('should set the key and value at the beginning of the link', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', false);

			equals(map.at(0), 1);
			equals(map.at(1), false);

			map.unshift('gamma', 2);

			equals(map.at(0), 2);
			equals(map.at(1), 1);

			equals(map.get('alpha'), 1);
			equals(map.get('beta'), false);
			equals(map.get('gamma'), 2);
		});
	});

	describe('#setBefore(reference_key, new_key, new_value)', () => {
		it('should set the new key & value before the reference key', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 3);

			map.setBefore('beta', 'gamma', 4);

			equals(map.at(0), 1);
			equals(map.at(1), 4);
			equals(map.at(2), 2);
			equals(map.at(3), 3);

			equals(map.get('alpha'), 1);
			equals(map.get('beta'), 2);
			equals(map.get('gamma'), 4);
			equals(map.get('delta'), 3);
		});
	});

	describe('#setAfter(reference_key, new_key, new_value)', () => {
		it('should set the new key & value after the reference key', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 3);

			map.setAfter('beta', 'gamma', 4);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 4);
			equals(map.at(3), 3);

			equals(map.get('alpha'), 1);
			equals(map.get('beta'), 2);
			equals(map.get('gamma'), 4);
			equals(map.get('delta'), 3);
		});
	});

	describe('#[Symbol.iterator]', () => {
		it('should return an iterator', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			let obj = {};
			let arr = [];

			for (let [key, val] of map) {
				obj[key] = val;
				arr.push(val);
			}

			equals(arr[0], 1);
			equals(arr[1], 2);
			equals(arr[2], 3);

			equals(obj.alpha, 1);
			equals(obj.beta, 2);
			equals(obj.delta, 3);
		});
	});

	describe('#keys()', () => {
		it('should return an iterator', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			let arr = [];

			for (let key of map.keys()) {
				arr.push(key);
			}

			equals(arr[0], 'alpha');
			equals(arr[1], 'beta');
			equals(arr[2], 'delta');
		});
	});

	describe('#values()', () => {
		it('should return an iterator', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			let arr = [];

			for (let val of map.values()) {
				arr.push(val);
			}

			equals(arr[0], 1);
			equals(arr[1], 2);
			equals(arr[2], 3);
		});
	});

	describe('#entries()', () => {
		it('should return an iterator', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			let arr = [];

			for (let [key, val] of map.entries()) {
				arr.push([key, val]);
			}

			equals(arr[0][0], 'alpha');
			equals(arr[0][1], 1);
			equals(arr[1][0], 'beta');
			equals(arr[1][1], 2);
			equals(arr[2][0], 'delta');
			equals(arr[2][1], 3);
		});
	});

	describe('#at(index)', () => {
		it('should return the value at the given index', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 3);
		});
	});

	describe('#delete(key)', () => {

		it('should delete the given key', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 3);
			equals(map.size, 3);

			map.delete('beta');

			equals(map.at(0), 1);
			equals(map.at(1), 3);
			equals(map.size, 2);
		});
	});
	
	describe('#clear()', () => {

		it('should clear the map', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 3);
			equals(map.size, 3);

			map.clear();

			equals(map.size, 0);
		});
	});

	describe('#setAt(index, key, value)', () => {

		it('should set the key & value at the given index', () => {

			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 1);
			map.set('beta', 2);
			map.set('delta', 3);

			equals(map.at(0), 1);
			equals(map.at(1), 2);
			equals(map.at(2), 3);
			equals(map.size, 3);

			map.setAt(1, 'gamma', 4);

			equals(map.at(0), 1);
			equals(map.at(1), 4);
			equals(map.at(2), 3);
			equals(map.size, 3);
		});

		it('should remove existing elements with the same key', () => {
			
			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 'alpha');
			map.set('gamma', 'gamma');
			map.set('delta', 'delta');

			equals(map.at(0), 'alpha');
			equals(map.at(1), 'gamma');
			equals(map.at(2), 'delta');
			equals(map.size, 3);

			map.setAt(0, 'gamma', 'new_gamma');

			equals(map.at(0), 'new_gamma');
			equals(map.at(1), 'delta');
			equals(map.at(2), undefined);
			equals(map.size, 2);
		});

		it('should not remove existing elements with the same key if the index is the same', () => {
			
			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 'alpha');
			map.set('gamma', 'gamma');
			map.set('delta', 'delta');

			equals(map.at(0), 'alpha');
			equals(map.at(1), 'gamma');
			equals(map.at(2), 'delta');
			equals(map.size, 3);

			map.setAt(1, 'gamma', 'new_gamma');

			equals(map.at(0), 'alpha');
			equals(map.at(1), 'new_gamma');
			equals(map.at(2), 'delta');
			equals(map.size, 3);
		});

		it('should throw an error if the index is out of bounds', () => {
			
			let map = new Blast.Classes.Develry.LinkedMap();

			map.set('alpha', 'alpha');
			map.set('gamma', 'gamma');
			map.set('delta', 'delta');

			assert.throws(() => {
				map.setAt(5, 'gamma', 'new_gamma');
			}, Error);
		});
	});
});

function equals(actual, expected, message) {
	assert.strictEqual(actual, expected, message);
}