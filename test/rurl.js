var assert = require('assert'),
    Blast,
    RURL;

var relative_tests = [
	['/foo/bar/baz', 'quux', '/foo/bar/quux'],
	['/foo/bar/baz', 'quux/asdf', '/foo/bar/quux/asdf'],
	['/foo/bar/baz', 'quux/baz', '/foo/bar/quux/baz'],
	['/foo/bar/baz', '../quux/baz', '/foo/quux/baz'],
	['/foo/bar/baz', '/bar', '/bar'],
	['/foo/bar/baz/', 'quux', '/foo/bar/baz/quux'],
	['/foo/bar/baz/', 'quux/baz', '/foo/bar/baz/quux/baz'],
	['/foo/bar/baz', '../../../../../../../../quux/baz', '/quux/baz'],
	['/foo/bar/baz', '../../../../../../../quux/baz', '/quux/baz'],
	['/foo', '.', '/'],
	['/foo', '..', '/'],
	['/foo/', '.', '/foo/'],
	['/foo/', '..', '/'],
	['/foo/bar', '.', '/foo/'],
	['/foo/bar', '..', '/'],
	['/foo/bar/', '.', '/foo/bar/'],
	['/foo/bar/', '..', '/foo/'],
	['foo/bar', '../../../baz', '../../baz'],
	['foo/bar/', '../../../baz', '../baz'],
	['/foo/bar/baz', '/../etc/passwd', '/etc/passwd'],
];

