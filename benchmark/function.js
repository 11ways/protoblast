var Blast  = require('../index.js')();

suite('Function', function() {

	var fnc = function(nr){
		var alpha, beta;
		return nr+1;
	},
	   src = ''+fnc,
	   fn2 = function(){},
	   fn3 = function(){};

	bench('.create(name, fnc)', function() {
		Function.create('increment', fnc);
	});

	bench('.getTokenType(str)', function() {
		Function.getTokenType('return');
	});

	bench('.tokenize(sourceCode)', function() {
		Function.tokenize(src);
	});

	bench('.tokenize(sourceCode, addType)', function() {
		Function.tokenize(src, true);
	});

	bench('#toSource()', function() {
		fnc.toSource();
	});

	bench('#tokenize()', function() {
		fnc.tokenize();
	});

	bench('#methodize()', function() {
		fn2._methodized = false;
		fn2.methodize();
	});

	bench('#unmethodize()', function() {
		fn3._unmethodized = false;
		fn3.unmethodize();
	});

	bench('#curry()', function() {
		fn2.curry();
	});
});