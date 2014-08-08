var Blast  = require('../index.js')();

suite('String', function() {

	var str = 'This is a regular string, it is!',
	    att = {class: 'active now', id: 'test', href: 'http://www.test.be'},
	    html = '<b>Should not be bold</b><br>',
	    del = 'No <% yes %> no <% yes %>',
	    text = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor',
	    hex = '4a9fd',
	    temp = 'These are :placeholders you can set :values',
	    vals = {placeholders: 'tests', values: 'vals'},
	    b = 'This isn\'t a regular ztring, is it?';

	bench('.serializeAttributes(obj)', function() {
		String.serializeAttributes(att);
	});

	bench('#toSource()', function() {
		str.toSource();
	});

	bench('#after(needle)', function() {
		str.after('is');
	});

	bench('#afterLast(needle)', function() {
		str.afterLast('is');
	});

	bench('#before(needle)', function() {
		str.before('is');
	});

	bench('#beforeLast(needle)', function() {
		str.beforeLast('is');
	});

	bench('#stripTags()', function() {
		html.stripTags();
	});

	bench('#dissect(open, close)', function() {
		del.dissect('<%', '%>');
	});

	bench('#truncate(length, cuttOfAtWord, ellipsis)', function() {
		text.truncate(50)
	});

	bench('#truncate(50, true, "...")', function() {
		text.truncate(50, true, '...');
	});

	bench('#capitals()', function() {
		str.capitals();
	});

	bench('#count(word)', function() {
		str.count('is');
	});

	bench('#startsWith(word)', function() {
		str.startsWith('is');
	});

	bench('#endsWith(word)', function() {
		str.endsWith('is');
	});

	bench('#postfix(str)', function() {
		str.postfix('is');
	});

	bench('#isHex()', function() {
		hex.isHex();
	});

	bench('#despace()', function() {
		str.despace();
	});

	bench('#multiply(nr)', function() {
		hex.multiply(2);
	});

	bench('#isObjectId()', function() {
		hex.isObjectId();
	});

	bench('#numberHash()', function() {
		str.numberHash();
	});

	bench('#checksum()', function() {
		str.checksum();
	});

	bench('#placeholders()', function() {
		temp.placeholders();
	});

	bench('#fillPlaceholders(obj)', function() {
		temp.fillPlaceholders(vals);
	});

	bench('#score(word, fuzziness)', function() {
		str.score(b);
	});

});
