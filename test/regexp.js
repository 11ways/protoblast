var assert = require('assert'),
    Blast;

describe('RegExp', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.escape(string)', function() {
		it('should escape a string so it can be used inside a regex', function() {

			var escaped = '\\{this should be \\/\\/escaped\\^\\$\\}';

			assert.equal(RegExp.escape('{this should be //escaped^$}'), escaped);

			assert.strictEqual(RegExp.escape('$40 for a g3\/400'), '\\$40 for a g3\\/400');
			assert.strictEqual(RegExp.escape('*very*'), '\\*very\\*');
			assert.strictEqual(RegExp.escape('\\.+*?[^]$(){}=!<>|:'), '\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:');
			assert.strictEqual(RegExp.escape('*RRRING* Hello?'), '\\*RRRING\\* Hello\\?');
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

			assert.equal(rWithMod.toString(), pWithMod);
			assert.equal(rNoDel.toString(),   '/a|b/');
			assert.equal(rWithout.toString(), '/a|b/');
		});
	});

	describe('.interpretWildcard(str)', function() {
		it('should convert a glob string to a regex', function() {

			var glob = '*.develry.be',
			    rx   = RegExp.interpretWildcard(glob);

			assert.strictEqual(String(rx), '\/.*\\.develry\\.be\/g');

			assert.strictEqual(RegExp.interpretWildcard(glob, 'i')+'', '\/.*\\.develry\\.be\/gi');
		});
	});

	describe('#getPattern()', function() {
		it('should return the pattern part of the regex', function() {

			var rx = /search/i;

			assert.equal(rx.getPattern(), 'search');
		});
	});

	describe('#getFlags()', function() {
		it('should return the flags used in the regex', function() {

			var rx = /search/i;

			assert.equal(rx.getFlags(), 'i');
		});
	});

});