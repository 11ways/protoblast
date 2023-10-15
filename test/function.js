var assert = require('assert'),
    Blast;

let TAB_SRC;

function tabs(nr) {
	let result = '';

	if (Blast.isBun) {
		nr *= 2;
		nr += 2;
	}

	while (nr--) {
		result += TAB_SRC;
	}

	return result;
}

function spaceAfterAnonymousFunction() {
	if (Blast.isBun) {
		return '';
	} else {
		return ' ';
	}
}

describe('Function', function() {

	before(function() {
		Blast  = require('../index.js')();

		if (Blast.isBun) {
			TAB_SRC = ' ';
		} else {
			TAB_SRC = '\t';
		}
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

		it('should have the same amount of arguments', function() {

			var fnc = Function.create('ReturnWrapperName', function test(a, b) {

			});

			assert.equal(fnc.length, 2);
			assert.equal(fnc.name, 'ReturnWrapperName');
		});

		it('should accept an array as argument names', function() {

			var fnc = Function.create('ReturnWrapperName', ['a', 'b', 'c'], function test() {});

			assert.equal(fnc.length, 3);
			assert.equal(fnc.name, 'ReturnWrapperName');
		});

		it('should accept a string as argument names', function() {

			var fnc = Function.create('ReturnWrapperName', 'a, b, c, d', function test() {});

			assert.equal(fnc.length, 4);
			assert.equal(fnc.name, 'ReturnWrapperName');
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

		it('should recognize invalid tokens', function() {

			var tokens,
			    source = 'function €(){vra é #}';

			tokens = Function.tokenize(source, true);

			assert.equal(tokens[0].type, 'keyword');
			assert.equal(tokens[2].type, 'invalid');
			assert.equal(tokens[10].type, 'invalid');
		});

		it('should only return the values when addType is false or not set', function() {

			var tokens,
			    source = 'function() {return 1}';

			tokens = Function.tokenize(source);

			assert.equal(tokens[0], 'function');
			assert.equal(tokens[2], ')');
			assert.equal(tokens[3], ' ');
		});

		it('is also available on the function', function() {

			var tokens;

			function myFnc() {};

			tokens = myFnc.tokenize();

			assert.equal(tokens[0], 'function');
			assert.equal(tokens[6], '{');
		});

		it('should handle async functions', function() {

			var fnc = async function myAsyncFunction() {
				var bla = await Pledge.resolve();
				return bla;
			};

			var tokens = fnc.tokenize();
			var expected = [ 'async', ' ', 'function', ' ', 'myAsyncFunction', '(', ')', ' ', '{', EOL + tabs(4), 'var', ' ', 'bla', ' ', '=', ' ', 'await', ' ', 'Pledge', '.', 'resolve', '(', ')', ';', EOL + tabs(4), 'return', ' ', 'bla', ';', EOL + tabs(3), '}'];

			assert.deepEqual(tokens, expected);

			tokens = fnc.tokenize(true);

			expected = [
				{ line_start: 0, line_end: 0, type: 'keyword', name: 'async', value: 'async' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'keyword', name: 'function', value: 'function' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'myAsyncFunction' },
				{ type: 'parens', value: '(' },
				{ type: 'parens', value: ')' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'curly', value: '{' },
				{ type: 'whitespace', value: EOL + tabs(4) },
				{ type: 'keyword', name: 'var', value: 'var' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'bla' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', name: 'assign', value: '=' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'keyword', name: 'await', value: 'await' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'Pledge' },
				{ type: 'punct', name: 'dot', value: '.' },
				{ type: 'name', value: 'resolve' },
				{ type: 'parens', value: '(' },
				{ type: 'parens', value: ')' },
				{ type: 'punct', name: 'semicolon', value: ';' },
				{ type: 'whitespace', value: EOL + tabs(4) },
				{ type: 'keyword', name: 'return', value: 'return' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'bla' },
				{ type: 'punct', name: 'semicolon', value: ';' },
				{ type: 'whitespace', value: EOL + tabs(3) },
				{ line_start: 3, line_end: 3, type: 'curly', value: '}' }
			];

			deepAlike(tokens, expected);
		});

		it('should handle spread syntax', function() {

			var fnc = async function myAsyncFunction(first, ...args) {
				var a = [...first];
			};

			var tokens = fnc.tokenize();
			var expected = [ 'async', ' ', 'function', ' ', 'myAsyncFunction', '(', 'first', ',', ' ', '...', 'args', ')', ' ', '{', EOL + tabs(4), 'var', ' ', 'a', ' ', '=', ' ', '[', '...', 'first', ']', ';', EOL + tabs(3), '}'];

			assert.deepEqual(tokens, expected);

			tokens = fnc.tokenize(true);
			expected = [
				{ type: 'keyword', value: 'async', name: 'async' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'keyword', value: 'function', name: 'function' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'myAsyncFunction' },
				{ type: 'parens', value: '(' },
				{ type: 'name', value: 'first' },
				{ type: 'punct', value: ',', name: 'comma' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '...', name: 'spread' },
				{ type: 'name', value: 'args' },
				{ type: 'parens', value: ')' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'curly', value: '{' },
				{ type: 'whitespace', value: EOL + tabs(4) },
				{ type: 'keyword', value: 'var', name: 'var' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'a' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'square', value: '[' },
				{ type: 'punct', value: '...', name: 'spread' },
				{ type: 'name', value: 'first' },
				{ type: 'square', value: ']' },
				{ type: 'punct', value: ';', name: 'semicolon' },
				{ type: 'whitespace', value: EOL + tabs(3) },
				{ type: 'curly', value: '}' }
			];

			deepAlike(tokens, expected);
		});

		var handles_comments;

		it('should handle default argument values', function() {
			var fnc = function (a=1){};

			var tokens = fnc.tokenize();

			let expected = [ 'function', ' ', '(', 'a', '=', '1', ')', '{', '}' ];

			if (Blast.isBun) {
				expected = [ 'function', '(', 'a', ' ', '=', ' ', '1', ')', ' ', '{', '\n        ', '}' ];
			}

			assert.deepEqual(tokens, expected);

			tokens = fnc.tokenize(true);

			expected = [
				{ type: 'keyword', value: 'function', name: 'function' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'parens', value: '(' },
				{ type: 'name', value: 'a' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'number', value: '1' },
				{ type: 'parens', value: ')' },
				{ type: 'curly', value: '{' },
				{ type: 'curly', value: '}' } 
			];

			if (Blast.isBun) {
				expected = [
					{ type: 'keyword', value: 'function', name: 'function' },
					{ type: 'parens', value: '(' },
					{ type: 'name', value: 'a' },
					{ type: 'punct', value: '=', name: 'assign' },
					{ type: 'number', value: '1' },
					{ type: 'parens', value: ')' },
					{ type: 'curly', value: '{' },
					{ type: 'curly', value: '}' } 
				];
			}

			deepAlike(tokens, expected)
		});

		it('should handle different EOL the same', function() {

			let with_n = 'let a;\n//test\n//done',
			    with_rn = 'let a;\r\n//test\r\n//done';

			let tokens_n = Function.tokenize(with_n),
			    tokens_rn = Function.tokenize(with_rn);

			assert.strictEqual(tokens_n.length, 8);
			assert.strictEqual(tokens_rn.length, 8);

			for (let i = 0; i < tokens_n.length; i++) {
				let token_n = tokens_n[i].trim(),
				    token_rn = tokens_rn[i].trim();

				assert.strictEqual(token_n, token_rn, 'The two tokens did not match, linebreak parsing issue?');
			}
		});

		it('should handle comments', function() {
			var fnc = function /*namecomment*/ fncname(a /*whatever*/) {
				//linecomment
			};

			// Some engines strip comments, so ignore that
			if (String(fnc).indexOf('namecomment') == -1) {
				handles_comments = false;
				return;
			} else {
				handles_comments = true;
			}

			var tokens = fnc.tokenize();

			assert.deepEqual(tokens, [ 'function', ' ', '/*namecomment*/', ' ', 'fncname', '(', 'a', ' ', '/*whatever*/', ')', ' ', '{', EOL + tabs(4), '//linecomment', EOL + tabs(3), '}' ]);

			tokens = fnc.tokenize(true);

			deepAlike(tokens, [
				{ type: 'keyword', value: 'function', name: 'function' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'comment', value: '/*namecomment*/' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'fncname' },
				{ type: 'parens', value: '(' },
				{ type: 'name', value: 'a' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'comment', value: '/*whatever*/' },
				{ type: 'parens', value: ')' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'curly', value: '{' },
				{ type: 'whitespace', value: EOL + tabs(4) },
				{ type: 'comment', value: '//linecomment' },
				{ type: 'whitespace', value: EOL + tabs(3) },
				{ type: 'curly', value: '}' } ]
			);
		});

		it('should handle backticks', function() {
			var fnc = function(){
				var a=`this
is
a
backtick
string` + `another
`;
			};

			var tokens = fnc.tokenize();

			// If this node version doesn't handle comments correctly, it probably changes more stuff
			if (!handles_comments) {
				return;
			}

			assert.deepEqual(tokens, [ 'function', '(', ')', '{', EOL + tabs(4), 'var', ' ', 'a', '=', '`this' + EOL + 'is' + EOL + 'a' + EOL + 'backtick' + EOL + 'string`', ' ', '+', ' ', '`another' + EOL + '`', ';', EOL + tabs(3), '}' ]);

			tokens = fnc.tokenize(true);

			var expected = [
				{ type: 'keyword', value: 'function', name: 'function' },
				{ type: 'parens', value: '(' },
				{ type: 'parens', value: ')' },
				{ type: 'curly', value: '{' },
				{ type: 'whitespace', value: EOL + tabs(4) },
				{ type: 'keyword', value: 'var', name: 'var' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'a' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'string', value: '`this' + EOL + 'is' + EOL + 'a' + EOL + 'backtick' + EOL + 'string`' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '+', name: 'plus' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'string', value: '`another' + EOL + '`' },
				{ type: 'punct', value: ';', name: 'semicolon' },
				{ type: 'whitespace', value: EOL + tabs(3) },
				{ type: 'curly', value: '}' }
			];

			deepAlike(tokens, expected);
		});

		it('should handle arrow functions', function() {

			var a = (a) => a * 1;

			var tokens = a.tokenize();

			assert.deepEqual(tokens, [ '(', 'a', ')', ' ', '=>', ' ', 'a', ' ', '*', ' ', '1' ]);
		});

		it('should correctly detect regular expressions', function() {

			var tokens = Function.tokenize(`a = b / c / 10`, true);

			var result = [
				{ type: 'name', value: 'a' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'b' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '/', name: 'divide' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'c' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '/', name: 'divide' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'number', value: '10' }
			];

			deepAlike(tokens, result);

			tokens = Function.tokenize(`/test/g.test('bla')`, true);

			result = [
				{ type: 'regexp', value: '/test/g', name: 'regexp' },
				{ type: 'punct', value: '.', name: 'dot' },
				{ type: 'name', value: 'test' },
				{ type: 'parens', value: '(' },
				{ type: 'string', value: '\'bla\'' },
				{ type: 'parens', value: ')' }
			];

			deepAlike(tokens, result);

			tokens = Function.tokenize(`a = (/b/g)`, true);

			result = [
				{ type: 'name', value: 'a' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'parens', value: '(' },
				{ type: 'regexp', value: '/b/g', name: 'regexp' },
				{ type: 'parens', value: ')' }
			];

			deepAlike(tokens, result);

			tokens = Function.tokenize(`var a\n/r/g.test('r')`, true);

			result = [
				{ type: 'keyword', value: 'var', name: 'var' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'a' },
				{ type: 'whitespace', value: '\n' },
				{ type: 'regexp', value: '/r/g', name: 'regexp' },
				{ type: 'punct', value: '.', name: 'dot' },
				{ type: 'name', value: 'test' },
				{ type: 'parens', value: '(' },
				{ type: 'string', value: '\'r\'' },
				{ type: 'parens', value: ')' }
			];

			deepAlike(tokens, result);

			tokens = Function.tokenize(`var a = /r/g, b = this.bla, c = /b/g, d = a/2/1;\n/zever/g`, true);

			result = [
				{ type: 'keyword', value: 'var', name: 'var' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'a' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'regexp', value: '/r/g', name: 'regexp' },
				{ type: 'punct', value: ',', name: 'comma' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'b' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'keyword', value: 'this', name: 'this' },
				{ type: 'punct', value: '.', name: 'dot' },
				{ type: 'name', value: 'bla' },
				{ type: 'punct', value: ',', name: 'comma' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'c' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'regexp', value: '/b/g', name: 'regexp' },
				{ type: 'punct', value: ',', name: 'comma' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'd' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'punct', value: '=', name: 'assign' },
				{ type: 'whitespace', value: ' ' },
				{ type: 'name', value: 'a' },
				{ type: 'punct', value: '/', name: 'divide' },
				{ type: 'number', value: '2' },
				{ type: 'punct', value: '/', name: 'divide' },
				{ type: 'number', value: '1' },
				{ type: 'punct', value: ';', name: 'semicolon' },
				{ type: 'whitespace', value: '\n' },
				{ type: 'regexp', value: '/zever/g', name: 'regexp' }
			];

			deepAlike(tokens, result);
		});
	});

	describe('.getArgumentNames(fnc)', function() {

		it('should return the argument names of a function', function() {

			var names;

			names = Function.getArgumentNames(function test(alpha, beta) {
				return null;
			});

			assert.equal(names[0], 'alpha');
			assert.equal(names[1], 'beta');
			assert.equal(names.length, 2);
		});

		it('should return empty array when no name is set', function() {

			var names = Function.getArgumentNames(function test() {});

			assert.equal(names.length, 0);
		});

		it('should return empty array when there is only a space', function() {

			var names = Function.getArgumentNames(function test( ) {});

			assert.equal(names.length, 0);
		});

		it('should also accept a string', function() {

			var names = Function.getArgumentNames('function test(alpha, beta) {}');

			assert.equal(names[0], 'alpha');
			assert.equal(names[1], 'beta');
			assert.equal(names.length, 2);
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

	describe('#getBodySource()', function() {
		it('should return the source code of the body', function() {

			// Bun somehow turns this into "return 2;"??
			if (Blast.isBun) {
				return;
			}

			var body;

			function myFnc() {return 1 + 1;};

			body = myFnc.getBodySource();

			assert.equal(body, 'return 1 + 1;');
		});
	});

	describe('#methodize()', function() {
		it('creates a function that calls the given function with current "this" context as the first argument', function() {

			var fnc = function(obj){return obj.zever;},
			    test = {zever: 'TEST'},
			    methodized = fnc.methodize();

			test.fnc = methodized;

			assert.equal(fnc({}), undefined);
			assert.equal(test.fnc(), 'TEST');
		});

		it('should handle arguments as expected', function() {

			var methodized,
			    test;

			function myFnc(obj, addition) {
				return obj.number + addition;
			}

			methodized = myFnc.methodize();

			test = {
				number : 1,
				myFnc  : methodized
			};

			assert.equal(String(myFnc({}, 5)), 'NaN');
			assert.equal(test.myFnc(4), 5);
		});

		it('should cache earlier methodized functions', function() {

			var fnc = function(){},
			    m1,
			    m2;

			m1 = fnc.methodize();
			m2 = fnc.methodize();

			assert.equal(m1, m2);
		});

		it('allows setting the wrapper name', function() {

			var methodized;

			function myFnc(){}
			function m_fnc(){}
			function toTestDelete(){}

			assert.equal(myFnc.methodize('bla').name, 'bla');
			assert.equal(m_fnc.methodize().name, '_m_fnc');
			assert.equal(toTestDelete.methodize('delete').name, '_delete');
		});

		it('should set the original function as the unmethodized one', function() {

			var methodized;

			function myFnc(){}

			methodized = myFnc.methodize();

			assert.equal(methodized.unmethodize(), myFnc);
		});
	});

	describe('#unmethodize()', function() {
		it('should create a new function that calls the given function with the first argument as the context', function() {

			var fnc = function(){return this.zever;},
			    methodized = fnc.unmethodize();

			assert.equal(fnc(), undefined);
			assert.equal(methodized({zever: 'TEST'}), 'TEST');
		});

		it('should be able to set the wrapper name', function() {

			function myFnc(){};
			function bla_fnc(){};
			function u_fnc(){};
			function toTestDelete(){};

			assert.equal(myFnc.unmethodize().name, 'myFnc');
			assert.equal(bla_fnc.unmethodize('bla').name, 'bla');
			assert.equal(u_fnc.unmethodize('u_fnc').name, '_u_fnc');
			assert.equal(toTestDelete.unmethodize('delete').name, '_delete');
		});
	});

	describe('.tryCatch(fnc, args, context)', function() {

		it('should return the original value when no errors occur', function() {

			var result;

			result = Function.tryCatch(function() {
				return 'alpha';
			});

			assert.equal(result, 'alpha');
		});

		it('should catch errors and return them', function() {

			var result;

			result = Function.tryCatch(function() {
				return _does_not_exist + 1;
			});

			assert.equal(result.constructor.name, 'ReferenceError');
		});

		it('should apply the given args', function() {

			var result;

			result = Function.tryCatch(function(a, b) {
				return a+b;
			}, [1, 2]);

			assert.equal(result, 3);
		});

		it('should apply the given context', function() {

			var result;

			result = Function.tryCatch(function() {
				return this.a + this.b;
			}, null, {a: 1, b: 2});

			assert.equal(result, 3);
		});

	});

	describe('.isNativeClass(fnc)', function() {
		it('detects when a function is made using the class syntax', function() {

			let anonymous = function() {};
			let anon_two = function() {return 'class'};
			let arrow = (zever) => {return 'class'};
			let real_class = class Test {};

			assert.strictEqual(Function.isNativeClass({}), false);
			assert.strictEqual(Function.isNativeClass(), false);
			assert.strictEqual(Function.isNativeClass(null), false);
			assert.strictEqual(Function.isNativeClass(1), false);

			assert.strictEqual(Function.isNativeClass(anonymous), false);
			assert.strictEqual(Function.isNativeClass(anon_two), false);
			assert.strictEqual(Function.isNativeClass(arrow), false);
			assert.strictEqual(Function.isNativeClass(real_class), true);
		});
	});
});