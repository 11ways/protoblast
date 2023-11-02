var assert = require('assert'),
    Blast;

describe('Date', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.create()', function() {
		it('should return a new date object', function() {
			assert.equal(Date.create().constructor.name, 'Date');
		});
	});

	describe('.isDate(variable)', function() {
		it('should return true if the argument is a date object', function() {

			var date = new Date(),
			    str  = '';
			assert.equal(Date.isDate(date), true);
			assert.equal(Date.isDate(str), false);
		});
	});

	describe('.parseDuration(str)', function() {
		it('should parse duration strings and return number of ms', function() {

			assert.equal(Date.parseDuration('1 ms'), 1);
			assert.equal(Date.parseDuration('1 s'), 1000);
			assert.equal(Date.parseDuration('1 sec'), 1000);
			assert.equal(Date.parseDuration('1 second'), 1000);
			assert.equal(Date.parseDuration('1 seconds'), 1000);

			assert.equal(Date.parseDuration('5 seconds'), 5000);

			assert.equal(Date.parseDuration('20 minutes'), 1200000);
		});

		it('should add all durations together', function() {

			assert.equal(Date.parseDuration('1 s 10 ms'), 1010);
			assert.equal(Date.parseDuration('1 sec 10ms'), 1010);

			assert.equal(Date.parseDuration('1m 5 seconds'), 65000);
		});
	});

	describe('.firstWeekOfYear(year)', function() {
		it('should return the date of the start of the first week of the given year', function() {
			var start = Date.firstWeekOfYear(2020);
			assert.strictEqual(JSON.parse(JSON.stringify(start)), "2019-12-29T23:00:00.000Z");

			start = Date.firstWeekOfYear(2021);
			assert.strictEqual(JSON.parse(JSON.stringify(start)), "2021-01-03T23:00:00.000Z");
		});
	});

	describe('.firstDayOfWeek(week, year)', function() {
		it('should return the date the date of the first day of the given week', function() {
			var start = Date.firstDayOfWeek(11, 2020);

			assert.strictEqual(JSON.parse(JSON.stringify(start)), "2020-03-08T23:00:00.000Z");

			start = Date.firstDayOfWeek(11);
			let temp = Date.firstDayOfWeek(11, (new Date()).getFullYear());
			assert.strictEqual(JSON.stringify(start), JSON.stringify(temp));
		});
	});

	describe('.parseStringToTime(str, base)', function() {
		it('should parse "today"', function() {
			var today = Number(Date.create().startOf('day'));
			assert.equal(Date.parseStringToTime('today'), today);
		});

		it('should do some arithmetics to a given timestamp', function() {
			assert.equal(Date.parseStringToTime('+1 day', 1129633200*1000), 1129719600*1000);
			assert.equal(Date.parseStringToTime('+1 week 2 days 4 hours 2 seconds', 1129633200*1000), 1130425202*1000);
		});

		it('should get the date of tomorrow', function() {
			var now = new Date();

			assert.equal(Date.parseStringToTime('tomorrow'), Number(now.add(1, 'day').startOf('day')));
		});

		it('should go to the correct day of the same week', function() {

			var base_date = new Date('2018-06-29'),
			    base = Number(base_date);

			assert.equal(Date.parseStringToTime('saturday this week', base), Number(new Date('2018-06-30')))

			base_date = new Date('2018-07-01');
			base = Number(base_date);

			assert.equal(Date.parseStringToTime('saturday this week', base), Number(new Date('2018-06-30')));
			assert.equal(Date.parseStringToTime('sunday this week', base), Number(new Date('2018-07-01')));
			assert.equal(Date.parseStringToTime('monday this week', base), Number(new Date('2018-06-25')));
		});

		it('should go to the correct day of the next week', function() {
			var base_date = new Date('2018-06-29'),
			    base = Number(base_date);

			assert.equal(Date.parseStringToTime('saturday next week', base), Number(new Date('2018-07-07')))

			base_date = new Date('2018-07-01');
			base = Number(base_date);

			assert.equal(Date.parseStringToTime('saturday next week', base), Number(new Date('2018-07-07')));
			assert.equal(Date.parseStringToTime('sunday next week', base), Number(new Date('2018-07-08')));
			assert.equal(Date.parseStringToTime('monday next week', base), Number(new Date('2018-07-02')));
		});

		it('should go to the correct day of last week', function() {
			var base_date = new Date('2018-06-29'),
			    base = Number(base_date);

			assert.equal(Date.parseStringToTime('saturday last week', base), Number(new Date('2018-06-23')))

			base_date = new Date('2018-07-01');
			base = Number(base_date);

			assert.equal(Date.parseStringToTime('saturday last week', base), Number(new Date('2018-06-23')));
			assert.equal(Date.parseStringToTime('sunday last week', base), Number(new Date('2018-06-24')));
			assert.equal(Date.parseStringToTime('monday last week', base), Number(new Date('2018-06-18')));
		});

		it('should understand "now"', function() {
			var now = Date.now(),
			    parsed = Date.parseStringToTime('now');

			var diff = Math.abs(parsed - now);

			if (diff > 5) {
				throw new Error('Failed to correctly parse "now"');
			}

			parsed = Date.parseStringToTime('now + 5 hours');
			now += (5 * 60 * 60 * 1000);
			diff = Math.abs(parsed - now);

			if (diff > 5) {
				throw new Error('Failed to correctly add 5 hours to "now"');
			}
		});

		it('should pase the given base string', function() {

			var parsed = Date.parseStringToTime('tomorrow', '2018-12-01');

			assert.strictEqual(parsed, 1543705200000);
		});
	});

	describe('.parseString(str, base)', function() {
		it('should return a date object', function() {
			var today = Number(Date.create().startOf('day')),
			    parsed_time = Date.parseStringToTime('today'),
			    parsed_date = Date.parseString('today');

			assert.equal(Number(parsed_date), today);
		});

		it('should be able to parse regular date strings', function() {
			var date = Date.parseString('2018-12-01');
			assert.strictEqual(+date, +(new Date('2018-12-01')));
		});

		it('should ignore the base when a regular date string is passed', function() {
			var date = Date.parseString('2018-12-01', '2017-01-01');
			assert.strictEqual(+date, +(new Date('2018-12-01')));
		});
	});

	describe('.difference(unit, start, end, startOfUnit)', function() {

		var a = new Date("2015-08-26T14:39:05.745Z"),
		    b = new Date("2015-08-14T10:31:10.045Z");

		it('should return the difference in ms', function() {

			var diff = Date.difference(a, b);
			
			assert.equal(diff, -1051675700);
		});

		it('should return the difference in seconds', function() {

			var diff = Date.difference('seconds', a, b);

			assert.equal(diff, -1051675.7);
		});

		it('should return the difference in minutes', function() {
			var diff = Date.difference('minutes', a, b);

			assert.equal(diff, -17527.928333333333);
		});

		it('should go to the start of the day', function() {

			var diff = Date.difference('days', a, b),
			    sdiff = Date.difference('days', a, b, true);

			assert.equal(diff, -12.172172453703704);
			assert.equal(sdiff, -12);
		});
	});

	describe('#format(pattern, locale)', function() {

		var date = new Date('2015-08-26T14:39:05.745Z');

		it('should format the date using the specified methods', function() {

			var a = new Date(date),
			    b = new Date('2016-08-26T14:39:05.745Z'),
			    c = new Date('2016-01-01T18:39:05.745Z'),
			    d = new Date('2016-08-26T06:39:05.745Z'),
			    e = new Date('2016-01-26T06:39:05.745Z'),
			    f = new Date('2016-01-03T06:39:05.745Z'),
			    g = new Date('2016-10-26T06:39:05.745Z')

			// Days
			assert.equal(a.format('d'), '26');
			assert.equal(c.format('d'), '01');
			assert.equal(a.format('j'), '26');
			assert.equal(c.format('j'), '1');

			assert.equal(c.format('D'), 'Fri');
			assert.equal(c.format('l'), 'Friday');
			assert.equal(c.format('N'), '5');
			assert.equal(f.format('N'), '7', 'Sunday should return 7');
			assert.equal(f.format('w'), '0', 'Sunday should return 0');
			assert.equal(c.format('S'), 'st');
			assert.equal(b.format('S'), 'th');
			assert.equal(c.format('z'), '1');
			assert.equal(e.format('z'), '26');
			assert.equal(e.format('W'), '4');
			assert.equal(c.format('W'), '53');

			// Months
			assert.equal(a.format('F'), 'August', 'Should return the full month name');
			assert.equal(a.format('m'), '08', 'Should return zero-padded month number');
			assert.equal(g.format('m'), '10', 'Should return zero-padded month number');
			assert.equal(a.format('M'), 'Aug', 'Should return short month name');
			assert.equal(a.format('n'), '8', 'Should return month number');
			assert.equal(a.format('t'), '31', 'Should return days in the month');

			// Years
			assert.equal(a.format('L'), false, 'Should return false: 2015 is not a leap year');
			assert.equal(b.format('L'), true, 'Should return true: 2016 is a leap year');
			assert.equal(c.format('o'), '2015', 'The week is part of the previous year, so that year should be returned');
			assert.equal(a.format('Y'), '2015', 'Should return the full year');
			assert.equal(a.format('y'), '15', 'Should return the year in 2-digits');

			// Time
			assert.equal(a.format('a'), 'pm', 'Should return pm');
			assert.equal(a.format('A'), 'PM', 'Should return PM');
			assert.equal(d.format('a'), 'am', 'Should return am');
			assert.equal(d.format('A'), 'AM', 'Should return AM');
			assert.equal(a.format('B'), '652', 'Should return the swatch time');

			// Skip hour tests, because of timezone stuff
			// assert.equal(a.format('g'), '2');
			// assert.equal(a.format('G'), '14');
			// assert.equal(a.format('h'), '02');
			// assert.equal(a.format('H'), '14');

			assert.equal(a.format('i'), '39');
			assert.equal(a.format('s'), '05');
			assert.equal(a.format('u'), '745');

			// Timezone
			assert.equal(a.format('e'), 'Not Yet Supported');
			//assert.equal(a.format('I'), true, 'DST should be true');
			//assert.equal(e.format('I'), false, 'DST should be false');
			//assert.equal(e.format('O'), '+0100', 'Difference to GMT');
			//assert.equal(e.format('P'), '+01:00', 'Difference to GMT with colon');

			// Date/Time
			//assert.equal(a.format('c'), '2015-08-26T16:39:05+02:00');
			//assert.equal(a.format('r'), 'Wed Aug 26 2015 16:39:05 GMT+0200 (CEST)');
			//assert.equal(e.format('U'), '1453790345.745');
		});

		it('accepts a locale parameter as second argument', function() {

			var a = new Date(date),
			    b = new Date('2016-08-26T14:39:05.745Z'),
			    c = new Date('2016-01-01T18:39:05.745Z'),
			    d = new Date('2016-08-26T06:39:05.745Z'),
			    e = new Date('2016-01-26T06:39:05.745Z'),
			    f = new Date('2016-01-03T06:39:05.745Z'),
			    g = new Date('2016-10-26T06:39:05.745Z')

			// Days
			assert.equal(c.format('D', 'nl'), 'vr');
			assert.equal(c.format('l', 'nl'), 'vrijdag');
			assert.equal(c.format('D', 'fr'), 'ven.');

			// Months
			assert.equal(a.format('F', 'nl'), 'augustus', 'Should return the full month name in Dutch');
			assert.equal(a.format('F', 'fr'), 'août', 'Should return the full month name in French');
			//assert.equal(a.format('M', 'nl'), 'aug', 'Should return short month name');
		});
	});

	describe('#format(pattern, locale, timezone)', function() {
		it('should format to the given timezone', function() {

			let date = new Date('Thu Sep 03 2020 00:00:00 GMT+0200 (Central European Summer Time)');

			assert.strictEqual(date.format('Y-m-d', null, 'Europe/Brussels'), '2020-09-03');
			assert.strictEqual(date.format('Y-m-d', null, 'America/New_York'), '2020-09-02');
		});
	});

	describe('#clone()', function() {
		it('should return a clone of the date object', function() {
			var d = new Date(),
			    clone = d.clone();

			assert.equal(Number(clone), Number(d));
		});
	});

	describe('#stripTime()', function() {
		it('should strip the time and return as new date', function() {
			var a = new Date(),
			    b = a.stripTime();

			assert.equal(a == b, false);
			assert.equal((b.getHours() * 60) + b.getTimezoneOffset(), 0);
		});
	});

	describe('#stripDate()', function() {
		it('should strip the date and return as new date', function() {
			var a = new Date(),
			    b = a.stripDate();

			assert.equal(a == b, false);
			assert.equal(b.getFullYear(), 1970);
		});
	});

	describe('#setTimestring(time)', function() {
		it('should set the time of the current instance', function() {
			var a = new Date();

			a.setTimestring('12:46:47');

			assert.equal(a.getHours(), 12);
			assert.equal(a.getMinutes(), 46);
			assert.equal(a.getSeconds(), 47);

			a.setTimestring('12:33');

			assert.equal(a.getMinutes(), 33);
			assert.equal(a.getSeconds(), 0);
		});
	});

	describe('#add(amount, unit)', function() {
		var a;

		before(function() {
			a = new Date('2014-11-15T12:49:29.382Z');
		});

		it('should add 1 unit if only unit is defined', function() {

			// amount is 1 if only a unit is given
			assert.equal(a.clone().add('day').toJSON(), '2014-11-16T12:49:29.382Z');

			// null or undefined is 0
			assert.equal(a.clone().add(null, 'day').toJSON(), '2014-11-15T12:49:29.382Z');
			assert.equal(a.clone().add(undefined, 'day').toJSON(), '2014-11-15T12:49:29.382Z');
		});

		it('should handle numbers as strings', function() {

			// Converts strings to numbers
			assert.equal(a.clone().add('1', 'day').toJSON(), '2014-11-16T12:49:29.382Z');

			// Invalid strings are 0
			assert.equal(a.clone().add('blabla', 'day').toJSON(), '2014-11-15T12:49:29.382Z');
		});

		it('should add nothing when the unit does not exist', function() {
			assert.equal(a.clone().add(1, 'apples').toJSON(), '2014-11-15T12:49:29.382Z');
		});

		it('should add the wanted amount of unit of time to the date', function() {

			// Add ms
			assert.equal(a.clone().add(1, 'millisecond').toJSON(), '2014-11-15T12:49:29.383Z');
			assert.equal(a.clone().add(5, 'ms').toJSON(), '2014-11-15T12:49:29.387Z');

			// Add seconds
			assert.equal(a.clone().add(1, 'second').toJSON(), '2014-11-15T12:49:30.382Z');
			assert.equal(a.clone().add(5, 'seconds').toJSON(), '2014-11-15T12:49:34.382Z');
			assert.equal(a.clone().add(60, 'seconds').toJSON(), '2014-11-15T12:50:29.382Z');
			assert.equal(a.clone().add(61, 'seconds').toJSON(), '2014-11-15T12:50:30.382Z');

			// Add minutes
			assert.equal(a.clone().add(1, 'minute').toJSON(), '2014-11-15T12:50:29.382Z');
			assert.equal(a.clone().add(2, 'minutes').toJSON(), '2014-11-15T12:51:29.382Z');

			// Add hours
			assert.equal(a.clone().add(1, 'hour').toJSON(), '2014-11-15T13:49:29.382Z');
			assert.equal(a.clone().add(2, 'hours').toJSON(), '2014-11-15T14:49:29.382Z');
			assert.equal(a.clone().add(20, 'hour').toJSON(), '2014-11-16T08:49:29.382Z');

			// Add days
			assert.equal(a.clone().add(0, 'days').toJSON(), '2014-11-15T12:49:29.382Z');
			assert.equal(a.clone().add(1, 'day').toJSON(), '2014-11-16T12:49:29.382Z');
			assert.equal(a.clone().add(2, 'days').toJSON(), '2014-11-17T12:49:29.382Z');
			assert.equal(a.clone().add(3, 'days').toJSON(), '2014-11-18T12:49:29.382Z');
		});

		it('should handle days, months & years differently', () => {

			let base = new Date('2023-10-12 15:41:31');

			// This should skip the DST change!
			assertDate(base.clone().add(19, 'days'), '2023-10-31 15:41:31');

			// It should simply change the month, never the hour
			assertDate(base.clone().add(19, 'days').add(1, 'month'), '2023-12-01 15:41:31');
			assertDate(base.clone().add(1, 'month'), '2023-11-12 15:41:31');
			assertDate(base.clone().add(2, 'month'), '2023-12-12 15:41:31');
			assertDate(base.clone().add(8, 'month'), '2024-06-12 15:41:31');
		});

		it('should accept adding duration strings', function() {
			assert.equal(a.clone().add('1 second').toJSON(), '2014-11-15T12:49:30.382Z');
			assert.equal(a.clone().add('1 minute').toJSON(), '2014-11-15T12:50:29.382Z');
			assert.equal(a.clone().add('1 minute 5 seconds').toJSON(), '2014-11-15T12:50:34.382Z');
		});
	});

	describe('#subtract(amount, unit)', function() {
		var a;

		before(function() {
			a = new Date('2014-11-15T12:49:29.382Z');
		});

		it('should subtract the wanted amount of unit from the date', function() {
			assert.equal(a.clone().subtract(1, 'millisecond').toJSON(), '2014-11-15T12:49:29.381Z');
		});

		it('should subtract a single amount of the unit if only the unit is given', function() {
			assert.equal(a.clone().subtract('millisecond').toJSON(), '2014-11-15T12:49:29.381Z');
		});

		it('should convert the amount to a number', function() {
			assert.equal(a.clone().subtract('1', 'millisecond').toJSON(), '2014-11-15T12:49:29.381Z');
		});

		it('should use 1 if an invalid string is given as amount', function() {
			assert.equal(a.clone().subtract('wut', 'millisecond').toJSON(), '2014-11-15T12:49:29.381Z');
		});

		it('should accept subtracting duration strings', function() {
			assert.equal(a.clone().subtract('1 second').toJSON(), '2014-11-15T12:49:28.382Z');
			assert.equal(a.clone().subtract('1 minute').toJSON(), '2014-11-15T12:48:29.382Z');
			assert.equal(a.clone().subtract('1 minute 5 seconds').toJSON(), '2014-11-15T12:48:24.382Z');
		});

		it('should handle days, months & years differently', () => {

			let base = new Date('2023-10-12 15:41:31');

			// This should skip the DST change!
			assertDate(base.clone().subtract(19, 'days'), '2023-09-23 15:41:31');

			// It should simply change the month, never the hour
			assertDate(base.clone().subtract(19, 'days').subtract(1, 'month'), '2023-08-23 15:41:31');
			assertDate(base.clone().subtract(1, 'month'), '2023-09-12 15:41:31');
			assertDate(base.clone().subtract(2, 'month'), '2023-08-12 15:41:31');
			assertDate(base.clone().subtract(9, 'month'), '2023-01-12 15:41:31');

			assertDate(base.clone().subtract(10, 'month'), '2022-12-12 15:41:31');
		});
	});

	describe('#startOf(unit)', function() {
		var offset,
		    a,
		    b;

		before(function() {
			a = new Date('2014-11-15T12:49:29.382Z');
			b = new Date('2014-11-15 12:10:10');

			offset = a.getTimezoneOffset();
		});

		it('should go to the start of the wanted unit', function() {

			assert.equal(a.clone().startOf('second').toJSON(), (new Date('2014-11-15T12:49:29.000Z')).toJSON());
			assert.equal(a.clone().startOf('minute').toJSON(), (new Date('2014-11-15T12:49:00.000Z')).toJSON());
			assert.equal(a.clone().startOf('hour').toJSON(), (new Date('2014-11-15T12:00:00.000Z')).toJSON());

			// Go to start of day, this is timezone sensitive
			//assert.equal('Sat Nov 15 2014 00:00:00 GMT+0200 (EET)', b.clone().startOf('day').toString());

			assert.equal(a.clone().startOf('month').toJSON(), (new Date('2014-10-31T23:00:00.000Z')).toJSON());
			assert.equal(a.clone().startOf('year').toJSON(), (new Date('2013-12-31T23:00:00.000Z')).toJSON());
		});

		it('can set the start of a tenfold', function() {
			assert.equal(a.clone().startOf('decasecond').toJSON(), (new Date('2014-11-15T12:49:20.000Z')).toJSON());
			assert.equal(a.clone().startOf('decaminute').toJSON(), (new Date('2014-11-15T12:40:00.000Z')).toJSON());
		});
	});

	describe('#endOf(unit)', function() {

		it('should go to the end of the wanted unit', function() {

			// Leap year!
			let start = new Date('2020-01-01');

			start.endOf('year');

			assert.strictEqual(start.toJSON(), (new Date('2020-12-31T22:59:59.999Z')).toJSON())

		});
	});

	describe('#next(unit)', function() {
		it('should go to the next wanted day', function() {
			var a = new Date('2018-06-25T14:49:29.382Z');

			assert.equal(a.clone().next('monday').toJSON(), (new Date('2018-07-02T14:49:29.382Z')).toJSON())
			assert.equal(a.clone().next('tuesday').toJSON(), (new Date('2018-06-26T14:49:29.382Z')).toJSON())
			assert.equal(a.clone().next('sunday').toJSON(), (new Date('2018-07-01T14:49:29.382Z')).toJSON())
		});

		it('should go to the next week', function() {
			var a = new Date('2018-06-25T14:49:29.382Z');

			assert.equal(a.clone().next('week').toJSON(), (new Date('2018-07-02T14:49:29.382Z')).toJSON())
		});

		it('should go to the next month', function() {
			var a = new Date('2018-06-25T14:49:29.382Z');

			assert.equal(a.clone().next('month').toJSON(), (new Date('2018-07-25T14:49:29.382Z')).toJSON())
		});

		it('should actually go to the next month, even if it has less days', function() {
			var a = new Date('2018-01-31T14:49:29.382Z');
			assert.equal(a.clone().next('month').toJSON(), (new Date('2018-02-28T14:49:29.382Z')).toJSON())

			// Eugh, timezone stuff
			a = new Date('2018-02-28T15:49:29.382Z');
			assert.equal(a.clone().next('month').toJSON(), (new Date('2018-03-28T14:49:29.382Z')).toJSON())

			a = new Date('2018-05-31T14:49:29.382Z');
			assert.equal(a.clone().next('month').toJSON(), (new Date('2018-06-30T14:49:29.382Z')).toJSON())
		});
	});

	describe('#timeago()', function() {
		it('should return a string saying how much time has passed', function() {
			var now = Date.now(),
			    date = new Date(now - 40 * 1000);

			let ago = date.timeAgo();

			assert.strictEqual(ago, '40 seconds ago');

			date = new Date(now - 5 * 1000);
			ago = date.timeAgo();
			assert.strictEqual(ago, 'just now');

			date = new Date(now - 90 * 1000);
			ago = date.timeAgo();
			assert.strictEqual(ago, 'a minute ago');

			date = new Date(now);
			date.subtract(1, 'day');

			assert.strictEqual(date.timeAgo(), 'a day ago');

			date = subtractedDays(date, 6);
			assert.strictEqual(date.timeAgo(), '7 days ago');

			date = subtractedDays(now, 14);
			assert.strictEqual(date.timeAgo(), '14 days ago');

			date = subtractedDays(now, 21);
			assert.strictEqual(date.timeAgo(), '21 days ago');

			date = subtractedDays(now, 30);
			assert.strictEqual(date.timeAgo(), 'a month ago');

			date = subtractedDays(now, 31);
			assert.strictEqual(date.timeAgo(), 'a month and a day ago');

			date = subtractedDays(now, 6*30);
			assert.strictEqual(date.timeAgo(), '6 months ago');

			date = new Date();
			date.subtract(1000, 'seconds')

			assert.strictEqual(date.timeAgo(), '16 minutes ago');

			date = new Date();
			date.subtract(379, 'days');

			assert.strictEqual(date.timeAgo(), 'a year ago');
		});
	});
});

function subtractedDays(now, days_to_subtract) {

	now = new Date(now);
	let result = now.clone();

	let hours = days_to_subtract * 24;

	result.subtract(hours, 'hours');

	return result;
}

function assertDate(actual, expected) {
	assert.strictEqual(actual.format('Y-m-d H:i:s'), expected);
}