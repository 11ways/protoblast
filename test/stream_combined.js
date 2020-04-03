var assert = require('assert'),
    libstream = require('stream'),
    libpath = require('path'),
    fs = require('fs'),
    os = require('os'),
    Blast,
    Delayed,
    Combined;

describe('Stream.Combined', function() {
	Blast  = require('../index.js')();
	Delayed = Blast.Classes.Stream.Delayed;
	Combined = Blast.Classes.Stream.Combined;
	this.timeout(800);

	it('should combine multiple streams', function(finished) {

		let file_1 = libpath.resolve(__dirname, 'abc.js'),
		    file_2 = libpath.resolve(__dirname, 'error.js');

		let buffer = Buffer.from('Veggies for all'),
		    string = 'This is a string';

		let combined = new Combined();

		combined.append(fs.createReadStream(file_1));
		combined.append(buffer);
		combined.append(fs.createReadStream(file_2));

		combined.append(function(next) {
			next(string);
		});

		let temp_target = libpath.resolve(os.tmpdir(), 'protoblast_' + Date.now() + '.tmp');

		let dest = fs.createWriteStream(temp_target);

		combined.pipe(dest);

		dest.on('close', function() {
			let file_result = fs.readFileSync(temp_target, 'utf8');

			assert.strictEqual(file_result, expected);
			finished();
		});

		let expected = fs.readFileSync(file_1) + buffer + fs.readFileSync(file_2) + string;
	});

});