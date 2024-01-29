let assert = require('assert'),
    Blast;

describe('WeakValueSetMap', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new WeakValueSetMapMap()', function() {
		it('should return a new WeakValueSetMap instance', function() {
			assert.equal((new Blast.Classes.WeakValueSetMap) instanceof Blast.Classes.WeakValueSetMap, true);
		});
	});

	describe('#add(key, value)', function() {
		it('should add objects to a set', function() {

			let set = new Blast.Classes.WeakValueSetMap();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			set.add('group', a);
			assert.strictEqual(set.size, 1);

			set.add('group', b);
			assert.strictEqual(set.size, 1);
		});

		it('should throw an error on primitives', () => {

			let set = new Blast.Classes.WeakValueSetMap();

			assert.throws(() => {
				set.add('bla', 1);
			}, Error);

		});
	});

	describe('#clear()', function() {
		it('should remove all values', function() {

			let set = new Blast.Classes.WeakValueSetMap();

			let obj = {a: 1};

			set.add('group', obj);
			assert.strictEqual(set.size, 1);

			set.add('group2', obj);
			assert.strictEqual(set.size, 2);

			set.clear();
			assert.strictEqual(set.size, 0);
		});
	});

	describe('#delete(key, value)', function() {
		it('should delete the given value from the set at key', function() {

			let set = new Blast.Classes.WeakValueSetMap();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			set.add('group', a);
			set.add('group', b);
			set.add('group', c);

			assert.strictEqual(set.size, 1);

			set.delete('group', b);
			assert.strictEqual(set.size, 1);

			set.delete('group', c);
			assert.strictEqual(set.size, 1);

			set.delete('group', a);
			assert.strictEqual(set.size, 0);
		});
	});

	describe('#has(key, value)', function() {
		it('should return a boolean', function() {

			let set = new Blast.Classes.WeakValueSetMap();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			set.add('group', a);
			set.add('group', b);
			set.add('group', c);

			assert.strictEqual(set.has('group', a), true);

			set.delete('group', a);
			assert.strictEqual(set.has('group', a), false);
		});

		it('should return false once the value is garbage collected', async function() {

			let map = new Blast.Classes.WeakValueSetMap();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			map.add('group', a);
			map.add('group', b);
			map.add('group', c);

			assert.strictEqual(map.size, 1);
			assert.strictEqual(map.has('group', a), true);
			assert.strictEqual(map.has('group', b), true);
			assert.strictEqual(map.has('group', c), true);

			b = null;

			let count = 0;
			let v8,
			    vm,
			    gc;

			try {
				v8 = require('v8');
				vm = require('vm');

				v8.setFlagsFromString('--expose_gc');
				gc = vm.runInNewContext('gc');
			} catch (err) {
				return;
			}

			if (!gc) {
				return;
			}

			do {
				await Blast.Classes.Pledge.after(5);
				gc();

				let set = map.get('group');

				if (set.size == 2) {
					break;
				}

				count++;

				if (count > 10) {
					throw new Error('Garbage collection is taking too long');
				}
			} while(true);

			assert.strictEqual(map.size, 1);
			assert.strictEqual(map.has('group', a), true);
			assert.strictEqual(map.has('group', b), false);
			assert.strictEqual(map.has('group', c), true);
		});
	});

	describe('#entries()', function() {
		it('iterates over all the values', function() {

			let map = new Blast.Classes.WeakValueSetMap();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			map.add('group', a);
			map.add('group', b);
			map.add('group', c);

			let entries = [...map];

			assert.strictEqual(entries.length, 1);

			let set = entries[0][1];

			assert.strictEqual(set.size, 3);

			let values = [...set];

			assert.strictEqual(values.length, 3);
			assert.strictEqual(values[0], a);
			assert.strictEqual(values[1], b);
			assert.strictEqual(values[2], c);
		});
	});

});