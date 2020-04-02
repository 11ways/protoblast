var assert = require('assert'),
    libstream = require('stream'),
    Blast,
    Delayed;

describe('Stream.Delayed', function() {
	Blast  = require('../index.js')();
	Delayed = Blast.Classes.Stream.Delayed;
	this.timeout(800);

	describe('#resume()', function() {
		it('should resume emitting events', function() {

			let source = new libstream.Stream(),
			    delayed = new Delayed(source, {pause_stream: false});

			// The original source should emit
			let source_emits = [];
			let delayed_emits = [];

			source.on('test', function(val) {
				source_emits.push(val);
			});

			delayed.on('test', function(val) {
				delayed_emits.push(val);
			})

			source.emit('test', 1);
			source.emit('test', 2);

			assert.deepStrictEqual(source_emits, [1, 2]);
			assert.deepStrictEqual(delayed_emits, []);

			delayed.resume();

			assert.deepStrictEqual(source_emits, [1, 2]);
			assert.deepStrictEqual(delayed_emits, [1, 2]);
		});
	});
});