if (typeof WeakMap != 'undefined') {
	return;
}

let id = 0;

/**
 * The WeakMap class isn't present everywhere
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 */
let NewWeakMap = Blast.defineClass('WeakMap', function WeakMap() {
	this.id = id++;
}, true);

// Force it into the global
Blast.Globals.WeakMap = NewWeakMap;

/**
 * Set value on an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {Object}   obj
 * @param    {Mixed}    val
 */
Blast.definePrototype('WeakMap', function set(obj, val) {
	var map = this._blastMap(obj);

	map[this.id] = val;

	return this;
});

/**
 * Get value of an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {Object}   obj
 * @param    {Mixed}    val
 */
Blast.definePrototype('WeakMap', function get(obj) {
	var map = this._blastMap(obj);
	return map[this.id];
});

/**
 * Has value of an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {Object}   obj
 * @param    {Mixed}    val
 */
Blast.definePrototype('WeakMap', function has(obj) {
	var map = this._blastMap(obj);

	if (map[this.id] == null && !(this.id in map)) {
		return false;
	}

	return true;
});

/**
 * Delete value of an object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {Object}   obj
 */
Blast.definePrototype('WeakMap', 'delete', function _delete(obj) {
	var map = this._blastMap(obj);

	delete map[this.id];

	return this;
});

/**
 * Get the object's map
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.8
 * @version  0.3.8
 *
 * @param    {Object}   obj
 * @param    {Mixed}    val
 */
Blast.definePrototype('WeakMap', function _blastMap(obj) {

	var map;

	if (!obj) {
		throw new Error('Not a valid object');
	}

	if (!obj.__blast_weakmap) {
		Blast.defineProperty(obj, '__blast_weakmap', {
			value : {}
		});
	}

	return obj.__blast_weakmap;
});