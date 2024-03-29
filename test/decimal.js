let assert = require('assert'),
    FixedDecimal,
    MutableFixedDecimal,
    MutableDecimal,
    Decimal,
    Blast;

describe('Decimal', function() {

	before(() => {
		Blast = require('../index.js')();
		Decimal = Blast.Classes.Develry.Decimal;
	});

	describe('new Decimal(input)', () => {

		it('should handle scientific notation', () => {

			decimalEquals(Decimal('1e14'), '100000000000000');
			decimalEquals(Decimal('1e-14'), '0.00000000000001');
			decimalEquals(Decimal('1e-15'), '0.000000000000001');
			decimalEquals(Decimal('1e-16'), '0.0000000000000001');
			decimalEquals(Decimal('1e-17'), '0.00000000000000001');
			decimalEquals(Decimal('-345.43e+4'), '-3454300');
			decimalEquals(Decimal('3.345E-9'), '0.000000003345');
		});

		it('should handle falsy values', () => {
			decimalEquals(Decimal(''), '0');
			decimalEquals(Decimal(0), '0');
			decimalEquals(Decimal(false), '0');
			decimalEquals(Decimal(), '0');
			decimalEquals(Decimal(null), '0');
			decimalEquals(Decimal(undefined), '0');
		});
	});

	describe('#toDry()', () => {
		it('should be able to be serialized', () => {

			let a = Decimal('1.1'),
			    b = Decimal('1.2');

			a.setArithmeticScale(1);
			b.setArithmeticScale(1);

			let result = a.add(b);

			let dry = result.toDry();

			assert.strictEqual(dry.value.string, '2.3');

			let revived = JSON.undry(JSON.dry(result));

			assert.strictEqual(revived.toString(), '2.3');
			assert.strictEqual(revived.constructor.name, 'Decimal');
		});
	});

	describe('#isGreaterThan(value)', () => {

		it('should return true when the value is greater', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), true);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), true);
		});

		it('should return false when the value is smaller', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), true);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), true);
		});

		it('should return false when the value is equal', () => {

			let a = Decimal('1'),
			    b = Decimal('1');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), false);

			a = Decimal('1.1');
			b = Decimal('1.1');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), false);
		});

		it('should handle negative values', () => {

			let a = Decimal('1'),
			    b = Decimal('-1');

			assert.strictEqual(a.isGreaterThan(b), true);
			assert.strictEqual(b.isGreaterThan(a), false);

			a = Decimal('-1');
			b = Decimal('1');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), true);

			a = Decimal('-1');
			b = Decimal('-1');

			assert.strictEqual(a.isGreaterThan(b), false);
			assert.strictEqual(b.isGreaterThan(a), false);

			a = Decimal('-1.1');
			b = Decimal('-1.2');

			assert.strictEqual(a.isGreaterThan(b), true);
			assert.strictEqual(b.isGreaterThan(a), false);
		});
	});

	describe('#isGreaterThanOrEqual(value)', () => {

		it('should return true when the value is greater', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isGreaterThanOrEqual(b), false);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isGreaterThanOrEqual(b), false);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);
		});

		it('should return false when the value is smaller', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isGreaterThanOrEqual(b), false);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isGreaterThanOrEqual(b), false);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);
		});

		it('should return true when the value is equal', () => {

			let a = Decimal('1'),
			    b = Decimal('1');

			assert.strictEqual(a.isGreaterThanOrEqual(b), true);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);

			a = Decimal('1.1');
			b = Decimal('1.1');

			assert.strictEqual(a.isGreaterThanOrEqual(b), true);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);
		});

		it('should handle negative values', () => {

			let a = Decimal('1'),
			    b = Decimal('-1');

			assert.strictEqual(a.isGreaterThanOrEqual(b), true);
			assert.strictEqual(b.isGreaterThanOrEqual(a), false);

			a = Decimal('-1');
			b = Decimal('1');

			assert.strictEqual(a.isGreaterThanOrEqual(b), false);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);

			a = Decimal('-1');
			b = Decimal('-1');

			assert.strictEqual(a.isGreaterThanOrEqual(b), true);
			assert.strictEqual(b.isGreaterThanOrEqual(a), true);
		});
	});

	describe('#isLowerThan(value)', () => {

		it('should return true when the value is greater', () => {
			
			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isLowerThan(b), true);
			assert.strictEqual(b.isLowerThan(a), false);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isLowerThan(b), true);
			assert.strictEqual(b.isLowerThan(a), false);
		});

		it('should return false when the value is smaller', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isLowerThan(b), true);
			assert.strictEqual(b.isLowerThan(a), false);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isLowerThan(b), true);
			assert.strictEqual(b.isLowerThan(a), false);

			a = Decimal('1.1');
			b = Decimal('1.1');

			assert.strictEqual(a.isLowerThan(b), false);
			assert.strictEqual(b.isLowerThan(a), false);

			a = Decimal('-1.1');
			b = Decimal('1.1');

			assert.strictEqual(a.isLowerThan(b), true);
			assert.strictEqual(b.isLowerThan(a), false);
		});
	});

	describe('#isLowerThanOrEqual(value)', () => {

		it('should return true when the value is greater', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isLowerThanOrEqual(b), true);
			assert.strictEqual(b.isLowerThanOrEqual(a), false);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isLowerThanOrEqual(b), true);
			assert.strictEqual(b.isLowerThanOrEqual(a), false);
		});

		it('should return false when the value is smaller', () => {

			let a = Decimal('1'),
			    b = Decimal('2');

			assert.strictEqual(a.isLowerThanOrEqual(b), true);
			assert.strictEqual(b.isLowerThanOrEqual(a), false);

			a = Decimal('1.1');
			b = Decimal('1.2');

			assert.strictEqual(a.isLowerThanOrEqual(b), true);
			assert.strictEqual(b.isLowerThanOrEqual(a), false);

			a = Decimal('1.1');
			b = Decimal('1.1');

			assert.strictEqual(a.isLowerThanOrEqual(b), true);
			assert.strictEqual(b.isLowerThanOrEqual(a), true);

			a = Decimal('-1.1');
			b = Decimal('1.1');

			assert.strictEqual(a.isLowerThanOrEqual(b), true);
			assert.strictEqual(b.isLowerThanOrEqual(a), false);
		});
	});

	describe('#toScale(scale)', () => {

		it('should return a new instance', () => {

			let a = Decimal('1.11'),
			    b = a.toScale(1);

			decimalEquals(a, '1.11');
			decimalEquals(b, '1.1');
		});

		it('should return a new instance with the correct scale', () => {

			let a = Decimal('1.15'),
			    b = a.toScale(1);

			decimalEquals(a, '1.15');
			decimalEquals(b, '1.2');

			decimalEquals(Decimal('1.123456').toScale(2), '1.12');
			decimalEquals(Decimal('1.123456').toScale(5), '1.12346');
		});


		it('should not break on larger scales', () => {

			let a = Decimal('999.5');
			let result = a.toScale(20);

			decimalEquals(result, '999.5');
		});
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

		it('should do additions', () => {

			addition(1, '6.1915', '7.1915');
			addition(1, '-1.02', '-0.02');
			addition(1, '0.09', '1.09');
			addition(1, '-0.0001', '0.9999');
			addition(1, '8e5', '800001');
			addition(1, '9E12', '9000000000001');
			addition(1, '1e-14', '1.00000000000001');
			addition(1, '3.345E-9', '1.000000003345');
			addition(1, '-345.43e+4', '-3454299');
			addition(1, '-94.12E+0', '-93.12');
			addition('0', 0, '0');
			addition('0', '0', '0');
			addition(3, -0, '3');
			addition(9.654, 0, '9.654');
			addition(0, '0.001', '0.001');
			addition(0, '111.1111111110000', '111.111111111');
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

		it('should do rounding', () => {

			let a = Decimal('482415314400600371304757933326735596247.502'),
			    b = Decimal('64121617419177033485421455407.5858664539051557486457828966476314714');

			let result_str = '482415314464721988723934966812157051655.0878664539051557486457828966476314714';

			a.setArithmeticScale(37);
			b.setArithmeticScale(37);
			a.setRoundingMode(Decimal.ROUND_HALF_DOWN);

			decimalEquals(a.add(b), result_str);

			a = Decimal('4961172832120828815580484602760756.2012712908');
			b = Decimal('672041039664151754962281595761407065569.95071013621060637157419754');

			a.setArithmeticScale(2);
			b.setArithmeticScale(2);
			a.setRoundingMode(Decimal.ROUND_DOWN);

			decimalEquals(a.add(b), '672046000836983875791097176246009826326.15');
		});

		it('should handle scale changes', () => {

			let a = Decimal('1.000000000100000000020000000003'),
			    b = Decimal('1.15');

			decimalEquals(a.add(b), '2.150000000100000000020000000003');
			decimalEquals(b.add(a), '2.150000000100000000020000000003');

			a.setArithmeticScale(10);
			b.setArithmeticScale(10);

			decimalEquals(a.add(b), '2.1500000001');
			decimalEquals(b.add(a), '2.1500000001');
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
			decimalEquals(a.divide(b), '0.3333333333');

			b = Decimal('6');
			a.setArithmeticScale(10);
			b.setArithmeticScale(10);
			decimalEquals(a.divide(b), '0.1666666667');

			a = Decimal('1.15');
			b = Decimal('9967');

			a.setArithmeticScale(10);
			b.setArithmeticScale(10);

			decimalEquals(a.divide(b), '0.0001153808');

			// This should now have a precision of 30
			let ones = Decimal('0.111111111111111111111111111111');
			decimalEquals(ones, '0.111111111111111111111111111111');

			let div = ones.divide(2);
			decimalEquals(div, '0.055555555555555555555555555556');
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

	describe('#factorial()', () => {
		it('should calculate the factorial of an integer value', () => {

			let result = Decimal('0').factorial();
			decimalEquals(result, '1');

			result = Decimal('1').factorial();
			decimalEquals(result, '1');

			result = Decimal('2').factorial();
			decimalEquals(result, '2');

			result = Decimal('8').factorial();
			decimalEquals(result, '40320');

			result = Decimal('9').factorial();
			decimalEquals(result, '362880');

			result = Decimal('10').factorial();
			decimalEquals(result, '3628800');

			result = Decimal('11').factorial();
			decimalEquals(result, '39916800');

			result = Decimal('15').factorial();
			decimalEquals(result, '1307674368000');

			result = Decimal('50').factorial();
			decimalEquals(result, '30414093201713378043612608166064768844377641568960512000000000000');
		});
	});

	describe('#naturalExponentiation()', () => {
		it('should calculate the natural exponentiation of a value', () => {

			let result = Decimal('5').naturalExponentiation();
			decimalEquals(result, '148.41315910257660342112');

			result = Decimal('6').naturalExponentiation();
			decimalEquals(result, '403.42879349273512260839');

			let six = Decimal('6');
			six.setArithmeticScale(10);
			decimalEquals(six.naturalExponentiation(), '403.4287934927');

			six.setArithmeticScale(30);
			decimalEquals(six.naturalExponentiation(), '403.428793492735122608387180543388');
		});

		it('should support decimal values', () => {

			let result = Decimal('5.5');
			result.setArithmeticScale(20);
			result = result.naturalExponentiation();
			decimalEquals(result, '244.69193226422038791519');

		});
	});

	describe('#logarithm()', () => {

		it('should calculate the Base10 logarithm of a value', () => {

			let result = Decimal('5').logarithm();
			decimalEquals(result, '0.69897000433601880479');

			result = Decimal('6').logarithm();
			decimalEquals(result, '0.77815125038364363251');

			result = Decimal('16').logarithm();
			decimalEquals(result, '1.20411998265592478085');

			result = Decimal('10').logarithm();
			decimalEquals(result, '1');

			result = Decimal('100').logarithm();
			decimalEquals(result, '2');
		});

		it('should throw an error for negative values', () => {
			assert.throws(() => {
				Decimal('-5').logarithm();
			});
		});
	});

	describe('#naturalLogarithm()', () => {

		it('should calculate the natural logarithm of a value', () => {

			let result = Decimal('5').naturalLogarithm();
			decimalEquals(result, '1.6094379124341003746');

			result = Decimal('6').naturalLogarithm();
			decimalEquals(result, '1.79175946922805500081');

			result = Decimal('16').naturalLogarithm();
			decimalEquals(result, '2.77258872223978123767');
		});

		it('should throw an error for negative values', () => {
			assert.throws(() => {
				Decimal('-5').naturalLogarithm();
			});
		});
	});

	describe('#power(value)', () => {

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

		it('should handle decimals', () => {
			pow('2.5', '2', '6.25');
			pow('2.5', '3', '15.625');
			pow('2.5', '4', '39.0625');
			pow('2.5', '-3', '0.064');
			pow('12.536', '2', '157.151296');


			let neg_one_third = Decimal('-0.333333333333333333333333333333');
			neg_one_third.setArithmeticScale(30);
			let powered = neg_one_third.power(2);

			decimalEquals(powered, '0.111111111111111111111111111111');

			let div = powered.divide(2);
			decimalEquals(div, '0.055555555555555555555555555556');

			pow('12.536', '10', '95849496223.2257405224');
		});

		it('should handle decimal exponents', () => {
			pow('2', '1.5', '2.8284271247461900976', 20);
			pow('2', '1.5', '2.8284271247461900976', 19);
			pow('2', '1.5', '2.828427124746190098', 18);
			pow('4', '0.5', '2');
			pow('4', '0.25', '1.4142135624');
			pow('5', '-0.5', '0.4472135955');
			pow('5', '-0.1', '0.8513399225');
			pow('47', '3.3', '329551.2256522242');

			pow('47', '3.3', '329551.225652224185906737597704672962', 30);
			pow('47', '3.3', '329551.2256522241859067375977046729623', 31);
		});
	});

	describe('#squareRoot()', () => {

		it('should calculate the square root of an integer', () => {

			sqrt('4', '2');
			sqrt('9', '3');
			sqrt('16', '4');
			sqrt('81', '9');
			sqrt('21609', '147');
			sqrt('225930053041', '475321');
			sqrt('999998000001', '999999');
			sqrt('47369', '217.64420506873138431431');
		});

		it('should calculate the square root of a decimal', () => {

			sqrt('9.5', '3.08220700148448822513');
			sqrt('147.123', '12.12942702686322277542');
			sqrt('999000.25', '999.5');

			// This will automatically set the arithmetic scale to 30
			sqrt('446348.594999999999999999999999999999', '668.093253221434649745644636746559');
		});
	});

	describe('#modulo(value)', () => {

		it('should calculate the modulo of two numbers', () => {

			modulo('0', '1', '0');
			modulo('4', '3', '1');
			modulo('4', '2', '0');
			modulo('4', '1', '0');
			modulo('5', '3', '2');

			modulo('64462', '90.840', '56.44');
			modulo('46', '433563.55477', '46');
			modulo('47852501568', '-147426331397', '47852501568');
			modulo('0', '3812504.1', '0');
			modulo('-1534', '-293318.339', '-1534');

			modulo('-1261.3', '39.0', '-13.3');
			modulo('1.017', '-153', '1.017');
			modulo('27.690', '-21507592', '27.69');
			modulo('-2623.072516', '3.06', '-0.652516');

			modulo('2318237922853539360.167157597022570', '-9702015238687.680494235371626139504030926823802574', '9295675788919.833075194557918488338251940141560718');
			modulo('39.99', '-196.666', '39.99');
  			modulo('198328732837738155510399443.82996', '0.049415792708', '0.034407057628');

			modulo('9.0188012787220251521914339e+21', '7.34972521506799782052e+20', '199131020640427767567.4339');
		});

	});
});

describe('MutableDecimal', () => {

	before(() => {
		Blast = require('../index.js')();
		Decimal = Blast.Classes.Develry.Decimal;
		MutableDecimal = Blast.Classes.Develry.MutableDecimal;
	});

	describe('#clone()', () => {

		it('should clone the instance', () => {

			let a = MutableDecimal('1.1'),
			    b = MutableDecimal('1.2');

			a.add(b);

			decimalEquals(a, '2.3');
			decimalEquals(b, '1.2');

			let clone = a.clone();

			decimalEquals(clone, '2.3');
			assert.strictEqual(clone.constructor.name, 'MutableDecimal');
			assert.notStrictEqual(clone, a);

			a.add('0.1');
			clone.add('0.2');

			decimalEquals(a, '2.4');
			decimalEquals(clone, '2.5');
		});
	});

	describe('#add(value)', () => {
		it('should add numbers in place', () => {

			let original = MutableDecimal('1');
			let result = original.add('5');

			decimalEquals(result, '6');
			assert.strictEqual(result, original);

			result.add('3');
			decimalEquals(result, '9');

			result.add('0.12345');
			decimalEquals(result, '9.12345');

			result.multiply('2');
			decimalEquals(result, '18.2469');
		});
	});

	describe('#subtract(value)', () => {
		it('should subtract numbers in place', () => {

			let original = MutableDecimal('1');
			let result = original.subtract('5');

			decimalEquals(result, '-4');
			assert.strictEqual(result, original);

			result.subtract('3');
			decimalEquals(result, '-7');
		});
	});

	describe('#multiply(value)', () => {
		it('should multiply numbers in place', () => {

			let original = MutableDecimal('1');
			let result = original.multiply('5');

			decimalEquals(result, '5');
			assert.strictEqual(result, original);

			result.multiply('3');
			decimalEquals(result, '15');
		});
	});

	describe('#divide(value)', () => {
		it('should divide numbers in place', () => {

			let original = MutableDecimal('1');
			let result = original.divide('5');

			decimalEquals(result, '0.2');
			assert.strictEqual(result, original);

			result.divide('3');
			decimalEquals(result, '0.06666666666666666667');

			decimalEquals(Decimal('0.2').divide('3'), result.toString());
		});
	});

	describe('#toImmutable()', () => {
		it('should return an immutable decimal', () => {

			let original = MutableDecimal('1');
			let immutable = original.toImmutable();

			decimalEquals(immutable, '1');
			decimalEquals(original, '1');
			assert.strictEqual(immutable.constructor.name, 'Decimal');

			original.add('5');

			decimalEquals(original, '6');
			decimalEquals(immutable, '1');

			let mutable = immutable.toMutable();
			assert.strictEqual(mutable.constructor.name, 'MutableDecimal');

			mutable.add('4');

			decimalEquals(original, '6');
			decimalEquals(immutable, '1');
			decimalEquals(mutable, '5');
		});
	});

	describe('#toScale(scale)', () => {

		it('should modify the instance', () => {

			let a = MutableDecimal('1.15'),
			    b = a.toScale(1);

			decimalEquals(a, '1.2');
			decimalEquals(b, '1.2');

			decimalEquals(MutableDecimal('1.123456').toScale(2), '1.12');
			decimalEquals(MutableDecimal('1.123456').toScale(5), '1.12346');
		});
	});
});

describe('FixedDecimal', () => {

	before(() => {
		Blast = require('../index.js')();
		Decimal = Blast.Classes.Develry.Decimal;
		MutableDecimal = Blast.Classes.Develry.MutableDecimal;
		FixedDecimal = Blast.Classes.Develry.FixedDecimal;
	});

	describe('#toDry()', () => {
		it('should be able to be serialized', () => {

			let a = FixedDecimal('1.1'),
			    b = FixedDecimal('1.2');

			a.setArithmeticScale(1);
			b.setArithmeticScale(1);

			let result = a.add(b);

			let dry = result.toDry();

			assert.strictEqual(dry.value.string, '2.3');

			let revived = JSON.undry(JSON.dry(result));

			assert.strictEqual(revived.toString(), '2.3');
			assert.strictEqual(revived.constructor.name, 'FixedDecimal');

			let new_result = revived.add('1.123');
			assert.strictEqual(new_result.toString(), '3.4');
			assert.strictEqual(new_result.constructor.name, 'FixedDecimal');
		});
	});

	describe('#clone()', () => {

		it('should clone the instance', () => {

			let a = FixedDecimal('1.1'),
			    b = FixedDecimal('1.2');

			a.setArithmeticScale(1);
			b.setArithmeticScale(1);

			let result = a.add(b);

			let clone = result.clone();

			assert.strictEqual(clone.toString(), '2.3');
			assert.strictEqual(clone.constructor.name, 'FixedDecimal');
			assert.notStrictEqual(clone, result);
		});
	});

	describe('#add(value)', () => {

		it('should keep the original scale', () => {

			let original = FixedDecimal('1');
			let result = original.add('5');

			decimalEquals(result, '6');

			result = original.add('0.15');
			decimalEquals(result, '1');

			result = original.add('0.99');
			decimalEquals(result, '2');

			original = FixedDecimal('1', 2);
			result = original.add('0.15');
			decimalEquals(result, '1.15');

			result = original.add('0.99');
			decimalEquals(result, '1.99');

			original = FixedDecimal('1.20');
			result = original.add('0.15');
			decimalEquals(result, '1.35');
		});
	});

	describe('#multiply(value)', () => {
		it('should keep the original scale', () => {

			let original = FixedDecimal('1');
			let result = original.multiply('5');

			decimalEquals(result, '5');

			result = original.multiply('0.15');
			decimalEquals(result, '0');

			result = original.multiply('0.99');
			decimalEquals(result, '1');

			original = FixedDecimal('1', 2);
			result = original.multiply('0.15');
			decimalEquals(result, '0.15');

			result = original.multiply('0.99');
			decimalEquals(result, '0.99');

			original = FixedDecimal('1.20');
			result = original.multiply('0.15');
			decimalEquals(result, '0.18');

			original = FixedDecimal('1.33');
			result = original.multiply('2');
			decimalEquals(result, '2.66');

			original = FixedDecimal('0.66');
			result = original.multiply('0.2');
			decimalEquals(result, '0.13');
		});
	});

	describe('#divide(value)', () => {

		it('should keep the original scale', () => {

			let original = FixedDecimal('1');
			let result = original.divide('5');

			decimalEquals(result, '0');

			// @TODO: this will divide by zero & cause an error
			// result = original.divide('0.15');
			// decimalEquals(result, '6');

			result = original.divide('0.99');
			decimalEquals(result, '1');

			original = FixedDecimal('1', 2);
			result = original.divide('0.15');
			decimalEquals(result, '6.67');

			result = original.divide('0.99');
			decimalEquals(result, '1.01');

			original = FixedDecimal('1.20');
			result = original.divide('0.15');
			decimalEquals(result, '8.00');

			original = FixedDecimal('1.33');
			result = original.divide('2');
			decimalEquals(result, '0.67');

			original = FixedDecimal('0.66');
			result = original.divide('0.2');
			decimalEquals(result, '3.30');

			original = FixedDecimal('10.10');
			result = original.divide('3');
			decimalEquals(result, '3.37');
		});
	});
});

describe('MutableFixedDecimal', () => {

	before(() => {
		Blast = require('../index.js')();
		Decimal = Blast.Classes.Develry.Decimal;
		MutableDecimal = Blast.Classes.Develry.MutableDecimal;
		FixedDecimal = Blast.Classes.Develry.FixedDecimal;
		MutableFixedDecimal = Blast.Classes.Develry.MutableFixedDecimal;
	});

	describe('#add(value)', () => {

		it('should keep the original scale', () => {

			let original = MutableFixedDecimal('1');

			assert.strictEqual(original.constructor.name, 'MutableFixedDecimal');

			let result = original.add('5');

			decimalEquals(result, '6');

			assert.strictEqual(original, result);

			original.add(1);
			decimalEquals(original, '7');
			assert.strictEqual(original, result);

			original = MutableFixedDecimal('1.15');
			decimalEquals(original, '1.15');
			result = original.add('0.15');
			assert.strictEqual(original, result);
			
			decimalEquals(original, '1.30');
			

			result = original.add('1');
			decimalEquals(original, '2.30');
			assert.strictEqual(original, result);
		});
	});

});

function modulo(first_string, second_string, result_string, scale = 10) {

	let first = Decimal(first_string),
	    second = Decimal(second_string);

	first.setArithmeticScale(scale);
	second.setArithmeticScale(scale);

	let sum = first.modulo(second);

	decimalEquals(sum, result_string, `Decimal('${first_string}').modulo('${second_string}') should equal Decimal('${result_string}')`);
}

function sqrt(first_string, result_string) {
	let first = Decimal(first_string);

	let sum = first.squareRoot();

	decimalEquals(sum, result_string, `Decimal('${first_string}').squareRoot() should equal Decimal('${result_string}')`);
};

function pow(first_string, second_string, result_string, scale = 10) {
	let first = Decimal(first_string),
	    second = Decimal(second_string);

	first.setArithmeticScale(scale);
	second.setArithmeticScale(scale);

	let sum = first.power(second);

	decimalEquals(sum, result_string, `Decimal('${first_string}').power('${second_string}') should equal Decimal('${result_string}')`);
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