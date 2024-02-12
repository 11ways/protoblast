let assert = require('assert'),
    Blast,
    Trail,
    Placeholder;

describe('Placeholder', function() {
	Blast  = require('../index.js')();
	Trail = Blast.Classes.Develry.Trail;
	Placeholder = Blast.Classes.Develry.Placeholder;

	describe('.deepResolve(input, ...args)', () => {
		it('should recursively resolve all placeholders in objects', () => {

			let pledge = new Pledge(),
			    trail = Trail.fromArrow('my->nested->path');

			pledge.resolve('PLEDGED!');

			let context = {
				my: {
					nested: {
						path: 1,
					}
				}
			};

			let data = {
				pledge: pledge,
				trail : trail,
				deep  : {
					arr: [pledge, trail]
				}
			};

			let resolved = Placeholder.deepResolve(data, context);

			assert.deepStrictEqual(resolved, {
				pledge: 'PLEDGED!',
				trail : 1,
				deep  : {
					arr : ['PLEDGED!', 1]
				}
			});
		});

		it('should also resolve values in resolved values', () => {

			let pledge = new Pledge(),
			    trail = Trail.fromArrow('my->nested->path');

			pledge.resolve('PLEDGED!');

			let somewhere_else = new Pledge();
			somewhere_else.resolve('ELSE!');

			let context = {
				my: {
					nested: {
						path: Trail.fromArrow('somewhere->else'),
					}
				},
				somewhere: {
					else: somewhere_else,
				}
			};

			let data = {
				pledge: pledge,
				trail : trail,
				deep  : {
					arr: [pledge, trail]
				}
			};

			let resolved = Placeholder.deepResolve(data, context);

			assert.deepStrictEqual(resolved, {
				pledge: 'PLEDGED!',
				trail : 'ELSE!',
				deep  : {
					arr : ['PLEDGED!', 'ELSE!']
				}
			});
		});
	});

});