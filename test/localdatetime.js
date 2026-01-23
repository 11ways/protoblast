let assert = require('assert'),
    Blast,
    LocalDateTime,
    LocalDate,
    LocalTime,
    original_tz = process.env.TZ;

function setBrusselsTimezone() {
	// Set the timezone to Brussels
	process.env.TZ = 'Europe/Brussels';
}

function setNewYorkTimezone() {
	// Set the timezone to Brussels
	process.env.TZ = 'America/New_York';
}

function restoreOriginalTimezone() {
	process.env.TZ = original_tz;
}

describe('LocalDateTime', function() {

	before(() => {
		Blast  = require('../index.js')();
		LocalDateTime = Blast.Classes.Develry.LocalDateTime;
		LocalDate = Blast.Classes.Develry.LocalDate;
		LocalTime = Blast.Classes.Develry.LocalTime;
	});

	describe('.create()', () => {
		it('should return a new LocalDateTime object', () => {
			assert.equal(LocalDateTime.create().constructor.name, 'LocalDateTime');
		});

		it('should clone if it receives another LocalDateTime object', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52'),
			    cloned = LocalDateTime.create(local_date);

			assert.strictEqual(cloned.toNumericRepresentation(), local_date.toNumericRepresentation());
			assert.notStrictEqual(cloned, local_date);
		});

		it('should ignore timezones', () => {
			setNewYorkTimezone();
			let local_date = new LocalDateTime('2023-10-21');
			assertDateTime(local_date, '2023-10-21 00:00:00');

			setBrusselsTimezone();
			assertDateTime(local_date, '2023-10-21 00:00:00');

			local_date = new LocalDateTime('2023-10-21');
			assertDateTime(local_date, '2023-10-21 00:00:00');

			local_date = new LocalDateTime('2023/10/21');
			assertDateTime(local_date, '2023-10-21 00:00:00');
		});
	});

	describe('.fromNumericRepresentation(int_representation)', () => {
		it('should return a new LocalDateTime object from a BigInt representation', () => {

			let input = 2023_09_01_23_59_12_000n;

			let local_date = LocalDateTime.fromNumericRepresentation(input);

			assert.strictEqual(local_date.toString(), '2023-09-01 23:59:12');
		});
	});

	describe('#toString()', () => {
		it('should ignore timezone changes', () => {

			setBrusselsTimezone();
			let native_date = new Date('2023-10-21 17:12:52');
			let local_date = LocalDateTime.create('2023-10-21 17:12:52');

			assert.strictEqual(native_date.toString(), 'Sat Oct 21 2023 17:12:52 GMT+0200 (Central European Summer Time)');
			assert.strictEqual(local_date.toString(), '2023-10-21 17:12:52');

			setNewYorkTimezone();
			assert.strictEqual(native_date.toString(), 'Sat Oct 21 2023 11:12:52 GMT-0400 (Eastern Daylight Time)');
			assert.strictEqual(local_date.toString(), '2023-10-21 17:12:52');

			local_date = LocalDateTime.create('2023-10-21 17:12:52');
			assert.strictEqual(local_date.toString(), '2023-10-21 17:12:52');

			setBrusselsTimezone();
			local_date = LocalDateTime.create('2023-10-21 17:12:52');
			assert.strictEqual(local_date.toString(), '2023-10-21 17:12:52');

			local_date = new LocalDateTime(2023, 10, 21, 17, 12, 52);
			assert.strictEqual(local_date.toString(), '2023-10-21 17:12:52');
		});
	});

	describe('#[Symbol.toPrimitive]', () => {
		it('should behave like the Date class', () => {

			let local_date = LocalDateTime.create('2023-10-21 17:12:52');

			let number = 2 * local_date;

			assert.strictEqual(number, local_date.valueOf() * 2);
			assert.strictEqual(local_date.toString(), '' + local_date);
		});
	});

	describe('#toNumericRepresentation()', () => {
		it('should return a custom integer representation of the local datetime', () => {
			setBrusselsTimezone();
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.toNumericRepresentation(), 2023_10_21_17_12_52_000n);

			setNewYorkTimezone();
			assert.strictEqual(local_date.toNumericRepresentation(), 2023_10_21_17_12_52_000n);

			setBrusselsTimezone();
		});
	});

	describe('#toDry() & .unDry()', () => {
		it('should prepare the object for drying', () => {

			setBrusselsTimezone();
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let dried = JSON.dry(local_date);

			setNewYorkTimezone();
			let revived = JSON.undry(dried);
			
			assert.notStrictEqual(revived, local_date);

			assert.strictEqual(revived.toNumericRepresentation(), local_date.toNumericRepresentation());
		});
	});

	describe('#clone()', () => {
		it('should clone the date', () => {

			setBrusselsTimezone();
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let cloned = local_date.clone();

			setNewYorkTimezone();
			assert.strictEqual(cloned.toNumericRepresentation(), local_date.toNumericRepresentation());
			assert.notStrictEqual(cloned, local_date);
		});
	});

	describe('#add(amount, unit)', () => {

		it('should add 1 unit if only unit is defined', function() {

			let a = new LocalDateTime('2014-11-15 12:49:29');

			// amount is 1 if only a unit is given
			assert.equal(a.clone().add('day').toString(), '2014-11-16 12:49:29');

			// null or undefined is 0
			assert.equal(a.clone().add(null, 'day').toString(), '2014-11-15 12:49:29');
			assert.equal(a.clone().add(undefined, 'day').toString(), '2014-11-15 12:49:29');
		});

		it('should handle days, months & years differently', () => {

			let base = new LocalDateTime('2023-10-12 15:41:31');

			// This should skip the DST change!
			assertDateTime(base.clone().add(19, 'days'), '2023-10-31 15:41:31');

			// It should simply change the month, never the hour
			assertDateTime(base.clone().add(19, 'days').add(1, 'month'), '2023-12-01 15:41:31');
			assertDateTime(base.clone().add(1, 'month'), '2023-11-12 15:41:31');
			assertDateTime(base.clone().add(2, 'month'), '2023-12-12 15:41:31');
			assertDateTime(base.clone().add(8, 'month'), '2024-06-12 15:41:31');
		});

		it('should ignore DST', () => {

			setBrusselsTimezone();

			// Naming is wrong: it's actually the reverse. Anyway.
			let before_dst = new LocalDateTime('2023-10-28 11:12:13');
			let after_dst = before_dst.clone().add(1, 'day');

			assertDateTime(after_dst, '2023-10-29 11:12:13');

			after_dst = before_dst.clone().add(24, 'hours');
			assertDateTime(after_dst, '2023-10-29 11:12:13');

			before_dst = new LocalDateTime('2023-10-29 02:59:59');
			after_dst = before_dst.clone().add(1, 'second');

			// According to DST rules, this should become 02:00:00 again.
			// But we ignore that!
			assertDateTime(after_dst, '2023-10-29 03:00:00');

			// Now actually going into DST
			before_dst = new LocalDateTime('2023-03-26 02:00:00');
			// @TODO: This WILL turn into 2023-03-26 03:00:00,
			// because this is still the native parser parsing it that way!
			after_dst = before_dst.clone().add(1, 'second');
			//assertDate(after_dst, '2023-03-26 02:00:01');

		});
	});

	describe('#startOf(unit)', () => {
		it('should set the time to the start of the unit', function() {

			setBrusselsTimezone();
			let a = new LocalDateTime('2014-11-15 12:49:29');

			assert.equal(a.clone().startOf('day').toString(), '2014-11-15 00:00:00');
			assert.equal(a.clone().startOf('month').toString(), '2014-11-01 00:00:00');
			assert.equal(a.clone().startOf('year').toString(), '2014-01-01 00:00:00');

			setNewYorkTimezone();
			assert.equal(a.clone().startOf('day').toString(), '2014-11-15 00:00:00');
			assert.equal(a.clone().startOf('month').toString(), '2014-11-01 00:00:00');
			assert.equal(a.clone().startOf('year').toString(), '2014-01-01 00:00:00');

			a = new LocalDateTime('2014-11-15 12:49:29');

			assert.equal(a.clone().startOf('day').toString(), '2014-11-15 00:00:00');
			assert.equal(a.clone().startOf('month').toString(), '2014-11-01 00:00:00');
			assert.equal(a.clone().startOf('year').toString(), '2014-01-01 00:00:00');
		});
	});

	describe('#endOf(unit)', () => {
		it('should set the time to the end of the unit', function() {

			setBrusselsTimezone();
			let a = new LocalDateTime('2014-11-15 12:49:29');

			assert.equal(a.clone().endOf('day').toString(), '2014-11-15 23:59:59');
			assert.equal(a.clone().endOf('month').toString(), '2014-11-30 23:59:59');
			assert.equal(a.clone().endOf('year').toString(), '2014-12-31 23:59:59');

			setNewYorkTimezone();
			assert.equal(a.clone().endOf('day').toString(), '2014-11-15 23:59:59');
			assert.equal(a.clone().endOf('month').toString(), '2014-11-30 23:59:59');
			assert.equal(a.clone().endOf('year').toString(), '2014-12-31 23:59:59');
		});
	});

	describe('#withTime(time)', () => {

		it('should accept time as string', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withTime('12:34:56');

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-21 12:34:56');

			new_date = local_date.withTime('12:34');
			assertDateTime(new_date, '2023-10-21 12:34:00');
		});

		it('should accept time as a LocalTime', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withTime(LocalTime.create('12:34:56'));

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-21 12:34:56');
		});

		it('should accept native Date objects', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withTime(new Date('2023-10-01 12:34:56'));

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-21 12:34:56');
		});

		it('should accept other LocalDateTime object', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withTime(new LocalDateTime('2023-10-01 12:34:56'));

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-21 12:34:56');
		});
	});

	describe('#withDate(date)', () => {

		it('should accept date as string', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withDate('2023-10-01');

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-01 17:12:52');
		});

		it('should accept date as a LocalDate', () => {
			
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withDate(LocalDate.create('2023-10-01'));

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-01 17:12:52');
		});

		it('should accept date as another LocalDateTime', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withDate(new LocalDateTime('2023-10-01 12:34:56'));

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-01 17:12:52');
		});

		it('should accept native Date objects', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let new_date = local_date.withDate(new Date('2023-10-01 12:34:56'));

			assertDateTime(local_date, '2023-10-21 17:12:52');
			assertDateTime(new_date, '2023-10-01 17:12:52');
		});
	});

	describe('#getTime()', () => {
		it('should get the time', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let time = local_date.getTime();

			assert.strictEqual(time.constructor.name, 'LocalTime');
			assert.strictEqual(time.toString(), '17:12:52');

			local_date = new LocalDateTime('2023-10-21');
			time = local_date.getTime();
			assert.strictEqual(time.toString(), '00:00:00');
		});
	});

	describe('#setTime(time)', () => {
		it('should set the time in-place', () => {

			let local_date = new LocalDateTime('2023-10-21 17:12:52');

			local_date.setTime('12:34:56');

			assertDateTime(local_date, '2023-10-21 12:34:56');

			local_date.setTime(new Date('2023-10-01 10:00:14'));
			assertDateTime(local_date, '2023-10-21 10:00:14');

			local_date.setTime(new LocalDateTime('2023-10-01 07:11:14'));
			assertDateTime(local_date, '2023-10-21 07:11:14');
		});
	});

	describe('#getDayOfWeek()', () => {
		it('get the current day of the week', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getDayOfWeek(), 6);

			local_date = new LocalDateTime('2023-10-22 17:12:52');
			assert.strictEqual(local_date.getDayOfWeek(), 7);
		});
	});

	describe('#getDate()', () => {
		it('should get the local date portion', () => {

			let initial = new LocalDateTime('2023-10-21 17:12:52');
			let local_date = initial.getDate();

			assert.strictEqual(local_date.constructor.name, 'LocalDate');
			assert.strictEqual(local_date.toString(), '2023-10-21');
		});
	});

	describe('#setDate(date)', () => {
		it('should set the date in-place', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');

			local_date.setDate('2023-10-01');

			assertDateTime(local_date, '2023-10-01 17:12:52');

			local_date.setDate(new Date('2023-10-05 10:00:14'));
			assertDateTime(local_date, '2023-10-05 17:12:52');

			local_date.setDate(new LocalDateTime('2023-10-02 07:11:14'));
			assertDateTime(local_date, '2023-10-02 17:12:52');
		});
	});

	describe('#getWeekDay()', () => {
		it('should return the day of the week', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getWeekDay(), 6);

			local_date.add(1, 'day');
			assert.strictEqual(local_date.getWeekDay(), 7);

			local_date.add(1, 'day');
			assert.strictEqual(local_date.getWeekDay(), 1);
		});
	});

	describe('#setWeekDay(week_day)', () => {
		it('should set the day of the current week', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getWeekDay(), 6);

			local_date.setWeekDay(1);
			assertDateTime(local_date, '2023-10-16 17:12:52');

			local_date.setWeekDay(7);
			assertDateTime(local_date, '2023-10-22 17:12:52');
		});
	});

	describe('#getCurrentDayOfYear()', () => {
		it('should return the number of this day in the year', () => {
			let local_date = new LocalDateTime('2024-01-01 17:12:52');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 1);

			local_date = new LocalDateTime('2024-01-01 00:00:00');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 1);

			local_date = new LocalDateTime('2024-01-31 17:12:52');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 31);

			local_date = new LocalDateTime('2024-02-29 17:12:52');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 60);

			local_date = new LocalDateTime('2024-03-01 17:12:52');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 61);

			local_date = new LocalDateTime('2023-03-01 17:12:52');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 60);

			local_date = new LocalDateTime('2023-03-01 23:59:59');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 60);

			local_date = new LocalDateTime('2023-12-31 00:00:00');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 365);

			local_date = new LocalDateTime('2024-12-31 00:00:00');
			assert.strictEqual(local_date.getCurrentDayOfYear(), 366);
		});
	});

	describe('#getWeekOfYear()', () => {
		it('should return the week number of the current year', () => {
			let local_date = new LocalDateTime('2023-01-01 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 0);

			local_date = new LocalDateTime('2023-01-02 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 1);

			local_date = new LocalDateTime('2023-01-03 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 1);

			local_date = new LocalDateTime('2023-01-07 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 1);

			local_date = new LocalDateTime('2023-01-08 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 1);

			local_date = new LocalDateTime('2023-01-09 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 2);

			local_date = new LocalDateTime('2023-10-22 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 42);

			local_date = new LocalDateTime('2024-01-01 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 1);

			local_date = new LocalDateTime('2023-12-31 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 52);

			local_date = new LocalDateTime('2024-12-31 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 53);

			local_date = new LocalDateTime('2032-12-31 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 53);

			local_date = new LocalDateTime('2033-01-01 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 0);

			local_date = new LocalDateTime('2033-01-02 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 0);

			local_date = new LocalDateTime('2033-01-03 00:00:00');
			assert.strictEqual(local_date.getWeekOfYear(), 1);
		});
	});

	describe('#getWeek()', () => {
		it('should return the current ISO week number', () => {
			let local_date = new LocalDateTime('2023-01-01 00:00:00');
			assert.strictEqual(local_date.getWeek(), 52);

			local_date = new LocalDateTime('2023-01-02 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);

			local_date = new LocalDateTime('2023-01-03 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);

			local_date = new LocalDateTime('2023-01-07 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);

			local_date = new LocalDateTime('2023-01-08 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);

			local_date = new LocalDateTime('2023-01-09 00:00:00');
			assert.strictEqual(local_date.getWeek(), 2);

			local_date = new LocalDateTime('2023-10-22 00:00:00');
			assert.strictEqual(local_date.getWeek(), 42);

			local_date = new LocalDateTime('2024-01-01 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);

			local_date = new LocalDateTime('2023-12-31 00:00:00');
			assert.strictEqual(local_date.getWeek(), 52);

			local_date = new LocalDateTime('2024-12-31 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);

			local_date = new LocalDateTime('2026-12-31 00:00:00');
			assert.strictEqual(local_date.getWeek(), 53);

			local_date = new LocalDateTime('2027-01-01 00:00:00');
			assert.strictEqual(local_date.getWeek(), 53);

			local_date = new LocalDateTime('2032-12-30 00:00:00');
			assert.strictEqual(local_date.getWeek(), 53);

			local_date = new LocalDateTime('2033-01-01 00:00:00');
			assert.strictEqual(local_date.getWeek(), 53);

			local_date = new LocalDateTime('2033-01-02 00:00:00');
			assert.strictEqual(local_date.getWeek(), 53);

			local_date = new LocalDateTime('2033-01-03 00:00:00');
			assert.strictEqual(local_date.getWeek(), 1);
		});
	});

	describe('#getYear()', () => {
		it('should return the current year', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getYear(), 2023);

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			assert.strictEqual(local_date.getYear(), 2024);
		});
	});

	describe('#setYear(new_year)', () => {
		it('should set the year of the date', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			local_date.setYear(1999);
			assert.strictEqual(local_date.getYear(), 1999);
			assertDateTime(local_date, '1999-10-21 17:12:52');

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			local_date.setYear(2023);
			assert.strictEqual(local_date.getYear(), 2023);
			assert.strictEqual(local_date.getMonth(), 3);

			assertDateTime(local_date, '2023-03-01 00:10:10');
		});
	});

	describe('#getMonth()', () => {
		it('should return the current month', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getMonth(), 10);

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			assert.strictEqual(local_date.getMonth(), 2);
		});
	});

	describe('#setMonth()', () => {
		it('should set the current month', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			local_date.setMonth(1);
			assertDateTime(local_date, '2023-01-21 17:12:52');

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			local_date.setMonth(2);
			assertDateTime(local_date, '2024-02-29 00:10:10');

			local_date.setMonth(3);
			assertDateTime(local_date, '2024-03-29 00:10:10');

			local_date = new LocalDateTime('2023-01-29 00:10:10');
			assertDateTime(local_date, '2023-01-29 00:10:10');

			local_date.setMonth(2);
			assertDateTime(local_date, '2023-03-01 00:10:10');

			local_date = new LocalDateTime('2023-01-31 00:10:10');
			local_date.setMonth(2);
			assertDateTime(local_date, '2023-03-03 00:10:10');
		});
	});

	describe('#getDay()', () => {
		it('should return the current day', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getDay(), 21);

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			assert.strictEqual(local_date.getDay(), 29);
		});
	});

	describe('#setDay(new_day)', () => {
		it('should set the current day', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			local_date.setDay(11);
			assert.strictEqual(local_date.getDay(), 11);
			assertDateTime(local_date, '2023-10-11 17:12:52');

			local_date.setDay(32);
			assert.strictEqual(local_date.getDay(), 1);
			assertDateTime(local_date, '2023-11-01 17:12:52');

			local_date = new LocalDateTime('2023-02-28 00:10:10');
			assert.strictEqual(local_date.getDay(), 28);

			local_date.setDay(29);
			assert.strictEqual(local_date.getDay(), 1);
			assertDateTime(local_date, '2023-03-01 00:10:10');
		});
	});

	describe('#getHours()', () => {
		it('should return the current hour', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getHours(), 17);

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			assert.strictEqual(local_date.getHours(), 0);
		});
	});

	describe('#setHours(new_hours)', () => {
		it('should set the current hour', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			local_date.setHours(11);
			assert.strictEqual(local_date.getHours(), 11);
			assertDateTime(local_date, '2023-10-21 11:12:52');

			local_date.setHours(24);
			assert.strictEqual(local_date.getHours(), 0);
			assertDateTime(local_date, '2023-10-22 00:12:52');
		});
	});

	describe('#getMinutes()', () => {
		it('should return the current minute', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			assert.strictEqual(local_date.getMinutes(), 12);

			local_date = new LocalDateTime('2024-02-29 00:10:10');
			assert.strictEqual(local_date.getMinutes(), 10);
		});
	});

	describe('#setMinutes(new_minutes)', () => {
		it('should set the current minutes', () => {
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			local_date.setMinutes(11);
			assert.strictEqual(local_date.getMinutes(), 11);
			assertDateTime(local_date, '2023-10-21 17:11:52');

			local_date.setMinutes(60);
			assert.strictEqual(local_date.getMinutes(), 0);
			assertDateTime(local_date, '2023-10-21 18:00:52');
		});
	});

	describe('#isBefore(other_date)', () => {
		it('should compare with regular Date instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new Date('2023-10-30 15:00:00');
			let after_date = new Date('2023-10-30 16:00:00');
			let same_date = new Date('2023-10-30 15:43:00');

			assert.strictEqual(local_date.isBefore(before_date), false);
			assert.strictEqual(local_date.isBefore(after_date), true);
			assert.strictEqual(local_date.isBefore(same_date), false);
		});

		it('should compare with other LocalDateTime instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new LocalDateTime('2023-10-30 15:00:00');
			let after_date = new LocalDateTime('2023-10-30 16:00:00');
			let same_date = new LocalDateTime('2023-10-30 15:43:00');

			assert.strictEqual(local_date.isBefore(before_date), false);
			assert.strictEqual(local_date.isBefore(after_date), true);
			assert.strictEqual(local_date.isBefore(same_date), false);
		});

		it('should parse date strings', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = '2023-10-30 15:00:00';
			let after_date = '2023-10-30 16:00:00';
			let same_date = '2023-10-30 15:43:00';

			assert.strictEqual(local_date.isBefore(before_date), false);
			assert.strictEqual(local_date.isBefore(after_date), true);
			assert.strictEqual(local_date.isBefore(same_date), false);

			let no_time = '2023-10-30';
			assert.strictEqual(local_date.isBefore(no_time), false);
		});

		it('should accept LocalDate instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new LocalDate('2023-10-30');
			let after_date = new LocalDate('2023-10-31');
			let same_date = new LocalDate('2023-10-30');

			assert.strictEqual(local_date.isBefore(before_date), false);
			assert.strictEqual(local_date.isBefore(after_date), true);
			assert.strictEqual(local_date.isBefore(same_date), false);
		});

		it('should accept LocalTime instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new LocalTime('15:00:00');
			let after_date = new LocalTime('16:00:00');
			let same_date = new LocalTime('15:43:00');

			assert.strictEqual(local_date.isBefore(before_date), false);
			assert.strictEqual(local_date.isBefore(after_date), true);
			assert.strictEqual(local_date.isBefore(same_date), false);
		});
	});

	describe('#isAfter(other_date)', () => {
		it('should compare with regular Date instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new Date('2023-10-30 15:00:00');
			let after_date = new Date('2023-10-30 16:00:00');
			let same_date = new Date('2023-10-30 15:43:00');

			assert.strictEqual(local_date.isAfter(before_date), true);
			assert.strictEqual(local_date.isAfter(after_date), false);
			assert.strictEqual(local_date.isAfter(same_date), false);
		});

		it('should compare with other LocalDateTime instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new LocalDateTime('2023-10-30 15:00:00');
			let after_date = new LocalDateTime('2023-10-30 16:00:00');
			let same_date = new LocalDateTime('2023-10-30 15:43:00');

			assert.strictEqual(local_date.isAfter(before_date), true);
			assert.strictEqual(local_date.isAfter(after_date), false);
			assert.strictEqual(local_date.isAfter(same_date), false);
		});

		it('should parse date strings', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = '2023-10-30 15:00:00';
			let after_date = '2023-10-30 16:00:00';
			let same_date = '2023-10-30 15:43:00';

			assert.strictEqual(local_date.isAfter(before_date), true);
			assert.strictEqual(local_date.isAfter(after_date), false);
			assert.strictEqual(local_date.isAfter(same_date), false);

			let no_time = '2023-10-30';
			assert.strictEqual(local_date.isAfter(no_time), false);
		});

		it('should accept LocalDate instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new LocalDate('2023-10-30');
			let after_date = new LocalDate('2023-10-31');
			let same_date = new LocalDate('2023-10-30');

			assert.strictEqual(local_date.isAfter(before_date), false);
			assert.strictEqual(local_date.isAfter(after_date), false);
			assert.strictEqual(local_date.isAfter(same_date), false);
		});

		it('should accept LocalTime instances', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let before_date = new LocalTime('15:00:00');
			let after_date = new LocalTime('16:00:00');
			let same_date = new LocalTime('15:43:00');

			assert.strictEqual(local_date.isAfter(before_date), true);
			assert.strictEqual(local_date.isAfter(after_date), false);
			assert.strictEqual(local_date.isAfter(same_date), false);
		});
	});

	describe('#isOnSameDate(other_date)', () => {

		it('should see if the year-month-day are the same', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');
			let same_date = new LocalDateTime('2023-10-30 16:00:00');
			let other_date = new LocalDateTime('2023-10-31 15:43:00');

			assert.strictEqual(local_date.isOnSameDate(same_date), true);
			assert.strictEqual(local_date.isOnSameDate(other_date), false);

			let other_local_date = new LocalDateTime('2023-10-10');
			assert.strictEqual(local_date.isOnSameDate(other_local_date), false);
		});

		it('should accept strings', () => {

			let local_date = new LocalDateTime('2023-10-30 15:43:00');

			assert.strictEqual(local_date.isOnSameDate('2023-10-30'), true);
			assert.strictEqual(local_date.isOnSameDate('2023-10-31'), false);

			assert.strictEqual(local_date.isOnSameDate('2023-10-30 15:43:00'), true);
			assert.strictEqual(local_date.isOnSameDate('2023-10-31 15:43:00'), false);
		});
	});

	describe('#valueOf()', () => {
		it('should return the integer representation in the current timezone', () => {

			setBrusselsTimezone();
			let local_date = new LocalDateTime('2023-10-21 17:12:52');
			let native_date = new Date('2023-10-21 17:12:52');

			let local_value = +local_date,
			    native_value = +native_date;

			assert.strictEqual(local_value, native_value);

			setNewYorkTimezone();

			let second_local_value = +local_date,
			    second_native_value = +native_date;

			assert.notStrictEqual(second_local_value, second_native_value);

			// Timezones only change representations of the timestamp,
			// not the actual value.
			assert.strictEqual(second_native_value, native_value);

			// But recreate the date in the current timezone
			native_date = new Date('2023-10-21 17:12:52');

			let third_native_value = +native_date;

			assert.strictEqual(third_native_value, second_local_value);

			setBrusselsTimezone();
		});
	});
});

