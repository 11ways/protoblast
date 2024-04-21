const ADD_CHILD = Symbol('add_child'),
      IS_ROOT_NODE = Symbol('is_root'),
      IDENTIFIERS = new Map(),
      COUNTER = Symbol('counter'),
      ORDER = Symbol('order'),
      SITE = Symbol('site');

/**
 * The base Collaboration class
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 */
const Base = Fn.inherits(null, 'Develry.Collaboration', function Base() {});

/**
 * The identifier instance
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {number}   order
 * @param    {string}   site
 * @param    {number}   counter
 */
const Identifier = Fn.inherits('Develry.Collaboration.Base', function Identifier(order, site, counter) {
	this[ORDER] = order;
	this[SITE] = site;
	this[COUNTER] = counter;
});

/**
 * Get/create an identifier
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Identifier.setStatic(function get(order, site, counter) {

	let sites = IDENTIFIERS.get(site);

	if (!sites) {
		sites = new Map();
		IDENTIFIERS.set(site, sites);
	}

	let orders = sites.get(order);

	if (!orders) {
		orders = new Map();
		sites.set(order, orders);
	}

	let id = orders.get(counter);

	if (!id) {
		id = new Identifier(order, site, counter);
		orders.set(counter, id);
	}

	return id;
});

/**
 * unDry an identifier
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {Identifier}
 */
