var assert = require('assert'),
    Blast;

describe('Branch', () => {

	let root_one,
	    root_two,
	    alpha,
	    beta,
	    gamma;

	before(() => {
		Blast = require('../index.js')();

		root_one = new Blast.Classes.Branch();
		root_two = new Blast.Classes.Branch();
		alpha = new Blast.Classes.Branch();
		beta = new Blast.Classes.Branch();
		gamma = new Blast.Classes.Branch();
	});

	describe('#append(new_branch)', () => {
		it('should append the new branch', () => {

			root_one.append(alpha);
			root_one.append(beta);

			beta.append(gamma);

			assert.strictEqual(alpha.parent, root_one);
			assert.strictEqual(beta.parent, root_one);
			assert.strictEqual(gamma.parent, beta);
		});
	});

	describe('#prepend(new_branch)', () => {
		it('should prepend the branch', () => {

			root_one.prepend(gamma);

			let children = root_one.children;

			assert.strictEqual(children[0], gamma);
			assert.strictEqual(children[1], alpha);
			assert.strictEqual(children[2], beta);

			assert.strictEqual(gamma.parent, root_one);
			assert.strictEqual(beta.children.length, 0);
		});
	});

	describe('#insertBefore(new_branch, reference_branch)', () => {
		it('should insert the new branch before the reference branch', () => {

			root_one.insertBefore(gamma, beta);

			let children = root_one.children;

			assert.strictEqual(children[0], alpha);
			assert.strictEqual(children[1], gamma);
			assert.strictEqual(children[2], beta);
		});

		it('should change the parent of the inserted branch', () => {
			assert.strictEqual(gamma.parent, root_one);
		});

		it('should have removed the new branch from the reference branch children', () => {

			let children = beta.children;

			assert.strictEqual(children.length, 0);
		});
	});

	describe('#remove()', () => {

		it('should remove itself from the parent branch', () => {

			alpha.remove();
			beta.remove();
			gamma.remove();

			assert.strictEqual(alpha.parent, null);
			assert.strictEqual(beta.parent, null);
			assert.strictEqual(gamma.parent, null);

			assert.strictEqual(root_one.children.length, 0);
		});
	});
});