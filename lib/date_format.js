/**
 * date.format functions:
 * Copyright (c) 2005 Jacob Wright
 * Contibutors: Tomas Theunissen, D’n Russler, Haravikk
 * Modified by Jelle De Loecker
 *
 * @link https://github.com/jacwright/date.format
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
module.exports = function BlastDateFormat(Blast, Collection) {

	var shortMonths,
	    longMonths,
	    shortDays,
	    longDays,
	    methods;

	shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	methods = {};

	Blast.defineStatic('Date', 'shortMonths', shortMonths);
	Blast.defineStatic('Date', 'longMonths', longMonths);
	Blast.defineStatic('Date', 'shortDays', shortDays);
	Blast.defineStatic('Date', 'longDays', longDays);
	Blast.defineStatic('Date', 'formatMethods', methods);

	/**
	 * Format a date
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.12
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Date', 'format', function format(pattern) {
		var date = this;

		if (pattern == 'L' || pattern == 'I') {
			return methods[pattern].call(this);
		}

		return pattern.replace(/(\\?)(.)/g, function(_, esc, chr) {
			return (esc === '' && methods[chr]) ? methods[chr].call(date) : chr;
		});
	});

	/**
	 * Day of the month, 2 digits with leading zeros
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.d = function getPaddedDay() {
		return (this.getDate() < 10 ? '0' : '') + this.getDate();
	};

	/**
	 * A textual representation of a day, three letters
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.D = function getDayName() {
		return shortDays[this.getDay()];
	};

	/**
	 * Day of the month without leading zeros
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.j = function getDay() {
		return this.getDate();
	};

	/**
	 * A full textual representation of the day of the week
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.l = function getDayName() {
		return longDays[this.getDay()];
	};

	/**
	 * ISO-8601 numeric representation of the day of the week.
	 * 1 (for Monday) through 7 (for Sunday).
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.N = function getISOWeekdayNumber() {
		return (this.getDay() == 0 ? 7 : this.getDay());
	};

	/**
	 * Ordinal suffix for the day of the month
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.S = function() {

		var result,
		    day;

		day = ''+this.getDate();
		result = Blast.Bound.String.ordinalize(day);

		return result.slice(day.length);
	};

	/**
	 * Numeric representation of the day of the week.
	 * 0 (for Sunday) through 6 (for Saturday)
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.w = function getWeekdayNumber() {
		return this.getDay();
	};

	/**
	 * The day of the year (starting from 0)
	 *
	 * @author   Jacob Wright
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	methods.z = function getDayOfYear() {
		var d = new Date(this.getFullYear(),0,1);
		return Math.ceil((this - d) / 86400000);
	};

	// Week
	methods.W = function() { 
		var target = new Date(this.valueOf());
		var dayNr = (this.getDay() + 6) % 7;
		target.setDate(target.getDate() - dayNr + 3);
		var firstThursday = target.valueOf();
		target.setMonth(0, 1);
		if (target.getDay() !== 4) {
			target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
		}
		return 1 + Math.ceil((firstThursday - target) / 604800000);
	};

	// Month
	methods.F = function() { return longMonths[this.getMonth()]; };
	methods.m = function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); };
	methods.M = function() { return shortMonths[this.getMonth()]; };
	methods.n = function() { return this.getMonth() + 1; };
	methods.t = function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate() };

	// Year
	methods.L = function() { var year = this.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); };
	methods.o = function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();};
	methods.Y = function() { return this.getFullYear(); };
	methods.y = function() { return ('' + this.getFullYear()).substr(2); };

	// Time
	methods.a = function() { return this.getHours() < 12 ? 'am' : 'pm'; };
	methods.A = function() { return this.getHours() < 12 ? 'AM' : 'PM'; };
	methods.B = function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); };
	methods.g = function() { return this.getHours() % 12 || 12; };
	methods.G = function() { return this.getHours(); };
	methods.h = function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); };
	methods.H = function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); };
	methods.i = function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); };
	methods.s = function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); };
	methods.u = function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ? '0' : '')) + m; };

	// Timezone
	methods.e = function() { return "Not Yet Supported"; };
	methods.I = function() {
		var DST = null;
			for (var i = 0; i < 12; ++i) {
					var d = new Date(this.getFullYear(), i, 1);
					var offset = d.getTimezoneOffset();

					if (DST === null) DST = offset;
					else if (offset < DST) { DST = offset; break; }
					else if (offset > DST) break;
			}
			return (this.getTimezoneOffset() == DST) | 0;
		};
	methods.O = function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; };
	methods.P = function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; };
	methods.T = function() { return this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); };
	methods.Z = function() { return -this.getTimezoneOffset() * 60; };

	// Full Date/Time
	methods.c = function() { return this.format("Y-m-d\\TH:i:sP"); };
	methods.r = function() { return this.toString(); };
	methods.U = function() { return this.getTime() / 1000; };

};