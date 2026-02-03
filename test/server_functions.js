const fs = require('fs');
const libpath = require('path');
const os = require('os');

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
		non_existing_path = libpath.join(os.tmpdir(), 'this', 'should', 'not', 'exist', Blast.Classes.Crypto.randomHex(8));
		test_file_dir = libpath.join(os.tmpdir(), 'protofiletest_' + Blast.Classes.Crypto.randomHex(8));
		test_file_path = libpath.join(test_file_dir, 'text');
	});

	function createTestFile() {
		Blast.mkdirpSync(test_file_dir);
		fs.writeFileSync(test_file_path, 'stillhere');
		assert.strictEqual(fs.existsSync(test_file_path), true);
	}

	describe('#mkdirp(path, options)', function() {
		it('should create a directory asynchronously', async function() {

			let result = await Blast.mkdirp('/');

			assert.strictEqual(typeof result, 'string');

			let random = Blast.Classes.Crypto.randomHex(8);

			prototest_root_async = libpath.join(os.tmpdir(), 'prototest_' + random);

			result = await Blast.mkdirp(prototest_root_async);

			assert.strictEqual(result, prototest_root_async);

			let result_again = await Blast.mkdirp(prototest_root_async);

			assert.strictEqual(result_again, prototest_root_async);

			const test_this_path = libpath.join(prototest_root_async, 'test', 'this');

			result = await Blast.mkdirp(test_this_path);

			assert.strictEqual(result, test_this_path);

			assert.strictEqual(fs.existsSync(test_this_path), true);
		});
	});

	describe('#mkdirpSync(path, options)', function() {
		it('should create a directory synchronously', function() {

			let result = Blast.mkdirpSync('/');

			assert.strictEqual(typeof result, 'string');

			let random = Blast.Classes.Crypto.randomHex(8);

			prototest_root_sync = libpath.join(os.tmpdir(), 'prototest_' + random);

			result = Blast.mkdirpSync(prototest_root_sync);

			assert.strictEqual(result, prototest_root_sync);

			let result_again = Blast.mkdirpSync(prototest_root_sync);

			assert.strictEqual(result_again, prototest_root_sync);

			const test_this_path = libpath.join(prototest_root_sync, 'test', 'this');

			result = Blast.mkdirpSync(test_this_path);

			assert.strictEqual(result, test_this_path);

			assert.strictEqual(fs.existsSync(test_this_path), true);
		});
	});

	describe('#rmrf(path)', function() {
		it('should remove a directory and its contents asynchronously', async function() {

			// Just making sure the target exists
			assert.strictEqual(fs.existsSync(prototest_root_async), true);

			// And make sure it has contents
			assert.strictEqual(fs.existsSync(libpath.join(prototest_root_async, 'test')), true);

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

		it('should be able to remove a directory with nested contents', async function() {

			let root_dir = Blast.createTempDirSync();
			let nested_dir = Blast.createTempDirSync({dir: root_dir});
			let test_file = Blast.openTempFileSync({dir: nested_dir});

			assert.strictEqual(fs.existsSync(test_file.path), true);
			assert.strictEqual(fs.existsSync(nested_dir), true);
			assert.strictEqual(fs.existsSync(root_dir), true);

			fs.closeSync(test_file.fd);

			await Blast.rmrf(root_dir);

			assert.strictEqual(fs.existsSync(test_file.path), false);
			assert.strictEqual(fs.existsSync(nested_dir), false);
			assert.strictEqual(fs.existsSync(root_dir), false);
		});
	});

	describe('#rmrfSync(path)', function() {
		it('should remove a directory and its contents synchronously', function() {

			// Just making sure the target exists
			assert.strictEqual(fs.existsSync(prototest_root_sync), true);

			// And make sure it has contents
			assert.strictEqual(fs.existsSync(libpath.join(prototest_root_sync, 'test')), true);

			let result = Blast.rmrfSync(prototest_root_sync);

			// Now it should be gone!
			assert.strictEqual(fs.existsSync(prototest_root_sync), false, 'The file at ' + prototest_root_sync + ' still exists');
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

			fs.closeSync(info.fd);
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

			fs.closeSync(info.fd);
		});
	});

	describe('#createTempFile(options)', function() {

		it('should create a temporary file without leaving it open', async function() {

			let path = await Blast.createTempFile();

			assert.strictEqual(typeof path, 'string');
			assert.strictEqual(fs.existsSync(path), true);
		});
	});

	describe('#createTempFileSync(options)', function() {

		it('should create a temporary file without leaving it open', async function() {

			let path = await Blast.createTempFileSync();

			assert.strictEqual(typeof path, 'string');
			assert.strictEqual(fs.existsSync(path), true);
		});
	});

	describe('#cleanupTempPaths()', function() {
		this.timeout(8000);
		this.slow(1000);

		it('should remove temp paths', async function() {

			// Create a new temporary file
			let info = await Blast.openTempFile();

			assert.strictEqual(fs.existsSync(info.path), true);

			fs.closeSync(info.fd);

			await Blast.cleanupTempPaths();

			assert.strictEqual(fs.existsSync(info.path), false);
		});
	});

	describe('#cleanupTempPathsSync()', function() {
		this.timeout(8000);
		this.slow(1000);

		it('should remove temp paths', function() {

			// Create a new temporary file
			let info = Blast.openTempFileSync();

			assert.strictEqual(fs.existsSync(info.path), true);

			fs.closeSync(info.fd);

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

	describe('#destringifyCode()', function() {

		it('should not replace "use strict" directive prologues', function() {

			// This simulates what happens in the client bundle:
			// The //_DESTRINGIFYCODE_// marker is where variable definitions are inserted,
			// but "use strict" appears BEFORE it and should not be replaced
			let code = `(function() {
	"use strict";

	//_DESTRINGIFYCODE_//

	function test() {
		"use strict";
		return "use strict";
	}
})();`;

			let result = Blast.destringifyCode(code, {});

			// The first "use strict" (directive at top) should NOT be replaced
			// because it appears before //_DESTRINGIFYCODE_// and would cause
			// "Cannot access variable before initialization" error
			
			// Check that the code doesn't have a bare variable reference before the const declaration
			let lines = result.split('\n');
			let destringifyIndex = -1;
			let useStrictVarUsageBeforeDecl = false;

			for (let i = 0; i < lines.length; i++) {
				let line = lines[i].trim();
				
				// Find where the const declarations are inserted
				if (line.startsWith('const Ø')) {
					destringifyIndex = i;
					break;
				}
				
				// Check if there's a standalone Ø variable (replaced "use strict") before const
				// A standalone directive would be just the variable name followed by ;
				if (line.match(/^Ø[a-z0-9]+;$/i)) {
					useStrictVarUsageBeforeDecl = true;
				}
			}

			assert.strictEqual(
				useStrictVarUsageBeforeDecl,
				false,
				'Directive "use strict" should not be replaced with a variable that is used before declaration'
			);

			// The result should still be valid JavaScript that can be evaluated
			// If "use strict" was incorrectly replaced, this will throw:
			// "ReferenceError: Cannot access 'Øxx' before initialization"
			assert.doesNotThrow(() => {
				eval(result);
			}, 'The destringified code should be valid JavaScript');
		});

		it('should still replace "use strict" when used as a return value', function() {

			let code = `(function() {
	//_DESTRINGIFYCODE_//

	function a() { return "use strict"; }
	function b() { return "use strict"; }
})();`;

			let result = Blast.destringifyCode(code, {});

			// When "use strict" is used as a value (not directive), it CAN be replaced
			// because both usages are after the //_DESTRINGIFYCODE_// marker
			
			// The result should be valid JavaScript
			assert.doesNotThrow(() => {
				eval(result);
			}, 'The destringified code should be valid JavaScript');
		});

		it('should not replace any standalone string statement (not just "use strict")', function() {

			// Any string followed by semicolon could be a directive prologue
			// Examples: "use asm"; for asm.js, or future directives
			// We need multiple usages after the marker for the optimization to kick in
			let code = `(function() {
"use asm";
"some directive";
//_DESTRINGIFYCODE_//

function a() { return "use asm"; }
function b() { return "use asm"; }
function c() { return "use asm"; }
function d() { return "some directive"; }
function e() { return "some directive"; }
function f() { return "some directive"; }
})();`;

			let result = Blast.destringifyCode(code, {});

			let lines = result.split('\n');
			let varUsageBeforeDecl = false;

			for (let i = 0; i < lines.length; i++) {
				let line = lines[i].trim();
				
				if (line.startsWith('const Ø')) {
					break;
				}
				
				// Check for any standalone Ø variable before const declarations
				if (line.match(/^Ø[a-z0-9]+;$/i)) {
					varUsageBeforeDecl = true;
				}
			}

			assert.strictEqual(
				varUsageBeforeDecl,
				false,
				'Standalone string statements should not be replaced with variables used before declaration'
			);

			// The strings used as return values SHOULD still be replaced (optimized)
			// Count occurrences of the literal strings in result
			// Note: destringify normalizes to single quotes in const declarations
			let useAsmDoubleQuoted = (result.match(/"use asm"/g) || []).length;
			let someDirectiveDoubleQuoted = (result.match(/"some directive"/g) || []).length;

			// The directive prologues should remain as double-quoted literal strings (1 each)
			// The const declarations use single quotes, so only the directive remains double-quoted
			assert.strictEqual(useAsmDoubleQuoted, 1, '"use asm" directive should remain as double-quoted string');
			assert.strictEqual(someDirectiveDoubleQuoted, 1, '"some directive" directive should remain as double-quoted string');

			// The const declarations should exist (with single quotes)
			assert.ok(result.includes("'use asm'"), 'const declaration for use asm should exist');
			assert.ok(result.includes("'some directive'"), 'const declaration for some directive should exist');

			// The return statements should use variables, not string literals
			assert.ok(result.includes('return Ø'), 'return statements should use variable references');

			// Verify the code is still valid
			assert.doesNotThrow(() => {
				eval(result);
			}, 'The destringified code should be valid JavaScript');
		});

		it('should not replace directives that come after a single-line comment', function() {

			let code = `(function() {
	// This is a comment
	"use strict";
	//_DESTRINGIFYCODE_//

	function test() {
		return "use strict";
	}
})();`;

			let result = Blast.destringifyCode(code, {});

			// The directive after the comment should NOT be replaced
			let lines = result.split('\n');
			let destringifyIndex = -1;
			let useStrictVarUsageBeforeDecl = false;

			for (let i = 0; i < lines.length; i++) {
				let line = lines[i].trim();
				
				if (line.startsWith('const Ø')) {
					destringifyIndex = i;
					break;
				}
				
				if (line.match(/^Ø[a-z0-9]+;$/i)) {
					useStrictVarUsageBeforeDecl = true;
				}
			}

			assert.strictEqual(
				useStrictVarUsageBeforeDecl,
				false,
				'Directive "use strict" after a comment should not be replaced with a variable that is used before declaration'
			);

			assert.doesNotThrow(() => {
				eval(result);
			}, 'The destringified code should be valid JavaScript');
		});

		it('should not replace directives that come after a multiline comment', function() {

			let code = `(function() {
	/* This is a
	   multiline comment */
	"use strict";
	//_DESTRINGIFYCODE_//

	function test() {
		return "use strict";
	}
})();`;

			let result = Blast.destringifyCode(code, {});

			// The directive after the multiline comment should NOT be replaced
			let lines = result.split('\n');
			let destringifyIndex = -1;
			let useStrictVarUsageBeforeDecl = false;

			for (let i = 0; i < lines.length; i++) {
				let line = lines[i].trim();
				
				if (line.startsWith('const Ø')) {
					destringifyIndex = i;
					break;
				}
				
				if (line.match(/^Ø[a-z0-9]+;$/i)) {
					useStrictVarUsageBeforeDecl = true;
				}
			}

			assert.strictEqual(
				useStrictVarUsageBeforeDecl,
				false,
				'Directive "use strict" after a multiline comment should not be replaced with a variable that is used before declaration'
			);

			assert.doesNotThrow(() => {
				eval(result);
			}, 'The destringified code should be valid JavaScript');
		});
	});
});