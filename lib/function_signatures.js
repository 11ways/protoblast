const TYPE_WRAPPER = Symbol('type_wrapper'),
      TYPES        = Symbol('types');

/**
 * The base SignatureType
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.8.1
 */
class SignatureType {

	// Is this argument optional?
	// (Meaning the argument can be left undefined)
	is_optional = false;

	// Should null values be allowed?
	allow_null = false;

	// Is this instance in a proxy?
	// (The proxy trap will make this return true)
	is_proxy = false;

	// An actual reference to the un-proxied instance
	self = null;

	// The string representation of this signature
	_signature_string = null;

	// This type does not alter arguments
	alters_arguments = false;

	/**
	 * Initialize this instance
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 */
	constructor() {
		// This is needed in case it gets proxified
		this.self = this;
	}

	/**
	 * Is this argument optional?
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @type     {Boolean}
	 */
	 get is_optional() {
		return this.is_optional;
	}

	/**
	 * Should this argument not be null?
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @type     {Boolean}
	 */
	get not_null() {
		return !this.allow_null;
	}

	/**
	 * Return a nullable version of this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @return   {SignatureType}
	 */
	nullable() {
		if (this.allow_null) {
			return this;
		}

		let result = this.clone();
		result.allow_null = true;

		return result;
	}

	/**
	 * Return an optional version of this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {Boolean}   is_optional
	 *
	 * @return   {Boolean}
	 */
	optional(is_optional = true) {

		if (is_optional === this.is_optional) {
			return this;
		}

		let result = this.clone();
		result.is_optional = is_optional;

		return result;
	}

	/**
	 * Expect an array of values of the current type.
	 * If it isn't an array, wrap it in one
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 *
	 * @return   {ArraySignatureType}
	 */
	array() {
		return new ArraySignatureType(this);
	}

	/**
	 * Return a combined SignatureType
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {SignatureType}   other_type
	 *
	 * @return   {GroupedSignatureType}
	 */
	or(other_type) {
		return new GroupedSignatureType(this, other_type);
	}

	/**
	 * Return a combined SignatureType
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {SignatureType}   other_type
	 *
	 * @return   {GroupedSignatureType}
	 */
	and(other_type) {
		let result = this.or(other_type);
		result.is_and_group = true;
		return result;
	}

	/**
	 * Get an un-proxied version of this instance
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @return   {SignatureType}
	 */
	getUnproxied() {
		return this.self;
	}

	/**
	 * Clone this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @return   {SignatureType}
	 */
	clone() {
		let result = new SignatureType();
		result.is_optional = this.is_optional;
		result.allow_null = this.allow_null;
		return result;
	}

	/**
	 * Test the given value against this type.
	 * The base class is used as the "Any" type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {mixed}   arg
	 *
	 * @return   {Boolean}
	 */
	test(arg) {

		if (arg == null) {
			if (arg === undefined) {
				return this.is_optional;
			}

			return this.allow_null;
		}

		return true;
	}
}

/**
 * Representation of a single Signature type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
class SingleSignatureType extends SignatureType {

	// The actual type class (can be a string)
	type_class = null;

	// The optional parent in the class chain
	parent = null;

	// Does the type class need a check?
	needs_check = false;

	/**
	 * Initialize this instance
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {Function|String}   class_constructor
	 * @param    {SignatureType}     parent
	 */
	constructor(class_constructor, parent) {
		super();

		if (typeof class_constructor == 'object') {
			class_constructor = class_constructor.type_class;
		}

		if (typeof class_constructor == 'string') {
			this.needs_check = true;
		}

		if (this.needs_check && !parent) {
			throw new Error('Failed to get a parent!!')
		}

		this.type_class = class_constructor;
		this.parent = parent;
	}

	/**
	 * Get the signature string
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @type     {String}
	 */
	get signature_string() {

		if (this._signature_string == null) {
			if (typeof this.type_class == 'string') {
				this._signature_string = this.type_class;
			} else {
				this._signature_string = this.type_class.name;
			}
		}

		return this._signature_string;
	}

	/**
	 * Clone this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @return   {SignatureType}
	 */
	clone() {
		let result = createSignatureTypeProxy(this.type_class, this.parent);
		result.allow_null = this.allow_null;
		result.is_optional = this.is_optional;
		return result;
	}

	/**
	 * Test the given value against this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {mixed}   arg
	 *
	 * @return   {Boolean}
	 */
	test(arg) {

		if (arg == null) {
			if (arg === undefined) {
				return this.is_optional;
			}

			return this.allow_null;
		}

		if (this.type_class == null) {
			return false;
		}

		// Make sure the class is actually a constructor
		if (this.needs_check) {
			if (typeof this.type_class == 'string') {
				let from_parent = this.parent[this.type_class];

				if (from_parent && typeof from_parent != 'string') {
					if (typeof from_parent == 'object') {
						from_parent = from_parent.type_class;
					}

					if (typeof from_parent == 'function') {
						this.type_class = from_parent;
						this.needs_check = false;
					}
				}
			} else {
				this.needs_check = false;
			}
		}

		if (arg.constructor == this.type_class) {
			return true;
		}

		if (typeof this.type_class != 'function') {
			throw new TypeError('The type "' + this.type_class + '" is not yet ready');
		}

		if (arg instanceof this.type_class) {
			return true;
		}

		return false;
	}
};