describe('LocalDate', function() {

	before(() => {
		// Ensure Blast is loaded (in case this describe runs in isolation)
		if (!Blast) {
			Blast = require('../index.js')();
			LocalDateTime = Blast.Classes.Develry.LocalDateTime;
			LocalDate = Blast.Classes.Develry.LocalDate;
			LocalTime = Blast.Classes.Develry.LocalTime;
		}
	});

	describe('.create()', () => {
		it('should return a new LocalDate object', () => {
			assert.equal(LocalDate.create().constructor.name, 'LocalDate');
		});

		it('should clone if it receives another LocalDate object', () => {
			
			let local_date = new LocalDate('2023-10-21'),
			    cloned = LocalDate.create(local_date);

			assert.strictEqual(cloned.toNumericRepresentation(), local_date.toNumericRepresentation());
			assert.notStrictEqual(cloned, local_date);
		});

		it('should ignore timezones', () => {
			setNewYorkTimezone();
			let local_date = new LocalDate('2023-10-21');
			assertDate(local_date, '2023-10-21');
		});
	});

	describe('#add(amount, unit)', () => {

		it('should add 1 unit if only unit is defined', function() {

			let a = new LocalDate('2014-11-15 12:49:29');

			// amount is 1 if only a unit is given
			assert.equal(a.clone().add('day').toString(), '2014-11-16');

			// null or undefined is 0
			assert.equal(a.clone().add(null, 'day').toString(), '2014-11-15');
			assert.equal(a.clone().add(undefined, 'day').toString(), '2014-11-15');
		});

		it('should handle days, months & years differently', () => {

			let base = new LocalDate('2023-10-12');

			// This should skip the DST change!
			assertDate(base.clone().add(19, 'days'), '2023-10-31');

			// It should simply change the month, never the hour
			assertDate(base.clone().add(19, 'days').add(1, 'month'), '2023-12-01');
			assertDate(base.clone().add(1, 'month'), '2023-11-12');
			assertDate(base.clone().add(2, 'month'), '2023-12-12');
			assertDate(base.clone().add(8, 'month'), '2024-06-12');
		});

		it('should ignore DST', () => {

			setBrusselsTimezone();

			// Naming is wrong: it's actually the reverse. Anyway.
			let before_dst = new LocalDate('2023-10-28 11:12:13');
			let after_dst = before_dst.clone().add(1, 'day');

			assertDate(after_dst, '2023-10-29');

			after_dst = before_dst.clone().add(23, 'hours');
			assertDate(after_dst, '2023-10-28');

			after_dst = before_dst.clone().add(24, 'hours');
			assertDate(after_dst, '2023-10-29');

			after_dst = before_dst.clone().add(25, 'hours');
			assertDate(after_dst, '2023-10-29');

			before_dst = new LocalDate('2023-10-29');
			after_dst = before_dst.clone().add(1, 'second');
			assertDate(after_dst, '2023-10-29');

			after_dst = before_dst.clone().add(23, 'hours');
			assertDate(after_dst, '2023-10-29');

			after_dst = before_dst.clone().add(24, 'hours');
			assertDate(after_dst, '2023-10-30');

			after_dst = before_dst.clone().add(25, 'hours');
			assertDate(after_dst, '2023-10-30');
		});

		it('should ignore adding anything under 24 hours', () => {

			setBrusselsTimezone();

			let before_dst = new LocalDate('2023-10-28 11:12:13');
			let after_dst = before_dst.clone().add(23, 'hours');

			assertDate(after_dst, '2023-10-28');

			after_dst = before_dst.clone().add(24, 'hours');
			assertDate(after_dst, '2023-10-29');

			after_dst = before_dst.clone().add(25, 'hours');
			assertDate(after_dst, '2023-10-29');

			let temp = before_dst.clone();
			temp.add(10, 'hours');
			temp.add(10, 'hours');
			temp.add(10, 'hours');
			temp.add(10, 'hours');

			// Should not have had any effect: time is not kept
			assertDate(temp, '2023-10-28');
		});
	});

	describe('#startOf(unit)', () => {
		it('should set the time to the start of the unit', function() {

			setBrusselsTimezone();
			let a = new LocalDate('2014-11-15');

			assert.equal(a.clone().startOf('day').toString(), '2014-11-15');
			assert.equal(a.clone().startOf('month').toString(), '2014-11-01');
			assert.equal(a.clone().startOf('year').toString(), '2014-01-01');

			setNewYorkTimezone();
			assert.equal(a.clone().startOf('day').toString(), '2014-11-15');
			assert.equal(a.clone().startOf('month').toString(), '2014-11-01');
			assert.equal(a.clone().startOf('year').toString(), '2014-01-01');

			a = new LocalDate('2014-11-15 12:49:29');

			assert.equal(a.clone().startOf('day').toString(), '2014-11-15');
			assert.equal(a.clone().startOf('month').toString(), '2014-11-01');
			assert.equal(a.clone().startOf('year').toString(), '2014-01-01');
		});
	});

	describe('#endOf(unit)', () => {
		it('should set the time to the end of the unit', function() {

			setBrusselsTimezone();
			let a = new LocalDate('2014-11-15');

			assert.equal(a.clone().endOf('day').toString(), '2014-11-15');
			assert.equal(a.clone().endOf('month').toString(), '2014-11-30');
			assert.equal(a.clone().endOf('year').toString(), '2014-12-31');

			setNewYorkTimezone();
			assert.equal(a.clone().endOf('day').toString(), '2014-11-15');
			assert.equal(a.clone().endOf('month').toString(), '2014-11-30');
			assert.equal(a.clone().endOf('year').toString(), '2014-12-31');
		});
	});

	describe('#withTime(time)', () => {

		it('should accept time as string', () => {
			let local_date = new LocalDate('2023-10-21');
			let new_date = local_date.withTime('12:34:56');

			assertDateTime(new_date, '2023-10-21 12:34:56');

			new_date = local_date.withTime('12:34');
			assertDateTime(new_date, '2023-10-21 12:34:00');
		});

		it('should accept time as a LocalTime', () => {
			let local_date = new LocalDate('2023-10-21');
			let new_date = local_date.withTime(LocalTime.create('12:34:56'));

			assertDateTime(new_date, '2023-10-21 12:34:56');
		});

		it('should accept native Date objects', () => {

			let local_date = new LocalDate('2023-10-21');
			let new_date = local_date.withTime(new Date('2023-10-01 12:34:56'));

			assertDateTime(new_date, '2023-10-21 12:34:56');
		});

		it('should accept other LocalDateTime object', () => {

			let local_date = new LocalDate('2023-10-21');
			let new_date = local_date.withTime(new LocalDateTime('2023-10-01 12:34:56'));

			assertDateTime(new_date, '2023-10-21 12:34:56');
		});
	});

	describe('#withDate(date)', () => {

		it('should accept date as string', () => {

			let local_date = new LocalDate('2023-10-21 17:12:52');
			let new_date = local_date.withDate('2023-10-01');

			assertDate(local_date, '2023-10-21');
			assertDate(new_date, '2023-10-01');
			assert.strictEqual(new_date.constructor.name, 'LocalDate');
		});
	});

	describe('#getTime(time)', () => {
		it('should get the time', () => {

			let local_date = new LocalDate('2023-10-21 17:12:52');
			let time = local_date.getTime();

			assert.strictEqual(time.constructor.name, 'LocalTime');
			assert.strictEqual(time.toString(), '00:00:00');

			local_date = new LocalDate('2023-10-21');
			time = local_date.getTime();
			assert.strictEqual(time.toString(), '00:00:00');
		});
	});

	describe('#getDate()', () => {
		it('should get the local date portion', () => {

			let initial = new LocalDate('2023-10-21');
			let local_date = initial.getDate();

			assert.strictEqual(local_date.constructor.name, 'LocalDate');
			assert.strictEqual(local_date.toString(), '2023-10-21');

			assert.notStrictEqual(local_date, initial);
		});
	});

	describe('#setDate(date)', () => {
		it('should set the date in-place', () => {
			let local_date = new LocalDate('2023-10-21');

			local_date.setDate('2023-10-01');

			assertDate(local_date, '2023-10-01');

			local_date.setDate(new Date('2023-10-05 10:00:14'));
			assertDate(local_date, '2023-10-05');

			local_date.setDate(new LocalDateTime('2023-10-02 07:11:14'));
			assertDate(local_date, '2023-10-02');
		});
	});

	describe('#toNumericRepresentation()', () => {
		it('should return a custom integer representation of the local datetime', () => {
			setBrusselsTimezone();
			let local_date = new LocalDate('2023-10-21');
			assert.strictEqual(local_date.toNumericRepresentation(), 2023_10_21);

			setNewYorkTimezone();
			assert.strictEqual(local_date.toNumericRepresentation(), 2023_10_21);

			setBrusselsTimezone();
		});
	});

	describe('#toDry() & .unDry()', () => {
		it('should prepare the object for drying', () => {

			setBrusselsTimezone();
			let local_date = new LocalDate('2023-10-21');
			let dried = JSON.dry(local_date);

			setNewYorkTimezone();
			let revived = JSON.undry(dried);
			
			assert.notStrictEqual(revived, local_date);

			assert.strictEqual(revived.toNumericRepresentation(), local_date.toNumericRepresentation());
		});
	});

	describe('#getWeekDay()', () => {
		it('should return the day of the week', () => {
			setNewYorkTimezone();
			let local_date = new LocalDate('2023-10-21');
			assert.strictEqual(local_date.getWeekDay(), 6);

			local_date.add(1, 'day');
			assert.strictEqual(local_date.getWeekDay(), 7);

			local_date.add(1, 'day');
			assert.strictEqual(local_date.getWeekDay(), 1);

			local_date = new LocalDate('2023-10-21 23:59:59');
			assert.strictEqual(local_date.getWeekDay(), 6);

			local_date.add(1, 'day');
			assert.strictEqual(local_date.getWeekDay(), 7);

			local_date.add(1, 'day');
			assert.strictEqual(local_date.getWeekDay(), 1);

			setBrusselsTimezone();
			assert.strictEqual(local_date.getWeekDay(), 1);
		});
	});

	describe('#valueOf()', () => {
		it('should return the integer representation in the current timezone', () => {

			setBrusselsTimezone();
			let local_date = new LocalDate('2023-10-21 17:12:52');
			let native_date = new Date('2023-10-21 17:12:52');

			let local_value = +local_date,
			    native_value = +native_date;

			assert.strictEqual(local_value < native_value, true);

			local_date = new LocalDate('2023-10-22');

			assert.strictEqual(local_date > native_date, true);
		});
	});

	describe('#toString()', () => {
		it('should ignore timezone changes', () => {

			setBrusselsTimezone();
			let native_date = new Date('2023-10-21 17:12:52');
			let local_date = LocalDate.create('2023-10-21 17:12:52');

			assert.strictEqual(native_date.toString(), 'Sat Oct 21 2023 17:12:52 GMT+0200 (Central European Summer Time)');
			assert.strictEqual(local_date.toString(), '2023-10-21');

			setNewYorkTimezone();
			assert.strictEqual(native_date.toString(), 'Sat Oct 21 2023 11:12:52 GMT-0400 (Eastern Daylight Time)');
			assert.strictEqual(local_date.toString(), '2023-10-21');

			local_date = LocalDate.create('2023-10-21 17:12:52');
			assert.strictEqual(local_date.toString(), '2023-10-21');

			setBrusselsTimezone();
			local_date = LocalDate.create('2023-10-21 17:12:52');
			assert.strictEqual(local_date.toString(), '2023-10-21');

			local_date = new LocalDate(2023, 10, 22);
			assert.strictEqual(local_date.toString(), '2023-10-22');
		});
	});

	describe('#relativeTo(reference)', function() {
		it('should return a relative time string', function() {
			let reference = LocalDate.create('2026-01-23');
			let date;

			// 1 day before
			date = LocalDate.create('2026-01-22');
			assert.strictEqual(date.relativeTo(reference), 'a day ago');

			// 1 day after
			date = LocalDate.create('2026-01-24');
			assert.strictEqual(date.relativeTo(reference), 'a day from now');

			// 7 days before
			date = LocalDate.create('2026-01-16');
			assert.strictEqual(date.relativeTo(reference), '7 days ago');
		});

		it('should default to now if no reference provided', function() {
			let date = LocalDate.create();
			date.subtract(1, 'day');
			// Result includes time component since reference is "now" with current time
			// Just check it contains "day" since exact wording depends on time of day
			assert.ok(date.relativeTo().includes('day'), 'Should include "day"');
		});
	});

	describe('#timeAgo()', function() {
		it('should return a relative time string compared to now', function() {
			let date = LocalDate.create();
			date.subtract(1, 'day');
			// Result includes time component since reference is "now" with current time
			let result = date.timeAgo();
			assert.ok(result.includes('ago'), 'Past date should include "ago": ' + result);

			date = LocalDate.create();
			date.add(1, 'day');
			result = date.timeAgo();
			assert.ok(result.includes('from now'), 'Future date should include "from now": ' + result);
		});
	});

	describe('#relativeToCalendar(reference)', function() {
		it('should return calendar-relative strings', function() {
			let reference = LocalDate.create('2026-01-23');
			let date;

			// Same day
			date = LocalDate.create('2026-01-23');
			assert.strictEqual(date.relativeToCalendar(reference), 'today');

			// Tomorrow
			date = LocalDate.create('2026-01-24');
			assert.strictEqual(date.relativeToCalendar(reference), 'tomorrow');

			// Yesterday
			date = LocalDate.create('2026-01-22');
			assert.strictEqual(date.relativeToCalendar(reference), 'yesterday');

			// 3 days ago (same week)
			date = LocalDate.create('2026-01-20');
			assert.strictEqual(date.relativeToCalendar(reference), '3 days ago');

			// Sunday (crossed week boundary, 5 days ago)
			date = LocalDate.create('2026-01-18');
			assert.strictEqual(date.relativeToCalendar(reference), 'last week');
		});

		it('should default to now if no reference provided', function() {
			let date = LocalDate.create();
			assert.strictEqual(date.relativeToCalendar(), 'today');

			date.subtract(1, 'day');
			assert.strictEqual(date.relativeToCalendar(), 'yesterday');
		});
	});

	describe('.getDateRange(period, reference)', function() {

		it('should return today range', function() {
			let reference = LocalDate.create('2026-01-23');
			let range = LocalDate.getDateRange('today', reference);

			assert.strictEqual(range.from.toString(), '2026-01-23');
			assert.strictEqual(range.to.toString(), '2026-01-23');
		});

		it('should return yesterday range', function() {
			let reference = LocalDate.create('2026-01-23');
			let range = LocalDate.getDateRange('yesterday', reference);

			assert.strictEqual(range.from.toString(), '2026-01-22');
			assert.strictEqual(range.to.toString(), '2026-01-22');
		});

		it('should return this_week range (Mon-Sun)', function() {
			// 2026-01-23 is a Friday
			let reference = LocalDate.create('2026-01-23');
			let range = LocalDate.getDateRange('this_week', reference);

			// Monday of that week
			assert.strictEqual(range.from.toString(), '2026-01-19');
			// Sunday of that week
			assert.strictEqual(range.to.toString(), '2026-01-25');
		});

		it('should return last_week range', function() {
			// 2026-01-23 is a Friday
			let reference = LocalDate.create('2026-01-23');
			let range = LocalDate.getDateRange('last_week', reference);

			// Monday of previous week
			assert.strictEqual(range.from.toString(), '2026-01-12');
			// Sunday of previous week
			assert.strictEqual(range.to.toString(), '2026-01-18');
		});

		it('should return this_month range', function() {
			let reference = LocalDate.create('2026-01-23');
			let range = LocalDate.getDateRange('this_month', reference);

			assert.strictEqual(range.from.toString(), '2026-01-01');
			assert.strictEqual(range.to.toString(), '2026-01-31');
		});

		it('should return last_month range', function() {
			let reference = LocalDate.create('2026-01-23');
			let range = LocalDate.getDateRange('last_month', reference);

			assert.strictEqual(range.from.toString(), '2025-12-01');
			assert.strictEqual(range.to.toString(), '2025-12-31');
		});

		it('should return this_quarter range', function() {
			// Q1: Jan-Mar
			let reference = LocalDate.create('2026-02-15');
			let range = LocalDate.getDateRange('this_quarter', reference);

			assert.strictEqual(range.from.toString(), '2026-01-01');
			assert.strictEqual(range.to.toString(), '2026-03-31');

			// Q2: Apr-Jun
			reference = LocalDate.create('2026-05-10');
			range = LocalDate.getDateRange('this_quarter', reference);

			assert.strictEqual(range.from.toString(), '2026-04-01');
			assert.strictEqual(range.to.toString(), '2026-06-30');
		});

		it('should return last_quarter range', function() {
			// In Q1, last quarter is Q4 of previous year
			let reference = LocalDate.create('2026-02-15');
			let range = LocalDate.getDateRange('last_quarter', reference);

			assert.strictEqual(range.from.toString(), '2025-10-01');
			assert.strictEqual(range.to.toString(), '2025-12-31');

			// In Q2, last quarter is Q1
			reference = LocalDate.create('2026-05-10');
			range = LocalDate.getDateRange('last_quarter', reference);

			assert.strictEqual(range.from.toString(), '2026-01-01');
			assert.strictEqual(range.to.toString(), '2026-03-31');
		});

		it('should return this_year range', function() {
			let reference = LocalDate.create('2026-06-15');
			let range = LocalDate.getDateRange('this_year', reference);

			assert.strictEqual(range.from.toString(), '2026-01-01');
			assert.strictEqual(range.to.toString(), '2026-12-31');
		});

		it('should return last_year range', function() {
			let reference = LocalDate.create('2026-06-15');
			let range = LocalDate.getDateRange('last_year', reference);

			assert.strictEqual(range.from.toString(), '2025-01-01');
			assert.strictEqual(range.to.toString(), '2025-12-31');
		});

		it('should default to today if no reference provided', function() {
			let today = LocalDate.create();
			let range = LocalDate.getDateRange('today');

			assert.strictEqual(range.from.toString(), today.toString());
			assert.strictEqual(range.to.toString(), today.toString());
		});

		it('should throw for unknown period', function() {
			assert.throws(() => {
				LocalDate.getDateRange('invalid_period');
			}, /Unknown period/);
		});
	});

});

