var Blast  = require('../index.js')();

suite('JSONPath', function() {

	var p = new JSONPath('$..prop.test'),
	    arr = [{prop: {test: 1}}, {prop: {test: 2}}, {prop: {test: 3}}]

	bench('new JSONPath(expression)', function() {
		new JSONPath('$..prop.test');
	});

	bench('#normalize(expression) (cached)', function() {
		p.normalize('$..prop.test');
	});

	bench('#exec(obj)', function() {
		p.exec(arr);
	});
});
