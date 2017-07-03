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

	describe('.isNameAllowed(name)', function() {
		it('should return true for allowed names', function() {
			assert.equal(Function.isNameAllowed('zever'), true);
			assert.equal(Function.isNameAllowed('jelle'), true);
		});

		it('should return false for reserved names', function() {
			assert.equal(Function.isNameAllowed('delete'), false);
			assert.equal(Function.isNameAllowed('continue'), false);
			assert.equal(Function.isNameAllowed('new'), false);
			assert.equal(Function.isNameAllowed('typeof'), false);
		});

		it('should return false for names starting with numbers', function() {
			assert.equal(Function.isNameAllowed('3delete'), false);
			assert.equal(Function.isNameAllowed('3continue'), false);
			assert.equal(Function.isNameAllowed('3new'), false);
			assert.equal(Function.isNameAllowed('3typeof'), false);
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