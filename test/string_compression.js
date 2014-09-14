var assert = require('assert'),
    source,
    Blast;

describe('String Compression', function() {

	source = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed'
	       + 'do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	       + 'Ut enim ad minim veniam, quis nostrud exercitation ullamco '
	       + 'laboris nisi ut aliquip ex ea commodo consequat.';

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('String.compress(uncompressed)', function() {
		it('should return an UTF-16 string', function() {

			var compressed = String.compress(source),
			    decomp = String.decompress(compressed);

			assert.equal(false, compressed == source, 'Nothing was compressed');
			assert.strictEqual(decomp, source, 'Compression can not be decompressed');
		});
	});

	describe('String.decompress(compressed)', function() {
		it('should return the original source', function() {

			var compressed = String.compress(source),
			    decomp = String.decompress(compressed);

			assert.equal(false, compressed == source, 'Nothing was compressed');
			assert.strictEqual(decomp, source, 'Compression can not be decompressed');
		});
	});

	describe('String.compressToBase64(uncompressed)', function() {
		it('should return a BASE64 string', function() {

			var compressed = String.compressToBase64(source),
			    decomp = String.decompressFromBase64(compressed);

			assert.equal(false, compressed == source, 'Nothing was compressed');
			assert.strictEqual(decomp, source, 'Compression can not be decompressed');
		});
	});

	describe('String.decompressFromBase64(compressed)', function() {
		it('should return the original source', function() {

			var compressed = String.compressToBase64(source),
			    decomp = String.decompressFromBase64(compressed);

			assert.equal(false, compressed == source, 'Nothing was compressed');
			assert.strictEqual(decomp, source, 'Compression can not be decompressed');
		});
	});

	describe('String.compressToUTF16(uncompressed)', function() {
		it('should return an UTF-16 string', function() {

			var compressed = String.compressToUTF16(source),
			    decomp = String.decompressFromUTF16(compressed);

			assert.equal(false, compressed == source, 'Nothing was compressed');
			assert.strictEqual(decomp, source, 'Compression can not be decompressed');
		});
	});

	describe('String.decompressFromUTF16(compressed)', function() {
		it('should return the original source', function() {

			var compressed = String.compressToUTF16(source),
			    decomp = String.decompressFromUTF16(compressed);

			assert.equal(false, compressed == source, 'Nothing was compressed');
			assert.strictEqual(decomp, source, 'Compression can not be decompressed');
		});
	});

});
