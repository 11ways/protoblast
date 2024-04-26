const defStat = Blast.createStaticDefiner(Blast, true);

/**
 * Identifier symbols
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
const JANEWAY_LEFT  = defStat('JANEWAY_LEFT', Symbol.for('janeway_arg_left')),
      JANEWAY_RIGHT = defStat('JANEWAY_RIGHT', Symbol.for('janeway_arg_right'));

/**
 * Get all the object getters
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
defStat(function getObjectGetters(obj) {

	const result = new Map();

	let descriptors,
	    descriptor,
	    symbols,
	    current = obj,
	    entry,
	    key;

	while (current && typeof current == 'object') {
		descriptors = Object.getOwnPropertyDescriptors(current);

		// Get the symbols
		symbols = this.getObjectSymbols(current);

		if (symbols && symbols.length) {
			let i;

			for (i = 0; i < symbols.length; i++) {
				key = symbols[i];
				descriptor = Object.getOwnPropertyDescriptor(current, key);

				if (descriptor.get) {
					descriptor.symbol = key;
					descriptors[String(key)] = descriptor;
				}
			}
		}

		for (key in descriptors) {

			if (key == '__proto__') {
				continue;
			}

			entry = descriptors[key];

			if (entry.get) {
				result.set(key, entry);
			}
		}

		if (current.__proto__) {
			current = current.__proto__;
		} else {
			break;
		}
	}

	return result;
});

/**
 * Get all the symbol properties of the given object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Object}   arg
 *
 * @return   {Array}
 */
defStat(function getObjectSymbols(arg) {
	if (!Object.getOwnPropertySymbols) {
		return [];
	}

	return Object.getOwnPropertySymbols(arg);
});

if (!Blast.isBrowser) {
	return;
}

const ARG_STYLE = {style: `display: block;min-height: 20px; min-width: 350px;`};
const ARG_LEFT_STYLE = {style: 'background-color: #000; color: yellow; font-weight: bold'};
const ARG_RIGHT_STYLE = {style: 'background-color: #000; color: white; font-weight: bold'};
const PROP_STYLE = {style: `display: block;min-height: 20px;`};
const KEY_STYLE = {style: `display: inline-block;min-width: 120px; color: #ea89ea;`};
const HIDDEN_KEY_STYLE = {style: `display: inline-block;min-width: 120px; color: #ac65ac;font-style:italic`};
const VAL_STYLE = {style: `font-weight: bold;`};

/**
 * Serialize a body for custom formatters
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
const serializeBody = obj => {

	let result = ['div', {}];

	// Get all the plain keys
	let keys = Object.keys(obj);

	// Add all the keys
	let all_keys = [...keys];

	// Sort the keys alphabetically
	keys.sort();

	// Get all the getters
	let getters = Blast.getObjectGetters(obj);

	// Add them to all the keys
	all_keys.push(...getters.keys());

	// Get all the hidden keys
	let hidden_keys = Bound.Array.subtract(Object.getOwnPropertyNames(obj), all_keys);

	// Do the visible keys first
	for (let key of keys) {
		let val = obj[key];

		if (val) {
			let type = typeof val;

			if (type == 'object' || type == 'function') {
				result.push([
					'span',
					PROP_STYLE,
					[
						'span',
						KEY_STYLE,
						key + ': ',
					],
					['object', {'object': val}],
				]);
				continue;
			}
		}

		result.push([
			'span',
			PROP_STYLE,
			[
				'span',
				KEY_STYLE,
				key + ': ',
			],
			[
				'span',
				VAL_STYLE,
				'' + val,
			],
		]);
	}

	// Now do the hidden keys
	for (let key of hidden_keys) {
		let val = obj[key];

		if (val) {
			let type = typeof val;

			if (type == 'object' || type == 'function') {
				result.push([
					'span',
					PROP_STYLE,
					[
						'span',
						HIDDEN_KEY_STYLE,
						key + ': ',
					],
					['object', {'object': val}],
				]);
				continue;
			}
		}

		result.push([
			'span',
			PROP_STYLE,
			[
				'span',
				HIDDEN_KEY_STYLE,
				key + ': ',
			],
			[
				'span',
				VAL_STYLE,
				'' + val,
			],
		]);
	}

	if (getters.size) {

		let getter_object = {};

		for (let [key, descriptor] of getters) {

			if (key.startsWith('Symbol(')) {
				Blast.defineGet(getter_object, key, () => descriptor.get.call(obj));
				continue;
			}

			Blast.defineGet(getter_object, key, () => obj[key]);
		}

		result.push([
			'span',
			PROP_STYLE,
			[
				'span',
				KEY_STYLE,
				'[GETTERS] : ',
			],
			[
				'object',
				{object: getter_object},
			],
		]);
	}

	if (obj.__proto__) {
		result.push([
			'span',
			PROP_STYLE,
			[
				'span',
				KEY_STYLE,
				'[[Prototype]] : ',
			],
			[
				'object',
				{object: obj.__proto__},
			],
		]);
	}

	return result;
};

/**
 * Enable custom formatters
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
window.devtoolsFormatters = [{
	header: (arg) => {

		// Leave non-objects alone
		if (!arg || typeof arg != 'object') {
			return null;
		}

		// Leave HTML elements alone
		if (arg instanceof HTMLElement) {
			return null;
		}

		// Also ignore the builtin types
		if (arg instanceof Map || arg instanceof Set || Array.isArray(arg) || arg instanceof Error) {
			return null;
		}

		// If it's a plain object, also use the default formatter
		if (Obj.isPlainObject(arg)) {
			return null;
		}

		let left,
		    right;

		if (typeof arg[JANEWAY_LEFT] == 'function') {
			left = arg[JANEWAY_LEFT]();
		}

		if (typeof arg[JANEWAY_RIGHT] == 'function') {
			right = arg[JANEWAY_RIGHT]();
		}

		if (!left && arg.constructor) {
			left = arg.constructor.name;

			if (arg.constructor.namespace) {
				left = arg.constructor.namespace + '.' + left;
			}
		} else {
			left = 'Object'
		}

		if (!right) {
			right = '';

			if (arg instanceof Error) {
				right = arg.message;
			} else if (arg instanceof HTMLElement) {
				right = arg.outerHTML;
			}
		}

		let result = [
			'div',
			ARG_STYLE,
			[
				'span',
				ARG_LEFT_STYLE,
				left
			],
		];

		if (right) {
			result.push([
				'span',
				ARG_RIGHT_STYLE,
				right,
			]);
		}

		return result;
	},
	hasBody: (arg) => {
		return arg && typeof arg == 'object';
	},
	body: (arg) => {
		return serializeBody(arg);
	},
}];