describe('RURL', function() {

	before(function() {
		Blast  = require('../index.js')();
		RURL = Blast.Classes.RURL;
	});

	describe('.resolvePath(from, to)', function() {

		it('works when from is relative', function() {
			assert.equal(RURL.resolvePath('a/b', 'c'), 'a/c');
		});

		it('works when to is absolute', function() {
			assert.equal(RURL.resolvePath('/a/b', '/c'), '/c');
		});

		it('works when to is empty', function() {
			assert.equal(RURL.resolvePath('/a/b', ''), '/a/b');
		});

		it('works when to is a sibling of the parent', function() {
			assert.equal(RURL.resolvePath('/a/b', '../c'), '/c');
		});

		it('works when to is a sibling path', function() {
			assert.equal(RURL.resolvePath('/a/b', 'c'), '/a/c');
		});

		it('works when from is an index path', function() {
			assert.equal(RURL.resolvePath('/a/', 'c'), '/a/c');
		});

		it('works when to points to the parent directory', function() {
			assert.equal(RURL.resolvePath('/a/b', '..'), '/');
		});

		it('handles all node.js relative tests', function() {
			relative_tests.forEach(function(relative_test) {
				const a = RURL.resolvePath(relative_test[0], relative_test[1]);
				const e = relative_test[2];
				assert.equal(a, e,
				  `resolvePath(${relative_test[0]}, ${relative_test[1]})` +
				  ` == ${e}\n  actual=${a}`);
			});
		});
	});

	describe('.resolve(from, to)', function() {
		it('should resolve urls', function() {
			assert.equal(RURL.resolve('/one/two/three', 'four'), '/one/two/four');
			assert.equal(RURL.resolve('http://example.com/', '/one'), 'http://example.com/one');
			assert.equal(RURL.resolve('http://example.com/one', '/two'), 'http://example.com/two');
			assert.equal(RURL.resolve('http://example.com/one/two/three', '../up'), 'http://example.com/one/up');
			assert.equal(RURL.resolve('http://example.com/one/two/three', '../../../../up'), 'http://example.com/up');
		});
	});

	describe('.parse(str)', function() {
		it('should create a new URL object', function() {

			var simple = RURL.parse('/test'),
			    hard = RURL.parse('http://www.develry.be:8080/page?page=1&filter=test');

			assert.equal(simple.pathname, '/test');

			assert.equal(hard.pathname, '/page');
			assert.equal(hard.host, 'www.develry.be:8080');
			assert.equal(hard.port, '8080');
			assert.equal(hard.protocol, 'http:');
			assert.equal(hard.search, '?page=1&filter=test');
			assert.equal(hard.hostname, 'www.develry.be');
			assert.equal(hard.origin, 'http://www.develry.be:8080');
		});

		it('should accept urls without origin', function() {

			var path = '/chimera/editor/site/edit/5b2fa879b0705a10a8a7af3d?test=1',
			    url;

			url = RURL.parse(path);

			assert.equal(url.pathname, '/chimera/editor/site/edit/5b2fa879b0705a10a8a7af3d')
			assert.equal(url.resource, path);
			assert.equal(url.search, '?test=1');
		});

		it('converts hostname to lowercase', function () {
			var url = RURL.parse('HTTP://fOo.eXaMPle.com');

			assert.equal(url.hostname, 'foo.example.com');
			assert.equal(url.href, 'http://foo.example.com/');
		});

		it('does not lowercase the path', function () {
			var url = RURL.parse('HTTP://X.COM/Y/Z');

			assert.equal(url.pathname, '/Y/Z');
			assert.equal(url.href, 'http://x.com/Y/Z');
		});

		it('should parse the query string into an object', function () {
			var url = 'http://google.com/?foo=bar',
			    data = RURL.parse(url);

			assert.equal(typeof data.query, 'object');
			assert.equal(data.query.foo, 'bar');

			url = 'http://google.com/';
			data = RURL.parse(url);

			assert.equal(typeof data.query, 'object');
			assert.equal(Object.size(data.query), 0);
		});

		it('does not add question mark to href if query string is empty', function () {
			var url = 'http://google.com/',
			    data = RURL.parse(url);

			assert.equal(data.href, url);
		});

		it('allows a custom location object', function () {
			var url = '/foo?foo=bar',
			    data = RURL.parse(url, 'http://google.com');

			assert.equal(data.href, 'http://google.com/foo?foo=bar');
		});

		it('is blob: location aware', function () {
			var blob = {
				'href': 'blob:https%3A//gist.github.com/3f272586-6dac-4e29-92d0-f674f2dde618',
				'pathname': 'https%3A//gist.github.com/3f272586-6dac-4e29-92d0-f674f2dde618',
				'origin': 'https://gist.github.com',
				'protocol': 'blob:',
				'hostname': '',
				'search': '',
				'hash': '',
				'host': '',
				'port': ''
			};

			var url = '/unshiftio/url-parse',
			    data = RURL.parse(url, blob);

			assert.equal(data.href, 'https://gist.github.com/unshiftio/url-parse');
		});

		it('removes default port numbers', function () {
			var url = 'http://example.com:80',
			    parsed = RURL.parse(url);

			assert.equal(parsed.port, '');
			assert.equal(parsed.host, 'example.com');
			assert.equal(parsed.hostname, 'example.com');

			// Also adds a slash when there is no path
			assert.equal(parsed.href, 'http://example.com/');
		});

		it('understands an / as pathname', function () {
			var url = 'http://example.com:80/',
			    parsed = RURL.parse(url);

			assert.equal(parsed.port, '');
			assert.equal(parsed.username, '');
			assert.equal(parsed.password, '');
			assert.equal(parsed.pathname, '/');
			assert.equal(parsed.host, 'example.com');
			assert.equal(parsed.hostname, 'example.com');
			assert.equal(parsed.href, 'http://example.com/');
		});

		it('does not care about spaces', function () {
			var url = 'http://x.com/path?that\'s#all, folks',
			    parsed = RURL.parse(url);

			assert.equal(parsed.port, '');
			assert.equal(parsed.username, '');
			assert.equal(parsed.password, '');
			assert.equal(parsed.pathname, '/path');
			assert.equal(parsed.hash, '#all, folks');
			assert.equal(parsed.search, '?that\'s');
			assert.equal(parsed.host, 'x.com');
			assert.equal(parsed.hostname, 'x.com');
		});

		it('accepts + in the url', function () {
			var url = 'http://x.y.com+a/b/c',
			    parsed = RURL.parse(url);

			assert.equal(parsed.protocol, 'http:');
			assert.equal(parsed.host, 'x.y.com+a');
			assert.equal(parsed.hostname, 'x.y.com+a');
			assert.equal(parsed.pathname, '/b/c');
		});

		it('accepts multiple ???', function () {
			var url = 'http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=';
			assert.equal(RURL.parse(url).search, '???&hl=en&src=api&x=2&y=2&z=3&s=');
		});

		it('accepts a string as source argument', function () {
			var data = RURL.parse('/foo', 'http://sub.example.com/bar?foo=bar#hash');

			assert.equal(data.port, '');
			assert.equal(data.host, 'sub.example.com');
			assert.equal(data.href, 'http://sub.example.com/foo');
		});

		it('inherits port numbers for relative urls', function () {
			var data = RURL.parse('/foo', RURL.parse('http://sub.example.com:808/'));
			test();

			function test() {
				assert.equal(data.port, '808');
				assert.equal(data.hostname, 'sub.example.com');
				assert.equal(data.host, 'sub.example.com:808');
				assert.equal(data.href, 'http://sub.example.com:808/foo');
			}

			data = RURL.parse('/foo', 'http://sub.example.com:808/');
			test();
		});

		it('inherits slashes for relative urls', function () {
			var data = RURL.parse('/foo', {
				hash: '',
				host: 'example.com',
				hostname: 'example.com',
				href: 'http://example.com/',
				origin: 'http://example.com',
				password: '',
				pathname: '/',
				port: '',
				protocol: 'http:',
				search: ''
			});

			assert.equal(data.slashes, true);
			assert.equal(data.href, 'http://example.com/foo');

			data = RURL.parse('/foo', {
				auth: null,
				hash: null,
				host: 'example.com',
				hostname: 'example.com',
				href: 'http://example.com/',
				path: '/',
				pathname: '/',
				port: null,
				protocol: 'http:',
				query: null,
				search: null,
				slashes: true
			});

			assert.equal(data.slashes, true);
			assert.equal(data.href, 'http://example.com/foo');
		});

		it('inherits protocol for relative protocols', function () {
			var data = RURL.parse('//foo.com/foo', RURL.parse('http://sub.example.com:808/'));

			assert.equal(data.port, '');
			assert.equal(data.host, 'foo.com');
			assert.equal(data.protocol, 'http:');
			assert.equal(data.href, 'http://foo.com/foo');
		});

		it('does not inherit pathname for non relative urls', function () {
			var data = RURL.parse('http://localhost', RURL.parse('http://foo:bar@sub.example.com/bar?foo=bar#hash'));

			assert.equal(data.port, '');
			assert.equal(data.host, 'localhost');
			assert.equal(data.href, 'http://localhost/');
		});

		it('resolves pathname for relative urls', function () {
			var data, i = 0;
			var tests = [
				['',      'http://foo.com',      ''],
				['',      'http://foo.com/',     '/'],
				['a',     'http://foo.com',      '/a'],
				['a/',    'http://foo.com',      '/a/'],
				['b/c',   'http://foo.com/a',    '/b/c'],
				['b/c',   'http://foo.com/a/',   '/a/b/c'],
				['.',     'http://foo.com',      '/'],
				['./',    'http://foo.com',      '/'],
				['./.',   'http://foo.com',      '/'],
				['.',     'http://foo.com/a',    '/'],
				['.',     'http://foo.com/a/',   '/a/'],
				['./',    'http://foo.com/a/',   '/a/'],
				['./.',   'http://foo.com/a/',   '/a/'],
				['./b',   'http://foo.com/a/',   '/a/b'],
				['..',    'http://foo.com',      '/'],
				['../',   'http://foo.com',      '/'],
				['../..', 'http://foo.com',      '/'],
				['..',    'http://foo.com/a/b',  '/'],
				['..',    'http://foo.com/a/b/', '/a/'],
				['../..', 'http://foo.com/a/b',  '/'],
				['../..', 'http://foo.com/a/b/', '/'],
				['../../../../c',   'http://foo.com/a/b/', '/c'],
				['./../d',          'http://foo.com/a/b/c', '/a/d'],
				['d/e/f/./../../g', 'http://foo.com/a/b/c', '/a/b/d/g']
			];

			for (; i < tests.length; i++) {
				data = RURL.parse(tests[i][0], tests[i][1]);
				assert.equal(data.pathname, tests[i][2]);
			}
		});

		it('does not inherit hashes and query strings from source object', function () {
			var data = RURL.parse('/foo', RURL.parse('http://sub.example.com/bar?foo=bar#hash'));

			assert.equal(data.port, '');
			assert.equal(data.host, 'sub.example.com');
			assert.equal(data.href, 'http://sub.example.com/foo');
		});
	});

	describe('#auth', function () {
		it('does not lowercase the USER:PASS', function () {
			var url = 'HTTP://USER:PASS@EXAMPLE.COM',
			    parsed = RURL.parse(url);

			assert.equal(parsed.username, 'USER');
			assert.equal(parsed.password, 'PASS');
			assert.equal(parsed.protocol, 'http:');
			assert.equal(parsed.host, 'example.com');
			assert.equal(parsed.hostname, 'example.com');
		});

		it('accepts @ in pathnames', function () {
			var url = 'http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=',
			    parsed = RURL.parse(url);

			assert.equal(parsed.pathname, '/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=');
			assert.equal(parsed.username, '');
			assert.equal(parsed.password, '');
		});

		it('does not require passwords for auth', function () {
			var url = 'http://user@www.example.com/',
			    parsed = RURL.parse(url);

			assert.equal(parsed.password, '');
			assert.equal(parsed.pathname, '/');
			assert.equal(parsed.username, 'user');
			assert.equal(parsed.protocol, 'http:');
			assert.equal(parsed.hostname, 'www.example.com');
			assert.equal(parsed.href, url);
		});

		it('can be changed by setting username or password', function() {
			var url = 'http://user@www.example.com/',
			    parsed = RURL.parse(url);

			function testUnchanged() {
				assert.equal(parsed.pathname, '/');
				assert.equal(parsed.protocol, 'http:');
				assert.equal(parsed.hostname, 'www.example.com');
			}

			assert.equal(parsed.href, url);
			assert.equal(parsed.username, 'user');
			assert.equal(parsed.auth, 'user');
			assert.equal(parsed.password, '');
			testUnchanged();

			parsed.username = 'USER';
			assert.equal(parsed.username, 'USER');
			assert.equal(parsed.auth, 'USER');
			assert.equal(parsed.password, '');
			testUnchanged();

			parsed.password = 'PaSS';
			assert.equal(parsed.password, 'PaSS');
			assert.equal(parsed.auth, 'USER:PaSS');
			assert.equal(parsed.href, 'http://USER:PaSS@www.example.com/');
			testUnchanged();

			parsed.username = '';
			assert.equal(parsed.username, '');
			assert.equal(parsed.password, 'PaSS');
			assert.equal(parsed.auth, ':PaSS');

			// If no username is set, the password also is not added to the url
			assert.equal(parsed.href, 'http://www.example.com/');

			parsed.username = 'user';
			assert.equal(parsed.href, 'http://user:PaSS@www.example.com/');
		});
	});

	describe('#host', function() {
		it('updates the port', function() {
			var data = RURL.parse('http://google.com/?foo=bar');

			data.host = 'yahoo.com:808';

			assert.equal(data.hostname, 'yahoo.com');
			assert.equal(data.host, 'yahoo.com:808');
			assert.equal(data.port, '808');

			assert.equal(data.href, 'http://yahoo.com:808/?foo=bar');
		});

		it('updates the port (IPv6)', function () {
			var data = RURL.parse('http://google.com/?foo=bar');

			data.host = '[56h7::1]:808';

			assert.equal(data.hostname, '[56h7::1]');
			assert.equal(data.host, '[56h7::1]:808');
			assert.equal(data.port, '808');

			assert.equal(data.href, 'http://[56h7::1]:808/?foo=bar');
		});

		it('unsets the port when the port is missing from host', function () {
			var data = RURL.parse('http://google.com:8000/?foo=bar');

			data.host = 'yahoo.com';

			assert.equal(data.hostname, 'yahoo.com');
			assert.equal(data.host, 'yahoo.com');
			assert.equal(data.port, '');

			assert.equal(data.href, 'http://yahoo.com/?foo=bar');
		});

		it('unsets the port when the port is missing (IPv6)', function () {
			var data = RURL.parse('http://google.com:8000/?foo=bar');

			data.host = '[56h7::1]';

			assert.equal(data.hostname, '[56h7::1]');
			assert.equal(data.host, '[56h7::1]');
			assert.equal(data.port, '');

			assert.equal(data.href, 'http://[56h7::1]/?foo=bar');
		});

		it('should lowercase the values', function() {
			var data = RURL.parse('http://google.com/?foo=bar');

			data.host = 'GOOGLE.LOL';
			assert.equal(data.host, 'google.lol');
			assert.equal(data.href, 'http://google.lol/?foo=bar');
		});
	});

	describe('#hostname', function() {
		it('updates the host', function() {
			var data = RURL.parse('http://google.com:808/?foo=bar');

			data.hostname = 'yahoo.com';

			assert.equal(data.hostname, 'yahoo.com');
			assert.equal(data.host, 'yahoo.com:808');
			assert.equal(data.port, '808');

			assert.equal(data.href, 'http://yahoo.com:808/?foo=bar');
		});

		it('should lowercase the values', function() {
			var data = RURL.parse('http://google.com/?foo=bar');

			data.host = 'YaHoO.cOM';
			assert.equal(data.host, 'yahoo.com');
			assert.equal(data.href, 'http://yahoo.com/?foo=bar');
		});
	});

	describe('#port', function() {
		it('correctly updates the host when setting port', function () {
			var data = RURL.parse('http://google.com/foo');

			data.port = 8080;

			assert.equal(data.host, 'google.com:8080');
			assert.equal(data.href, 'http://google.com:8080/foo');
		});

		it('correctly updates the host when setting port (IPv6)', function () {
			var data = RURL.parse('http://[7886:3423::1233]/foo');

			data.port = 8080;

			assert.equal(data.host, '[7886:3423::1233]:8080');
			assert.equal(data.href, 'http://[7886:3423::1233]:8080/foo');
		});

		it('only sets port when its not default', function () {
			var data = RURL.parse('http://google.com/foo');

			data.port = 80;

			assert.equal(data.host, 'google.com');
			assert.equal(data.href, 'http://google.com/foo');

			data.port = 443;

			assert.equal(data.host, 'google.com:443');
			assert.equal(data.href, 'http://google.com:443/foo');
		});
	});

	describe('#hash', function() {
		it('removes hash from the href', function() {
			var data = RURL.parse('https://thisanurl.com/?swag=yolo#representing');

			data.hash = '';

			assert.equal(data.href, 'https://thisanurl.com/?swag=yolo');
		});

		it('prepends # to hash', function() {
			var data = RURL.parse('http://example.com');

			data.hash = 'usage';

			assert.equal(data.hash, '#usage');
			assert.equal(data.href, 'http://example.com/#usage');

			data.hash = '#license';

			assert.equal(data.hash, '#license');
			assert.equal(data.href, 'http://example.com/#license');
		});
	});

	describe('#fragment', function() {
		it('is the hash without hashbang', function() {
			var data = RURL.parse('http://example.com/#test');

			assert.equal(data.hash, '#test');
			assert.equal(data.fragment, 'test');

			data.fragment = 'new';

			assert.equal(data.hash, '#new');
			assert.equal(data.fragment, 'new');

			data.fragment = '#withhash';

			assert.equal(data.hash, '#withhash');
			assert.equal(data.fragment, 'withhash');
		});
	});

	describe('#search', function() {
		it('sets the query object', function() {
			var data = RURL.parse('http://www.develry.be');

			data.search = '?test=1&bla=2';

			assert.equal(data.query.test, '1');
			assert.equal(data.query.bla, '2');

			data.search = '?more=1';

			assert.equal(data.query.test, null);
			assert.equal(data.query.bla, null);
			assert.equal(data.query.more, '1');
		});
	});

	describe('#query', function() {
		it('sets the search string', function() {
			var data = RURL.parse('http://www.develry.be');

			data.query = {
				a: 1,
				b: 2
			};

			assert.equal(data.search, '?a=1&b=2');
		});

		it('sets an empty search string when an empty object is assigned', function() {
			var data = RURL.parse('http://www.develry.be');

			data.query = {
				a: 1,
				b: 2
			};

			assert.equal(data.search, '?a=1&b=2');

			data.query = {};
			assert.equal(data.search, '');
		});
	});

	describe('#pathname', function() {
		it('prepends / to pathname', function () {
			var url = RURL.parse();

			url.protocol = 'http';
			url.host = 'example.com:80';
			url.pathname = 'will/get/slash/prepended';

			assert.equal(url.pathname, '/will/get/slash/prepended');
			assert.equal(url.href, 'http://example.com:80/will/get/slash/prepended');

			url.pathname = '';

			assert.equal(url.pathname, '');
			assert.equal(url.href, 'http://example.com:80/');

			url.pathname = '/has/slash';

			assert.equal(url.pathname, '/has/slash');
			assert.equal(url.href, 'http://example.com:80/has/slash');
		});
	});

	describe('#path', function() {
		it('is an alias to #pathname', function() {
			var url = RURL.parse('http://foo.bar/foo.html?hello#test');

			assert.equal(url.path, '/foo.html');
			assert.equal(url.pathname, '/foo.html');

			url.path = '/test.html';

			assert.equal(url.pathname, '/test.html');

			assert.equal(url.href, 'http://foo.bar/test.html?hello#test')
		});
	});

	describe('#resource', function() {
		it('gets everything after the origin', function () {
			var url = RURL.parse('http://foo.bar/foo.html?hello#world');

			assert.equal(url.resource, '/foo.html?hello#world');
		});

		it('sets other values', function() {
			var url = RURL.parse('http://foo.bar/foo.html?hello#world');

			url.resource = '/world.html';
			assert.equal(url.href, 'http://foo.bar/world.html');
			assert.equal(url.resource, '/world.html');

			url.resource = '?query';
			assert.equal(url.href, 'http://foo.bar/?query');
			assert.equal(url.resource, '/?query');

			url.resource = '#fragment';
			assert.equal(url.href, 'http://foo.bar/#fragment');
			assert.equal(url.resource, '/#fragment');
			assert.equal(url.fragment, 'fragment');

			url.resource = '?hello#world';
			assert.equal(url.href, 'http://foo.bar/?hello#world');
			assert.equal(url.resource, '/?hello#world');

			url.resource = '/mars.txt?planet=123';
			assert.equal(url.href, 'http://foo.bar/mars.txt?planet=123');
			assert.equal(url.resource, '/mars.txt?planet=123');

			url.resource = '/neptune.txt#foo';
			assert.equal(url.href, 'http://foo.bar/neptune.txt#foo');
			assert.equal(url.resource, '/neptune.txt#foo');
		});
	});

	describe('#segments', function() {
		it('is an array representation of the path', function() {
			var u = RURL.parse('http://www.example.org/some/directory/foo.html');
			assert.equal(u.segments.join('||'), 'some||directory||foo.html');
		});

		it('sets the pathname when assigned to', function() {
			var u = RURL.parse('http://www.example.org/some/directory/foo.html');

			u.segments = ['hello', 'world', 'foo.html'];
			assert.equal(u.pathname, '/hello/world/foo.html');
		});
	});

	describe('#segment(index, value)', function() {
		it('gets all the segments', function() {
			var u = RURL.parse('http://www.example.org/some/directory/foo.html'),
			    seg = u.segment();

			assert.equal(seg.join('||'), 'some||directory||foo.html');
		});

		it('gets a single segment piece', function() {

			var u = RURL.parse('http://www.example.org/some/directory/foo.html');

			assert.equal(u.segment(0), 'some');
			assert.equal(u.segment(1), 'directory');
			assert.equal(u.segment(3), undefined);

			assert.equal(u.segment('first'), 'some');
			assert.equal(u.segment('last'), 'foo.html');
		});

		it('sets a segment & updates the pathname', function() {

			var u = RURL.parse('http://www.example.org/some/directory/foo.html');

			u.segment(0, 'zero');
			assert.equal(u.href, 'http://www.example.org/zero/directory/foo.html');

			u.segment('last', 'last');
			assert.equal(u.href, 'http://www.example.org/zero/directory/last');

			u.segment('first', 'first');
			assert.equal(u.href, 'http://www.example.org/first/directory/last');

			u.segment(1, 'one');
			assert.equal(u.href, 'http://www.example.org/first/one/last')
		});

		it('gets negative indexes', function() {
			var u = RURL.parse('http://www.example.org/some/directory/foo.html');

			assert.equal(u.segment(-1), 'foo.html');
		});

		it('accepts arrays', function() {
			var u = RURL.parse('http://www.example.org/some/directory/foo.html');
			u.segment(['one', 'two', 'three']);

			assert.equal(u.pathname, '/one/two/three');
		});
	});

	describe('#protocol', function() {
		it('extracts the right protocol from a url', function () {
			var testData = [
				{
					href: 'http://example.com',
					protocol: 'http:',
					pathname: ''
				},
				{
					href: 'mailto:test@example.com',
					pathname: 'test@example.com',
					protocol: 'mailto:'
				},
				{
					href: 'data:text/html,%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E',
					pathname: 'text/html,%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E',
					protocol: 'data:'
				},
				{
					href: 'sip:alice@atlanta.com',
					pathname: 'alice@atlanta.com',
					protocol: 'sip:'
				}
			];

			var data;
			for (var i = 0, len = testData.length; i < len; ++i) {
				data = RURL.parse(testData[i].href);
				assert.equal(data.protocol, testData[i].protocol);
				assert.equal(data.pathname, testData[i].pathname);
			}
		});

		it('updates slashes when updating protocol', function() {
			var data = RURL.parse('sip:alice@atlanta.com');

			assert.equal(data.href, 'sip:alice@atlanta.com');

			data.protocol = 'https';

			assert.equal(data.href, 'https://alice@atlanta.com/');

			data.protocol = 'mailto';

			assert.equal(data.href, 'mailto:alice@atlanta.com');
		});

		it('should lowercase the values', function() {
			var data = RURL.parse('http://google.com/?foo=bar');

			data.protocol = 'HTTPS';
			assert.equal(data.protocol, 'https:');

			data.protocol = 'HTTPS:';
			assert.equal(data.protocol, 'https:');

			assert.equal(data.href, 'https://google.com/?foo=bar');
		});
	});

	describe('#origin', function() {
		it('generates an origin property', function () {
			var url = RURL.parse('http://google.com:80/pathname');
			assert.equal(url.origin, 'http://google.com');
		});

		it('is lowercased', function () {
			var url = RURL.parse('HTTP://gOogle.cOm:80/pathname');
			assert.equal(url.origin, 'http://google.com');
		});

		it('removes default ports for http', function () {
			var o = RURL.parse('http://google.com:80/pathname');
			assert.equal(o.origin, 'http://google.com');

			o = RURL.parse('http://google.com:80');
			assert.equal(o.origin, 'http://google.com');

			o = RURL.parse('http://google.com');
			assert.equal(o.origin, 'http://google.com');

			o = RURL.parse('https://google.com:443/pathname');
			assert.equal(o.origin, 'https://google.com');

			o = RURL.parse('http://google.com:443/pathname');
			assert.equal(o.origin, 'http://google.com:443');

			o = RURL.parse('https://google.com:80/pathname');
			assert.equal(o.origin, 'https://google.com:80');
		});

		it('handles file:// based urls as null', function () {
			var o = RURL.parse('file://google.com/pathname');
			assert.equal(o.origin, 'null');
		});

		it('removes default ports for ws', function () {
			var o = RURL.parse('ws://google.com:80/pathname');
			assert.equal(o.origin, 'ws://google.com');

			o = RURL.parse('wss://google.com:443/pathname');
			assert.equal(o.origin, 'wss://google.com');

			o = RURL.parse('ws://google.com:443/pathname');
			assert.equal(o.origin, 'ws://google.com:443');

			o = RURL.parse('wss://google.com:80/pathname');
			assert.equal(o.origin, 'wss://google.com:80');
		});

		it('is correctly updated when host/protocol/port changes', function () {
			var data = RURL.parse('http://google.com/?foo=bar');

			data.protocol = 'HTTPS:';

			assert.equal(data.protocol, 'https:');
			assert.equal(data.origin, 'https://google.com');

			data.port = 1337;

			assert.equal(data.port, '1337');
			assert.equal(data.origin, 'https://google.com:1337');

			data.protocol = 'file:';

			assert.equal(data.protocol, 'file:');
			assert.equal(data.origin, 'null');
		});
	});

	describe('#clone()', function() {

		it('should clone and return a new RURL object', function() {

			var ori = RURL.parse('http://www.develry.be/test'),
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

			var ori = RURL.parse('http://www.develry.be');

			ori.addQuery('name', 'value');

			assert.equal(String(ori), 'http://www.develry.be/?name=value');
		});

		it('should overwrite the value if it already exists', function() {

			var ori = RURL.parse('http://www.develry.be');

			ori.addQuery('name', 'value');
			ori.addQuery('name', 'newvalue');

			assert.equal(String(ori), 'http://www.develry.be/?name=newvalue');
		});

		it('should add multiple values if it is an array', function() {

			var ori = RURL.parse('http://www.develry.be');

			ori.addQuery('name', ['one', 'two']);

			assert.equal(String(ori), 'http://www.develry.be/?name[0]=one&name[1]=two');
		});

		it('should delete values when null is given', function() {

			var ori = RURL.parse('http://www.develry.be/?name=ok');

			ori.addQuery('name', null);
			assert.equal(String(ori), 'http://www.develry.be/');
		});
	});

});