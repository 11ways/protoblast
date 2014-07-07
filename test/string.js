var assert = require('assert'),
    Blast  = require('../index.js')();

describe('String', function() {

	describe('#toSource()', function() {
		it('should return the source code representation of the string', function() {
			assert.strictEqual('(new String("TEST"))', 'TEST'.toSource());
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
		});
	});

	describe('#beforeLast(needle)', function() {
		
		var sentence = 'This is the string that contains the that needle that we need';

		it('should return the string before the last occurence of the needle', function() {
			assert.strictEqual('This is the string that contains the that needle ', sentence.beforeLast('that'));
		});
	});

	describe('#stripTags()', function() {
		it('should remove HTML tags from the string', function() {
			var original = '<b>This is a <br/>bold string</b>';

			assert.strictEqual('This is a bold string', original.stripTags());
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

	describe('#endsWith(str)', function() {
		it('should return true if the main string ends with the given string', function() {
			assert.strictEqual(true, 'polkadot'.endsWith('dot'));
		});

		it('should return false if the main string does not end with the given string', function() {
			assert.strictEqual(false, 'polkadot'.startsWith('somethingelse'));
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
			assert.strictEqual(3556498, 'test'.numberHash());
		});
	});

	describe('#checksum()', function() {
		it('should return the crc32 hash of the string', function() {
			assert.strictEqual(3632233996, 'test'.checksum());
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

});