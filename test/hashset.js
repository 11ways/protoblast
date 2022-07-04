var assert = require('assert'),
    Blast;

describe('HashSet', function() {

	before(function() {
		Blast = require('../index.js')();
	});

	describe('new HashSet()', function() {
		it('should return an empty HashSet', function() {
			const set = new HashSet();
			assert.strictEqual(set.size, 0);
		});
	});

	describe('#add(value)', function() {
		it('should add the value only once', function() {

			const set = new HashSet();

			let value = {bla: 1};

			set.add(value);
			assert.strictEqual(set.size, 1);

			set.add(value);
			set.add(value);
			assert.strictEqual(set.size, 1);
		});

		it('should add the value only once based on the hash', function() {

			const set = new HashSet();

			set.add({alpha: 1, beta: 1});
			assert.strictEqual(set.size, 1);

			set.add({alpha: 1, beta: 1});
			assert.strictEqual(set.size, 1);

			set.add({beta: 1, alpha: 1});
			assert.strictEqual(set.size, 1);

			set.add(1);
			assert.strictEqual(set.size, 2);
		});

		it('should add multiple values', function() {

			const set = new HashSet();

			set.add({alpha: 1, beta: 1});
			assert.strictEqual(set.size, 1);

			set.add({alpha: 1, beta: 2});
			assert.strictEqual(set.size, 2);

			set.add({beta: 3, alpha: 1});
			assert.strictEqual(set.size, 3);
		});
	});

	describe('#has(value)', function() {

		it('should return true or false, depending on the value being present', function() {
			
			const set = new HashSet();

			set.add({alpha: 1, beta: 1});
			assert.strictEqual(set.size, 1);

			assert.strictEqual(set.has({alpha: 1, beta: 1}), true);

			let value = ['reftest', 1];
			set.add(value);
			assert.strictEqual(set.size, 2);

			assert.strictEqual(set.has(value), true);
			assert.strictEqual(set.has(['reftest', 1]), true);
		});

		it('should not get confused by cheap key collisions', function() {

			const set = new HashSet();

			const a = ['same', 1];
			const b = ['same', 2];

			set.add(a);
			set.add(b);

			assert.strictEqual(set.size, 2);
			assert.strictEqual(set.has(a.slice(0)), true);
			assert.strictEqual(set.has(b.slice(0)), true);

			assert.strictEqual(set.delete(a.slice(0)), true);
			assert.strictEqual(set.delete(a.slice(0)), false);

			assert.strictEqual(set.delete(b.slice(0)), true);
			assert.strictEqual(set.delete(b.slice(0)), false);
		});
	});

	describe('#delete(value)', function() {

		it('should delete the value', function() {
			
			const set = new HashSet();

			set.add({alpha: 1, beta: 1});
			assert.strictEqual(set.size, 1);

			assert.strictEqual(set.delete({alpha: 1, beta: 1}), true, 'It should have returned true for removing the value');
			assert.strictEqual(set.delete({alpha: 1, beta: 1}), false, 'It should have returned false because the value was already deleted');
			assert.strictEqual(set.has({alpha: 1, beta: 1}), false);

			let value = ['reftest', 1];
			set.add(value);
			assert.strictEqual(set.size, 1);
			assert.strictEqual(set.delete(value), true, 'It should have returned true for removing the value');
		});
	});

	describe('#values()', function() {

		it('should be used to iterate over the values', function() {
			
			const set = new HashSet();

			set.add(1);
			set.add(1);
			set.add(2);
			set.add(3);
			assert.strictEqual(set.size, 3);

			let count = 0;

			for (let entry of set) {
				count++;
			}

			assert.strictEqual(count, 3);

			set.delete(1);

			count = 0;

			for (let entry of set) {
				count++;
			}

			assert.strictEqual(count, 2);
		});

		it('should iterate over the values in insertion order', function() {

			const set = new HashSet();

			set.add(47);
			set.add(5);
			set.add(4);
			set.add(1);
			set.add(4);
			set.add(2);
			set.add(47);
			set.add(8);

			let values = [];

			for (let entry of set) {
				values.push(entry);
			}

			assert.deepStrictEqual(values, [47, 5, 4, 1, 2, 8]);
		});
	});

	describe('#forEach(fn)', function() {

		it('should call the function for each entry', function() {

			const original = new HashSet();
			original.add({a: 1});
			original.add({b: 2});
			original.add({c: 3});

			let counter = 0;

			original.forEach(() => counter++);

			assert.strictEqual(counter, 3);
		});

	});

	describe('#toDry()', function() {
		it('should serialize the input', function() {

			const original = new HashSet();
			original.add({a: 1});
			original.add({b: 2});
			original.add({c: 3});

			let dried = JSON.dry(original);

			let revived = JSON.undry(dried);

			assert.strictEqual(revived.size, 3);

			const simple_set = new Set();
			simple_set.add('bla');
			simple_set.add('bla');
			simple_set.add('alb');

			dried = JSON.dry(simple_set);
			
			revived = JSON.undry(dried);

			assert.strictEqual(revived.size, 2);
		});
	});

});