/**
 * The grouped signature type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
class GroupedSignatureType extends SignatureType {

	needs_unproxy_child_test = true;
	is_and_group = false;

	constructor(...types) {
		super();
		this.types = types;
	}

	/**
	 * Test the given value against this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @param    {mixed}   arg
	 *
	 * @return   {Boolean}
	 */
	test(arg) {

		let result,
		    i;
		
		for (i = 0; i < this.types.length; i++) {
			result = this.types[i].test(arg);

			if (result) {
				if (!this.is_and_group) {
					return true;
				}
			} else if (this.is_and_group) {
				break;
			}
		}

		return result;
	}

	/**
	 * Clone this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @return   {SignatureType}
	 */
	clone() {
		let result = GroupedSignatureType(this.types);
		result.needs_unproxy_child_test = this.needs_unproxy_child_test;
		return new Proxy(result, traps);
	}

	/**
	 * Get an un-proxied version of this instance
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.7.25
	 *
	 * @return   {SignatureType}
	 */
	getUnproxied() {

		if (!this.needs_unproxy_child_test) {
			return this.self;
		}

		let result = new GroupedSignatureType(...conformTypes(this.types));
		result.needs_unproxy_child_test = false;
		result.is_and_group = this.is_and_group;

		return result;
	}
}

/**
 * Allow many of a certain type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.1
 * @version  0.8.1
 */
class ArraySignatureType extends SignatureType {

	// This type can alter arguments
	alters_arguments = true;

	constructor(parent_type) {
		super();
		this.type = parent_type;
	}

	/**
	 * Test the given value against this type
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 *
	 * @param    {mixed}   arg
	 *
	 * @return   {Boolean}
	 */
	test(arg) {

		let values = this.alterArgument(arg),
		    length = values.length,
		    i;

		for (i = 0; i < length; i++) {
			arg = values[i];

			if (!this.type.test(arg)) {
				return false;
			}
		}

		if (length == 0) {
			return false;
		}

		return true;
	}

	/**
	 * Adjust the argument
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 *
	 * @param    {*}   arg
	 *
	 * @return   {Array}
	 */
	alterArgument(arg) {

		if (!Array.isArray(arg)) {
			arg = [arg];
		}

		return arg;
	}
}

/**
 * A Method Signature
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
class MethodSignature {

	/**
	 * Initialize this instance
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.7.25
	 * @version  0.8.1
	 *
	 * @param    {SignatureType[]}   argument_types
	 * @param    {SignatureType}     return_type
	 * @param    {Function}          fnc
	 */
	constructor(argument_types, return_type, fnc) {
		this.argument_types = argument_types;
		this.return_type = return_type;
		this.fnc = fnc;
		this.name = fnc.name;
		this.alters_arguments = false;

		for (let type of argument_types) {
			if (type.alters_arguments) {
				this.alters_arguments = true;
			}
		}
	}

	/**
	 * Actually run this method
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 *
	 * @param    {*}      instance   The instance context to run the method on
	 * @param    {Array}  args       The arguments to pass to the method
	 *
	 * @return   {*}
	 */
	execute(instance, args) {

		if (this.alters_arguments) {
			this.alterArguments(args);
		}

		let result = this.fnc.apply(instance, args);

		if (this.return_type && !matchesTypes(result, this.return_type)) {
			throw new TypeError('Method "' + this.name + '" should return type `' + this.return_type.signature_string + '`, but tried to return `' + valueToSignatureString(result) + '`');
		}

		return result;
	}

	/**
	 * Cast arguments in-place
	 *
	 * @author   Jelle De Loecker   <jelle@elevenways.be>
	 * @since    0.8.1
	 * @version  0.8.1
	 *
	 * @param    {Array}  args       The arguments to check
	 */
	alterArguments(args) {

		let type,
		    i;

		for (i = 0; i < args.length; i++) {
			type = this.argument_types[i];

			if (type.alters_arguments) {
				args[i] = type.alterArgument(args[i]);
			}
		}
	}
}

