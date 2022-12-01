const TYPE_WRAPPER = Symbol('type_wrapper'),
      TYPES        = Symbol('types');

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
		let types_by_length = {};

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

	let length = argument_types.length,
	    wrapper = Blast.getSignatureWrapperMethod(context, name),
	    types_by_length = wrapper[TYPES],
	    signatures = types_by_length[length];
	
	if (!signatures) {
		signatures = [];
		types_by_length[length] = signatures;
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
 * Find the correct method
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @return   {Object}
 */
function findCorrectSignature(types_by_length, args) {

	let signatures = types_by_length[args.length];

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
			arg = args[j];

			// Allow undefined values.
			// Though this will have strange issues when multiple signatures have the same length
			if (arg == null) {
				continue;
			}

			type = signature.argument_types[j];

			if (arg.constructor == type) {
				continue;
			}

			if (arg instanceof type) {
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

	if (arg == null) {
		return true;
	}

	let type,
	    i;

	for (i = 0; i < types.length; i++) {
		type = types[i];

		if (arg.constructor == type) {
			return true;
		}
	
		if (arg instanceof type) {
			return true;
		}
	}

	return false;
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