Identifier.setStatic(function unDry(value) {
	return Identifier.get(...value);
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {Object}
 */
Identifier.setMethod('toDry', function toDry() {
	return {
		value: [this[ORDER], this[SITE], this[COUNTER]]
	};
});

/**
 * Compare with another identifier
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Identifier}   other
 */
Identifier.setMethod(function compare(other) {

	if (this[ORDER] > other[ORDER]) {
		return 1;
	}

	if (this[ORDER] < other[ORDER]) {
		return -1;
	}

	if (this[SITE] > other[SITE]) {
		return 1;
	}

	if (this[SITE] < other[SITE]) {
		return -1;
	}

	if (this[COUNTER] > other[COUNTER]) {
		return 1;
	}

	if (this[COUNTER] < other[COUNTER]) {
		return -1;
	}

	return 0;
});

/**
 * Return a string representation of this identifier
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Identifier.setMethod(function toString() {
	return this[ORDER] + '-' + this[SITE] + '-' + this[COUNTER];
});

/**
 * Custom Janeway representation (left side)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {string}
 */
Identifier.setMethod(Symbol.for('janeway_arg_left'), function janewayClassIdentifier() {
	return 'ID';
});

/**
 * Custom Janeway representation (right side)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {string}
 */
Identifier.setMethod(Symbol.for('janeway_arg_right'), function janewayInstanceInfo() {
	return this.toString();
});

/**
 * The base Collaboration node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Develry.Collaboration.Node}   parent
 * @param    {string}                       id
 */
const Node = Fn.inherits('Develry.Collaboration.Base', function Node(parent, id) {
	this.parent = parent;
	this.id = id;
});

/**
 * Can this node have children?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {boolean}
 */
Node.setProperty('allow_children', true);

/**
 * The metadata of this node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {Map}
 */
Node.setProperty('meta', null);

/**
 * No node is designed as thé root node by default
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {boolean}
 */
Node.setProperty(IS_ROOT_NODE, false);

/**
 * Get the root node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Node.setProperty(function root() {

	if (this[IS_ROOT_NODE]) {
		return this;
	}

	if (this.parent) {
		return this.parent.root;
	}

	return this;
});

/**
 * Get the amount of child nodes
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {number}
 */
Node.setProperty(function child_count() {

	let count = this.children?.length;

	if (count > 2) {
		return count - 2;
	}

	return 0;
});

/**
 * Does this node have children?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {boolean}
 */
Node.setProperty(function has_children() {
	return this.child_count > 0;
});

/**
 * unDry a node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {Develry.Collaboration.Node}
 */
Node.setStatic(function unDry(value) {
	let instance = Object.create(this.prototype);
	Object.assign(instance, value);

	if (value.is_root) {
		instance.makeRootNode(value.session_id);
	}

	if (instance.children) {
		for (let child of instance.children) {
			child.parent = this;
		}
	}

	console.log('Undried:', value, 'to', instance)

	return instance;
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @return   {Object}
 */
Node.setMethod('toDry', function toDry() {

	let value = {
		id : this.id,
	};

	if (this.session_id) {
		value.session_id = this.session_id;
	}

	if (this.children_by_id) {
		value.is_root = true;
	}

	if (this.children) {
		value.children = this.children;
	}

	if (this.meta) {
		value.meta = this.meta;
	}

	return {value};
});

/**
 * Set some metadata
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Node.setMethod(function setMeta(key, value) {

	if (!this.meta) {
		this.meta = new Map();
	}

	this.meta.set(key, value);
});

/**
 * Get some metadata
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Node.setMethod(function getMeta(key) {

	if (!this.meta) {
		return;
	}

	return this.meta.get(key);
});

/**
 * Initialize the child array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Node.setMethod(function createChildNodes() {

	this.children = [];

	const START = new Node(this, Identifier.get(0, this.root.session_id, this.root.counter++));
	const END = new Node(this, Identifier.get(4096, this.root.session_id, this.root.counter++));

	this[ADD_CHILD](START);
	this[ADD_CHILD](END);
});

/**
 * Make this the root node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {string}   session_id
 */
Node.setMethod(function makeRootNode(session_id, add_edge_nodes = true) {

	this[IS_ROOT_NODE] = true;

	this.session_id = session_id;
	this.children_by_id = new Map();
	this.children = [];
	this.counter = 0;

	this.listeners = [];

	if (add_edge_nodes) {
		const START = new Node(this, Identifier.get(0, null, null));
		const END = new Node(this, Identifier.get(4096, null, null));

		this[ADD_CHILD](START);
		this[ADD_CHILD](END);
	}
});

/**
 * Get a node by its id
 * (Always starts in the root node)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Identifier}   id
 *
 * @return   {Develry.Collaboration.Node}
 */
Node.setMethod(function getById(id) {

	if (!id) {
		return this.root;
	}

	return this.root.children_by_id.get(id);
});

/**
 * Delete the node at the given id
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Identifier}   id
 */
Node.setMethod('delete', function _delete(id) {

	let node = this.getById(id);

	if (!node) {
		return;
	}

	this.applyDelete(node);

	this.root.emitOperation('delete', {
		node_id: id,
	});
});

/**
 * Apply a delete
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node_to_delete
 */
Node.setMethod(function applyDelete(node_to_delete) {

	let parent = node_to_delete.parent;

	let index = parent.children.indexOf(node_to_delete);

	if (index == -1) {
		return;
	}

	parent.children.splice(index, 1);
	this.root.children_by_id.delete(node_to_delete.id);
});

/**
 * Append a child
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node
 */
Node.setMethod(function appendChild(node) {
	return this.insertAtIndex(node, (this.children?.length || 1) - 1);
});

/**
 * Insert a child node using an index as an operation.
 * These should be "new" nodes without an ID
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node
 * @param    {number}                       index
 */
Node.setMethod(function insertAtIndex(node, index) {

	// Make sure the index is between the START & END node
	index = Math.max(0, Math.min(index, this.children.length - 2));

	console.log('Inserting', node, 'at', index, 'in', this);

	// Get the previous node
	let previous = this.children[index];

	// Get the next node
	let next = this.children[index + 1];

	console.log(' -- ', previous, next)

	return this._insertBetween(node, previous, next);
});

/**
 * Insert a child node between the 2 adjacent nodes
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node
 * @param    {Develry.Collaboration.Node}   left
 * @param    {Develry.Collaboration.Node}   right
 */
Node.setMethod(function _insertBetween(node, left, right) {

	// Generate a new identifier
	let id = Identifier.get((left.id[ORDER] + right.id[ORDER]) / 2, this.root.session_id, this.root.counter++);

	// Set the id
	node.id = id;

	this.applyInsert(node, right);

	console.log('Emitting', node, 'on', this)

	this.root.emitOperation('insert', {
		node : JSON.clone(node),
		parent_id: this.id,
	});

	return node;
});

/**
 * Apply an insert
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node
 * @param    {Develry.Collaboration.Node}   right
 */
Node.setMethod(function applyInsert(node, right) {

	if (right) {
		// Set the parent
		node.parent = this;

		// Get the index of the right node
		let index = this.children.indexOf(right);

		// Insert the node
		this.children.splice(index, 0, node);
		this.root.children_by_id.set(node.id, node);
	} else {
		this[ADD_CHILD](node);
	}

	if (this.afterChildInsert) {
		this.afterChildInsert(node);
	}
});

/**
 * Add a child node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node
 */
Node.setMethod(ADD_CHILD, function addChild(node) {

	node.parent = this;

	const index = this.leftMostChildIndex(node);

	console.log('Adding', node, 'to', this)

	this.children.splice(index, 0, node);
	this.root.children_by_id.set(node.id, node);

	return node;
});

/**
 * Look for the child on the left using a binary search
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Collaboration.Node}   node
 */
Node.setMethod(function leftMostChildIndex(node) {

	let left_boundary = 0,
	    right_boundary = this.children.length,
	    middle;

	while (left_boundary < right_boundary) {

		// Update the middle index each time
		middle = Math.floor((left_boundary + right_boundary) / 2);

		// If the middle id is smaller than the node id,
		// we need to look to the right
		if (this.children[middle].id.compare(node.id) < 0) {
			left_boundary = middle + 1;
		} else {
			// Otherwise we look to the left
			right_boundary = middle;
		}
	}

	return left_boundary;
});


/**
 * Emit an operation
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Node.setMethod(function emitOperation(type, data) {
	for (let listener of this.listeners) {
		listener(type, data);
	}
});

/**
 * Add an operation listener
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Node.setMethod(function onOperation(callback) {
	this.listeners.push(callback);
});

/**
 * Receive an operation
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {string}   type
 * @param    {Object}   data
 */
Node.setMethod(function receiveOperation(type, data) {

	if (type == 'insert') {
		let node = data.node,
		    parent_id = data.parent_id;

		let parent = this.getById(parent_id);

		if (!parent) {
			console.log('There is no', parent_id, 'for', type, data)
			throw new Error('Parent not found');
		}

		parent.applyInsert(node);
	}

	if (type == 'delete') {
		let node_id = data.node_id;

		let node = this.getById(node_id);

		if (!node) {
			console.log('There is no', node_id, 'for', type, data)
			throw new Error('Node not found');
		}

		this.applyDelete(node);
	}
});

/**
 * Example root node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {string}   session_id
 */
const RootNode = Fn.inherits('Develry.Collaboration.Node', function Root(session_id) {
	Root.super.call(this, null, null);
	this.makeRootNode(session_id);
});

/**
 * The root node should always be the root node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
RootNode.setProperty(function root() {
	return this;
});

/**
 * An example Container node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Develry.Collaboration.Node}   parent
 * @param    {string}                       id
 */
const ContainerNode = Fn.inherits('Develry.Collaboration.Node', function Container(parent, id) {
	Container.super.call(this, parent, id);
	this.createChildNodes();
});

/**
 * A text node
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.3
 * @version  0.9.3
 *
 * @param    {Develry.Collaboration.Node}   parent
 * @param    {string}                       id
 */
const TextNode = Fn.inherits('Develry.Collaboration.Node', function Text(parent, id) {
	TextNode.super.call(this, parent, id);
	this.text = '';
});
