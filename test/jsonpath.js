var assert = require('assert'),
    Blast;

describe('JSONPath', function() {

	var expression;

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('new JSONPath(expression, options)', function() {
		it('should create a new JSONPath object', function() {
			expression = new JSONPath('$..name');
		});
	});

	describe('#exec(obj)', function() {
		it('should execute this path on the given object', function() {

			var result,
			    data;

			data = [
				{name: 'a'},
				{name: 'b'},
				{name: 'c'}
			];

			result = expression.exec(data);

			assert.equal('a,b,c', result+'');
		});
	});

});