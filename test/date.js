var assert = require('assert'),
    Blast;

describe('Date', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.create()', function() {
		it('should return a new date object', function() {
			assert.equal('Date', Date.create().constructor.name);
		});
	});

	describe('.isDate(variable)', function() {
		it('should return true if the argument is a date object', function() {

			var date = new Date(),
			    str  = '';
			assert.equal(true, Date.isDate(date));
			assert.equal(false, Date.isDate(str));
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the date', function() {
			var d = new Date(1);
			assert.equal('(new Date(1))', d.toSource());
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
			assert.equal('2014-11-16T12:49:29.382Z', a.clone().add('day').toJSON());

			// null or undefined is 0
			assert.equal('2014-11-15T12:49:29.382Z', a.clone().add(null, 'day').toJSON());
			assert.equal('2014-11-15T12:49:29.382Z', a.clone().add(undefined, 'day').toJSON());
		});

		it('should handle numbers as strings', function() {

			// Converts strings to numbers
			assert.equal('2014-11-16T12:49:29.382Z', a.clone().add('1', 'day').toJSON());

			// Invalid strings are 0
			assert.equal('2014-11-15T12:49:29.382Z', a.clone().add('blabla', 'day').toJSON());
		});

		it('should add nothing when the unit does not exist', function() {
			assert.equal('2014-11-15T12:49:29.382Z', a.clone().add(1, 'apples').toJSON());
		});

		it('should add the wanted amount of unit of time to the date', function() {

			// Add ms
			assert.equal('2014-11-15T12:49:29.383Z', a.clone().add(1, 'millisecond').toJSON());
			assert.equal('2014-11-15T12:49:29.387Z', a.clone().add(5, 'ms').toJSON());

			// Add seconds
			assert.equal('2014-11-15T12:49:30.382Z', a.clone().add(1, 'second').toJSON());
			assert.equal('2014-11-15T12:49:34.382Z', a.clone().add(5, 'seconds').toJSON());
			assert.equal('2014-11-15T12:50:29.382Z', a.clone().add(60, 'seconds').toJSON());
			assert.equal('2014-11-15T12:50:30.382Z', a.clone().add(61, 'seconds').toJSON());

			// Add minutes
			assert.equal('2014-11-15T12:50:29.382Z', a.clone().add(1, 'minute').toJSON());
			assert.equal('2014-11-15T12:51:29.382Z', a.clone().add(2, 'minutes').toJSON());

			// Add hours
			assert.equal('2014-11-15T13:49:29.382Z', a.clone().add(1, 'hour').toJSON());
			assert.equal('2014-11-15T14:49:29.382Z', a.clone().add(2, 'hours').toJSON());
			assert.equal('2014-11-16T08:49:29.382Z', a.clone().add(20, 'hour').toJSON());

			// Add days
			assert.equal('2014-11-15T12:49:29.382Z', a.clone().add(0, 'days').toJSON());
			assert.equal('2014-11-16T12:49:29.382Z', a.clone().add(1, 'day').toJSON());
			assert.equal('2014-11-17T12:49:29.382Z', a.clone().add(2, 'days').toJSON());
			assert.equal('2014-11-18T12:49:29.382Z', a.clone().add(3, 'days').toJSON())
		});
	});

	describe('#subtract(amount, unit)', function() {
		var a;

		before(function() {
			a = new Date('2014-11-15T12:49:29.382Z');
		});

		it('should subtract the wanted amount of unit from the date', function() {
			assert.equal('2014-11-15T12:49:29.381Z', a.clone().subtract(1, 'millisecond').toJSON());
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

			assert.equal('2014-11-15T12:49:29.000Z', a.clone().startOf('second').toJSON());
			assert.equal('2014-11-15T12:49:00.000Z', a.clone().startOf('minute').toJSON());
			assert.equal('2014-11-15T12:00:00.000Z', a.clone().startOf('hour').toJSON());

			// Go to start of day, this is timezone sensitive
			//assert.equal('Sat Nov 15 2014 00:00:00 GMT+0200 (EET)', b.clone().startOf('day').toString());

			//assert.equal('2014-11-01T00:00:00.000Z', a.clone().startOf('month').toJSON());
			//assert.equal('2014-01-01T00:00:00.000Z', a.clone().startOf('year').toJSON());
		});
	});

});