var assert = require('assert'),
    Blast;

describe('String', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new StringBuilder()', function() {
		it('should return a new StringBuilder instance', function() {
			assert.equal((new Blast.Classes.Develry.StringBuilder) instanceof Blast.Classes.Develry.StringBuilder, true);
		});
	});

	describe('#append(str)', function() {
		it('should append strings', function() {

			var sb = new Blast.Classes.Develry.StringBuilder;

			assert.strictEqual(sb.length, 0);

			sb.append('');

			assert.strictEqual(sb.length, 0);

			sb.append(0);

			assert.strictEqual(sb.length, 1);

			sb.append('test');

			assert.strictEqual(sb.length, 5);
		});
	});

	describe('#toString()', function() {
		it('should return a string', function() {

			var sb = new Blast.Classes.Develry.StringBuilder;

			sb.append('a');
			sb.append('bc');
			sb.append('');
			sb.append('d');

			assert.strictEqual(sb.toString(), 'abcd');
		});
	});

	describe('#delete(start, end)', function() {
		it('should delete a part of the string', function() {

			var sb = new Blast.Classes.Develry.StringBuilder,
			    i;

			for (i = 0; i < 10; i++) {
				sb.append(i);
			}

			assert.strictEqual(sb.toString(), '0123456789');

			sb.delete(0, 3);

			assert.strictEqual(sb.toString(), '3456789');

			sb.prepend('012');

			assert.strictEqual(sb.toString(), '0123456789');

			sb.delete(0,3);

			assert.strictEqual(sb.toString(), '3456789');

			sb.prepend(12);
			sb.prepend(0);
			assert.strictEqual(sb.toString(), '0123456789');

			sb.delete(0,3);

			assert.strictEqual(sb.toString(), '3456789');

			sb.clear();

			assert.strictEqual(sb.toString(), '');

			let nr;

			for (i = 0; i < 10; i++) {
				nr = i * 2;

				sb.append(String(nr) + String(nr + 1));
			}

			assert.strictEqual(sb.toString(), '012345678910111213141516171819')

			sb.delete(7, 16);

			assert.strictEqual(sb.toString(), '012345613141516171819')
		});
	});

	describe('#cut(start, end)', function() {
		it('should cut and return part of a string', function() {
			var sb = new Blast.Classes.Develry.StringBuilder;

			sb.append('012');
			sb.append('3456');
			sb.append('789');
			sb.append('1011121314');

			let str = sb.cut(4, 9);

			assert.strictEqual(sb.toString(), '012391011121314');
			assert.strictEqual(str, '45678');
		});
	});

	describe('#clone()', function() {

		it('should clone the builder', function() {

			var sb = new Blast.Classes.Develry.StringBuilder;

			sb.append('0123');
			sb.append('4567');

			assert.strictEqual(sb.toString(), '01234567');

			let cloned = sb.clone();

			assert.strictEqual(cloned instanceof Blast.Classes.Develry.StringBuilder, true);
			assert.strictEqual(cloned.toString(), '01234567');
		});
	});

});