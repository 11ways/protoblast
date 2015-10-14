var assert = require('assert'),
    Blast;

describe('JSON', function() {

	var dryCirc2,
	    dryCirc;

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#toSource()', function() {
		it('should return the source code representation of the JSON object', function() {
			assert.equal(JSON.toSource(), 'JSON');
		});
	});

	describe('.dry()', function() {
		it('should stringify the object', function() {

			var obj = {},
			    arr = [0,1,2],
			    undry,
			    json,
			    dry;

			obj.a = arr;
			obj.b = arr;

			json = JSON.stringify(obj);
			dry = JSON.dry(obj);

			assert.equal(dry.length < json.length, true, 'Dry string is not shorter than JSON string');

			undry = JSON.undry(dry);

			assert.equal(undry.a, undry.b, 'Array a & b should be references to the same array');
		});

		it('should stringify circular references', function() {

			var obj = {test: true, arr: [0,1,2]},
			    dry;

			obj.circle = obj;

			dry = JSON.dry(obj);
			dryCirc = dry;

			assert.equal(dry, '{"test":true,"arr":[0,1,2],"circle":"~"}');

			obj.deep = {obj: obj};
			dryCirc2 = JSON.dry(obj);
		});

		it('should use #toDry() method of objects', function() {

			var d = new Deck(),
			    ntemp,
			    temp,
			    ndry,
			    obj,
			    dry;

			d.push('first');
			obj = {nonroot: d};

			dry = JSON.dry(d);
			ndry = JSON.dry(obj);
			temp = JSON.parse(dry);
			ntemp = JSON.parse(ndry);

			assert.equal(temp.path, '__Protoblast.Classes.Deck');
			assert.equal(ntemp.nonroot.path, '__Protoblast.Classes.Deck');
		});

		it('should handle #toJSON calls properly', function() {

			var undried,
			    dried,
			    obj,
			    a;

			a = {a: 1};

			obj = {
				zero: {toJSON: function(){return 0}},
				one: a,
				two: a
			};

			dried = JSON.dry(obj);
			undried = JSON.undry(dried);

			assert.equal(undried.zero, 0, '#toJSON was not respected');
			assert.equal(undried.one, undried.two, 'References have been messed up');
		});

		it('should drop functions', function() {

			var undried,
			    dried,
			    fnc = function test() {},
			    obj = {a: fnc, b: 1}

			dried = JSON.dry(obj);
			undried = JSON.undry(dried);

			assert.equal(JSON.dry(fnc), undefined, 'Function should be returned as undefined');
			assert.equal(undried.a, undefined, 'Functions should be returned as undefined');
			assert.equal(undried.b, 1, 'Other property did not revive');
		});
	});

	describe('.undry()', function() {

		it('should parse circular references', function() {

			var undry2,
			    undry;

			undry = JSON.undry(dryCirc);

			assert.equal(undry === undry.circle, true, 'Circular reference in undried object is gone');

			undry2 = JSON.undry(dryCirc2);

			assert.equal(undry2 === undry2.deep.obj, true, 'Deep circular reference in undried object is gone');
		});

		it('should use undry on dried objects that need to be revived', function() {

			var d = new Deck(),
			    dry,
			    undry;

			d.push('first');
			dry = JSON.dry({mydeck: d});

			undry = JSON.undry(dry);

			assert.equal(undry.mydeck instanceof Deck, true);
		});

		it('should also be able to revive root objects', function() {

			var d = new Deck(),
			    dry,
			    undry;

			d.push('first');
			dry = JSON.dry(d);

			undry = JSON.undry(dry);

			assert.equal(undry instanceof Deck, true);
		});

		it('should handle complicated revive structures', function() {

			var d = new Deck(),
			    d2 = new Deck(),
			    arr,
			    dry,
			    sub,
			    undry;

			arr = [0,1,2];
			d2.push('sub');
			d2.set('arr', arr);

			d.push('first');
			d.set('subdeck', d2);
			d.set('arr', arr);

			dry = JSON.dry(d);

			undry = JSON.undry(dry);
			sub = undry.get('subdeck');

			assert.equal(undry instanceof Deck, true, 'Undried object should be a Deck instance');
			assert.equal(sub instanceof Deck, true, 'Sub entry of object should also be a Deck instance');
			assert.equal(undry.get('arr') === sub.get('arr'), true, 'Array in both Decks should be a reference');
		});

		it('should handle recursive links first returned by a toJSON call', function() {

			var undried,
			    dried,
			    root,
			    a,
			    x;

			a = {a: 'a'};
			x = {toJSON: function() {return a}};
			y = {toJSON: function() {return 'y'}};

			root = {
				x: x,
				y: y,
				last: a
			};

			dried = JSON.dry(root);
			undried = JSON.undry(dried);

			assert.equal(undried.last, undried.x);
		});

		it('should handle the safe character', function() {

			var undried,
			    input = 'This is ~not~ undefined',
			    dried = JSON.dry(input),
			    driedtwo = JSON.dry({a: input});

			undried = JSON.undry(dried);

			assert.equal(driedtwo, '{"a":"This is \\\\x7enot~ undefined"}', 'The first special char should be escaped');
			assert.equal(dried, JSON.stringify(input), 'Special chars should not be escaped in a regular string');
			assert.equal(undried, input);
		});
	});

});