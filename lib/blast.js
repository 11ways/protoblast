const defStat = Blast.createStaticDefiner(Blast);

/**
 * Turn the given list into a tree
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.3
 * @version  0.8.3
 *
 * @param    {Array}   entries
 *
 * @return   {Array}
 */
defStat(function listToTree(list) {

	const root = {
		children: []
	};

	const stack = [root];

	let current_parent = root,
	    item;
  
	for (item of list) {
		while (item.level <= current_parent.level) {
			stack.pop();
			current_parent = stack[stack.length - 1];
		}

		if (!Array.isArray(item.children)) {
			item.children = [];
		}

		current_parent.children.push(item);
		stack.push(item);
		current_parent = item;
	}

	return root.children;
});