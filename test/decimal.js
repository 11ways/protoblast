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

	describe('#divide(value)', () => {

		it('should divide whole numbers', () => {
			divide('1', '1', '1');
			divide('2', '2', '1');
			divide('10', '2', '5');
			divide('100', '10', '10');

			divide('20', '2', '10');
			divide('20', '4', '5');
		});

		it('should divide into terminating decimals', () => {

			divide('1', '2', '0.5');
			divide('1', '4', '0.25');
			divide('1', '5', '0.2');
			divide('1', '8', '0.125');
			divide('1', '10', '0.1');
			divide('1', '20', '0.05');
			divide('1', '25', '0.04');
			divide('20', '16', '1.25');
		});

		it('should divide into repeating decimals', () => {
			divide('1',    '3', '0.33333333333333333333');
			divide('1',    '6', '0.16666666666666666667');
			divide('1',    '7', '0.14285714285714285714');
			divide('1', '9967', '0.00010033109260559847')
		});

		it('should divide into irrational decimals', () => {
			divide('1', '3.1415926535', '0.31830988619288862874');
		});

		it('should divide some more', () => {

			divide('1.15',            '9967', '0.00011538075649643825');
			divide('1.15',         '9967.12', '0.00011537936735987928');
			divide('1.123456789',      '2.1', '0.53497942333333333333');
		});

		it('should respect the arithmetic precision', () => {

			let a = Decimal('1'),
			    b = Decimal('3');

			a.setArithmeticScale(10);
			b.setArithmeticScale(10);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setArithmeticScale(10);
			b.setArithmeticScale(5);
			decimalEquals(a.divide(b), '0.33333');

			b = Decimal('6');
			a.setArithmeticScale(10);
			b.setArithmeticScale(10);
			decimalEquals(a.divide(b), '0.1666666667');

			a = Decimal('1.15');
			b = Decimal('9967');

			a.setArithmeticScale(10);
			b.setArithmeticScale(10);

			decimalEquals(a.divide(b), '0.0001153808');
		});

		it('should respect rounding modes', () => {

			let a = Decimal('2'),
			    b = Decimal('7');

			// This decimal is repeating:
			// 0.285714 285714 285714

			a.setArithmeticScale(4);
			b.setArithmeticScale(6);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0.2858');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0.2857');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0.2858');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0.2857');

			a = Decimal('1');
			b = Decimal('6');

			a.setArithmeticScale(10);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0.1666666667');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0.1666666666');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0.1666666667');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '0.1666666666');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0.1666666666');

			a = Decimal('1');
			b = Decimal('3');

			a.setArithmeticScale(10);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0.3333333334');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0.3333333334');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0.3333333333');

			a = Decimal('5');
			b = Decimal('9');

			a.setArithmeticScale(10);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0.5555555556');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0.5555555555');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0.5555555556');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '0.5555555555');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0.5555555556');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0.5555555555');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0.5555555556');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0.5555555556');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0.5555555555');

			a = Decimal('5');
			b = Decimal('7');

			// 0.714285 714285 714285

			a.setArithmeticScale(5);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0.71429');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0.71428');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0.71429');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '0.71428');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0.71429');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0.71428');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0.71428');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0.71429');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0.71428');

			a = Decimal('1');
			b = Decimal('3');

			a.setArithmeticScale(0);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '1');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '1');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0');

			// When both arithmetic scales are 0, the result should be 0
			a.setArithmeticScale(0);
			b.setArithmeticScale(0);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0');

			a = Decimal('1')
			b = Decimal('27')

			a.setArithmeticScale(10);
			b.setArithmeticScale(10);

			decimalEquals(a.divide(b), '0.037037037');
		});

		it('should respect rounding modes for negative numbers', () => {

			let a = Decimal('2'),
			    b = Decimal('-7');

			// This decimal is repeating:
			// -0.285714 285714 285714

			a.setArithmeticScale(4);
			b.setArithmeticScale(6);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '-0.2858');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '-0.2857');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '-0.2857');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '-0.2858');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '-0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '-0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '-0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '-0.2857');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '-0.2857');

			a = Decimal('1');
			b = Decimal('-6');

			a.setArithmeticScale(10);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '-0.1666666667');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '-0.1666666666');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '-0.1666666666');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '-0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '-0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '-0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '-0.1666666667');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '-0.1666666666');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '-0.1666666667');

			a = Decimal('1');
			b = Decimal('-3');

			a.setArithmeticScale(10);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '-0.3333333334');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '-0.3333333333');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '-0.3333333333');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '-0.3333333334');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '-0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '-0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '-0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '-0.3333333333');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '-0.3333333333');

			a = Decimal('5');
			b = Decimal('-9');

			a.setArithmeticScale(10);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '-0.5555555556');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '-0.5555555555');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '-0.5555555555');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '-0.5555555556');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '-0.5555555556');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '-0.5555555555');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '-0.5555555556');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '-0.5555555555');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '-0.5555555556');

			a = Decimal('5');
			b = Decimal('-7');

			// -0.714285 714285 714285

			a.setArithmeticScale(5);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '-0.71429');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '-0.71428');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '-0.71428');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '-0.71429');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '-0.71429');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '-0.71428');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '-0.71428');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '-0.71428');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '-0.71429');

			a = Decimal('1');
			b = Decimal('-3');

			a.setArithmeticScale(0);
			b.setArithmeticScale(12);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '-1');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_FLOOR);
			decimalEquals(a.divide(b), '-1');

			a.setRoundingMode(Decimal.ROUND_HALF_UP);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_EVEN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_CEIL);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_HALF_FLOOR);
			decimalEquals(a.divide(b), '0');

			// When both arithmetic scales are 0, the result should be 0
			a.setArithmeticScale(0);
			b.setArithmeticScale(0);
			a.setRoundingMode(Decimal.ROUND_UP);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_DOWN);
			decimalEquals(a.divide(b), '0');

			a.setRoundingMode(Decimal.ROUND_CEIL);
			decimalEquals(a.divide(b), '0');
		});
	});

	describe('#pow(value)', () => {

		it('should handle simple powers', () => {

			pow('0', '0', '1');
			pow('0', '1', '0');
			pow('0', '2', '0');
			pow('0', '3', '0');

			pow('1', '0', '1');
			pow('1', '1', '1');
			pow('1', '2', '1');
			pow('1', '3', '1');

			pow('2', '0', '1');
			pow('2', '1', '2');
			pow('2', '2', '4');
			pow('-2', '2', '4');
			pow('2', '3', '8');
			pow('-2', '3', '-8');

			pow('3', '0', '1');
			pow('3', '1', '3');
			pow('3', '2', '9');
			pow('3', '3', '27');

			pow('4', '0', '1');
			pow('4', '1', '4');
			pow('4', '2', '16');
			pow('4', '3', '64');

			pow('5', '0', '1');
			pow('5', '1', '5');
			pow('5', '2', '25');
			pow('5', '3', '125');

			pow('6', '0', '1');
			pow('6', '1', '6');
			pow('6', '2', '36');
			pow('6', '3', '216');

			pow('7', '0', '1');
			pow('7', '1', '7');
			pow('7', '2', '49');
			pow('7', '3', '343');

			pow('8', '0', '1');
			pow('8', '1', '8');
			pow('8', '2', '64');
			pow('8', '3', '512');

			pow('9', '0', '1');
		});

		it('should handle negative powers', () => {

			pow('2', '-1', '0.5');
			pow('2', '-2', '0.25');
			pow('2', '-3', '0.125');

			pow('3', '-1', '0.3333333333');
			pow('3', '-2', '0.1111111111');
			pow('3', '-3', '0.037037037');

			pow('4', '-1', '0.25');
			pow('4', '-2', '0.0625');
			pow('4', '-3', '0.015625');

			pow('5', '-1', '0.2');
			pow('5', '-2', '0.04');
			pow('5', '-3', '0.008');

			pow('6', '-1', '0.1666666667');
			pow('6', '-2', '0.0277777778');
			pow('6', '-3', '0.0046296296');

			pow('7', '-1', '0.1428571429');
			pow('7', '-2', '0.0204081633');
			pow('7', '-3', '0.0029154519');

			pow('8', '-1', '0.125');
			pow('8', '-2', '0.015625');
			pow('8', '-3', '0.001953125');

			pow('9', '-1', '0.1111111111');
			pow('9', '-2', '0.012345679');
			pow('9', '-3', '0.0013717421');

			pow('-9', '-2', '0.012345679');
			pow('-9', '-3', '-0.0013717421');
		});

	});
});

function pow(first_string, second_string, result_string) {
	let first = Decimal(first_string),
	    second = Decimal(second_string);

	first.setArithmeticScale(10);
	second.setArithmeticScale(10);

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

function divide(first_string, second_string, result_string) {
	let first = Decimal(first_string),
	    second = Decimal(second_string);

	let sum = first.divide(second);

	decimalEquals(sum, result_string, `Decimal('${first_string}').divide('${second_string}') should equal Decimal('${result_string}')`);
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