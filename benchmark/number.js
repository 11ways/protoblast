var Blast  = require('../index.js')();

suite('Number', function() {

	var nr = 21;

	bench('.random(0, 10)', function() {
		Number.random(0, 10);
	});

	bench('#toPaddedString(5)', function() {
		nr.toPaddedString(5);
	});
});