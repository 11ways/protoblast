var assert = require('assert'),
    Blast;

describe('URL', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.parse(str)', function() {
		it('should create a new URL object', function() {

			var simple = URL.parse('/test'),
			    hard = URL.parse('http://www.codedor.be:8080/page?page=1&filter=test');

			assert.equal('/test', simple.pathname);

			assert.equal('/page', hard.pathname);
			assert.equal('www.codedor.be:8080', hard.host);
			assert.equal('8080', hard.port);
			assert.equal('http:', hard.protocol);
			assert.equal('?page=1&filter=test', hard.search);
			assert.equal('www.codedor.be', hard.hostname);
			assert.equal('http://www.codedor.be', hard.origin);
		});
	});

	describe('#clone()', function() {

		it('should clone and return a new URL object', function() {

			var ori = URL.parse('http://www.codedor.be/test'),
			    clone = ori.clone();

			assert.equal('http://www.codedor.be/test', ori+'');
			assert.equal('http://www.codedor.be/test', clone+'');

			ori.addQuery('param', 'A');

			assert.equal('http://www.codedor.be/test?param=A', ori+'');
			assert.equal('http://www.codedor.be/test', clone+'');

			clone.addQuery('param', 'CLONE');

			assert.equal('http://www.codedor.be/test?param=A', ori+'');
			assert.equal('http://www.codedor.be/test?param=CLONE', clone+'');
		});
	});
});