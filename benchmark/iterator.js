var Blast  = require('../index.js')();

suite('Iterator', function() {

	var arr = [0,1,2,3,4,5],
	    iter = new Iterator(arr);

	bench('new Iterator(arr)', function() {
		new Iterator(arr);
	});

	bench('#hasNext()', function() {
		iter.hasNext();
	});

	bench('#next()', function() {
		this.nextIndex = 0;
		iter.next();
	});
});