/**
 * Proxy traps for the SignatureType class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
const traps = {
	get: (context, property) => {

		// Always return true for the `is_proxy` property
		if (property == 'is_proxy') {
			return true;
		}

		// See if the property has a value on the actual instance
		let result = context[property];

		// Return the value if it's defined, or the property is a symbol
		if (result !== undefined || typeof property == 'symbol') {
			return result;
		}

		// If the property is a class-like name, return a new SignatureType proxy
		if (property[0] == property[0].toUpperCase()) {
			let child = createSignatureTypeProxy(property, context);
			context[property] = child;
			return child;
		}
	}
};

/**
 * Create a new SignatureType proxy
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
function createSignatureTypeProxy(class_constructor, parent) {
	let instance = new SingleSignatureType(class_constructor, parent);
	return new Proxy(instance, traps);
}

/**
 * Get/create the typed wrapper method
 * which will delegate calls to the correct signature
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.8.1
 *
 * @param    {Object}   context
 * @param    {String}   name
 */
Blast.getSignatureWrapperMethod = function getSignatureWrapperMethod(context, name) {

	if (!context) {
		throw new Error('Invalid context passed to getSignatureWrapperMethod');
	}

	let descriptor = Object.getOwnPropertyDescriptor(context, name),
	    current_method = descriptor?.value,
	    wrapper_method,
	    super_method;

	if (typeof current_method != 'function') {
		if (typeof context[name] == 'function') {
			super_method = context[name];
		}
	} else {
		if (current_method[TYPE_WRAPPER]) {
			wrapper_method = current_method;
		}
	}

	if (!wrapper_method) {
		let types_by_length = {
			lengths: [],
		};

		wrapper_method = Fn.create(name, function _doCorrectTypeMethod(...args) {

			let signature = findCorrectSignature(types_by_length, args);

			if (!signature) {
				if (wrapper_method.super) {
					return wrapper_method.super.apply(this, args);
				}

				if (current_method) {
					return current_method.apply(this, args);
				}

				throw new TypeError('Failed to find "' + name + '" method matching signature `' + argsToSignatureString(args) + '`');
			}

			return signature.execute(this, args);
		});

		wrapper_method[TYPES] = types_by_length;
		wrapper_method[TYPE_WRAPPER] = true;

		if (super_method) {
			Blast.defineValue(wrapper_method, 'super', super_method);
		}

		Blast.defineValue(context, name, wrapper_method);
	}

	return wrapper_method;
};

/**
 * Add a typed method
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Object}   context
 * @param    {Array}    argument_types
 * @param    {String}   name
 * @param    {Function} fnc
 */
Blast.addMethodSignature = function addMethodSignature(context, argument_types, return_types, name, fnc) {

	if (!Array.isArray(return_types)) {
		fnc = name;
		name = return_types;
		return_types = null;
	}

	if (typeof name == 'function') {
		fnc = name;
		name = fnc.name;
	}

	argument_types = conformTypes(argument_types);
	return_types = conformTypes(return_types);

	if (return_types) {
		return_types = return_types[0];
	}

	let length = argument_types.length,
	    wrapper = Blast.getSignatureWrapperMethod(context, name),
	    types_by_length = wrapper[TYPES],
	    signatures = types_by_length[length];
	
	if (!signatures) {
		signatures = [];
		types_by_length[length] = signatures;
		types_by_length.lengths.push(length);
	} else if (findDuplicateSignature(signatures, argument_types)) {
		throw new Error('Tried to create a duplicate signature "' + name + '"');
	}

	let signature = new MethodSignature(argument_types, return_types, fnc);

	signatures.push(signature);

	return wrapper;
};


/**
 * Create a type instance out of a class constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Function}   constructor
 */
