let assert = require('assert'),
    Blast;

const ALPHA = Symbol('alpha'),
      BETA = Symbol('beta'),
      DELTA = Symbol('delta'),
      GAMMA = Symbol('gamma'),
      EPSILON = Symbol('epsilon'),
      ZETA = Symbol('zeta'),
      ETA = Symbol('eta');

describe('BiDirectionalArray', function() {

	before(() => {
		Blast = require('../index.js')();
	});

	describe('#append(element)', () => {
		it('should append an element', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(1);
			arr.append(2);
			arr.append(3);

			equals(arr.size, 3);
		});
	});

	describe('#at(index)', () => {

		it('should get the element at the given index', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(1);
			arr.append(2);
			arr.append(3);

			equals(arr.at(0), 1);
			equals(arr.at(1), 2);

			equals(arr.at(-5), undefined);
		});
	});

	describe('#includes(element)', () => {

		it('should return a boolean', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(1);
			arr.append(2);
			arr.append(3);

			equals(arr.includes(1), true);
			equals(arr.includes(2), true);
			equals(arr.includes(3), true);
			equals(arr.includes(4), false);

			arr.prepend(4);
			arr.prepend(5);
			equals(arr.includes(4), true);
		});
	});

	describe('#prepend(element)', () => {

		it('should prepend an element', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(1);
			arr.append(2);
			arr.append(3);

			arr.prepend(-1);
			arr.prepend(-2);

			equals(arr.at(0), 1);
			equals(arr.at(1), 2);

			equals(arr.at(-1), -1);
			equals(arr.at(-2), -2);

			arr.prepend(-3);
			arr.prepend(-4);

			equals(arr.at(0), 1);
			equals(arr.at(-2), -2);
			equals(arr.at(-3), -3);
			equals(arr.at(-4), -4);
		});
	});

	describe('#indexOf(element)', () => {

		it('should get the index of the given element', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(ALPHA);
			arr.append(BETA);
			arr.append(DELTA);

			arr.prepend(ZETA); // -1
			arr.prepend(ETA);  // -2

			equals(arr.at(0), ALPHA);
			equals(arr.at(1), BETA);

			equals(arr.at(-1), ZETA);
			equals(arr.at(-2), ETA);

			equals(arr.indexOf(ALPHA), 0);
			equals(arr.indexOf(BETA), 1);
			equals(arr.indexOf(DELTA), 2);
			equals(arr.indexOf(ZETA), -1);
			equals(arr.indexOf(ETA), -2);

			equals(arr.indexOf(GAMMA), false);
		});
	});

	describe('#start_index', () => {
		it('should get the start index', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(ALPHA);
			equals(arr.start_index, 0);

			arr.append(BETA);
			arr.append(DELTA);

			equals(arr.start_index, 0);

			arr.prepend(ZETA); // -1
			equals(arr.start_index, -1);

			arr.prepend(ETA);  // -2

			equals(arr.start_index, -2);
		});
	});

	describe('#end_index', () => {
		it('should get the end index', () => {

			let arr = new Blast.Classes.Develry.BiDirectionalArray();

			arr.append(ALPHA);
			equals(arr.end_index, 0);

			arr.append(BETA);
			arr.append(DELTA);

			equals(arr.end_index, 2);

			arr.prepend(ZETA); // -1
			equals(arr.end_index, 2);

			arr.prepend(ETA);  // -2

			equals(arr.end_index, 2);
		});
	});

});

function equals(actual, expected, message) {
	assert.strictEqual(actual, expected, message);
}