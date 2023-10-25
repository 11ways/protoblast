let assert = require('assert'),
    Decimal,
    Blast;

describe('Decimal', function() {

	before(() => {
		Blast = require('../index.js')();
		Decimal = Blast.Classes.Develry.Decimal;
	});

	describe('#add(value)', () => {

		it('should return a new instance', () => {
			let one = Decimal('1'),
			    two = Decimal('2');
			
			let three = one.add(two);

			decimalEquals(one, '1');
			decimalEquals(two, '2');
			decimalEquals(three, '3');
		});

		it('should be precise', () => {

			let a = Decimal('0.1'),
			    b = Decimal('0.2');

			let c = a.add(b);

			decimalEquals(c, '0.3');

			c = Decimal('0.99').add('0.012');
			decimalEquals(c, '1.002');

			c = Decimal('0.99').add('0.2');
			decimalEquals(c, '1.19');
		});

		it('should handle negative values', () => {

			let result = Decimal('0').add('-1');
			decimalEquals(result, '-1');

			result = Decimal('0.5').add('-0.6');
			decimalEquals(result, '-0.1');

			result = Decimal('1.1').add('-1.2');
			decimalEquals(result, '-0.1');

			result = Decimal('-1.1').add('-1.2');
			decimalEquals(result, '-2.3');

			result = Decimal('-0.09').add('0.01');
			decimalEquals(result, '-0.08');

			result = Decimal('-0.09').add('0.09');
			decimalEquals(result, '0');

			result = Decimal('-0.09').add('0.001');
			decimalEquals(result, '-0.089');

			result = Decimal('-0.09').add('0.0001');
			decimalEquals(result, '-0.0899');

			result = Decimal('10').add('-100');
			decimalEquals(result, '-90');

			result = Decimal('100').add('-10');
			decimalEquals(result, '90');

			result = Decimal('100').add('-100');
			decimalEquals(result, '0');

			result = Decimal('-100').add('-100');
			decimalEquals(result, '-200');

			result = Decimal('-0.1').add('-0.1');
			decimalEquals(result, '-0.2');

			result = Decimal('-0.1').add('-0.01');
			decimalEquals(result, '-0.11');

			result = Decimal('-0.0').add('-0.1');
			decimalEquals(result, '-0.1');

			result = Decimal('-0.0').add('-0.0');
			decimalEquals(result, '0');

			result = Decimal('-0.0').add('-0.0').add('1');
			decimalEquals(result, '1');

			result = Decimal('0.1').add('0.9');
			decimalEquals(result, '1');

			result = Decimal('-0.1').add('-0.9');
			decimalEquals(result, '-1');

			result = Decimal('0.1').add('0.2').add('0.3').add('0.4');
			decimalEquals(result, '1');

			result = Decimal('9999999999999999').add('0.0000000000000001');
			decimalEquals(result, '9999999999999999.0000000000000001');

			result = Decimal('-0.1').add('0.1');
			decimalEquals(result, '0');
		});
	});

	describe('#subtract(value)', () => {
		it('should subtract values', () => {

			let result = Decimal('0').subtract('1');
			decimalEquals(result, '-1');

			result = Decimal('10').subtract('1');
			decimalEquals(result, '9');
		});

		it('should add negative values', () => {

			let result = Decimal('0').subtract('-1');
			decimalEquals(result, '1');

			result = Decimal('10').subtract('-1');
			decimalEquals(result, '11');

		});
	});

	describe('#multiply(value)', () => {

		it('should multiply simple integers', () => {
			multiplications([
				[ '0',  '1',  '0'],
				[ '1',  '1',  '1'],
				[ '2',  '1',  '2'],
				[ '2',  '2',  '4'],
				[ '2',  '3',  '6'],
				['-1', '-1',  '1'],
				['-2',  '2', '-4'],
				['-2', '-2',  '4'],
			]);
		});

		it('should multiply simple decimals', () => {
			multiplications([
				[  '0.1',    '1',   '0.1'],
				[  '0.1',    '2',   '0.2'],
				[  '0.1',    '3',   '0.3'],
				['-10.0',  '0.1',    '-1'],
				[  '0.1',  '0.1',  '0.01'],
				[  '0.1',  '0.2',  '0.02'],
				[  '0.5',  '0.5',  '0.25'],
				[  '0.5',    '8',     '4'],
				[  '0.5',    '9',   '4.5'],
				[  '0.5',   '10',     '5'],
				[  '0.5',   '11',   '5.5'],
				[   '23',   '42',   '966'],
				[   '23',  '-42',  '-966'],
			]);
		});

	});

	

});

function pow(first_string, second_string, result_string) {
	let first = Decimal(first_string),
	    second = Decimal(second_string);

	let sum = first.pow(second);

	decimalEquals(sum, result_string, `Decimal('${first_string}').pow('${second_string}') should equal Decimal('${result_string}')`);
}

function multiplications(arr) {

	for (let entry of arr) {
		let a = Decimal(entry[0]),
		    b = Decimal(entry[1]),
		    string_result = entry[2];

		let c = a.multiply(b);

		let msg = `Decimal('${entry[0]}).multiply('${entry[1]}') should equal Decimal('${entry[2]}')`;

		decimalEquals(c, string_result, msg);
	}
}

function addition(first_string, second_string, result_string) {
	let first = Decimal(first_string),
	    second = Decimal(second_string);

	let sum = first.add(second);

	decimalEquals(sum, result_string, `Decimal('${first_string}').add('${second_string}') should equal Decimal('${result_string}')`);
}

function decimalEquals(decimal, str, msg) {
	assert.strictEqual(decimal.toString(), str, msg);
}