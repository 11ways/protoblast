var Blast  = require('../index.js')();

suite('Boolean', function() {

	var bool = true;

	bench('#toSource()', function() {
		bool.toSource();
	});
});