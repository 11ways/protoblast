const TYPE_WRAPPER = Symbol('type_wrapper'),
      TYPES        = Symbol('types');

/**
 * The class used to test argument types
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 */
class SignatureType {
	#is_optional = false;
	#allow_null = true;
	#type_class;

	constructor(class_constructor) {
		this.#type_class = class_constructor;
	}

	get is_optional() {
		return this.#is_optional;
	}

	get not_null() {
		return !this.#allow_null;
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

		if (is_optional === this.#is_optional) {
			return this;
		}

		let result = new SignatureType(this.#type_class);
		result.#allow_null = this.#allow_null;
		result.#is_optional = is_optional;

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
			return this.#allow_null;
		}

		if (this.#type_class == null) {
			return false;
		}

		if (arg.constructor == this.#type_class) {
			return true;
		}

		if (arg instanceof this.#type_class) {
			return true;
		}

		return false;
	}
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

				throw new Error('Failed to find a "' + name + '" method matching this signature');
			}

			let result = signature.fnc.apply(this, args);

			if (signature.return_types && !matchesTypes(result, signature.return_types)) {
				throw new Error('Expected return type was not found for method "' + name + '"');
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

	let signature = {
		argument_types,
		return_types,
		fnc,
	};

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
	return new SignatureType(constructor);
};

/**
 * Find the correct method
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
	    type,
	    i;
	
	for (i = 0; i < types.length; i++) {
		entry = types[i];

		if (entry instanceof SignatureType) {
			result.push(entry);
		} else {
			result.push(Blast.createType(entry));
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
 * @return   {Object}
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

		if (type instanceof SignatureType) {
			test = type.test(arg);
			
			if (test) {
				result = test;
				break;
			}
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

for (let name in Blast.Classes) {
	let entry = Blast.Classes[name];

	if (typeof entry == 'function') {
		Blast.Types[name] = Blast.createType(Blast.Classes[name]);
	}
}