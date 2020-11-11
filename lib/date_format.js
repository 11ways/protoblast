/**
 * date.format functions:
 * Copyright (c) 2005 Jacob Wright
 * Contibutors: Tomas Theunissen, D’n Russler, Haravikk
 * Modified by Jelle De Loecker
 *
 * @link https://github.com/jacwright/date.format
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var has_full_icu,
    shortMonths,
    longMonths,
    shortDays,
    longDays,
    methods,
    test;

shortMonths = [
	'Jan',  'Feb',  'Mar',  'Apr', 'May', 'Jun',  'Jul',  'Aug',  'Sep',  'Oct', 'Nov', 'Dec',
	'jan.', 'feb.', 'mrt.', 'apr.','mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.','nov.','dec.',
	'janv.','févr.','mars.','avr.','mai', 'juin', 'juil.','août', 'sept.','oct.','nov.','déc.'
];

longMonths = [
	'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
	'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december',
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

shortDays = [
	'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
	'ma', 'di', 'wo', 'do', 'vr', 'za', 'zo',
	'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'
];

longDays = [
	'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
	'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
	'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
];

methods = {};

Blast.defineStatic('Date', 'shortMonths', shortMonths);
Blast.defineStatic('Date', 'longMonths', longMonths);
Blast.defineStatic('Date', 'shortDays', shortDays);
Blast.defineStatic('Date', 'longDays', longDays);
Blast.defineStatic('Date', 'formatMethods', methods);

if (Blast.isNode) {
	test = new Intl.DateTimeFormat('es', {month:'long'}).format(new Date(9E8));

	if (test == 'enero') {
		has_full_icu = true;
	}
} else {
	has_full_icu = true;
}

/**
 * Format a date
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.5
 *
 * @param    {String}   pattern
 * @param    {String}   locale
 * @param    {String}   timezone
 *
 * @return   {String}
 */
Blast.definePrototype('Date', function format(pattern, locale, timezone) {

	var date = this;

	if (timezone) {

		// Convert the date to a string in the wanted timezone
		// (but without it mentioning said timezone)
		let cloned = date.toLocaleString('en-US', {
			timeZone: timezone,
			dateStyle : 'medium',
			timeStyle : 'medium'
		});

		// Now interpret that date in the current timezone
		date = new Date(cloned);
	}

	if (pattern == 'L' || pattern == 'I') {
		return methods[pattern].call(this);
	}

	return pattern.replace(/(\\?)(.)/g, function(_, esc, chr) {
		return (esc === '' && methods[chr]) ? methods[chr].call(date, locale) : chr;
	});
});

/**
 * Get the date locale
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {String}
 */
Blast.definePrototype('Date', function getLocale(locale) {

	if (locale) {
		return locale;
	}

	if (this.locale) {
		return this.locale;
	}

	return 'en';
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
 * A short textual representation of a day
 *
 * @author   Jacob Wright
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.0
 *
 * @return   {String}
 */
methods.D = function getDayName(locale) {

	locale = this.getLocale(locale);

	if (!has_full_icu && locale != 'en') {
		let weekday = methods.N.call(this) - 1;

		if (locale == 'nl') {
			weekday += 7;
		} else if (locale == 'fr') {
			weekday += 14;
		}

		return shortDays[weekday];
	}

	return this.toLocaleDateString(locale, {weekday: 'short'});
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
 * @version  0.7.0
 *
 * @return   {String}
 */
methods.l = function getDayName(locale) {
	locale = this.getLocale(locale);

	if (!has_full_icu && locale != 'en') {
		let weekday = methods.N.call(this) - 1;

		if (locale == 'nl') {
			weekday += 7;
		} else if (locale == 'fr') {
			weekday += 14;
		}

		return longDays[weekday];
	}

	return this.toLocaleDateString(locale, {weekday: 'long'});
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
	result = Bound.String.ordinalize(day);

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

/**
 * A textual representation of a month, three letters
 *
 * @author   Jacob Wright
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.0
 *
 * @return   {String}
 */
methods.M = function getShortMonthName(locale) {
	var locale = this.getLocale(locale);

	if (!has_full_icu && locale != 'en') {
		let month = this.getMonth();

		if (locale == 'nl') {
			month += 12;
		} else if (locale == 'fr') {
			month += 24;
		}

		return shortMonths[month];
	}

	return this.toLocaleDateString(locale, {month: 'short'});
};

/**
 * A textual representation of the month, long version
 *
 * @author   Jacob Wright
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.0
 *
 * @return   {String}
 */
methods.F = function getLongMonthName(locale) {
	var locale = this.getLocale(locale);

	if (!has_full_icu && locale != 'en') {
		let month = this.getMonth();

		if (locale == 'nl') {
			month += 12;
		} else if (locale == 'fr') {
			month += 24;
		}

		return longMonths[month];
	}

	return this.toLocaleDateString(locale, {month: 'long'});
};

// Month
methods.m = function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); };
methods.n = function() { return this.getMonth() + 1; };
methods.t = function() { var d = this; return new Date(d.getFullYear(), d.getMonth(), 0).getDate() };

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
methods.e = function() { return 'Not Yet Supported'; };
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
methods.c = function() { return this.format('Y-m-d\\TH:i:sP'); };
methods.r = function() { return this.toString(); };
methods.U = function() { return this.getTime() / 1000; };