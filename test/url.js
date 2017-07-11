var assert = require('assert'),
    Blast;

describe('URL', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.parse(str)', function() {
		it('should create a new URL object', function() {

			var simple = URL.parse('/test'),
			    hard = URL.parse('http://www.develry.be:8080/page?page=1&filter=test');

			assert.equal(simple.pathname, '/test');

			assert.equal(hard.pathname, '/page');
			assert.equal(hard.host, 'www.develry.be:8080');
			assert.equal(hard.port, '8080');
			assert.equal(hard.protocol, 'http:');
			assert.equal(hard.search, '?page=1&filter=test');
			assert.equal(hard.hostname, 'www.develry.be');
			assert.equal(hard.origin, 'http://www.develry.be');
		});
	});

	describe('#clone()', function() {

		it('should clone and return a new URL object', function() {

			var ori = URL.parse('http://www.develry.be/test'),
			    clone = ori.clone();

			assert.equal(ori+'', 'http://www.develry.be/test');
			assert.equal(clone+'', 'http://www.develry.be/test');

			ori.addQuery('param', 'A');

			assert.equal(ori+'', 'http://www.develry.be/test?param=A');
			assert.equal(clone+'', 'http://www.develry.be/test');

			clone.addQuery('param', 'CLONE');

			assert.equal(ori+'', 'http://www.develry.be/test?param=A');
			assert.equal(clone+'', 'http://www.develry.be/test?param=CLONE');
		});
	});

	describe('#addQuery(name, value)', function() {

		it('should add the value to the url', function() {

			var ori = URL.parse('http://www.develry.be');

			ori.addQuery('name', 'value');

			assert.equal(String(ori), 'http://www.develry.be/?name=value');
		});

		it('should overwrite the value if it already exists', function() {

			var ori = URL.parse('http://www.develry.be');

			ori.addQuery('name', 'value');
			ori.addQuery('name', 'newvalue');

			assert.equal(String(ori), 'http://www.develry.be/?name=newvalue');
		});

		it('should add multiple values if it is an array', function() {

			var ori = URL.parse('http://www.develry.be');

			ori.addQuery('name', ['one', 'two']);

			assert.equal(String(ori), 'http://www.develry.be/?name%5B0%5D=one&name%5B1%5D=two');
		});

		it('should delete values when null is given', function() {

			var ori = URL.parse('http://www.develry.be/?name=ok');

			ori.addQuery('name', null);
			assert.equal(String(ori), 'http://www.develry.be/');
		});
	});
});