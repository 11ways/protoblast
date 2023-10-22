let assert = require('assert'),
    Blast,
    LocalDateTime,
    LocalDate,
    LocalTime;

function setBrusselsTimezone() {
	// Set the timezone to Brussels
	process.env.TZ = 'Europe/Brussels';
}

function setNewYorkTimezone() {
	// Set the timezone to Brussels
	process.env.TZ = 'America/New_York';
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