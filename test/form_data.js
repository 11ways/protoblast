let assert = require('assert'),
    Blast;

describe('FormData', function() {

	before(function() {
		Blast = require('../index.js')();
	});

	describe('new FormData()', function() {
		it('should return a new FormData instance', function() {
			assert.equal((new Blast.Classes.FormData) instanceof Blast.Classes.FormData, true);
		});
	});

	describe('#boundary', function() {
		it('should always be unique', function() {

			let a = new Blast.Classes.FormData(),
			    b = new Blast.Classes.FormData();

			assert.notStrictEqual(a, b);
		});
	});

	describe('#append(field, value, options)', function() {

		it('should add a value', function() {

			let formdata = new Blast.Classes.FormData();

			formdata.append('nr', 1);
			formdata.append('str', 'str');
		});
	});

	describe('#toBuffer()', function() {

		it('should serialize the data to a buffer', function() {

			let formdata = new Blast.Classes.FormData();

			formdata.append('nr', 1);
			formdata.append('str', 'str');

			let buffer = formdata.getBuffer();

			assert.strictEqual(buffer.length, 263);

			let str = buffer.toString('utf8');

			str = str.replaceAll(formdata.boundary, 'BOUNDARY');

			let expect = "--BOUNDARY\r\nContent-Disposition: form-data; name=\"nr\"\r\n\r\n1\r\n--BOUNDARY\r\nContent-Disposition: form-data; name=\"str\"\r\n\r\nstr\r\n--BOUNDARY--\r\n";

			assert.strictEqual(str, expect);
		});
	});
});