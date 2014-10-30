var assert = require('assert'),
    Blast;

describe('Error', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the error', function() {
			var e = new Error('msg'),
			    src = e.toSource(),
			    begin = '(new Error("msg", ';

			assert.equal(begin, e.toSource().slice(0,18));

			var line = new Error('msg');
			line.lineNumber = 0;
			src = line.toSource();

			assert.equal('(new Error("msg", undefined))', src);

			line = new Error('msg');
			line.lineNumber = null;
			src = line.toSource();

			assert.equal('(new Error("msg", undefined))', src);

			line = new Error('msg');
			line.lineNumber = 10;
			src = line.toSource();

			assert.equal('(new Error("msg", undefined, 10))', src);
		});
	});

	describe('.unDry() & #toDry()', function() {
		it('should be able to stringify & revive an error', function() {

			var e = new Error('msg'),
			    str = JSON.dry(e),
			    revive = JSON.undry(str);

			assert.equal(e.message, revive.message, 'Message is not equal');
			assert.equal(e.stack, revive.stack, 'Stack is not equal');
		});
	});
});