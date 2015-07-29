var assert = require('assert'),
    Blast;

describe('Function', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.create(name, fnc)', function() {
		it('should return a new named function', function() {

			var fnc = Function.create('ReturnOne', function() {
				return 1;
			});

			assert.equal(fnc.name, 'ReturnOne');
			assert.equal(fnc(), 1);
		});

		it('should have a reference to the newly wrapped function', function() {

			var fnc = Function.create('ReturnWrapperName', function med() {
				return med.wrapper.name;
			});

			assert.equal(fnc(), 'ReturnWrapperName');
		});
	});

	describe('.tokenize(source, addType, throwError)', function() {
		it('should tokenize a function', function() {

			var tokens,
			    fnc;

			fnc = function fname(a, b) {
				return a+b;
			};

			tokens = Function.tokenize(fnc, true);

			assert.equal(tokens[0].type, 'keyword');
			assert.equal(tokens[0].value, 'function');
			assert.equal(tokens[2].type, 'name');
			assert.equal(tokens[2].value, 'fname');
		});
	});

	describe('#methodize()', function() {
		it('should create a new function that calls the given function with current "this" context as the first argument', function() {

			var fnc = function(obj){return obj.zever;},
			    test = {zever: 'TEST'},
			    methodized = fnc.methodize();

			test.fnc = methodized;

			assert.equal(fnc({}), undefined);
			assert.equal(test.fnc(), 'TEST');
		});
	});

	describe('#unmethodize()', function() {
		it('should create a new function that calls the given function with the first argument as the context', function() {

			var fnc = function(){return this.zever;},
			    methodized = fnc.unmethodize();

			assert.equal(fnc(), undefined);
			assert.equal(methodized({zever: 'TEST'}), 'TEST');
		});
	});

	describe('#curry()', function() {
		it('should create a function that already contains pre-filled-in arguments', function() {

			var adder,
			    addTen;

			adder = function adder(a, b) {
				return a+b;
			}

			addTen = adder.curry(10);

			assert.equal(addTen(5), adder(10, 5));
			assert.equal(addTen.name, adder.name);
		});
	});

});