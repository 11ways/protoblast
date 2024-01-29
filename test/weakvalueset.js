let assert = require('assert'),
    Blast;

describe('WeakValueSet', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new WeakValueSet()', function() {
		it('should return a new WeakValueSet instance', function() {
			assert.equal((new Blast.Classes.WeakValueSet) instanceof Blast.Classes.WeakValueSet, true);
		});
	});

	describe('#add(value)', function() {
		it('should add objects', function() {

			let set = new Blast.Classes.WeakValueSet();

			let obj = {a: 1};

			set.add(obj);
			assert.strictEqual(set.size, 1);

			set.add(obj);
			assert.strictEqual(set.size, 1);
		});

		it('should throw an error on primitives', () => {

			let set = new Blast.Classes.WeakValueSet();

			assert.throws(() => {
				set.add(1);
			}, Error);

		});
	});

	describe('#clear()', function() {
		it('should remove all values', function() {

			let set = new Blast.Classes.WeakValueSet();

			let obj = {a: 1};

			set.add(obj);
			assert.strictEqual(set.size, 1);

			set.clear();
			assert.strictEqual(set.size, 0);
		});
	});

	describe('#delete(value)', function() {
		it('should delete the given value from the set', function() {

			let set = new Blast.Classes.WeakValueSet();

			let obj = {a: 1};

			set.add(obj);
			assert.strictEqual(set.size, 1);

			set.delete(obj);

			assert.strictEqual(set.size, 0);
		});
	});

	describe('#has(value)', function() {
		it('should return a boolean', function() {

			let set = new Blast.Classes.WeakValueSet();

			let obj = {a: 1};

			set.add(obj);
			assert.strictEqual(set.size, 1);
			assert.strictEqual(set.has(obj), true);

			set.delete(obj);
			assert.strictEqual(set.has(obj), false);
		});

		it('should return false once the value is garbage collected', async function() {

			let set = new Blast.Classes.WeakValueSet();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			set.add(a).add(b).add(c);

			assert.strictEqual(set.size, 3);
			assert.strictEqual(set.has(a), true);
			assert.strictEqual(set.has(b), true);
			assert.strictEqual(set.has(c), true);

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

				if (set.size == 2) {
					break;
				}

				count++;

				if (count > 10) {
					throw new Error('Garbage collection is taking too long');
				}
			} while(true);

			assert.strictEqual(set.size, 2);
			assert.strictEqual(set.has(a), true);
			assert.strictEqual(set.has(b), false);
			assert.strictEqual(set.has(c), true);
		});
	});

	describe('#entries()', function() {
		it('iterates over all the values', function() {

			let set = new Blast.Classes.WeakValueSet();

			let a = {a: 1},
			    b = {b: 2},
			    c = {c: 3};

			set.add(a).add(b).add(c);

			let entries = [...set];

			assert.strictEqual(entries.length, 3);
			assert.strictEqual(entries[0], a);
			assert.strictEqual(entries[1], b);
			assert.strictEqual(entries[2], c);
		});
	});

});