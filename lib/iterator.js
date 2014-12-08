module.exports = function BlastIterator(Blast, Collection) {

	/**
	 * The Iterator class
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 */
	var Iterator = Collection.Function.inherits(function Iterator(subject) {

		// What is the subject type?
		if (Array.isArray(subject)) {
			this._iterSubject = subject;
		} else if (subject != null) {
			this._iterSubjectIsArray = false;
			this._iterSubject = Collection.Object.dissect(subject);
		}
	});

	/**
	 * Determine if an object is an instance of Iterator
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.5
	 * @version  0.1.5
	 */
	Blast.defineStatic(Iterator, function isIterator(obj) {
		return obj && obj._iterSubject != null;
	});

	/**
	 * The initial index is always 0
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @type   {Number}
	 */
	Iterator.setProperty('_iterNextIndex', 0);

	/**
	 * By default the *source* of the subject is expected to be an array
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @type   {Boolean}
	 */
	Iterator.setProperty('_iterSubjectIsArray', true);

	/**
	 * If no valid subject is given, this empty array is used
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @type   {Array}
	 */
	Iterator.setProperty('_iterSubject', []);

	/**
	 * See if there is a next item
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @return   {Boolean}
	 */
	Iterator.setMethod(function hasNext() {
		return this._iterNextIndex < this._iterSubject.length;
	});

	/**
	 * Return the next item
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.4
	 *
	 * @return   {Object}
	 */
	Iterator.setMethod(function next() {

		if (this._iterNextIndex < this._iterSubject.length) {

			if (this._iterSubjectIsArray) {
				return {
					index: this._iterNextIndex,
					value: this._iterSubject[this._iterNextIndex++],
					done: false
				};
			} else {
				return {
					index: this._iterNextIndex,
					key: this._iterSubject[this._iterNextIndex].key,
					value: this._iterSubject[this._iterNextIndex++].value,
					done: false
				};
			}
		}

		return {done: true};
	});

	/**
	 * Reset the iterator, go back to the beginning
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 */
	Iterator.setMethod(function reset() {
		this._iterNextIndex = 0;
	});

	Blast.defineClass('Iterator', Iterator);
};