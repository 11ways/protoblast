var assert = require('assert'),
    Blast;

describe('String', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.serializeAttributes(obj)', function() {
		it('should return serialized attributes as a string', function() {

			var output,
			    obj;

			obj = {
				a : 1,
				b : 2
			};

			output = String.serializeAttributes(obj);

			assert.equal(output, 'a="1" b="2"');
		});
	});

	describe('.decodeAttributes(value, separator)', function() {
		it('should return an object', function() {

			var input = 'a="1", b="2"',
			    obj;

			obj = String.decodeAttributes(input);

			assert.equal(JSON.stringify(obj), '{"a":"1","b":"2"}');
		});

		it('should allow another separator', function() {

			var input = 'a="1"; b="2"',
			    obj;

			obj = String.decodeAttributes(input, ';');

			assert.equal(JSON.stringify(obj), '{"a":"1","b":"2"}');
		});
	});

	describe('.encodeCookie(name, value, options)', function() {
		it('should return a valid cookie string', function() {
			var output = String.encodeCookie('cookiename', 'myvalue', {path: '/mypath'});

			assert.equal(output, 'cookiename=myvalue; path=/mypath');
		});
	});

	// Tets by Mathias Bynens' codePointAt shim
	describe('#codePointAt(position)', function() {
		
		var sentence = 'This is the string that contains the that needle that we need';

		it('should take 1 argument', function() {
			assert.strictEqual(String.prototype.codePointAt.length, 1);
		});

		it('should handle strings that start with a BMP symbol', function() {
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(''), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt('_'), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(-Infinity), undefined);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(-1), undefined);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(-0), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(0), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(3), 0x1D306);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(4), 0xDF06);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(5), 0x64);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(42), undefined);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(Infinity), undefined);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(Infinity), undefined);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(NaN), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(false), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(null), 0x61);
			assert.strictEqual('abc\uD834\uDF06def'.codePointAt(undefined), 0x61);
		});

		it('should handle strings that start with an astral symbol', function() {
			assert.strictEqual('\uD834\uDF06def'.codePointAt(''), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt('1'), 0xDF06);
			assert.strictEqual('\uD834\uDF06def'.codePointAt('_'), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(-1), undefined);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(-0), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(0), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(1), 0xDF06);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(42), undefined);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(false), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(null), 0x1D306);
			assert.strictEqual('\uD834\uDF06def'.codePointAt(undefined), 0x1D306);
		});

		it('should handle lone high surrogates', function() {
			assert.strictEqual('\uD834abc'.codePointAt(''), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt('_'), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(-1), undefined);
			assert.strictEqual('\uD834abc'.codePointAt(-0), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(0), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(false), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(NaN), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(null), 0xD834);
			assert.strictEqual('\uD834abc'.codePointAt(undefined), 0xD834);
		});

		it('should handle low surrogates', function() {
			assert.strictEqual('\uDF06abc'.codePointAt(''), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt('_'), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(-1), undefined);
			assert.strictEqual('\uDF06abc'.codePointAt(-0), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(0), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(false), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(NaN), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(null), 0xDF06);
			assert.strictEqual('\uDF06abc'.codePointAt(undefined), 0xDF06);
		});

		it('should throw expected errors', function() {

			assert.throws(function() { String.prototype.codePointAt.call(null); }, TypeError);
			assert.throws(function() { String.prototype.codePointAt.call(null, 4); }, TypeError);

			assert.throws(function() { String.prototype.codePointAt.call(undefined); }, TypeError);
			assert.throws(function() { String.prototype.codePointAt.call(undefined, 4); }, TypeError);
			
			assert.strictEqual(String.prototype.codePointAt.call(42, 0), 0x34);
			assert.strictEqual(String.prototype.codePointAt.call(42, 1), 0x32);
			assert.strictEqual(String.prototype.codePointAt.call({ 'toString': function() { return 'abc'; } }, 2), 0x63);
			var tmp = 0;
			assert.strictEqual(String.prototype.codePointAt.call({ 'toString': function() { ++tmp; return String(tmp); } }, 0), 0x31);
			assert.strictEqual(tmp, 1);

			assert.throws(function() { String.prototype.codePointAt.apply(undefined); }, TypeError);
			assert.throws(function() { String.prototype.codePointAt.apply(undefined, [4]); }, TypeError);
			assert.throws(function() { String.prototype.codePointAt.apply(null); }, TypeError);
			assert.throws(function() { String.prototype.codePointAt.apply(null, [4]); }, TypeError);
			assert.strictEqual(String.prototype.codePointAt.apply(42, [0]), 0x34);
			assert.strictEqual(String.prototype.codePointAt.apply(42, [1]), 0x32);
			assert.strictEqual(String.prototype.codePointAt.apply({ 'toString': function() { return 'abc'; } }, [2]), 0x63);
			tmp = 0;
			assert.strictEqual(String.prototype.codePointAt.apply({ 'toString': function() { ++tmp; return String(tmp); } }, [0]), 0x31);
			assert.strictEqual(tmp, 1);
		});
	});

	describe('#after(needle, first)', function() {

		var sentence = 'This is the string that contains the that needle that we need';

		it('should return the string after the first occurence of the needle', function() {
			assert.strictEqual(' contains the that needle that we need', sentence.after('that'));
		});

		it('should return the string after the last occurence of the needle', function() {
			assert.strictEqual(' we need', sentence.after('that', false));
		});

		it('should return the string after the wanted occurence of the needle', function() {
			assert.strictEqual(' needle that we need', sentence.after('that', 2));
			assert.strictEqual(' we need', sentence.after('that', 3));
		});

		it('should return an empty string if an occurence is wanted that is not there', function() {
			assert.strictEqual('', sentence.after('that', 4));
			assert.strictEqual('', sentence.after('castle'));
		});

		it('should return an empty string for illegal parameters', function() {
			assert.strictEqual('', sentence.after());
			assert.strictEqual('', sentence.after(function(){}));
			assert.strictEqual('', sentence.after(false));
			assert.strictEqual('', sentence.after('that', function(){}));
		});
	});

	describe('#afterLast(needle)', function() {

		var sentence = 'This is the string that contains the that needle that we need';

		it('should return the string after the last occurence of the needle', function() {
			assert.strictEqual(' we need', sentence.afterLast('that'));
		});
	});

	describe('#before(needle, first)', function() {

		var sentence = 'This is the string that contains the that needle that we need';

		it('should return the string before the first occurence of the needle', function() {
			assert.strictEqual('This is the string ', sentence.before('that'));
		});

		it('should return the string before the last occurence of the needle', function() {
			assert.strictEqual('This is the string that contains the that needle ', sentence.before('that', false));
		});

		it('should return the string before the second occurence of the needle', function() {
			assert.strictEqual('This is the string that contains the ', sentence.before('that', 2));
			assert.strictEqual('This is the string that contains the that needle ', sentence.before('that', 3));
		});

		it('should return an empty string if an occurence is wanted that is not there', function() {
			assert.strictEqual('', sentence.before('that', 4));
			assert.strictEqual('', sentence.before('castle'));
		});

		it('should return an empty string for illegal parameters', function() {
			assert.strictEqual('', sentence.before());
			assert.strictEqual('', sentence.before(function(){}));
			assert.strictEqual('', sentence.before(false));
			assert.strictEqual('', sentence.before('that', function(){}));
		});
	});

	describe('#beforeLast(needle)', function() {
		
		var sentence = 'This is the string that contains the that needle that we need';

		it('should return the string before the last occurence of the needle', function() {
			assert.strictEqual(sentence.beforeLast('that'), 'This is the string that contains the that needle ');
		});
	});

	describe('#stripTags()', function() {
		it('should remove HTML tags from the string and replace breaks with newlines', function() {
			var original = '<b>This is a <br/>bold string</b>';

			assert.strictEqual(original.stripTags(), 'This is a \nbold string');
		});

		it('should not strip invalid tags', function() {
			var text = 'lorem ipsum < a> < div>';
			assert.equal(text.stripTags(), text);
		});

		it('should remove simple HTML tags', function() {
			var html = '<a href="">lorem <strong>ipsum</strong></a>',
			    text = 'lorem ipsum';

			assert.equal(html.stripTags(), text);
		});

		it('should remove comments', function() {
			var html = '<!-- lorem -- ipsum -- --> dolor sit amet',
			    text = ' dolor sit amet';

			assert.equal(html.stripTags(), text);
		});

		it('should strip tags within comments', function() {
			var html = '<!-- <strong>lorem ipsum</strong> --> dolor sit',
			    text = ' dolor sit';

			assert.equal(html.stripTags(), text);
		});

		it('should not fail with nested quotes', function() {
			var html = '<article attr="foo \'bar\'">lorem</article> ipsum',
			    text = 'lorem ipsum';

			assert.equal(html.stripTags(), text);
		});
	});

	describe('#stripTags(string)', function() {
		it('should allow given tag', function() {
			var html = '<strong>lorem ipsum</strong>',
			    allowed_tags = 'strong';

			assert.equal(html.stripTags(allowed_tags), html);
		});

		it('should leave attributes when allowing HTML', function() {
			var html = '<a href="https://example.com">lorem ipsum</a>',
			    allowed_tags = 'a';

			assert.equal(html.stripTags(allowed_tags), html);
		});

		it('should strip extra < within tags', function() {
			var html = '<div<>>lorem ipsum</div>',
			    text = '<div>lorem ipsum</div>',
			    allowed_tags = 'div';

			assert.equal(html.stripTags(allowed_tags), text);
		});

		it('should strip <> within quotes', function() {
			var html = '<a href="<script>">lorem ipsum</a>',
			    text = '<a href="script">lorem ipsum</a>',
			    allowed_tags = 'a';

			assert.equal(html.stripTags(allowed_tags), text);
		});
	});

	describe('#stripTags(array)', function() {
		it('should allow given tags', function() {
			var html = '<strong>lorem <em>ipsum</em></strong>',
			    allowed_tags = ['strong', 'em'];

			assert.equal(html.stripTags(allowed_tags), html);
		});
	});

	describe('#stripTags(false)', function() {
		it('should remove HTML tags including breaks', function() {
			var original = '<b>This is a <br/>bold string</b>';

			assert.strictEqual(original.stripTags(false), 'This is a bold string');
		});
	});

	describe('#stripTags({})', function() {
		it('should allow given tags to stay', function() {
			var original = '<b>This is a <br>test</b><i> italic test</i>';

			var result = original.stripTags({
				'b': '*',
				'i': '_'
			});

			assert.strictEqual(result, '*This is a test*_ italic test_');
		});
	});

	describe('#stripTags(null, replacement)', function() {
		it('should replace all tags with the replacement', function() {
			var original = '<b>This is a <br>test</b><i> italic test</i>';

			assert.strictEqual(original.stripTags(null, '-'), '-This is a \ntest-- italic test-');
			assert.strictEqual(original.stripTags(false, '-'), '-This is a -test-- italic test-');
		});
	});

	describe('#dissect(openTag, closeTag)', function() {
		it('should dissect a string into parts in- and outside of the given delimiters', function() {

			var original = 'This <% is a %> test',
			    arr      = original.dissect('<%', '%>'),
			    expected = '[{"type":"normal","lineStart":0,"lineEnd":0,"content":"This "},{"type":"inside","lineStart":0,"lineEnd":0,"content":" is a "},{"type":"normal","lineStart":0,"lineEnd":0,"content":" test"}]';

			assert.strictEqual(JSON.stringify(arr), expected);
		});

		it('should return an empty array for an empty string', function() {

			var original = '',
			    arr      = original.dissect('<%', '%>'),
			    expected = '[]';

			assert.strictEqual(JSON.stringify(arr), expected);
		});
	});

	describe('#encodeHTML()', function() {
		it('should encode certain characters to safe HTML code', function() {
			var original = '<string> & foo © bar ≠ baz 𝌆 qux';

			assert.strictEqual(original.encodeHTML(), '&#60;string&#62; &#38; foo &#169; bar &#8800; baz &#x1d306; qux');
		});

		it('should support emojis', function() {
			var original = '<b>👷</b>';
			assert.strictEqual(original.encodeHTML(), '&#60;b&#62;&#x1f477;&#60;/b&#62;');
		});
	});

	describe('#decodeHTML()', function() {
		it('should decode certain escaped HTML entities', function() {
			var original = '&quot;&#60;string&#62; &#38; foo &#169; bar &#8800; baz &#55348;&#57094; qux&quot;&amp;';
			var second = '&quot;&#60;string&#62; &#38; foo &#169; bar &#8800; baz &#x1d306; qux&quot;&amp;';

			assert.strictEqual(original.decodeHTML(), '"<string> & foo © bar ≠ baz 𝌆 qux"&');
			assert.strictEqual(second.decodeHTML(), '"<string> & foo © bar ≠ baz 𝌆 qux"&');
		});

		it('should leave non-existing entities alone', function() {
			var original = '&whatisthis;Test&doesntexist;';

			assert.strictEqual(original.decodeHTML(), '&whatisthis;Test&doesntexist;');
		});

		it('should only decode entities that end with a semicolon', function() {
			var original = '&Aacute &Aacute;;';

			assert.strictEqual('&Aacute \u00C1;', original.decodeHTML());
		});

		it('should be case sensitive', function() {
			var original = '&Afr; &afr;';

			assert.strictEqual('\uD835\uDD04 \uD835\uDD1E', original.decodeHTML());
		});

		it('should leave html entities alone', function() {
			var original = '&quot;Brackets:&quot; <b>keep</b><br>';

			assert.strictEqual(original.decodeHTML(), '"Brackets:" <b>keep</b><br>');
		});
	});

	describe('#truncate(length, word, ellipsis)', function() {
		it('should truncate a string', function() {
			var original = 'This string is deemed a bit too longified to be put on the screen of the user!',
			    simple   = original.truncate(40, false),
			    word     = original.truncate(40),
			    ell      = original.truncate(40, true, ' (cont)'),
			    noell    = original.truncate(40, false, false);

			assert.strictEqual('This string is deemed a bit too longi...', simple);
			assert.strictEqual('This string is deemed a bit too...', word);
			assert.strictEqual('This string is deemed a bit too (cont)', ell);
			assert.strictEqual('This string is deemed a bit too longifie', noell);
		});
	});

	describe('#capitals()', function() {
		it('should return the amount of capitals in the string', function() {
			assert.strictEqual(3, 'This Is A test'.capitals());
		});
	});

	describe('#count(str)', function() {
		it('should count the given string in the main string', function() {
			assert.strictEqual(3, 'this this appears 3 times in this string'.count('this'));
		});
	});

	describe('#startsWith(str)', function() {
		it('should return true if the main string starts with the given string', function() {
			assert.strictEqual(true, 'polkadot'.startsWith('polka'));
		});

		it('should return false if the main string does not start with the given string', function() {
			assert.strictEqual(false, 'polkadot'.startsWith('somethingelse'));
		});
	});

	describe('#startsWithAny(str)', function() {
		it('should return true if the main string starts with any of the given strings', function() {
			assert.strictEqual(true, 'polkadot'.startsWithAny(['wrong', 'polka']));
		});

		it('should accept single strings', function() {
			assert.strictEqual(true, 'polkadot'.startsWithAny('polk'));
			assert.strictEqual(false, 'polkadot'.startsWithAny('something'));
		});

		it('should return false if the main string does not start with any of the given strings', function() {
			assert.strictEqual(false, 'polkadot'.startsWith(['olka', 'somethingelse']));
		});
	});

	describe('#endsWith(str)', function() {
		it('should return true if the main string ends with the given string', function() {
			assert.strictEqual(true, 'polkadot'.endsWith('dot'));
		});

		it('should return false if the main string does not end with the given string', function() {
			assert.strictEqual(false, 'polkadot'.endsWith('somethingelse'));
		});
	});

	describe('#endsWithAny(str)', function() {
		it('should return true if the main string ends with any of the given strings', function() {
			assert.strictEqual(true, 'polkadot'.endsWithAny(['wrong', 'dot']));
		});

		it('should accept single strings', function() {
			assert.strictEqual(true, 'polkadot'.endsWithAny('dot'));
			assert.strictEqual(false, 'polkadot'.endsWithAny('polk'));
		});

		it('should return false if the main string does not end with any of the given strings', function() {
			assert.strictEqual(false, 'polkadot'.endsWithAny(['olka', 'somethingelse']));
		});
	});

	describe('#postfix(str)', function() {
		it('should append the given postfix', function() {
			var main = 'main';

			assert.equal('string', typeof main.postfix('post'));
			assert.strictEqual('mainpost', main.postfix('post'));
		});

		it('should not append the given postfix when it is already present', function() {
			var main = 'mainpost';

			assert.equal('string', typeof main.postfix('post'));
			assert.strictEqual('mainpost', main.postfix('post'));
		});
	});

	describe('#isHex()', function() {
		it('should return true if the string is a valid hex', function() {
			assert.strictEqual(true, '14AB4CE9'.isHex());
		});

		it('should return false if the string is not a valid hex', function() {
			assert.strictEqual(false, 'ZZZ14AB4CE9'.isHex());
			assert.strictEqual(false, '0x14AB4CE9'.isHex());
		});
	});

	describe('#despace()', function() {
		it('should replace all the spaces with underscores', function() {
			assert.strictEqual('here_are_spaces', 'here are spaces'.despace());
		});
	});

	describe('#multiply(n)', function() {
		it('should return the string n times', function() {
			assert.strictEqual('', 'test'.multiply());
			assert.strictEqual('', 'test'.multiply(0));
			assert.strictEqual('testtesttest', 'test'.multiply(3));
		});
	});

	describe('#isObjectId()', function() {
		it('should return true if the string is a valid objectId', function() {
			assert.strictEqual(true, '5318a2921dcba2eefb328dc8'.isObjectId());
			assert.strictEqual(false, '18a2921dcba2eefb328dc8'.isObjectId());
		});
	});

	describe('#numberHash()', function() {
		it('should return the numeric hash of the string', function() {
			assert.strictEqual('test'.numberHash(), 3556498);
		});
	});

	describe('#checksum()', function() {
		it('should return the crc32 hash of the string', function() {
			assert.strictEqual('test'.checksum(), 3632233996);
		});
	});

	describe('#fowler()', function() {
		it('should return the fnv-1a hash of the string', function() {
			assert.strictEqual('simple'.fowler(), 375816319);
			assert.strictEqual('protoblast'.fowler(), 556809709);
		});
	});

	describe('#placeholders()', function() {
		it('should return placeholders inside the string', function() {

			var str = ':this and :that are :placeholders',
			    arr = str.placeholders();

			assert.strictEqual('this,that,placeholders', arr.join());
		});
	});

	describe('#fillPlaceholders()', function() {
		it('should replace placeholders inside the string', function() {

			var str = ':me and :that are :placeholders',
			    result = str.fillPlaceholders({me: 'me', that: 'him', placeholders: 'happy'}),
			    multiple = ':me and :me for :that :that :that';

			assert.strictEqual('me and him are happy', result);
			assert.strictEqual('a and a for b b b', multiple.fillPlaceholders({me: 'a', that: 'b'}));
		});
	});

	describe('#assignments()', function() {
		it('should return assignments inside the string', function() {

			var str = '{this} and {that} are {placeholders}',
			    arr = str.assignments();

			assert.strictEqual('this,that,placeholders', arr.join());
		});
	});

	describe('#assign()', function() {
		it('should replace placeholders inside the string', function() {

			var str = '{me} and {that} are {placeholders}',
			    result = str.assign({me: 'me', that: 'him', placeholders: 'happy'}),
			    multiple = '{me} and {me} for {that} {that} {that}';

			assert.strictEqual(result, 'me and him are happy');
			assert.strictEqual(multiple.assign({me: 'a', that: 'b'}), 'a and a for b b b');
		});

		it('should get the first property when assigning a plain object', function() {
			var str = 'Assign {myprop}',
			    result;

			result = str.assign({myprop: {first: '1'}});

			assert.strictEqual(result, 'Assign 1');
		});

		it('should use the custom toString() method when assigning an object', function() {
			var str = 'Assign {myprop}',
			    result;

			result = str.assign({myprop: {first: '1', toString: function() {return 2}}});

			assert.strictEqual(result, 'Assign 2');
		});
	});

	describe('#normalizeAcronyms()', function() {
		it('remove points from acronyms', function() {

			assert.strictEqual('Agents Of SHIELD', 'Agents Of S.H.I.E.L.D.'.normalizeAcronyms());
			assert.strictEqual('Agents Of SHIELD', 'Agents Of S.H.I.E.L.D'.normalizeAcronyms());
			assert.strictEqual('Agents Of SHIELD.ext', 'Agents Of S.H.I.E.L.D.ext'.normalizeAcronyms());
			assert.strictEqual('Agents Of SHIELD.EXT', 'Agents Of S.H.I.E.L.D.EXT'.normalizeAcronyms());

			assert.strictEqual('The CIA is not a part of the FBI', 'The C.I.A. is not a part of the F.B.I.'.normalizeAcronyms());
			assert.strictEqual('The CIA is not a part of the FBI', 'The C.I.A is not a part of the F.B.I'.normalizeAcronyms());
			assert.strictEqual('The CIA is not a part of the FBI.ext', 'The C.I.A is not a part of the F.B.I.ext'.normalizeAcronyms());

		});
	});

	describe('#score()', function() {
		it('should see how alike 2 string are', function() {

			var result = 'lets go to the sea'.score('let\'s go to the sun', 0.5),
			    score = false;

			if (result > 0.4 && result < 0.5) {
				score = true;
			}

			assert.strictEqual(0.3, 'dome'.score('home', 0.5));
			assert.strictEqual(true, score);
		});
	});

	describe('#repeat(count)', function() {
		it('should repeat the string `count` times', function() {
			assert.strictEqual('', 'test'.repeat());
			assert.strictEqual('', 'test'.repeat(0));
			assert.strictEqual('testtesttest', 'test'.repeat(3));
		});

		it('should throw an error when the context is null', function() {
			assert.throws(function() {
				String.prototype.repeat.call(null, 4);
			});
		});

		it('should throw an error when the count is negative', function() {
			assert.throws(function() {
				'bla'.repeat(-5);
			});
		});

		it('should throw an error when the count is infinity', function() {
			assert.throws(function() {
				'bla'.repeat(Infinity);
			});
		});

		it('should throw an error when the resulting string would be too big', function() {
			assert.throws(function() {
				'bla'.repeat(1 << 28);
			});
		});
	});

	describe('#padStart(target_length, pad_string)', function() {
		it('should do nothing if the string is long enough already', function() {
			assert.equal('abc'.padStart(3, '0'), 'abc');
		});

		it('should pad the string at the start', function() {
			assert.equal('abc'.padStart(6, '123'), '123abc');
		});

		it('should pad only part of the string at the start', function() {
			assert.equal('abc'.padStart(6, '123456'), '123abc');
		});

		it('should repeat the string to pad', function() {
			assert.equal('abc'.padStart(6, '0'), '000abc');
		});

		it('should convert the pad_string to a string', function() {
			assert.equal('abc'.padStart(6, 1), '111abc');
		});
	});

	describe('#padEnd(target_length, pad_string)', function() {
		it('should do nothing if the string is long enough already', function() {
			assert.equal('abc'.padEnd(3, '0'), 'abc');
		});

		it('should pad the string at the start', function() {
			assert.equal('abc'.padEnd(6, '123'), 'abc123');
		});

		it('should pad only part of the string at the start', function() {
			assert.equal('abc'.padEnd(6, '123456'), 'abc123');
		});

		it('should repeat the string to pad', function() {
			assert.equal('abc'.padEnd(6, '0'), 'abc000');
		});

		it('should convert the pad_string to a string', function() {
			assert.equal('abc'.padEnd(6, 1), 'abc111');
		});
	});

	describe('#isEmptyWhitespace()', function() {

		it('should return true for zero-length strings', function() {
			assert.strictEqual(''.isEmptyWhitespace(), true);
			assert.strictEqual((new String()).isEmptyWhitespace(), true);
		});

		it('should return true for strings with only spaces', function() {
			assert.strictEqual('   '.isEmptyWhitespace(), true);
		});

		it('should return true for strings with other types of whitespace', function() {
			assert.strictEqual('\n'.isEmptyWhitespace(), true);
			assert.strictEqual('\t'.isEmptyWhitespace(), true);
			assert.strictEqual('\r'.isEmptyWhitespace(), true);
		});

		it('should return true for strings with different types of whitespace', function() {
			assert.strictEqual(' \n \t \r'.isEmptyWhitespace(), true);
		});

		it('should return false for strings with text', function() {
			assert.strictEqual('a'.isEmptyWhitespace(), false);
			assert.strictEqual(' a '.isEmptyWhitespace(), false);
			assert.strictEqual(' a\nb\nc '.isEmptyWhitespace(), false);
		});
	});

	describe('#isEmptyWhitespaceHTML()', function() {

		it('should return true for regular empty strings', function() {
			assert.strictEqual(''.isEmptyWhitespaceHTML(), true);
			assert.strictEqual(' '.isEmptyWhitespaceHTML(), true);
			assert.strictEqual('\n'.isEmptyWhitespaceHTML(), true);
		});

		it('should return true for HTML with only empty tags', function() {
			assert.strictEqual(' <p></p> <b> </b>'.isEmptyWhitespaceHTML(), true);
			assert.strictEqual('<br>'.isEmptyWhitespaceHTML(), true);
			assert.strictEqual('<br/>'.isEmptyWhitespaceHTML(), true);
		});

		it('should return false for HTML with text', function() {
			assert.strictEqual('<p>This is text</p>'.isEmptyWhitespaceHTML(), false);
			assert.strictEqual('<p></p> text'.isEmptyWhitespaceHTML(), false);
		});

		it('should return false for text with <> chars', function() {
			assert.strictEqual('a < b && b > a'.isEmptyWhitespaceHTML(), false);
		});

		it.skip('should return ... for invalid HTML elements?', function() {
			assert.strictEqual(' < b a > '.isEmptyWhitespaceHTML(), false);
		});
	});
});