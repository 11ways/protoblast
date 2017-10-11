var assert = require('assert'),
    Blast;

describe('RegExp', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

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

	describe('#getPattern()', function() {
		it('should return the pattern part of the regex', function() {

			var rx = /search/i;

			assert.equal('search', rx.getPattern());
		});
	});

	describe('#getFlags()', function() {
		it('should return the flags used in the regex', function() {

			var rx = /search/i;

			assert.equal('i', rx.getFlags());
		});
	});

});