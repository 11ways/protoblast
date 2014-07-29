var assert = require('assert'),
    Blast  = require('../index.js')();

describe('RegExp', function() {

	describe('.escape(string)', function() {
		it('should escape a string so it can be used inside a regex', function() {

			var escaped = '\\{this should be \\/\\/escaped\\^\\$\\}';

			assert.equal(escaped, RegExp.escape('{this should be //escaped^$}'));
		});
	});

	describe('.interpret(pattern)', function() {
		it('should convert a string pattern to a regex', function() {

			var pWithMod = '/a|b/gi',
			    pWithout = 'a|b',
			    pNoDel   = '/a|b/',
			    rWithMod = RegExp.interpret(pWithMod),
			    rWithout = RegExp.interpret(pWithout),
			    rNoDel   = RegExp.interpret(pNoDel);

			assert.equal(pWithMod, rWithMod.toString());
			assert.equal('/a|b/', rNoDel.toString());
			assert.equal('/a|b/', rWithout.toString());
		});
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the regex', function() {

			var rx = /search/i;

			assert.equal('/search/i', rx.toSource());
		});
	});

});