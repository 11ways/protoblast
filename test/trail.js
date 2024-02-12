let assert = require('assert'),
    Blast,
    Trail;

describe('Trail', function() {
	Blast  = require('../index.js')();
	Trail = Blast.Classes.Develry.Trail;

	describe('.fromDot(path)', () => {
		it('should create a new trail', () => {
			let trail = Trail.fromDot('this.is.a.path');
		});
	});

	describe('#getResolvedValue(context)', () => {
		it('should extract the path from the given context', () => {

			let trail = Trail.fromDot('my.nested.path');
			let obj = {
				my: {
					nested: {
						path: 1,
					}
				}
			};

			let value = trail.getResolvedValue(obj);

			assert.strictEqual(value, 1);
		});
	});

});