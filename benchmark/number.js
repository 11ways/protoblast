var Blast  = require('../index.js')();

suite('Number', function() {

	bench('.random(0, 10)', function() {
		Number.random(0, 10);
	});
});