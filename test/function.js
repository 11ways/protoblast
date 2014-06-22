var assert = require('assert'),
    Blast  = require('../index.js')();

describe('Function', function() {

	describe('.create(name, fnc)', function() {
		it('should return a new named function', function() {

			var fnc = Function.create('ReturnOne', function() {
				return 1;
			});

			assert.equal('ReturnOne', fnc.name);
			assert.equal(1, fnc());
		});
	});

	describe('#methodize()', function() {
		it('should create a new function that calls the given function with current "this" context as the first argument', function() {

			var fnc = function(obj){return obj.zever;},
			    test = {zever: 'TEST'},
			    methodized = fnc.methodize();

			test.fnc = methodized;

			assert.equal(undefined, fnc({}));
			assert.equal('TEST', test.fnc());
		});
	});

	describe('#unmethodize()', function() {
		it('should create a new function that calls the given function with the first argument as the context', function() {

			var fnc = function(){return this.zever;},
			    methodized = fnc.unmethodize();

			assert.equal(undefined, fnc());
			assert.equal('TEST', methodized({zever: 'TEST'}));
		});
	});

});