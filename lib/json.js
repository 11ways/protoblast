/**
 * Circular-JSON code:
 * Copyright (C) 2013 by WebReflection
 * Modified by Jelle De Loecker
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
module.exports = function BlastJSON(Blast, Collection) {

	var safeStartWithSpecialCharRG,
	    escapedSafeSpecialChar,
	    safeSpecialCharRG,
	    safeSpecialChar,
	    specialCharRg,
	    specialChar,
	    getregex,
	    iso8061;

	specialChar = '~';
	safeSpecialChar = '\\x' + ('0' + specialChar.charCodeAt(0).toString(16)).slice(-2);
	escapedSafeSpecialChar = '\\' + safeSpecialChar;
	specialCharRg = new RegExp(safeSpecialChar, 'g');
	safeSpecialCharRG = new RegExp(escapedSafeSpecialChar, 'g');

	safeStartWithSpecialCharRG = new RegExp('(?:^|([^\\\\]))' + escapedSafeSpecialChar);

	iso8061 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
	getregex = /^\/(.*)\/(.*)/;

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('JSON', 'toSource', function toSource() {
		return 'JSON';
	}, true);

	/**
	 * Generate a replacer function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Function}
	 */
	function generateReplacer(root, replacer) {

		var seenByConstructor,
		    constructorMap,
		    seenObjects,
		    seenMap,
		    chain,
		    isObj,
		    path,
		    last,
		    temp,
		    i;

		isObj = typeof root === 'object';

		// Don't create a replacer if the root isn't an object
		if (isObj === false || root == null) {
			return;
		}

		seenByConstructor = {};
		constructorMap = {};

		seenObjects = [root];
		seenMap = [specialChar];

		chain = [];
		path = [];

		last = root;

		seenByConstructor[root.constructor.name] = [root];
		constructorMap[root.constructor.name] = [0];


		return function dryReplacer(key, value) {

			var nameType,
			    valType,
			    temp,
			    len,
			    j;

			// Process the value to a possible given replacer function
			if (replacer != null) {
				value = replacer.call(this, key, value);
			}

			// Get the type of the value after possible `replacer` ran
			valType = typeof value;

			if (key !== '') {

				if (value != null && valType === 'object') {

					// Get the name of the constructor
					nameType = value.constructor.name;

					// Create the map if it doesn't exist yet
					if (seenByConstructor[nameType] == null) {
						seenByConstructor[nameType] = [];
						constructorMap[nameType] = [];
					}

					while (len = chain.length) {

						temp = chain[len-1];

						// If the item is found on the current chain link
						if (temp[key] === value) {
							break;
						} else {
							// If it was not, remove this link from the chain
							chain.pop();
							path.pop();
						}

					}

					// Now see if this object has been seen before
					if (seenByConstructor[nameType].length) {
						i = seenByConstructor[nameType].indexOf(value);
					} else {
						i = -1;
					}

					if (i < 0) {

						// Store the object in the seen array and return the index
						i = seenObjects.push(value) - 1;
						j = seenByConstructor[nameType].push(value) - 1;
						constructorMap[nameType][j] = i;

						// Key cannot contain specialChar but could be not a string
						path.push(('' + key).replace(specialCharRg, safeSpecialChar));

						seenMap[i] = specialChar + path.join(specialChar);

						if (value.constructor.name == 'RegExp') {
							value = {dry: 'regexp', value: value.toString()};
						} else if (typeof value.toDry === 'function') {
							value = value.toDry();
							value.dry = 'toDry';
							value.drypath = path.slice(0);
						}
					} else {
						value = seenMap[constructorMap[nameType][i]];
					}
				} else {

					

					if (valType === 'string') {
						// Make sure the "special char" doesn't mess things up
						value = value.replace(safeSpecialChar, escapedSafeSpecialChar)
						             .replace(specialChar, safeSpecialChar);
					} else if (valType === 'number') {

						// Allow infinite values
						if (!isFinite(value)) {
							if (value > 0) {
								value = {dry: '+Infinity'};
							} else {
								value = {dry: '-Infinity'};
							}
						}
					}
				}
			}

			last = value;

			// Push the current object to the chain,
			// it is now the active item
			if (value != null & typeof value == 'object') {
				chain.push(value);
			}

			return value;
		};
	};

	/**
	 * Generate reviver function
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Function}
	 */
	function generateReviver(reviver, undryPaths) {

		return function dryReviver(key, value) {

			var valType = typeof value,
			    constructor,
			    temp;

			if (valType === 'string') {
				if (value.charAt(0) === specialChar) {
					return new String(value.slice(1));
				} else if (value.match(iso8061)) {
					return new Date(value);
				}
			} else if (value && valType == 'object' && value.dry != null) {

				if (value.dry == 'toDry') {

					constructor = Collection.Object.path(Blast.Globals, value.path);

					// Undry this element, but don't put it in the parsed object yet
					if (constructor && typeof constructor.unDry === 'function') {
						value.undried = constructor.unDry(value.value);
					} else {
						value.undried = value.value;
					}

					undryPaths[value.drypath.join(specialChar)] = value;
				} else if (value.dry == 'regexp' && value.value) {
					return RegExp.apply(undefined, getregex.exec(value.value).slice(1));
				} else if (value.dry == '+Infinity') {
					return Infinity;
				} else if (value.dry == '-Infinity') {
					return -Infinity;
				}
			}

			if (valType === 'string') {
				value = value.replace(safeStartWithSpecialCharRG, '$1' + specialChar)
				             .replace(escapedSafeSpecialChar, safeSpecialChar);
			}

			if (reviver == null) {
				return value;
			}

			return reviver.call(this, key, value);
		};
	};

	/**
	 * Regenerate an array
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Array}
	 */
	function regenerateArray(root, current, chain, retrieve, undryPaths) {

		var length = current.length,
		    i;

		for (i = 0; i < length; i++) {
			// Only regenerate if it's not in the chain
			if (chain.indexOf(current[i]) == -1) {
				current[i] = regenerate(root, current[i], chain, retrieve, undryPaths);
			}
		}

		return current;
	};

	/**
	 * Regenerate an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Object}
	 */
	function regenerateObject(root, current, chain, retrieve, undryPaths) {

		var key;

		for (key in current) {
			if (current.hasOwnProperty(key)) {
				// Only regenerate if it's not in the cain
				if (chain.indexOf(current[key]) == -1) {
					current[key] = regenerate(root, current[key], chain, retrieve, undryPaths);
				}
			}
		}

		return current;
	};

	/**
	 * Regenerate a value
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Mixed}
	 */
	function regenerate(root, current, chain, retrieve, undryPaths) {

		var temp,
		    i;

		chain.push(current);

		if (current instanceof Array) {
			return regenerateArray(root, current, chain, retrieve, undryPaths);
		}

		if (current instanceof String) {

			if (current.length) {
				if (undryPaths[current]) {
					return undryPaths[current].undried;
				}

				if (retrieve.hasOwnProperty(current)) {
					temp = retrieve[current];
				} else {
					temp = retrieve[current] = retrieveFromPath(root, current.split(specialChar));
				}

				return temp;
			} else {
				return root;
			}
		}

		if (current instanceof Object) {
			return regenerateObject(root, current, chain, retrieve, undryPaths);
		}

		chain.pop();

		return current;
	};

	/**
	 * Retrieve from path.
	 * Set the given value, but only if the containing object exists.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Mixed}
	 */
	function retrieveFromPath(current, keys, value) {

		var length = keys.length,
		    prev,
		    key,
		    i;

		for (i = 0; i < length; i++) {

			// Normalize the key
			key = keys[i].replace(safeSpecialCharRG, specialChar);
			prev = current;

			if (current) {
				current = current[key];
			} else {
				return undefined;
			}
		}

		if (arguments.length === 3) {
			prev[key] = value;
			current = value;
		}

		return current;
	};

	/**
	 * Dry it
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('JSON', 'dry', function dry(value, replacer, space) {
		return JSON.stringify(value, generateReplacer(value, replacer), space);
	});

	/**
	 * Undry string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @return   {Mixed}
	 */
	Blast.defineStatic('JSON', 'undry', function undry(text, reviver) {

		var undryPaths = {},
		    retrieve = {},
		    result,
		    path;

		result = JSON.parse(text, generateReviver(reviver, undryPaths));

		for (path in undryPaths) {
			undryPaths[path].undried = regenerate(result, undryPaths[path].undried, [], retrieve, undryPaths)
		}

		// Only now can we resolve paths
		result = regenerate(result, result, [], retrieve, undryPaths);

		// Now we can replace all the undried values
		for (path in undryPaths) {
			Collection.Object.setPath(result, undryPaths[path].drypath, undryPaths[path].undried);
		}

		return result;
	});

};