describe('LocalTime', function() {

	describe('.create()', () => {
		it('should return a new LocalTime object', () => {
			assert.equal(LocalTime.create().constructor.name, 'LocalTime');
		});

		it('should clone if it receives another LocalTime object', () => {
			
			let local_date = new LocalTime('17:12:52'),
			    cloned = LocalTime.create(local_date);

			assert.strictEqual(cloned.toNumericRepresentation(), local_date.toNumericRepresentation());
			assert.notStrictEqual(cloned, local_date);
		});
	});

	describe('#add(amount, unit)', () => {

		it('should add 1 unit if only unit is defined', function() {

			let a = new LocalTime('12:49:29');

			// amount is 1 if only a unit is given
			assert.equal(a.clone().add('day').toString(), '12:49:29');

			// null or undefined is 0
			assert.equal(a.clone().add(null, 'day').toString(), '12:49:29');
			assert.equal(a.clone().add(undefined, 'day').toString(), '12:49:29');

			assert.equal(a.clone().add(null, 'hour').toString(), '12:49:29');
			assert.equal(a.clone().add(undefined, 'hour').toString(), '12:49:29');

			assert.equal(a.clone().add(1, 'hour').toString(), '13:49:29');
			assert.equal(a.clone().add(1, 'hour').toString(), '13:49:29');
			assert.equal(a.clone().add('hour').toString(), '13:49:29');
		});

		it('should handle days, months & years differently', () => {

			let base = new LocalTime('15:41:31');

			// This should skip the DST change!
			assertTime(base.clone().add(19, 'days'), '15:41:31');

			// It should simply change the month, never the hour
			assertTime(base.clone().add(19, 'days').add(1, 'month'), '15:41:31');
			assertTime(base.clone().add(1, 'month'), '15:41:31');
			assertTime(base.clone().add(2, 'month'), '15:41:31');
			assertTime(base.clone().add(8, 'month'), '15:41:31');
		});

		it('should ignore DST', () => {

			setBrusselsTimezone();

			// Naming is wrong: it's actually the reverse. Anyway.
			let before_dst = new LocalTime('11:12:13');
			let after_dst = before_dst.clone().add(1, 'day');

			assertTime(after_dst, '11:12:13');

			after_dst = before_dst.clone().add(24, 'hours');
			assertTime(after_dst, '11:12:13');

			before_dst = new LocalTime('2023-10-29 02:59:59');
			after_dst = before_dst.clone().add(1, 'second');

			// According to DST rules, this should become 02:00:00 again.
			// But we ignore that!
			assertTime(after_dst, '03:00:00');

			// Now actually going into DST
			before_dst = new LocalTime('2023-03-26 02:00:00');
			// @TODO: This WILL turn into 2023-03-26 03:00:00,
			// because this is still the native parser parsing it that way!
			after_dst = before_dst.clone().add(1, 'second');
			//assertDate(after_dst, '2023-03-26 02:00:01');
		});

		it('should roll over', () => {

			let base = new LocalTime('23:59:59'),
			    roll = base.clone();

			assert.strictEqual(base.valueOf(), roll.valueOf());

			roll.add(1, 'second');

			assert.strictEqual(roll.valueOf(), 0);
		});
	});

	describe('#startOf(unit)', () => {
		it('should set the time to the start of the unit', function() {

			setBrusselsTimezone();
			let a = new LocalTime('11:12:23');

			assert.equal(a.clone().startOf('day').toString(), '00:00:00');
			assert.equal(a.clone().startOf('month').toString(), '00:00:00');
			assert.equal(a.clone().startOf('year').toString(), '00:00:00');
			assert.equal(a.clone().startOf('hour').toString(), '11:00:00');
			assert.equal(a.clone().startOf('minute').toString(), '11:12:00');

			setNewYorkTimezone();
			assert.equal(a.clone().startOf('day').toString(), '00:00:00');
			assert.equal(a.clone().startOf('month').toString(), '00:00:00');
			assert.equal(a.clone().startOf('year').toString(), '00:00:00');
			assert.equal(a.clone().startOf('hour').toString(), '11:00:00');
			assert.equal(a.clone().startOf('minute').toString(), '11:12:00');

		});
	});

	describe('#endOf(unit)', () => {
		it('should set the time to the end of the unit', function() {

			setBrusselsTimezone();
			let a = new LocalTime('11:12:23');

			assert.equal(a.clone().endOf('day').toString(), '23:59:59');
			assert.equal(a.clone().endOf('month').toString(), '23:59:59');
			assert.equal(a.clone().endOf('year').toString(), '23:59:59');
			assert.equal(a.clone().endOf('hour').toString(), '11:59:59');
			assert.equal(a.clone().endOf('minute').toString(), '11:12:59');

			setNewYorkTimezone();
			assert.equal(a.clone().endOf('day').toString(), '23:59:59');
			assert.equal(a.clone().endOf('month').toString(), '23:59:59');
			assert.equal(a.clone().endOf('year').toString(), '23:59:59');
		});
	});

	describe('#withDate(date)', () => {

		it('should accept date as string', () => {

			let local_time = new LocalTime('17:12:52');
			let new_date = local_time.withDate('2023-10-01');

			assertDateTime(new_date, '2023-10-01 17:12:52');
		});

		it('should accept date as a LocalDate', () => {
			
			let local_time = new LocalTime('17:12:52');
			let new_date = local_time.withDate(LocalDate.create('2023-10-01'));

			assertDateTime(new_date, '2023-10-01 17:12:52');
		});

		it('should accept date as a LocalDateTime', () => {

			let local_time = new LocalTime('17:12:52');
			let new_date = local_time.withDate(LocalDateTime.create('2023-10-01 02:22:31'));

			assertDateTime(new_date, '2023-10-01 17:12:52');
		});

		it('should accept native Date objects', () => {

			let local_time = new LocalTime('17:12:52');
			let new_date = local_time.withDate(new Date('2023-10-01 11:14:58'));

			assertDateTime(new_date, '2023-10-01 17:12:52');
		});
	});

	describe('#setTime(time)', () => {
		it('should set the time in-place', () => {

			let local_date = new LocalTime('17:12:52');

			local_date.setTime('12:34:56');

			assertTime(local_date, '12:34:56');

			local_date.setTime(new Date('2023-01-06 10:00:14'));
			assertTime(local_date, '10:00:14');

			local_date.setTime(new LocalDateTime('2023-10-01 07:11:14'));
			assertTime(local_date, '07:11:14');
		});
	});

	describe('#getTime(time)', () => {
		it('should get the time', () => {

			let local_date = new LocalTime('2023-10-21 17:12:52');
			let time = local_date.getTime();

			assert.strictEqual(time.constructor.name, 'LocalTime');
			assert.strictEqual(time.toString(), '17:12:52');

			assert.notStrictEqual(time, local_date);
		});
	});

	describe('#toNumericRepresentation()', () => {
		it('should return a custom integer representation of the local time', () => {
			setBrusselsTimezone();
			let local_time = new LocalTime('17:12:52');
			assert.strictEqual(local_time.toNumericRepresentation(), 17_12_52_000);

			setNewYorkTimezone();
			assert.strictEqual(local_time.toNumericRepresentation(), 17_12_52_000);

			setBrusselsTimezone();
		});
	});

	describe('#toDry() & .unDry()', () => {
		it('should prepare the object for drying', () => {

			setBrusselsTimezone();
			let local_time = new LocalTime('17:12:52');
			let dried = JSON.dry(local_time);

			setNewYorkTimezone();
			let revived = JSON.undry(dried);
			
			assert.notStrictEqual(revived, local_time);

			assert.strictEqual(revived.toNumericRepresentation(), local_time.toNumericRepresentation());
		});
	});

	describe('#valueOf()', () => {
		it('should return the integer representation', () => {

			let local_time = new LocalTime('17:12:52'),
			    local_time_from_date = new LocalTime('2023-10-21 17:11:01');

			assert.strictEqual(local_time > local_time_from_date, true);

		});
	});

	describe('#toString()', () => {
		it('should ignore timezone changes', () => {

			setBrusselsTimezone();
			let native_date = new Date('2023-10-21 17:12:52');
			let local_time = LocalTime.create('2023-10-21 17:12:52');

			assert.strictEqual(native_date.toString(), 'Sat Oct 21 2023 17:12:52 GMT+0200 (Central European Summer Time)');
			assert.strictEqual(local_time.toString(), '17:12:52');

			setNewYorkTimezone();
			assert.strictEqual(native_date.toString(), 'Sat Oct 21 2023 11:12:52 GMT-0400 (Eastern Daylight Time)');
			assert.strictEqual(local_time.toString(), '17:12:52');

			local_time = LocalTime.create('2023-10-21 17:12:52');
			assert.strictEqual(local_time.toString(), '17:12:52');

			setBrusselsTimezone();
			local_time = LocalTime.create('17:12:52');
			assert.strictEqual(local_time.toString(), '17:12:52');

			local_time = new LocalTime(17, 12, 52);
			assert.strictEqual(local_time.toString(), '17:12:52');
		});
	});

	after(() => restoreOriginalTimezone());
});

function assertDate(actual, expected) {
	assert.strictEqual(actual.format('Y-m-d'), expected);
}

function assertDateTime(actual, expected) {
	assert.strictEqual(actual.format('Y-m-d H:i:s'), expected);
}

function assertTime(actual, expected) {
	assert.strictEqual(actual.format('H:i:s'), expected);
}