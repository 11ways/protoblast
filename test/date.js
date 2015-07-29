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

	describe('#toSource()', function() {
		it('should return the source code representation of the date', function() {
			var d = new Date(1);
			assert.equal(d.toSource(), '(new Date(1))');
		});
	});

	describe('#clone()', function() {
		it('should return a clone of the date object', function() {
			var d = new Date(),
			    clone = d.clone();

			assert.equal(Number(clone), Number(d));
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
	});

	describe('#startOf(unit)', function() {
		var a,
		    b;

		before(function() {
			a = new Date('2014-11-15T12:49:29.382Z');
			b = new Date('2014-11-15 12:10:10');
		});

		it('should go to the start of the wanted unit', function() {

			assert.equal(a.clone().startOf('second').toJSON(), '2014-11-15T12:49:29.000Z');
			assert.equal(a.clone().startOf('minute').toJSON(), '2014-11-15T12:49:00.000Z');
			assert.equal(a.clone().startOf('hour').toJSON(), '2014-11-15T12:00:00.000Z');

			// Go to start of day, this is timezone sensitive
			//assert.equal('Sat Nov 15 2014 00:00:00 GMT+0200 (EET)', b.clone().startOf('day').toString());

			//assert.equal(a.clone().startOf('month').toJSON(), '2014-11-01T00:00:00.000Z');
			//assert.equal(a.clone().startOf('year').toJSON(), '2014-01-01T00:00:00.000Z');
		});
	});

});