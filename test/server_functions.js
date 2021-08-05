const fs = require('fs');

let assert = require('assert'),
    Blast;

describe('Blast Server Functions', function() {
	Blast  = require('../index.js')();
	this.timeout(800);

	describe('#mkdirp(path, options)', function() {
		it('should create a directory asynchronously', async function() {

			let result = await Blast.mkdirp('/');

			assert.strictEqual(result, undefined);

			let random = Blast.Classes.Crypto.randomHex(8);

			let prototest_root = '/tmp/prototest_' + random;

			result = await Blast.mkdirp(prototest_root);

			assert.strictEqual(result, prototest_root);

			result = await Blast.mkdirp(prototest_root + '/test/this');

			assert.strictEqual(result, prototest_root + '/test');

			assert.strictEqual(fs.existsSync(prototest_root + '/test/this'), true);
		});
	});

	describe('#mkdirpSync(path, options)', function() {
		it('should create a directory synchronously', function() {

			let result = Blast.mkdirpSync('/');

			assert.strictEqual(result, undefined);

			let random = Blast.Classes.Crypto.randomHex(8);

			let prototest_root = '/tmp/prototest_' + random;

			result = Blast.mkdirpSync(prototest_root);

			assert.strictEqual(result, prototest_root);

			result = Blast.mkdirpSync(prototest_root + '/test/this');

			assert.strictEqual(result, prototest_root + '/test');

			assert.strictEqual(fs.existsSync(prototest_root + '/test/this'), true);
		});
	});
});