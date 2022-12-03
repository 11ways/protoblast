const TYPE_WRAPPER = Symbol('type_wrapper'),
      TYPES        = Symbol('types');

/**
 * Representation of a single Signature type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
let SignatureTypeClass = class SignatureType {

	// Is this argument optional?
	// (Meaning the argument can be left undefined)
	is_optional = false;

	// Should null values be allowed?
	allow_null = false;

	// The actual type class (can be a string)
	type_class = null;

	// The optional parent in the class chain
	parent = null;

	// Does the type class need a check?
	needs_check = false;

	// Is this instance in a proxy?
	// (The proxy trap will make this return true)
	is_proxy = false;

	// An actual reference to the un-proxied instance
	self = null;

	// The string representation of this signature
	_signature_string = null;

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

		// This is needed in case it gets proxified
		this.self = this;

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
};

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
	 * @version  0.7.25
	 *
	 * @param    {SignatureType[]}   argument_types
	 * @param    {SignatureType}     return_type
	 * @param    {Function}          fnc
	 */
	constructor(argument_types, return_type, fnc) {
		this.argument_types = argument_types;
		this.return_type = return_type;
		this.fnc = fnc;
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
	let instance = new SignatureTypeClass(class_constructor, parent);
	return new Proxy(instance, traps);
}

/**
 * Get/create the typed wrapper method
 * which will delegate calls to the correct signature
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
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

			let result = signature.fnc.apply(this, args);

			if (signature.return_type && !matchesTypes(result, signature.return_type)) {
				throw new TypeError('Method "' + name + '" should return type `' + signature.return_type.signature_string + '`, but tried to return `' + valueToSignatureString(result) + '`');
			}

			return result;
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

		if (entry instanceof SignatureTypeClass) {
			result.push(entry.getUnproxied());
		} else {
			result.push(new SignatureTypeClass(entry));
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

		if (type instanceof SignatureTypeClass) {
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

for (let name in Blast.Classes) {
	let entry = Blast.Classes[name];

	if (typeof entry == 'function') {
		Blast.Types[name] = Blast.createType(Blast.Classes[name]);
	}
}