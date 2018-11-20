var assert = require('assert'),
    Blast;

describe('TypedArray', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#pack12bit()', function() {
		it('should create a packed Uint8Array', function() {

			var arr = [4095, 1, 4095, 256, 4095],
			    source = new Uint16Array(arr);

			var packed = source.pack12bit();

			assert.strictEqual(packed.constructor.name, 'Uint8Array');

			var expected = [255, 31, 0, 255, 15, 16, 255, 15];

			for (let i = 0; i < expected.length; i++) {
				assert.strictEqual(packed[i], expected[i]);
			}
		});
	});

	describe('#unpack12bit()', function() {
		it('should unpack a Uint8Array and return a Uint16Array', function() {

			var arr = [4095, 1, 4095, 256, 4095],
			    source = new Uint16Array(arr),
			    packed = source.pack12bit();

			var unpacked = packed.unpack12bit();

			assert.strictEqual(unpacked.constructor.name, 'Uint16Array');

			for (let i = 0; i < arr.length; i++) {
				assert.strictEqual(unpacked[i], arr[i]);
			}
		});
	});

});