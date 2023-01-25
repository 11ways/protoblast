var assert = require('assert'),
    Blast;

describe('Blast', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.listToTree(list)', function() {

		it('should convert a flat list to a tree structure', () => {

			const input = [
				{ id: "1", level: 1, title: "Item 1"},
				{ id: "2", level: 2, title: "Item 2"},
				{ id: "3", level: 3, title: "Item 3"},
				{ id: "4", level: 2, title: "Item 4"},
			];

			const expected = [
				{
					id: "1",
					level: 1,
					title: "Item 1",
					children: [
						{
							id: "2",
							level: 2,
							title: "Item 2",
							children: [
								{ id: "3", level: 3, title: "Item 3", children: [] },
							],
						},
						{ id: "4", level: 2, title: "Item 4", children: [] },
					],
				},
			];

			assert.deepStrictEqual(Blast.listToTree(input), expected);
		});

		it("should handle level skips", () => {
			const input = [
				{ id: "1", level: 1, title: "Item 1"},
				{ id: "2", level: 4, title: "Item 2"},
			];

			const expected = [
				{
					id: "1",
					level: 1,
					title: "Item 1",
					children: [
						{
							id: "2",
							level: 4,
							title: "Item 2",
							children: [],
						},
					],
				},
			];

			assert.deepStrictEqual(Blast.listToTree(input), expected);
		});

		it("should handle lower level than first entry", () => {
			const input = [
				{ id: "1", level: 2, title: "Item 1"},
				{ id: "2", level: 1, title: "Item 2"},
				{ id: "3", level: 2, title: "Item 3"},

			];
			const expected = [
				{
					id: "1",
					level: 2,
					title: "Item 1",
					children: []
				},
				{
					id: "2",
					level: 1,
					title: "Item 2",
					children: [
						{ id: "3", level: 2, title: "Item 3", children: [] }
					],
				},
			];

			assert.deepStrictEqual(Blast.listToTree(input), expected);
		});

		it('edits the items in-place', () => {

			const input = [
				{ id: "1", level: 1, title: "Item 1"},
				{ id: "2", level: 4, title: "Item 2"},
			];

			const expected = [
				{
					id: "1",
					level: 1,
					title: "Item 1",
					children: [
						{
							id: "2",
							level: 4,
							title: "Item 2",
							children: [],
						},
					],
				},
			];

			let tree = Blast.listToTree(input);

			assert.deepStrictEqual(tree, expected);

			assert.strictEqual(tree[0], input[0]);
			assert.strictEqual(tree[0].children[0], input[1]);
		});
	});

});