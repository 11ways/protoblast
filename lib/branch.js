let PARENT = Symbol('parent'),
    CHILDREN = Symbol('children');

/**
 * The Branch class
 *
 * @constructor
 * @class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 */
let Branch = Fn.inherits(null, 'Branch', function Branch() {
	this[PARENT] = null;
	this[CHILDREN] = [];
});

// Expose the symbols
Blast.Classes.Branch.PARENT = PARENT;
Blast.Classes.Branch.CHILDREN = CHILDREN;

/**
 * The parent branch
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Branch}
 */
Branch.setProperty(function parent() {
	return this[PARENT];
}, function setParent(parent) {
	return this[PARENT] = parent;
});

/**
 * Return the root branch
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Branch}
 */
Branch.setProperty(function root() {

	let result = this;

	while (result.parent) {
		result = result.parent;
	}

	return result;
});

/**
 * Get the previous sibling node if it exists
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Branch}
 */
Branch.setProperty(function previousSibling() {
	return this._getSibling(-1);
});

/**
 * Get the next sibling node if it exists
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Branch}
 */
Branch.setProperty(function nextSibling() {
	return this._getSibling(1);
});

/**
 * Get an array of children
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Array}
 */
Branch.setProperty(function children() {
	return this[CHILDREN].slice(0);
});

/**
 * Returns `true` if this branch has children. Otherwise it returns `false`.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Boolean}
 */
Branch.setProperty(function hasChildren() {

	if (this[CHILDREN] && this[CHILDREN][0] != null) {
		return true;
	}

	return false;
});

/**
 * Return the first child node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Branch|Null}
 */
Branch.setProperty(function firstChild() {
	return this[CHILDREN][0] || null;
});

/**
 * Return the last child node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @type     {Branch|Null}
 */
Branch.setProperty(function lastChild() {
	return this[CHILDREN][this[CHILDREN].length - 1] || null;
});

/**
 * Get a sibling
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Number}   direction
 *
 * @return   {Branch}
 */
Branch.setMethod(function _getSibling(direction) {

	if (!this[PARENT] || !this[PARENT][CHILDREN]) {
		return null;
	}

	let i = this[PARENT][CHILDREN].indexOf(this);

	return this[PARENT][CHILDREN][i + direction] || null;
});

/**
 * Remove this node
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 */
Branch.setMethod(function remove() {

	if (!this[PARENT] || !this[PARENT][CHILDREN]) {
		return;
	}

	let i = this[PARENT][CHILDREN].indexOf(this);

	if (i > -1) {
		this[PARENT][CHILDREN].splice(i, 1);
	}

	this[PARENT] = null;
});

/**
 * Insert a branch before another branch
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Branch}   new_branch
 * @param    {Branch}   reference_branch
 */
Branch.setMethod(function insertBefore(new_branch, reference_branch) {
	return this._insert(0, new_branch, reference_branch);
});

/**
 * Insert a branch after another branch
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Branch}   new_branch
 * @param    {Branch}   reference_branch
 */
Branch.setMethod(function insertAfter(new_branch, reference_branch) {
	return this._insert(1, new_branch, reference_branch);
});

/**
 * Insert a branch
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Number}   direction
 * @param    {Branch}   new_branch
 * @param    {Branch}   reference_branch
 */
Branch.setMethod(function _insert(direction, new_branch, reference_branch) {

	let children = this[CHILDREN],
	    length = children.length,
	    moved = false;

	if (length > 0) {

		let i;

		for (i = 0; i < length; i++) {
			if (children[i] == reference_branch) {
				// If direction is 0, it gets added before it, otherwise after it
				children.splice(i + direction, 0, new_branch);
				moved = true;
				break;
			}
		}
	}

	// If it succeeded we should become the new parent
	if (moved) {

		if (new_branch[PARENT]) {

			// Get the old parent's children
			children = new_branch[PARENT][CHILDREN];

			let index = children.indexOf(new_branch);

			if (index > -1) {
				children.splice(index, 1);
			}
		}

		new_branch[PARENT] = this;
	} else {
		throw new Error('Unable to insert branch, reference branch was not found');
	}
});

/**
 * Prepend a branch
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Branch}   new_branch
 */
Branch.setMethod(function prepend(new_branch) {
	return this._pend(0, new_branch);
});

/**
 * Append a branch
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Branch}   new_branch
 */
Branch.setMethod(function append(new_branch) {
	return this._pend(1, new_branch);
});

/**
 * Pre/Append a branch
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Number}   direction
 * @param    {Branch}   new_branch
 */
Branch.setMethod(function _pend(direction, new_branch) {

	if (new_branch[PARENT]) {
		new_branch.remove();
	}

	if (direction == 0) {
		this[CHILDREN].unshift(new_branch);
	} else {
		this[CHILDREN].push(new_branch);
	}

	new_branch[PARENT] = this;

	return new_branch;
});

/**
 * The Data Branch class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 */
let Data = Fn.inherits('Branch.Branch', function Data(data) {
	Data.super.call(this);

	// The actual data
	this.data = data;
});

/**
 * Look for the given data
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {*}   data
 *
 * @return   {Branch}
 */
Data.setMethod(function seen(data) {

	let result = false,
	    child,
	    i;

	for (i = 0; i < this[CHILDREN].length; i++) {
		child = this[CHILDREN][i];

		if (child == data || child.data == data) {
			result = child;
			break;
		}

		result = child.seen(data);

		if (result) {
			break;
		}
	}

	return result;
});

/**
 * Is this the child of the given data?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {*}   data
 *
 * @return   {Boolean}
 */
Data.setMethod(function isChildOf(data) {

	let closest = this.closest(data);

	if (!closest || closest == this) {
		return false;
	}

	return true;
});

/**
 * Get the closest ancestor (or itself)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {*}   data
 *
 * @return   {Branch.Data}
 */
Data.setMethod(function closest(data) {

	let result = false,
	    current = this;

	while (current) {

		if (current == data || current.data == data) {
			result = current;
			break;
		}

		current = current.parent;
	}

	return result;
});

/**
 * Add data
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.8
 * @version  0.7.8
 *
 * @param    {Number}   direction
 * @param    {*}        data
 *
 * @return   {Branch}
 */
Data.setMethod(function _pend(direction, data) {

	if (!data || !(data instanceof Data)) {
		data = new Data(data);
	}

	return _pend.super.call(this, direction, data);
});