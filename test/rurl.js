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

	describe('new RURL()', function() {
		it('should create an empty url', function() {
			var url = new RURL();

			assert.equal(url.href, '');
			assert.equal(url.path, '');
			assert.equal(url.protocol, '');
			assert.equal(url.username, '');
			assert.equal(url.password, '');
			assert.equal(url.host, '');
			assert.equal(url.search, '');
			assert.equal(url.hash, '');
			assert.equal(url.fragment, '');
		});

		it('should be possible to construct a url piece by piece', function() {
			var url = new RURL();

			url.protocol = 'https://';
			url.hostname = 'my.sub.domain.be';
			url.resource = '/hawkejs/templates?name[0]=tags%2Fdashboard';

			assert.equal(url.href, 'https://my.sub.domain.be/hawkejs/templates?name[0]=tags%2Fdashboard');
			assert.deepEqual(url.query, {name: ['tags/dashboard']});

			url = new RURL();

			url.protocol = 'https://';
			url.hostname = 'my.sub.domain.be';
			url.path = '/hawkejs/templates?name[0]=tags%2Fdashboard';

			assert.equal(url.href, 'https://my.sub.domain.be/hawkejs/templates?name[0]=tags%2Fdashboard');
			assert.deepEqual(url.query, {name: ['tags/dashboard']});
		});
	});

	describe('.requiresPort(port, protocol)', function() {
		it('returns true when the given protocol requires the port to be used', function() {
			assert.equal(RURL.requiresPort(8080, 'gopher'), true);
			assert.equal(RURL.requiresPort(8080, 'https'), true);
			assert.equal(RURL.requiresPort(8080, 'http'), true);
			assert.equal(RURL.requiresPort(8080, 'ftp'), true);
			assert.equal(RURL.requiresPort(8080, 'wss'), true);
			assert.equal(RURL.requiresPort(8080, 'ws'), true);
		});

		it('returns false when the port is the default for the protocol', function() {
			assert.equal(RURL.requiresPort(70, 'gopher'), false);
			assert.equal(RURL.requiresPort(443, 'https'), false);
			assert.equal(RURL.requiresPort(80, 'http'), false);
			assert.equal(RURL.requiresPort(21, 'ftp'), false);
			assert.equal(RURL.requiresPort(443, 'wss'), false);
			assert.equal(RURL.requiresPort(80, 'ws'), false);
		});

		it('always returns false for file protocol', function() {
			assert.equal(RURL.requiresPort(80, 'file'), false);
			assert.equal(RURL.requiresPort(~~(Math.random()*100), 'file'), false);
		});

		it('returns false for port 0', function() {
			assert.equal(RURL.requiresPort(0), false);
		});

		it('accepts port strings', function() {
			assert.equal(RURL.requiresPort('80', 'http'), false);
			assert.equal(RURL.requiresPort('8080', 'http'), true);
		});

		it('returns true for any protocol it does not know', function() {
			assert.equal(RURL.requiresPort(40, 'myprotocol'), true);
		});
	});

	describe('.requiresSlashes(protocol)', function() {
		it('returns true for protocols that require slashes', function() {
			assert.equal(RURL.requiresSlashes('http'), true);
		});

		it('returns false for protocols that do not require slashes', function() {
			assert.equal(RURL.requiresSlashes('view-source'), false);
		});

		it('returns null for protocols it does not know', function() {
			assert.equal(RURL.requiresSlashes('flerg'), null);
			assert.equal(RURL.requiresSlashes(''), null);
			assert.equal(RURL.requiresSlashes(null), null);
		});
	});

	describe('.parseLocation(location)', function() {
		it('is blob: aware', function() {
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

			var data = RURL.parseLocation(blob);

			assert.equal(data.href, 'https://gist.github.com/3f272586-6dac-4e29-92d0-f674f2dde618');
		});

		it('uses the current location if none is given', function() {
			var data = RURL.parseLocation();
		});
	});

	describe('.parseObject(obj)', function() {
		it('returns null when nothing is given', function() {
			assert.equal(RURL.parseObject(), null);
		});

		it('returns a clone if an RURL object is given', function() {
			var original,
			    clone;

			original = RURL.parse('http://develry.be');
			clone = RURL.parseObject(original);

			assert.equal(clone.href, original.href);

			original.param('query', 'string');

			assert.equal(original.href, 'http://develry.be/?query=string');
			assert.equal(clone.href, 'http://develry.be/');
		});

		it('uses the href when nothing else worked', function() {
			var data,
			    url;

			data = {href: 'http://www.develry.be'};
			url = RURL.parseObject(data);

			assert.equal(url.href, 'http://www.develry.be/');
			assert.equal(url.constructor, RURL);
		});
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
				['',      'http://foo.com',      '/'],
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

	describe('.parse(obj)', function() {
		it('should parse url-like objects with a #scheme property (jurlp)', function() {

			var obj = {
				scheme: "http://",
				user: "username",
				password: "password",
				host: "www.example.com",
				port: "8080",
				path: "/path/file.name",
				query: "?query=string",
				fragment: "#anchor"
			};

			var result = RURL.parse(obj),
			    url = String(result);

			assert.equal(url, 'http://username:password@www.example.com:8080/path/file.name?query=string#anchor');
		});

		it('should parse url-like objects with methods (jsuri, urijs)', function() {

			var jsUri = require('jsuri'),
			    url   = 'http://user:pass@www.test.com:81/index.html?q=books#fragment',
			    uri   = new jsUri(url);

			var rurl = RURL.parse(uri);

			assert.equal(rurl.href, url);
		});

		if (typeof URL != 'undefined') {
			it('should parse WHATWG URLs', function() {
				var url   = 'http://user:pass@www.test.com:81/index.html?q=books#fragment',
				    uri   = new URL(url);

				var rurl = RURL.parse(uri);
				assert.equal(rurl.href, url);
			});
		}

		it('should parse legacy nodejs URL objects', function() {
			var nurl = require('url'),
			    url  = 'https://user:pass@www.develry.be:8080/test.html?query=string#hash';

			var instance = nurl.parse(url);
			var rurl = RURL.parse(instance);

			assert.equal(rurl.href, url);
		});
	});

	describe('.parseQuery(input, options)', function() {
		it('should parse simple query strings to an object', function() {
			assert.deepEqual(RURL.parseQuery('a=bla'), {a: 'bla'});
			assert.deepEqual(RURL.parseQuery('a=bla&b=foo'), {a: 'bla', b: 'foo'});
			assert.deepEqual(RURL.parseQuery('foo'), {foo: ''});
			assert.deepEqual(RURL.parseQuery('foo='), {foo: ''});
			assert.deepEqual(RURL.parseQuery('foo=bar&bar=baz'), {foo: 'bar', bar: 'baz'});
			assert.deepEqual(RURL.parseQuery('foo2=bar2&baz2='), {foo2: 'bar2', baz2: ''});
			assert.deepEqual(RURL.parseQuery('foo=bar&baz', {empty_value: null}), {foo: 'bar', baz: null});
			assert.deepEqual(RURL.parseQuery('str_a=Jack+and+Jill+didn%27t+see+the+well.'), {str_a: "Jack and Jill didn't see the well."});
			assert.deepEqual(RURL.parseQuery('a[b]["c"]=def&a[q]=t+5'), {"a":{"b":{'"c"':"def"},"q":"t 5"}});

			assert.deepEqual(RURL.parseQuery(' foo = bar = baz '), {' foo ': ' bar = baz '});

			assert.deepEqual(RURL.parseQuery('cht=p3&chd=t:60,40&chs=250x100&chl=Hello|World'), {
				cht: 'p3',
				chd: 't:60,40',
				chs: '250x100',
				chl: 'Hello|World'
			});
		});

		it('should parse nested strings', function() {
			assert.deepEqual(RURL.parseQuery('a[b]=c'),     {a: {b     : 'c'}});
			assert.deepEqual(RURL.parseQuery('a[>=]=23'),   {a: {'>='  : '23'}});
			assert.deepEqual(RURL.parseQuery('a[<=>]==23'), {a: {'<=>' : '=23'}});
			assert.deepEqual(RURL.parseQuery('a[==]=23'),   {a: {'=='  : '23'}});
			assert.deepEqual(RURL.parseQuery('a[b][c]=d'),  {a: {b: {c: 'd' }}});
		});

		it('should limit nesting to a default of 5 levels', function() {
			assert.deepEqual(RURL.parseQuery('a[b][c][d][e][f][g][h]=i'), { a: { b: { c: { d: { e: { f: { '[g][h]': 'i' } } } } } } });
		});

		it('should parse only 1 level deep with depth=1', function() {
			assert.deepEqual(RURL.parseQuery('a[b][c]=d', {depth: 1}), { a: { b: { '[c]': 'd' } } });
		});

		it('should parse simple arrays', function() {
			assert.deepEqual(RURL.parseQuery('a=b&a=c'), {a: 'c'});
			assert.deepEqual(RURL.parseQuery('a=b&b=1&a=c'), {a: 'c', b: '1'});
		});

		it('should parse explicit arrays', function() {
			assert.deepEqual(RURL.parseQuery('a[]=b&a[]=c'),  {a: ['b', 'c']});
			assert.deepEqual(RURL.parseQuery('a=b&a[]=c'),  {a: ['c']});
			assert.deepEqual(RURL.parseQuery('a=b&a[]=c&a[]=d'),  {a: ['c', 'd']});
			assert.deepEqual(RURL.parseQuery('a=b&a[]=c&a[]=d&a[0]=a'),  {a: ['a', 'd']});
			assert.deepEqual(RURL.parseQuery('a=b&a[]=c&a[]=d&a[5]=a'),  {a: ['c', 'd',,,,'a']});
			assert.deepEqual(RURL.parseQuery('a[]=b&a=c'),  {a: 'c'});
			assert.deepEqual(RURL.parseQuery('a[0]=b&a=c'), {a: 'c'});
			assert.deepEqual(RURL.parseQuery('a=b&a[0]=c'), {a: ['c']});

			assert.deepEqual(RURL.parseQuery('a[bla]=bla&a[]=add'), {a: {bla: 'bla', 0: 'add'}});
			assert.deepEqual(RURL.parseQuery('a[bla]=d&a[]=0&a[]=1&a[5]=5&a[]=6'), {a: {bla: 'd', '0': '0', '1': '1', '5': '5', '6': '6'}});

			assert.deepEqual(RURL.parseQuery('a[1]=b&a=c', {array_limit: 20}), {a: 'c'});
			assert.deepEqual(RURL.parseQuery('a[]=b&a=c'), {a: 'c'});
			assert.deepEqual(RURL.parseQuery('a[]=b&a=c', {array_limit: 0}), {a: 'c'});
			assert.deepEqual(RURL.parseQuery('a[1]=b&a[0]=c'), {a: ['c', 'b']});
		});

		it('should not set properties in the prototype', function() {

			var result,
			    query,
			    obj = {};

			query = 'a[__proto__][whatever_rurl]=1';
			result = RURL.parseQuery(query);

			assert.equal(obj.whatever_rurl, undefined);
		});

		it('should support encoded = signs', function() {
			assert.deepEqual(RURL.parseQuery('he%3Dllo=th%3Dere'), { 'he=llo': 'th=ere' });
		});
	});

	describe('#encodeQuery(obj, sep, eq, options)', function() {
		it('stringifies an object', function() {
			assert.equal(RURL.encodeQuery({ a: 'b' }), 'a=b');
			assert.equal(RURL.encodeQuery({ a: 1 }), 'a=1');
			assert.equal(RURL.encodeQuery({ a: 1, b: 2 }), 'a=1&b=2');
			assert.equal(RURL.encodeQuery({ a: 'A_Z' }), 'a=A_Z');
			assert.equal(RURL.encodeQuery({ a: '€' }), 'a=%E2%82%AC');
			assert.equal(RURL.encodeQuery({ a: '' }), 'a=%EE%80%80');
			assert.equal(RURL.encodeQuery({ a: 'א' }), 'a=%D7%90');
			assert.equal(RURL.encodeQuery({ a: '𐐷' }), 'a=%F0%90%90%B7');
		});

		it('stringifies a nested object', function() {
			assert.equal(RURL.encodeQuery({ a: { b: 'c' } }), 'a[b]=c');
			assert.equal(RURL.encodeQuery({ a: { b: { c: { d: 'e' } } } }), 'a[b][c][d]=e');
		});

		it('stringifies an array value', function() {
			assert.equal(RURL.encodeQuery({ a: ['b', 'c', 'd'] }), 'a[0]=b&a[1]=c&a[2]=d');
		});

		it('stringifies a nested array value', function() {
			assert.equal(RURL.encodeQuery({ a: { b: ['c', 'd'] } }), 'a[b][0]=c&a[b][1]=d');
		});

		it('stringifies an object inside an array', function() {

			var result = RURL.encodeQuery({ a: [{ b: 'c' }] });
			assert.equal(result, 'a[0][b]=c');

			result = RURL.encodeQuery({ a: [{ b: { c: [1] } }] });
			assert.equal(result, 'a[0][b][c][0]=1');
		});

		it('stringifies an array with mixed objects and primitives', function() {
			var input = { a: [{ b: 1 }, 2, 3] };
			var result = RURL.encodeQuery(input);

			// Result should 'a[0][b]=1&a[1]=2&a[2]=3'
			// But because Object.flatten uses an object, the order can vary
			assert.deepEqual(RURL.parseQuery(result), input);

			input = { a: 'b', c: ['d', 'e=f'], f: [['g'], ['h']] };
			result = RURL.encodeQuery(input);
			assert.deepEqual(RURL.parseQuery(result), input);
		});

		it('stringifies weird objects', function() {
			var input = { 'my weird field': '~q1!2"\'w$5&7/z8)?' },
			    result = RURL.encodeQuery(input);

			assert.equal(result, "my%20weird%20field=~q1!2%22'w$5%267%2Fz8)%3F");
		});

		it('skips properties that are part of the object prototype', function() {
			Object.prototype.crash = 'test';
			assert.equal(RURL.encodeQuery({ a: 'b' }), 'a=b');
			assert.equal(RURL.encodeQuery({ a: { b: 'c' } }), 'a[b]=c');
			delete Object.prototype.crash;
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

			assert.equal(parsed.href, 'http://USER:PASS@example.com/');
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

			assert.equal(url.pathname, '/');
			assert.equal(url.href, 'http://example.com:80/');

			url.pathname = '/has/slash';

			assert.equal(url.pathname, '/has/slash');
			assert.equal(url.href, 'http://example.com:80/has/slash');
		});

		it('encodes # or ?', function() {

			var url = RURL.parse('http://develry.be/test?a=b');

			url.pathname = '/test?a#id';

			assert.equal(url.href, 'http://develry.be/test%3Fa%23id?a=b');
		});
	});

	describe('#path', function() {
		it('gets the pathname + the search', function() {
			var url = RURL.parse('http://foo.bar/foo.html?hello#test');

			assert.equal(url.path, '/foo.html?hello');
			assert.equal(url.pathname, '/foo.html');
		});

		it('sets the pathname, search & hash', function() {
			var url = RURL.parse('http://foo.bar/foo.html?hello#test');

			url.path = '/test.html#hash';
			assert.equal(url.pathname, '/test.html');

			assert.equal(url.href, 'http://foo.bar/test.html#hash')
		});

		it('does not encode ? or #', function() {
			var url = RURL.parse('http://develry.be/test?a=b');

			url.path = '/bla?a=1#id';

			assert.equal(url.href, 'http://develry.be/bla?a=1#id');
			assert.equal(url.hash, '#id');
			assert.equal(url.search, '?a=1');
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
					pathname: '/'
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

		it('strips away slashes', function() {
			var u = RURL.parse('http://www.example.org/some/directory/foo.html');

			u.protocol = 'ftp://';

			assert.equal(u.href, 'ftp://www.example.org/some/directory/foo.html');
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

	describe('#extension', function() {

		it('should return the extension of the pathname', function() {

			var html = RURL.parse('https://www.elevenways.be/test.html'),
			    pdf = RURL.parse('https://www.elevenways.be/test.pdf'),
			    jpg = RURL.parse('https://www.elevenways.be/test.JPG'),
			    none = RURL.parse('https://www.elevenways.be');

			assert.strictEqual(html.extension, 'html');
			assert.strictEqual(pdf.extension, 'pdf');
			assert.strictEqual(jpg.extension, 'JPG');
			assert.strictEqual(none.extension, '');
		});

		it('should set the extension of the pathname', function() {

			var o = RURL.parse('https://www.elevenways.be/test');

			o.extension = 'php';

			assert.strictEqual(o.extension, 'php');
			assert.strictEqual(o.pathname, '/test.php');

			o.extension = '';

			assert.strictEqual(o.extension, '');
			assert.strictEqual(o.pathname, '/test');

			o.extension = '.whatever';
			assert.strictEqual(o.pathname, '/test.whatever');

			o.pathname = '/';

			assert.strictEqual(o.extension, '');

		});

	});

	describe('#toJSON()', function() {
		it('should return an object representation of the url', function() {

			var ori = RURL.parse('http://user:pass@www.develry.be:81/test?query=param#hash'),
			    json_string = JSON.stringify(ori),
			    obj = JSON.parse(json_string);

			assert.deepEqual(obj, {
				protocol : 'http:',
				username : 'user',
				password : 'pass',
				hostname : 'www.develry.be',
				port     : '81',
				pathname : '/test',
				search   : '?query=param',
				hash     : '#hash',
				slashes  : true,
				from_base : []
			});
		});
	});

	describe('#toDry()', function() {
		it('should allow an RURL object to be serialized & revived', function() {

			var serialized,
			    original,
			    revived,
			    url;

			url = 'http://user:pass@www.develry.be:81/test?query=param#hash';
			original = RURL.parse(url);
			serialized = JSON.dry(original);
			revived = JSON.undry(serialized);

			assert.equal(revived.constructor.name, 'RURL');
			assert.equal(revived.href, original.href);
		});
	});

	describe('#clone()', function() {

		it('should clone and return a new RURL object', function() {

			var ori = RURL.parse('http://www.develry.be/test'),
			    clone = ori.clone();

			assert.equal(ori+'', 'http://www.develry.be/test');
			assert.equal(clone+'', 'http://www.develry.be/test');

			ori.addQuery('param', 'A');

			assert.equal(ori+'', 'http://www.develry.be/test?param=A', 'Original should have a "param=A" parameter');
			assert.equal(clone+'', 'http://www.develry.be/test', 'Clone should not have changed');

			clone.addQuery('param', 'CLONE');

			assert.equal(ori+'', 'http://www.develry.be/test?param=A', 'Original should still have a "param=A" parameter');
			assert.equal(clone+'', 'http://www.develry.be/test?param=CLONE', 'Clone should now have a "param=CLONE" parameter');
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

		it('should accept querystrings', function() {
			var ori = RURL.parse('http://www.develry.be/?name=ok');

			ori.addQuery('name=new&more=test');
			assert.equal(String(ori), 'http://www.develry.be/?name=new&more=test');
			assert.deepEqual(ori.query, {name: 'new', more: 'test'});

			ori.addQuery('more=new&extra=extra');

			assert.equal(String(ori), 'http://www.develry.be/?name=new&more=new&extra=extra');
			assert.deepEqual(ori.query, {name: 'new', more: 'new', extra: 'extra'});
		});

		it('should accept objects as a single parameter', function() {
			var ori = RURL.parse('http://www.develry.be/?a=0&b=0&c=0');

			ori.addQuery({c: 'c', d: 'd'});

			assert.equal(String(ori), 'http://www.develry.be/?a=0&b=0&c=c&d=d');
			assert.deepEqual(ori.query, {a: '0', b: '0', c: 'c', d: 'd'});
		});
	});

	describe('#param(name)', function() {
		it('should get the parameter', function() {

			var ori = RURL.parse('http://www.develry.be/?a=0&b=0&c=0');

			assert.equal(ori.param('a'), '0');
			assert.equal(ori.param('b'), '0');
			assert.equal(ori.param('c'), '0');

			ori.addQuery({c: 'c', d: 'd'});

			assert.equal(ori.param('a'), '0');
			assert.equal(ori.param('b'), '0');
			assert.equal(ori.param('c'), 'c');
			assert.equal(ori.param('d'), 'd');
		});
	});

	describe('#param(name, value)', function() {
		it('should set the parameter to the given value', function() {

			var ori = RURL.parse('http://www.develry.be/?a=0&b=0&c=0');

			assert.equal(ori.param('a'), '0');
			assert.equal(ori.param('b'), '0');
			assert.equal(ori.param('c'), '0');

			ori.param('a', 'this=is=a');
			ori.param('c', '&thisisc');

			assert.equal(ori.param('a'), 'this=is=a');
			assert.equal(ori.param('b'), '0');
			assert.equal(ori.param('c'), '&thisisc');

			assert.equal(String(ori), 'http://www.develry.be/?a=this%3Dis%3Da&b=0&c=%26thisisc');

			var parsed = RURL.parse(String(ori));

			assert.equal(parsed.param('a'), 'this=is=a');
			assert.equal(parsed.param('b'), '0');
			assert.equal(parsed.param('c'), '&thisisc');
		});
	});

	describe('#usedBaseProperty(name)', function() {
		it('should return wether the value came from the base location', function() {

			var relative = RURL.parse('relfile', 'http://www.bla.be'),
			    absolute = RURL.parse('http://www.abs.be');

			assert.strictEqual(relative.usedBaseProperty('hostname'), true);
			assert.strictEqual(absolute.usedBaseProperty('hostname'), false);
		});
	});

});