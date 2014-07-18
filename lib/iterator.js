module.exports = function BlastDeck(Blast, Collection) {

	/**
	 * The Iterator class
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 */
	var Iterator = function Iterator(subject) {

		// What is the subject type?
		this.subjectArray = Array.isArray(subject);

		// Store the subject
		if (this.subjectArray) {
			this.subject = subject;
		} else {
			this.subject = Collection.Object.dissect(subject);
		}

		// Set the initial index
		this.nextIndex = 0;

	}

	/**
	 * See if there is a next item
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Boolean}
	 */
	Blast.defineValue(Iterator.prototype, 'hasNext', function hasNext() {
		return this.nextIndex < this.subject.length;
	});

	/**
	 * See if there is a next item
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.2
	 * @version  0.1.2
	 *
	 * @return   {Object}
	 */
	Blast.defineValue(Iterator.prototype, 'next', function next() {

		if (this.nextIndex < this.subject.length) {

			if (this.subjectArray) {
				return {
					index: this.nextIndex,
					value: this.subject[this.nextIndex++],
					done: false
				};
			} else {
				return {
					index: this.nextIndex,
					key: this.subject[this.nextIndex].key,
					value: this.subject[this.nextIndex++].value,
					done: false
				};
			}
		}

		return {done: true};
	});

	Blast.defineClass('Iterator', Iterator);
};