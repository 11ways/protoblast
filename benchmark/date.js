var Blast  = require('../index.js')();

suite('Date', function() {

	var date = new Date();

	bench('.create()', function() {
		Date.create();
	});

	bench('.isDate(var)', function() {
		Date.isDate(date);
	});
});