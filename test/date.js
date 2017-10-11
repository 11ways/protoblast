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

	describe('.difference(unit, start, end, startOfUnit', function() {

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

	describe('#format()', function() {

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
	});

	describe('#startOf(unit)', function() {
		var offset,
		    a,
		    b;

		before(function() {
			a = new Date('2014-11-15T12:49:29.382Z');
			b = new Date('2014-11-15 12:10:10');

			offset = a.getTimezoneOffset();
			a.subtract(offset, 'minutes');
			b.subtract(offset, 'minutes');
		});

		it('should go to the start of the wanted unit', function() {

			assert.equal(a.clone().startOf('second').add(offset, 'minutes').toJSON(), '2014-11-15T12:49:29.000Z');
			assert.equal(a.clone().startOf('minute').add(offset, 'minutes').toJSON(), '2014-11-15T12:49:00.000Z');
			assert.equal(a.clone().startOf('hour').add(offset, 'minutes').toJSON(), '2014-11-15T12:00:00.000Z');

			// Go to start of day, this is timezone sensitive
			//assert.equal('Sat Nov 15 2014 00:00:00 GMT+0200 (EET)', b.clone().startOf('day').toString());

			assert.equal(a.clone().startOf('month').add(offset, 'minutes').toJSON(), '2014-10-31T22:00:00.000Z');
			assert.equal(a.clone().startOf('year').add(offset, 'minutes').toJSON(), '2013-12-31T22:00:00.000Z');
		});
	});

});