const fs = require('fs');

let assert = require('assert'),
    Blast;

let prototest_root_async,
    prototest_root_sync;

let non_existing_path;
let test_file_path;

let temp_paths = [];

describe('Blast Server Functions', function() {
	Blast = require('../index.js')();
	this.timeout(800);

	before(function() {
		non_existing_path = '/tmp/this/should/not/exist/' + Blast.Classes.Crypto.randomHex(8);
		test_file_dir = '/tmp/protofiletest_' + Blast.Classes.Crypto.randomHex(8);
		test_file_path = test_file_dir + '/text';
	});

	function createTestFile() {
		Blast.mkdirpSync(test_file_dir);
		fs.writeFileSync(test_file_path, 'stillhere');
		assert.strictEqual(fs.existsSync(test_file_path), true);
	}

	describe('#mkdirp(path, options)', function() {
		it('should create a directory asynchronously', async function() {

			let result = await Blast.mkdirp('/');

			assert.strictEqual(result, undefined);

			let random = Blast.Classes.Crypto.randomHex(8);

			prototest_root_async = '/tmp/prototest_' + random;

			result = await Blast.mkdirp(prototest_root_async);

			assert.strictEqual(result, prototest_root_async);

			result = await Blast.mkdirp(prototest_root_async + '/test/this');

			assert.strictEqual(result, prototest_root_async + '/test');

			assert.strictEqual(fs.existsSync(prototest_root_async + '/test/this'), true);
		});
	});

	describe('#mkdirpSync(path, options)', function() {
		it('should create a directory synchronously', function() {

			let result = Blast.mkdirpSync('/');

			assert.strictEqual(result, undefined);

			let random = Blast.Classes.Crypto.randomHex(8);

			prototest_root_sync = '/tmp/prototest_' + random;

			result = Blast.mkdirpSync(prototest_root_sync);

			assert.strictEqual(result, prototest_root_sync);

			result = Blast.mkdirpSync(prototest_root_sync + '/test/this');

			assert.strictEqual(result, prototest_root_sync + '/test');

			assert.strictEqual(fs.existsSync(prototest_root_sync + '/test/this'), true);
		});
	});

	describe('#rmrf(path)', function() {
		it('should remove a directory and its contents asynchronously', async function() {

			// Just making sure the target exists
			assert.strictEqual(fs.existsSync(prototest_root_async), true);

			// And make sure it has contents
			assert.strictEqual(fs.existsSync(prototest_root_async + '/test'), true);

			let result = await Blast.rmrf(prototest_root_async);

			// Now it should be gone!
			assert.strictEqual(fs.existsSync(prototest_root_async), false);
		});

		it('should not throw an error when the target does not exist', async function() {

			assert.strictEqual(fs.existsSync(non_existing_path), false);

			let result = await Blast.rmrf(non_existing_path);

			assert.strictEqual(fs.existsSync(non_existing_path), false);
		});

		it('should be able to remove files', async function() {

			createTestFile();

			await Blast.rmrf(test_file_path);

			assert.strictEqual(fs.existsSync(test_file_path), false);
		});
	});

	describe('#rmrfSync(path)', function() {
		it('should remove a directory and its contents synchronously', function() {

			// Just making sure the target exists
			assert.strictEqual(fs.existsSync(prototest_root_sync), true);

			// And make sure it has contents
			assert.strictEqual(fs.existsSync(prototest_root_sync + '/test'), true);

			let result = Blast.rmrfSync(prototest_root_sync);

			// Now it should be gone!
			assert.strictEqual(fs.existsSync(prototest_root_sync), false);
		});

		it('should not throw an error when the target does not exist', async function() {

			assert.strictEqual(fs.existsSync(non_existing_path), false);

			let result = Blast.rmrfSync(non_existing_path);

			assert.strictEqual(fs.existsSync(non_existing_path), false);
		});

		it('should be able to remove files', async function() {

			createTestFile();

			Blast.rmrfSync(test_file_path);

			assert.strictEqual(fs.existsSync(test_file_path), false);
		});
	});

	describe('#openTempFile(options)', function() {

		it('should create a temporary file', async function() {

			let info = await Blast.openTempFile();

			assert.strictEqual(typeof info.path, 'string');
			assert.strictEqual(typeof info.fd, 'number');

			fs.writeSync(info.fd, 'test');

			let data = fs.readFileSync(info.path, 'utf8');

			assert.strictEqual(data, 'test');
		});
	});

	describe('#openTempFileSync(options)', function() {

		it('should create a temporary file synchronously', function() {

			let info = Blast.openTempFileSync();

			assert.strictEqual(typeof info.path, 'string');
			assert.strictEqual(typeof info.fd, 'number');

			fs.writeSync(info.fd, 'test');

			let data = fs.readFileSync(info.path, 'utf8');

			assert.strictEqual(data, 'test');
		});
	});

	describe('#cleanupTempPaths()', function() {
		it('should remove temp paths', async function() {

			// Create a new temporary file
			let info = await Blast.openTempFile();

			assert.strictEqual(fs.existsSync(info.path), true);

			await Blast.cleanupTempPaths();

			assert.strictEqual(fs.existsSync(info.path), false);
		});
	});

	describe('#cleanupTempPathsSync()', function() {
		it('should remove temp paths', function() {

			// Create a new temporary file
			let info = Blast.openTempFileSync();

			assert.strictEqual(fs.existsSync(info.path), true);

			Blast.cleanupTempPathsSync();

			assert.strictEqual(fs.existsSync(info.path), false);
		});
	});

	describe('#getClientPath()', function() {
		it('should create the client file again after cleaning temp paths', function(done) {

			Blast.getClientPath({
				modify_prototypes : true,
			}).done(function gotClientFile(err, path) {

				if (err) {
					return done(err);
				}

				if (!fs.existsSync(path)) {
					return done(new Error('Client file path did not exist'));
				}

				return done();
			});

		});
	});
});