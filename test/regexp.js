var assert = require('assert'),
    Blast  = require('../index.js')();

describe('RegExp', function() {

	describe('.escape(string)', function() {
		it('should escape a string so it can be used inside a regex', function() {

			var escaped = '\\{this should be \\/\\/escaped\\^\\$\\}';

			assert.equal(escaped, RegExp.escape('{this should be //escaped^$}'));
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the regex', function() {

			var rx = /search/i;

			assert.equal('/search/i', rx.toSource());
		});
	});

});