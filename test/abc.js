var assert   = require('assert');

describe('Blast(false)', function() {

	var Blast    = require('../index.js'),
	    blastObj,
	    modifiedProto;

	Blast.unit_test = true;

	blastObj = Blast(false);

	modifiedProto = !!(String.prototype.startsWith && Object.divide);

	it('should not modify the prototype', function() {
		assert.equal(modifiedProto, false);
	});

	it('should have returned bound functions', function() {
		var bound = !!(blastObj.Bound.String.startsWith);
		assert.equal(bound, true);
	});
});

describe('Blast()', function() {

	var Blast;

	it('should apply changes without throwing an error', function() {
		Blast = require('../index.js');
		Blast.unit_test = true;
		Blast = Blast();
	});

	it('should modify prototype when no parameter is given', function() {
		assert.equal(!!String.prototype.startsWith, true);
	});
});

describe('Blast.getClientPath()', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	it('should return the path to a client file', async function() {

		var path = await Blast.getClientPath();

	});

});

describe('Blast.parseUseragent(ua)', function() {

	var Blast;

	let tests = [
		{
			ua        : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:8.0) Gecko/20100101 Firefox/8.0',
			family    : 'firefox',
			version   : {
				major : 8,
				minor : 0,
				patch : '',
				float : 8
			},
			platform  : 'desktop',
			engine    : 'gecko'
		},
		{
			ua        : 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; yie8)',
			family    : 'internet explorer',
			version   : {
				major : 9,
				minor : 0,
				patch : '',
				float : 9
			},
			platform  : 'desktop',
			engine    : 'trident'
		},
		{
			ua        : 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.3; WOW64; Trident/7.0; Touch; .NET4.0E; .NET4.0C; .NET CLR 3.5.30729; .NET CLR 2.0.50727; .NET CLR 3.0.30729; Tablet PC 2.0)',
			family    : 'internet explorer',
			version   : {
				major : 9,
				minor : 0,
				patch : '',
				float : 9
			},
			platform  : 'desktop',
			engine    : 'trident'
		},
		{
			ua        : 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko',
			family    : 'internet explorer',
			version   : {
				major : 11,
				minor : 0,
				patch : '',
				float : 11
			},
			platform  : 'desktop',
			engine    : 'trident'
		},
		{
			ua        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36',
			family    : 'chrome',
			version   : {
				major : 44,
				minor : 0,
				patch : '2403.130',
				float : 44
			},
			platform  : 'desktop',
			engine    : 'blink'
		},
		{
			ua        : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.83 Safari/537.1',
			browser   : 'chrome',
			family    : 'chrome',
			version   : {
				major : 21,
				minor : 0,
				patch : '1180.83',
				float : 21
			},
			platform  : 'desktop',
			engine    : 'webkit'
		},
		{
			ua        : 'Mozilla/5.0 (Linux; Android 7.0; SAMSUNG SM-G610M Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.4 Chrome/59.0.3071.125 Mobile Safari/537.36',
			family    : 'samsung browser',
			version   : {
				major : 7,
				minor : 4,
				patch : '',
				float : 7.4
				// This is the engine version:
				// major : 59,
				// minor : 0,
				// patch : '3071.125',
				// float : 59
			},
			platform  : 'mobile',
			engine    : 'blink'
		},
		{
			ua        : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30',
			family    : 'chromium',
			version   : {
				major : 12,
				minor : 0,
				patch : '742.112',
				float : 12
			},
			platform  : 'desktop',
			engine    : 'webkit'
		},
		{
			ua        : 'Mozilla/5.0 (SMART-TV; X11; Linux armv7l) AppleWebKit/537.42 (KHTML, like Gecko) Chromium/25.0.1349.2 Chrome/25.0.1349.2 Safari/537.42',
			family    : 'chromium',
			version   : {
				major : 25,
				minor : 0,
				patch : '1349.2',
				float : 25
			},
			platform  : 'desktop',
			engine    : 'webkit'
		},
		{
			ua        : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36',
			family    : 'chromium',
			version   : {
				major : 50,
				minor : 0,
				patch : '2661.102',
				float : 50
			},
			platform  : 'desktop',
			engine    : 'blink'
		},
		{
			ua        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.10 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.10',
			family    : 'safari',
			version   : {
				major : 5,
				minor : 1,
				patch : '9',
				float : 5.1
			},
			platform  : 'desktop',
			engine    : 'webkit'
		},
		{
			ua        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0 Mobile/15D100 Safari/604.1',
			family    : 'safari',
			version   : {
				major : 11,
				minor : 0,
				patch : '',
				float : 11
			},
			platform  : 'mobile',
			engine    : 'webkit',
			os        : 'ios'
		},
		{
			ua        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
			family    : 'edge',
			version   : {
				major : 14,
				minor : 14393,
				patch : '',
				float : 14.14393
			},
			platform  : 'desktop',
			engine    : 'edgehtml'
		},
		{
			ua        : 'Mozilla/5.0 (iPad; CPU OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13G36 Safari/601.1',
			family    : 'safari',
			version   : {
				major : 9,
				minor : 0,
				patch : '',
				float : 9
			},
			platform  : 'mobile',
			engine    : 'webkit'
		},
		{
			ua        : 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.84 Safari/537.36 CrKey/1.22.74257',
			family    : 'chrome',
			version   : {
				major : 52,
				minor : 0,
				patch : '2743.84',
				float : 52
			},
			platform  : 'desktop',
			engine    : 'blink'
		},
		{
			ua        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3763.0 Safari/537.36 Edg/75.0.131.0',
			family    : 'edge',
			version   : {
				major : 75,
				minor : 0,
				patch : '131.0',
				float : 75
			},
			platform  : 'desktop',
			engine    : 'blink'
		}
	];

	before(function() {
		Blast  = require('../index.js')();
	});

	it('should correctly detect the browser & version', function() {

		var result,
		    entry,
		    i;

		for (i = 0; i < tests.length; i++) {
			entry = tests[i];
			result = Blast.parseUseragent(entry.ua);

			assert.strictEqual(result.family, entry.family, 'Wrong family for "' + entry.ua + '"');
			assert.strictEqual(result.engine, entry.engine, 'Wrong engine for "' + entry.ua + '": ' + result.engine + ' instead of ' + entry.engine);
			assert.strictEqual(result.platform, entry.platform, 'Wrong platform for "' + entry.ua + '"');
			assert.deepStrictEqual(result.version, entry.version, 'Wrong version for "' + entry.ua + '"');

			assert.strictEqual(result.webview, entry.webview || false, 'Wrong webview value for "' + entry.ua + '"');

			if (entry.os) {
				assert.strictEqual(result.os, entry.os, 'Wrong OS version for "' + entry.ua + '"');
			}
		}
	});
});