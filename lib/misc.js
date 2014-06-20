module.exports = function BlastMisc(Blast, Collection) {

	/**
	 * Return a string representing the source code of the object.
	 * Overwrites existing method in Firefox.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Uint8Array', 'toSource', function toSource() {
		return '(new Uint8Array([' + Array.prototype.join.call(this) + ']))';
	});

	/**
	 * Return a string representing the source code of the object.
	 * Overwrites existing method in Firefox.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Uint16Array', 'toSource', function toSource() {
		return '(new Uint16Array([' + Array.prototype.join.call(this) + ']))';
	});

	/**
	 * Return a string representing the source code of the object.
	 * Overwrites existing method in Firefox.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Uint32Array', 'toSource', function toSource() {
		return '(new Uint32Array([' + Array.prototype.join.call(this) + ']))';
	});

	/**
	 * Return a string representing the source code of the object.
	 * Overwrites existing method in Firefox.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('Uint8ClampedArray', 'toSource', function toSource() {
		return '(new Uint8ClampedArray([' + Array.prototype.join.call(this) + ']))';
	});

};