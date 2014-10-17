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

});