/**
 * Circular-JSON code:
 * Copyright (C) 2013 by WebReflection
 * Modified by Jelle De Loecker
 *
 * JSON-js code:
 * Public domain by Douglas Crockford
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

	'use strict';

	var specialChar = '~',
	    safeSpecialChar = '\\x7e',
	    escapedSafeSpecialChar = '\\' + safeSpecialChar,
	    safeStartWithSpecialCharRG = new RegExp('(?:^|([^\\\\]))' + escapedSafeSpecialChar),
	    safeSpecialCharRG = new RegExp(escapedSafeSpecialChar, 'g'),
	    specialCharRG = new RegExp(safeSpecialChar, 'g'),
	    getregex = /^\/(.*)\/(.*)/,
	    iso8061 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/,
	    undriers = {},
	    driers = {},
	    meta,
	    rep;

	var rx_one = /^[\],:{}\s]*$/,
	    rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
	    rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
	    rx_four = /(?:^|:|,)(?:\s*\[)+/g,
	    rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
	    rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

	// table of character substitutions
	meta = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"': '\\"',
		'\\': '\\\\'
	};

	function string_escaper(a) {
		var c = meta[a];

		return c == null
			? '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
			: c;
	}

	function quote(string) {
		rx_escapable.lastIndex = 0;
		return rx_escapable.test(string) 
			? '"' + string.replace(rx_escapable, string_escaper) + '"' 
			: '"' + string + '"';
	}

	/**
	 * Return a string representing the source code of the object.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.10
	 *
	 * @return   {Function}
	 */
	function generateReplacer(root, replacer) {

		var seenByConstructor,
		    constructorMap,
		    seenObjects,
		    seenMap,
		    isRoot,
		    chain,
		    path,
		    temp,
		    i;

		isRoot = true;
		seenByConstructor = {};
		constructorMap = {};

		chain = [];
		path = [];

		seenObjects = [];
		seenMap = [];

		return function dryReplacer(holder, key, value) {

			var nameType,
			    replaced,
			    partial,
			    isArray,
			    isWrap,
			    temp,
			    last,
			    len,
			    i,
			    j,
			    k,  // Member key
			    v;  // Member value

			// Process the value to a possible given replacer function
			if (replacer != null) {
				value = replacer.call(holder, key, value);
			}

			if (key === false) {
				key = '';
				isWrap = true;

				// Wrappers get added to the object chain, but not the path
				// We need to be able to identify them later on
				holder.__isWrap = true;

				// See if the wrapped value is an object
				if (holder[''] && typeof holder[''] === 'object') {
					holder.__isObject = true;
				}
			}

			switch (typeof value) {

				case 'function':
					return;

				case 'object':
					if (value == null) {
						value = 'null';
					} else {

						// Get the name of the constructor
						if (value.constructor) {
							nameType = value.constructor.name;
						} else {
							nameType = 'Object';
						}

						// Create the map if it doesn't exist yet
						if (seenByConstructor[nameType] == null) {
							seenByConstructor[nameType] = [];
							constructorMap[nameType] = [];
						}

						while (len = chain.length) {

							// If the current object at the end of the chain does not
							// match the current holder, move one up
							// Don't mess with the chain if this is a wrap object
							if (!isWrap && holder !== chain[len-1]) {

								last = chain.pop();

								// Only pop the path if the popped object isn't a wrapper
								// @todo: also check for __isObject or not?
								if (last && !last.__isWrap) {
									path.pop();
								}
							} else {
								break;
							}
						}

						// Now see if this object has been seen before
						if (seenByConstructor[nameType].length) {
							i = seenByConstructor[nameType].indexOf(value);

							if (i > -1) {
								value = quote(seenMap[constructorMap[nameType][i]]);
								break;
							}
						}

						// Store the object in the seen array and return the index
						i = seenObjects.push(value) - 1;
						j = seenByConstructor[nameType].push(value) - 1;
						constructorMap[nameType][j] = i;

						// Key cannot contain specialChar but could be not a string
						if (!isRoot && !isWrap) {
							path.push(('' + key).replace(specialCharRG, safeSpecialChar));
						} else {
							isRoot = false;
						}

						seenMap[i] = specialChar + path.join(specialChar);

						if (driers[nameType] != null) {
							value = driers[nameType].fnc(holder, key, value);

							value = {
								dry: nameType,
								value: value
							};

							if (driers[nameType].options.add_path !== false) {
								value.drypath = path.slice(0);
							}

							replaced = {'': value};
						} else if (nameType == 'RegExp') {
							value = {dry: 'regexp', value: value.toString()};
							replaced = {'': value};
						} else if (typeof value.toDry === 'function') {
							value = value.toDry();
							value.dry = 'toDry';
							value.drypath = path.slice(0);
							replaced = {'': value};
						} else if (typeof value.toJSON === 'function') {
							value = value.toJSON();
							replaced = {'': value};
						} else {
							isArray = Array.isArray(value);
						}

						// Push this object on the chain
						chain.push(replaced || value);

						if (replaced) {
							value = dryReplacer(replaced, false, replaced['']);

							// At least one part of the path & chain will have
							// to be popped off. This is needed for toJSON calls
							// that return primitive values
							temp = chain.pop();

							// Don't pop off anything from the path if the last item
							// from the chain was a wrapper for an object,
							// because then it'll already be popped of
							if (!(temp && temp.__isWrap && temp.__isObject)) {
								temp = path.pop();
							}

							break;
						}

						partial = [];

						if (isArray) {
							len = value.length;
							for (i = 0; i < len; i += 1) {
								partial[i] = dryReplacer(value, i, value[i]) || 'null';
							}

							v = partial.length === 0 ? '[]' : '[' + partial.join(',') + ']';
						} else {
							for (k in value) {
								if (value.hasOwnProperty(k)) {
									v = dryReplacer(value, k, value[k]);
									if (v) {
										partial.push(quote(k) + ':' + v);
									}
								}
							}

							v = partial.length === 0 ? '{}' : '{' + partial.join(',') + '}';
						}

						value = v;
					}
					break;

				case 'string':

					// Make sure the "special char" doesn't mess things up
					if (!isRoot) {
						value = value.replace(safeSpecialCharRG, escapedSafeSpecialChar)
						             .replace(specialChar, safeSpecialChar);
					}

					value = quote(value);
					break;

				case 'number':
					// Allow infinite values
					if (!isFinite(value)) {
						if (value > 0) {
							value = '{"dry":"+Infinity"}';
						} else {
							value = '{"dry":"-Infinity"}';
						}

						break;
					}

				case 'boolean':
				case 'null':
					value = String(value);
					break;
			}

			return value;
		};
	};

	/**
	 * Generate reviver function
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.10
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

				switch (value.dry) {

					case 'regexp':
						if (value.value) {
							return RegExp.apply(undefined, getregex.exec(value.value).slice(1));
						}
						break;

					case '+Infinity':
						return Infinity;

					case '-Infinity':
						return -Infinity;

					case 'toDry':
						constructor = Collection.Object.path(Blast.Globals, value.path);

						// Undry this element, but don't put it in the parsed object yet
						if (constructor && typeof constructor.unDry === 'function') {
							value.undried = constructor.unDry(value.value);
						} else {
							value.undried = value.value;
						}

						if (value.drypath) {
							undryPaths[value.drypath.join(specialChar)] = value;
						} else {
							return value.undried;
						}
						break;

					default:
						if (typeof value.value !== 'undefined') {
							if (undriers[value.dry]) {
								value.undried = undriers[value.dry].fnc(this, key, value.value);
							} else {
								value.undried = value.value;
							}

							if (value.drypath) {
								undryPaths[value.drypath.join(specialChar)] = value;
							} else {
								return value.undried;
							}
						}
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
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
	 * Deep clone an object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.6
	 * @version  0.2.0
	 *
	 * @param    {Object}   obj
	 * @param    {String}   custom_method   Custom method to use if available
	 * @param    {WeakMap}  wm
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('JSON', 'clone', function clone(obj, custom_method, wm) {

		var nameType,
		    entry,
		    split,
		    keys,
		    temp,
		    len,
		    i,
		    target;

		if (wm == null) {
			wm = new WeakMap();
			return clone({'_': obj}, custom_method, wm)['_'];
		}

		if (Array.isArray(obj)) {
			target = [];
		} else {
			target = {};
		}

		keys = Object.keys(obj);
		len = keys.length;

		// Remember the root object and its clone
		wm.set(obj, target);

		for (i = 0; i < len; i++) {
			entry = obj[keys[i]];

			if (entry && typeof entry == 'object') {

				// If this has been cloned before, use that
				if (wm.has(entry)) {
					target[keys[i]] = wm.get(entry);
					continue;
				}

				if (entry.constructor) {
					nameType = entry.constructor.name;

					if (custom_method && entry[custom_method]) {
						target[keys[i]] = entry[custom_method](wm);
					} else if (driers[nameType] != null) {
						// Look for a registered drier function
						temp = driers[nameType].fnc(obj, keys[i], entry);

						if (undriers[nameType]) {
							target[keys[i]] = undriers[nameType].fnc(target, keys[i], temp);
						} else {
							target[keys[i]] = temp;
						}
					} else if (entry.dryClone) {
						// Look for dryClone after
						target[keys[i]] = entry.dryClone(wm, custom_method);
					} else if (entry.toDry) {
						// Perform the toDry function
						temp = entry.toDry();

						// Clone the value,
						// because returned objects aren't necesarilly cloned yet
						temp = clone(temp.value, custom_method, wm);

						// Perform the undry function
						if (entry.constructor.unDry) {
							target[keys[i]] = entry.constructor.unDry(temp);
						} else {
							// If there is no undry function, the clone will be a simple object
							target[keys[i]] = temp;
						}
					} else if (nameType == 'Date') {
						target[keys[i]] = new Date(entry);
					} else if (nameType == 'RegExp') {
						temp = entry.toString();
						split = temp.match(/^\/(.*?)\/([gim]*)$/);

						if (split) {
							target[keys[i]] = new RegExp(split[1], split[2]);
						} else {
							target[keys[i]] = new RegExp(temp);
						}
					} else if (typeof entry.clone == 'function') {
						// If it supplies a clone method, use that
						target[keys[i]] = entry.clone();
					} else if (entry.toJSON) {
						temp = entry.toJSON();

						if (temp && typeof temp == 'object') {
							temp = clone(temp, custom_method, wm);
						}

						target[keys[i]] = temp;
					} else {
						target[keys[i]] = clone(entry, custom_method, wm);
					}
				} else {
					target[keys[i]] = clone(entry, custom_method, wm);
				}

				// Remember this clone for later
				wm.set(entry, target[keys[i]]);
			} else {
				target[keys[i]] = entry;
			}
		}

		return target;
	});

	/**
	 * Dry it
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.10
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('JSON', 'dry', function dry(value, replacer, space) {
		var root = {'': value};
		return generateReplacer(root, replacer)(root, '', value);
	});

	/**
	 * Register a drier
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.10
	 * @version  0.1.10
	 *
	 * @param    {String}   constructor_name   What constructor to listen to
	 * @param    {Function} fnc
	 * @param    {Object}   options
	 */
	Blast.defineStatic('JSON', 'registerDrier', function registerDrier(constructor_name, fnc, options) {
		driers[constructor_name] = {
			fnc: fnc,
			options: options || {}
		};
	});

	/**
	 * Register an undrier
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.10
	 * @version  0.1.10
	 *
	 * @param    {String}   constructor_name   What constructor to listen to
	 * @param    {Function} fnc
	 * @param    {Object}   options
	 */
	Blast.defineStatic('JSON', 'registerUndrier', function registerUndrier(constructor_name, fnc, options) {
		undriers[constructor_name] = {
			fnc: fnc,
			options: options || {}
		};
	});

	/**
	 * Undry string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
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

		if (result.undried != null && result.dry == 'toDry') {
			return result.undried;
		}

		return result;
	});

};