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

let machine_id,
    process_id,
    counter = ~~(Math.random() * 10000);

/**
 * Create an ObjectID string
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.9.0
 *
 * @return   {string}
 */
defStat(function createObjectId() {

	// Start with 4 bytes for the time in seconds
	let time = parseInt(Date.now()/1000).toString(16).slice(0, 8);
	let result = time;

	if (machine_id == null) {

		if (Blast.isBrowser) {
			machine_id = Math.abs(Bound.String.fowler(navigator.userAgent)).toString(16);
			process_id = Blast.Classes.Crypto.pseudoHex().padStart(4, '0');
		} else if (Blast.isServer) {
			let libcrypto = require('crypto');
			const hostname = require('os').hostname() || 'protoblast';
			machine_id = libcrypto.createHash('md5').update(hostname).digest('hex').padStart(6, '0');
			process_id = process.pid.toString(16).padStart(4, '0');
		}

		if (machine_id.length < 6) {
			machine_id += result;
		}

		// Get the first 6 pieces
		machine_id = machine_id.slice(0, 6);

		if (process_id.length > 4) {
			process_id = process_id.slice(0, 4);
		}
	}

	result += machine_id;
	result += process_id;

	// Create the counter
	let count = (counter++).toString(16);

	if (count.length < 6) {
		count = count.padStart(6, '0');
	} else {
		count = count.slice(-6);
	}

	result += count;

	return result;
});