Blast.createType = function createType(constructor) {
	return createSignatureTypeProxy(constructor);
};

/**
 * Make sure the given types are (non-proxied)
 * instances of the SignatureType class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Array}   types
 *
 * @return   {SignatureType[]}
 */
function conformTypes(types) {

	if (!types || !types.length) {
		return;
	}

	let result = [],
	    entry,
	    i;
	
	for (i = 0; i < types.length; i++) {
		entry = types[i];

		if (entry instanceof SignatureType) {
			result.push(entry.getUnproxied());
		} else {
			result.push(new SingleSignatureType(entry));
		}
	}

	return result;
}

/**
 * Find the correct method for the given arguments
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Object}   types_by_length
 * @param    {Array}    args
 *
 * @return   {Object}
 */
function findCorrectSignature(types_by_length, args) {

	let length = args.length,
	    signatures = types_by_length[length],
		result;

	if (signatures) {
		result = testSignatures(signatures, args, length);
	}

	if (!result) {

		let test_length,
		    i;
		
		for (i = 0; i < types_by_length.lengths.length; i++) {
			test_length = types_by_length.lengths[i];

			if (test_length > length) {
				signatures = types_by_length[test_length];

				if (signatures) {
					result = testSignatures(signatures, args, length);

					if (result) {
						break;
					}
				}
			}
		}
	}

	return result;
}

/**
 * Find the correct signature for the given arguments
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Array}   signatures
 * @param    {Array}   args
 * @param    {Number}  length
 *
 * @return   {MethodSignature|Boolean}
 */
function testSignatures(signatures, args, length) {

	if (!signatures) {
		return false;
	}

	let signature,
	    differs,
	    type,
		arg,
	    i,
		j;

	for (i = 0; i < signatures.length; i++) {
		signature = signatures[i];
		differs = false;

		for (j = 0; j < signature.argument_types.length; j++) {
			type = signature.argument_types[j];

			if (j >= length && !type.is_optional) {
				differs = true;
				break;
			}

			arg = args[j];

			if (type.test(arg)) {
				continue;
			}

			differs = true;
			break;
		}

		if (!differs) {
			return signature;
		}
	}

	return false;
}

/**
 * Does the given value match any of the given types?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
function matchesTypes(arg, types) {

	let result = false;

	if (arg == null) {
		result = true;
	}

	let test,
	    type,
	    i;

	for (i = 0; i < types.length; i++) {
		type = types[i];

		if (type instanceof SingleSignatureType) {
			test = type.test(arg);
			
			if (test) {
				result = test;
			}

			break;
		}

		if (arg.constructor == type) {
			result = true;
			break;
		}
	
		if (arg instanceof type) {
			result = true;
			break;
		}
	}

	return result;
}

/**
 * Get a matching type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 * 
 * @param    {MethodSignature[]}   signatures
 * @param    {SignatureType[]}     method_types
 */
function findDuplicateSignature(signatures, method_types) {

	let signature,
	    differs,
	    i,
		j;

	for (i = 0; i < signatures.length; i++) {
		signature = signatures[i];
		differs = false;

		for (j = 0; j < signature.argument_types.length; j++) {
			if (signature.argument_types[j] != method_types[j]) {
				differs = true;
				break;
			}
		}

		if (!differs) {
			return true;
		}
	}

	return false;
}

/**
 * Return the signature string of the given arguments
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 * 
 * @param    {Array}   args
 */
function argsToSignatureString(args) {

	let result = '';

	if (args && args.length) {
		let arg;

		for (arg of args) {
			if (result) result += ',';
			result += valueToSignatureString(arg);
		}
	} else {
		result = 'void';
	}

	return result;
}

/**
 * Return the signature string of a single value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 * 
 * @param    {*}   value
 */
function valueToSignatureString(value) {
	let result;

	if (value === undefined) {
		result = 'undefined';
	} else if (value == null) {
		result = 'null';
	} else if (value.constructor) {
		result = value.constructor.name;
	} else if (typeof value == 'object') {
		result = 'object';
	} else {
		result = '?';
	}

	return result;
}

Blast.Types = createSignatureTypeProxy();
Blast.Types.Any = new SignatureType();

for (let name in Blast.Classes) {
	let entry = Blast.Classes[name];

	if (typeof entry == 'function') {
		Blast.Types[name] = Blast.createType(Blast.Classes[name]);
	}
}