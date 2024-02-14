const finished_constitutors = new WeakMap(),
      waiting_children = new WeakMap(),
      CONSTITUTED_STATE = new WeakMap(),
      CONSTITUTED_LISTENERS = Symbol('constituted_listener'),
      POST_INHERIT_STATE = new WeakMap(),
      POST_INHERIT_LISTENERS = Symbol('post_inherit_listener'),
      finished_post_inherits = new WeakMap(),
      CLASS_PATH_CACHE = new Map(),
      proto_defs = [];

/**
 * Add a static method/property to a class and optionally its chain.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @param    {Function}   target
 * @param    {String}     key
 * @param    {Object}     descriptor
 */
const addDescriptorToStatic = function addDescriptorToStatic(target, key, descriptor, inherit) {

	if (inherit == null) {
		inherit = true;
	}

	if (inherit) {
		addToStaticChain(target, key, descriptor);
	}

	Object.defineProperty(target, key, descriptor);
};

/**
 * Add a static method/property to the staticChain.
 * This way, inherited classes can inherit static functions, too
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.9
 *
 * @param    {Function}   newConstructor
 * @param    {String}     key
 * @param    {Object}     descriptor
 */
const addToStaticChain = function addToStaticChain(newConstructor, key, descriptor) {

	var chain;

	if (newConstructor.staticChain) {
		chain = newConstructor.staticChain;
	} else {
		chain = {};
		Blast.defineValue(newConstructor, 'staticChain', chain);
	}

	// Also add this static property to already existing children
	addToChildren(newConstructor, key, descriptor);

	chain[key] = descriptor;
};

/**
 * Add a static method/property to the children
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.1.9
 * @version  0.7.24
 *
 * @param    {Function}   parent
 * @param    {String}     key
 * @param    {Object}     descriptor
 */
const addToChildren = function addToChildren(parent, key, descriptor) {

	var target,
	    i;

	if (!parent.children || !parent.children.length) {
		return;
	}

	for (i = 0; i < parent.children.length; i++) {
		target = parent.children[i];

		if (target.hasOwnProperty(key)) {
			continue;
		}

		Object.defineProperty(target, key, descriptor);
		addToStaticChain(target, key, descriptor);
	}
};

/**
 * Do multiple inheritance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.6
 * @version  0.3.6
 *
 * @param    {Function}   new_constructor
 * @param    {Function}   parent_constructor
 * @param    {Object}     proto
 */
const doMultipleInheritance = function doMultipleInheritance(new_constructor, parent_constructor, proto) {

	var more;

	if (proto == null) {
		proto = Object.create(new_constructor.prototype);
	}

	// See if this goes even deeper FIRST
	// (older properties could get overwritten)
	more = Object.getPrototypeOf(parent_constructor.prototype);

	if (more.constructor !== Object) {
		// Recurse with the earlier constructor
		doMultipleInheritance(new_constructor, more.constructor, proto);
	}

	// Inject the enumerable and non-enumerable properties of the parent
	Collection.Object.inject(proto, parent_constructor.prototype);

	return proto;
};

/**
 * Get a namespace object, or create it if it doesn't exist
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.7.25
 *
 * @param    {String}   namespace
 *
 * @return   {Object}
 */
const getNamespace = function getNamespace(namespace) {

	var file_options,
	    result,
	    name,
	    data;

	if (Array.isArray(namespace)) {
		namespace = namespace.join('.');
	}

	// Try getting the namespace
	if (!namespace || namespace == '@') {
		return Blast.Classes;
	} else {
		result = Obj.path(Blast.Classes, namespace);
	}

	if (Blast.isNode && namespace && (file_options = Blast[Blast.ACTIVE_FILE])) {
		if (!file_options.used_namespaces) {
			file_options.used_namespaces = [];
		}

		if (file_options.used_namespaces.indexOf(namespace) == -1) {
			file_options.used_namespaces.push(namespace);
		}
	}

	if (result == null) {
		name = namespace.split('.');
		name = name[name.length - 1];

		result = Fn.create(name, function() {
			var instance;

			if (!result[name]) {
				throw new Error('Could not find class "' + name + '" in namespace "' + namespace + '"');
			}

			// Create the object instance
			instance = Object.create(result[name].prototype);

			// Apply the constructor
			result[name].apply(instance, arguments);

			return instance;
		});

		// Add a getter to get the main class of this namespace
		Blast.defineGet(result, 'main_class', function getMainClass() {
			return result[name];
		});

		// Remember this is a namespace
		result.is_namespace = true;

		// Add an instanceof trap
		Object.defineProperty(result, Symbol.hasInstance, {value: function hasInstance(instance) {
			return !!result[name] && instance instanceof result[name];
		}});

		if (!result.setStatic) {
			Blast.defineValue(result, 'setStatic', Fn.prototype.setStatic);
		}

		// Create the namespace object
		Obj.setPath(Blast.Classes, namespace, result);

		// Create the type
		Obj.setPath(Blast.Types, namespace, Blast.createType(result));

		// Emit the creation of this namespace
		if (Blast.emit) {
			data = {
				type       : 'namespace',
				namespace  : namespace
			};

			Blast.emit(data, namespace);
		}
	}

	return result;
};

Blast.defineStatic('Function', 'getNamespace', getNamespace);

/**
 * Get a class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @param    {String}   path
 *
 * @return   {Function}
 */
const getClass = function getClass(path) {

	var pieces = path.split('.'),
	    result;

	result = Obj.path(Blast.Classes, path);

	if (typeof result == 'function') {
		if (result.is_namespace) {
			result = result[result.name];
		}

		return result;
	}

	result = Obj.path(Blast.Globals, path);

	if (typeof result == 'function') {
		if (result.is_namespace) {
			result = result[result.name];
		}

		return result;
	}
};

/**
 * Get path information
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @param    {String}   path
 *
 * @return   {Object}
 */
const getClassPathInfo = function getClassPathInfo(path) {

	var result = {},
	    namespace,
	    name,
	    temp;

	// See what's there
	temp = Obj.path(Blast.Classes, path);

	// Is there nothing at the current path?
	if (!temp) {
		if (path.indexOf('.') > -1) {

			// Split the path
			temp = path.split('.');

			// The last part is actually the name of the class
			name = temp.pop();

			// The namespace is what's left over
			namespace = temp.join('.');
		} else {
			// There is no real "path", it's just the name
			name = path;

			// So there is no namespace
			namespace = '';
		}
	} else {
		// Is the found function a namespace
		if (temp && temp.is_namespace) {

			// The name of the class is the same as the namespace
			name = temp.name;

			// The namespace path is the entire path
			namespace = path;

			// The full path actually needs the name again
			path = path + '.' + name;
		} else if (temp) {
			// We found a class function

			// The namespace should be on this class
			namespace = temp.namespace || '';

			// The name is the name of the found class
			name = temp.name;
		} else {
			namespace = '';
			name = path;
		}
	}

	result.name = name;
	result.namespace = namespace;
	result.path = path;
	result.class = Obj.path(Blast.Classes, path);
	result.namespace_wrapper = Obj.path(Blast.Classes, namespace);

	if (!namespace && !result.class && typeof Blast.Globals[name] == 'function') {
		result.class = Blast.Globals[name];
	}

	if (!result.namespace_wrapper) {
		result.namespace_wrapper = getNamespace(namespace);
	}

	return result;
};

Blast.getClassPathInfo = getClassPathInfo;

/**
 * Parse a class path and return the results as an array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string|function}   path
 *
 * @return   {string[]}
 */
Blast.parseClassPath = function parseClassPath(path) {

	if (typeof path == 'function') {
		path = path.namespace ? path.namespace + '.' + path.name : path.name;
	}

	if (path.length > 1024) {
		throw new Error('Path is too long');
	}

	let result = CLASS_PATH_CACHE.get(path);

	if (result) {
		return result;
	}

	let pieces = path.split('.'),
	    lower,
	    piece;

	result = [];

	for (piece of pieces) {
		lower = piece.toLowerCase();

		// The path consists of underscored type names,
		// like `my_namespace.my_class`
		if (piece == lower) {
			piece = piece.classify();
		} else if (piece.includes('_')) {
			// There is an underscore in the path,
			// which means it's also a path separator,
			// but only if it is not lowercase
			result.push(...piece.split('_'));
			continue;
		}

		result.push(piece);
	}

	CLASS_PATH_CACHE.set(path, result);

	return result;
};

/**
 * Do the given task for a given constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.6
 * @version  0.9.0
 *
 * @param    {Function}   constructor
 * @param    {Function}   task
 * @param    {WeakMap}    finished_map
 */
const doConstructorTask = function doConstructorTask(constructor, task, finished_map) {

	let finished = finished_map.get(constructor);

	if (!finished) {
		finished = [];
		finished_map.set(constructor, finished);
	}

	if (finished.indexOf(task) == -1) {
		task.call(constructor);
		finished.push(task);
	}
};

/**
 * Define a static function method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   fnc
 */
const defStat = function defStat(fnc) {
	return Blast.defineStatic('Function', fnc);
};

/**
 * Basic unsafe method to get argument names
 * (Unsafe because it does not check for default values or comments)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   fnc
 *
 * @return   {Array}
 */
const getArgNames = function getArgNames(fnc) {
	// Get the source code
	let source = fnc + '';

	// Only keep the text inside the argument parens
	source = source.slice(source.indexOf('(') + 1, source.indexOf(')'));

	// Strip all the whitespace
	source = source.replace(/\s+/g, '');

	return source.split(',');
};

/**
 * Define a static function method and also add it to the prototype
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   fnc
 */
const defClassMethod = function defClassMethod(fnc, target) {

	var protoMethod,
	    args = getArgNames(fnc).join(', ');

	// Define on the Function class first
	defStat(fnc);

	if (!target) {
		target = 'this';
	}

	eval('protoMethod = function ' + fnc.name + '(' + args + ') {return fnc(' + target + ', ' + args +');}');

	proto_defs.push(protoMethod);

	Blast.definePrototype('Function', protoMethod);
};

/**
 * Define a static function method and also add it to the prototype
 * This will use the prototype as the target
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Function}   fnc
 */
const defClassMethodForProto = function defClassMethodForProto(fnc) {
	return defClassMethod(fnc, 'this.prototype');
};

/**
 * Make one class inherit from the other
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.8.18
 *
 * @param    {String|Function|Array}   _parent           Parent class to inherit from
 * @param    {String}                  _namespace        Namespace to store class in
 * @param    {Function}                _newConstructor   New class constructor
 * @param    {Boolean}                 _do_constitutors  Do the constitutors [true]
 *
 * @return   {Function}
 */
Blast.defineStatic('Function', function inherits(_parent, _namespace, _newConstructor, _do_constitutors) {

	var parent_namespace,
	    parent_constructor,
	    whenClassAvailable,
	    super_constructor,
	    parentConstructor = _parent,
	    newConstructor = _newConstructor,
	    targetPath,
	    descriptor,
	    namespace = _namespace,
	    ns_filter,
	    multiple,
	    pieces,
	    config,
	    filter,
	    names,
	    proto,
	    chain,
	    name,
	    path,
	    temp,
	    key,
	    i;

	if (arguments.length == 1) {
		newConstructor = parentConstructor;
		parentConstructor = null;
		namespace = '';
	} else {
		let ns_type = typeof namespace;

		// No namespace has been given
		if (ns_type == 'function' || (ns_type == 'string' && !newConstructor)) {
			newConstructor = namespace;
			namespace = '';
		}

		if (typeof parentConstructor === 'string') {
			names = [parentConstructor];
		} else if (Array.isArray(parentConstructor)) {
			names = parentConstructor;
		}
	}

	if (typeof newConstructor == 'string') {

		try {
			newConstructor = Fn.create(newConstructor, function constructorShim() {
				newConstructor.super.apply(this, arguments);
			});
		} catch (err) {
			if (!Fn.isNameAllowed(newConstructor)) {
				throw new Error('Unable to create class with the name "' + newConstructor + '"');
			} else {
				throw err;
			}
		}
	}

	// Set the namespace on the constructor if it's given
	if (!newConstructor.namespace) {

		if (!namespace && typeof parentConstructor == 'function') {
			namespace = parentConstructor.namespace;
		}

		if (!namespace) {
			namespace = '';
		}

		Blast.defineValue(newConstructor, 'namespace', namespace == '@' ? '' : namespace);
	}

	if (_do_constitutors == null) {
		_do_constitutors = true;
	}

	if (Array.isArray(names)) {

		// Make sure all super constructors are available first
		for (i = 0; i < names.length; i++) {
			config = getClassPathInfo(names[i]);
			parent_constructor = config.class;

			// If one of the classes isn't available, schedule it for later
			if (!parent_constructor) {

				// Create new event filter
				filter = {
					type       : 'extended',
					descendant : config.name,
					namespace  : config.namespace
				};

				if (config.namespace) {
					ns_filter = {
						type       : 'extended',
						descendant : config.name,
						namespace  : config.namespace + '.' + config.name
					};

					Blast.once(ns_filter, function whenNsClassAvailable() {
						Blast.removeAllListeners(filter);
						whenClassAvailable();
					});
				}

				whenClassAvailable = function whenClassAvailable() {

					var oldProto = newConstructor.prototype,
					    arr,
					    i;

					// Replace the temporary prototype with the new,
					// correctly inherited one
					inherits(names, namespace, newConstructor, false);

					if (!oldProto.waitingForClass || !oldProto.hasOwnProperty('waitingForClass')) {
						return;
					}

					for (i = 0; i < oldProto.waitingMethods.length; i++) {
						arr = oldProto.waitingMethods[i];
						newConstructor.setMethod(arr[0], arr[1]);
					}

					for (i = 0; i < oldProto.waitingProperties.length; i++) {
						arr = oldProto.waitingProperties[i];
						Object.defineProperty(newConstructor.prototype, arr[0], arr[1]);
					}

					// Add the parent post-inheritors to the new constructor
					if (newConstructor.super.postInheritors != null) {
						for (i = 0; i < newConstructor.super.postInheritors.length; i++) {
							newConstructor.postInherit(newConstructor.super.postInheritors[i]);
						}
					};

					// Add the parent constitutors to the new constructor
					if (newConstructor.super.constitutors != null) {
						for (i = 0; i < newConstructor.super.constitutors.length; i++) {
							addConstructorConstitutor(newConstructor, newConstructor.super.constitutors[i], true);
						}
					};

					for (i = 0; i < oldProto.waitingPostInherit.length; i++) {
						newConstructor.postInherit(oldProto.waitingPostInherit[i]);
					}

					for (i = 0; i < oldProto.waitingConstitute.length; i++) {
						addConstructorConstitutor(newConstructor, oldProto.waitingConstitute[i], true);
					}

					doPostInheritors(newConstructor);
				};

				Blast.once(filter, function classIsAvailable() {

					if (ns_filter) {
						Blast.removeAllListeners(ns_filter);
					}

					whenClassAvailable();
				});

				// Set this on the current prototype
				newConstructor.prototype.waitingForClass = true;
				newConstructor.prototype.waitingMethods = [];
				newConstructor.prototype.waitingProperties = [];
				newConstructor.prototype.waitingConstitute = [];
				newConstructor.prototype.waitingPostInherit = [];

				// Ensure the constructor has static methods
				ensureConstructorStaticMethods(newConstructor);

				// The namespace might have a main class already defined,
				// we temporarily inherit those static methods
				if (config.namespace) {
					// Get the main class of the namespace, if any
					temp = getClass(config.namespace);

					if (temp && temp.staticChain) {
						for (key in temp.staticChain) {
							addDescriptorToStatic(newConstructor, key, temp.staticChain[key]);
						}
					}
				}

				// Try to do the constitutors as expected:
				// after the ones of the parent have finished
				Blast.loaded(function doConstitutorsWhenLoaded() {

					// If the super class still isn't available, do nothing
					if (!newConstructor.super) {
						return;
					}

					let waiting = waiting_children.get(newConstructor.super);

					if (!waiting) {
						waiting = [];
						waiting_children.set(newConstructor.super, waiting);
					}

					waiting.push(newConstructor);
				});

				return newConstructor;
			}
		}

		// Everything is available, iterate again
		for (i = 0; i < names.length; i++) {
			super_constructor = null;
			path = names[i];
			super_constructor = getClass(path);

			temp = inherits(super_constructor, namespace, newConstructor, _do_constitutors);

			if (i == 0 && temp) {
				newConstructor = temp;
			}
		}

		return newConstructor;
	}

	if (typeof newConstructor !== 'function') {
		throw new Error('Only functions can inherit from another function');
	}

	let new_constructor_name = newConstructor.name;

	// Does the parent class need to do anything to the constructor?
	if (parentConstructor && typeof parentConstructor.modifyChildConstructor == 'function') {
		temp = parentConstructor.modifyChildConstructor(newConstructor);

		if (temp && temp != newConstructor) {
			temp = Fn.create(new_constructor_name, temp);
			temp.staticChain = newConstructor.staticChain;
			temp.super = newConstructor.super;
			Blast.defineValue(temp, 'namespace', namespace);
			newConstructor = temp;
		}
	}

	// See if `setMethod` is available, if not this means
	// Protoblast was loaded without modifying the native objects
	// So we add it to this extended class' constructor
	ensureConstructorStaticMethods(newConstructor);

	if (parentConstructor) {

		// Add this class to the parent's children property array
		if (!parentConstructor.children) {
			Blast.defineValue(parentConstructor, 'children', []);
		} else {
			let child;

			// See if the parent already has a child by this name.
			// If it does, it has to be removed.
			for (i = 0; i < parentConstructor.children.length; i++) {
				child = parentConstructor.children[i];

				if (child.name == new_constructor_name && child.namespace == namespace) {
					parentConstructor.children.splice(i, 1);
					break;
				}
			}
		}

		parentConstructor.children.push(newConstructor);

		if (parentConstructor.staticChain) {
			chain = parentConstructor.staticChain;

			for (key in chain) {
				Object.defineProperty(newConstructor, key, chain[key]);
			}

			if (newConstructor.staticChain) {
				Collection.Object.inject(newConstructor.staticChain, chain);
			} else {
				newConstructor.staticChain = Object.create(chain);
			}
		}

		// See if newConstructor has already inherited something.
		// In that case this becomes multiple inheritance.
		multiple = typeof newConstructor.super === 'function';

		// Set the super value
		Blast.defineValue(newConstructor, 'super', parentConstructor);

		// In multiple inheritance the current and new prototypes must be used
		if (multiple) {
			proto = doMultipleInheritance(newConstructor, parentConstructor);
		} else {
			proto = parentConstructor.prototype;
		}

		// Set the default `toStringTag` method, if it hasn't been set yet
		if (!Obj.getPropertyDescriptor(proto, Symbol.toStringTag)) {
			Blast.defineGet(proto, Symbol.toStringTag, toStringTag);
		}

		// Inherit the prototype content
		newConstructor.prototype = Object.create(proto, {
			constructor: {
				value: newConstructor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});

		if (parentConstructor.postInheritors != null) {
			for (i = 0; i < parentConstructor.postInheritors.length; i++) {
				newConstructor.postInherit(parentConstructor.postInheritors[i]);
			}
		}

		// Get the parent constitutors and execute them
		if (_do_constitutors && parentConstructor.constitutors != null) {
			for (i = 0; i < parentConstructor.constitutors.length; i++) {
				newConstructor.constitute(parentConstructor.constitutors[i]);
			}
		}
	} else {
		parentConstructor = Function;
	}

	if (!targetPath) {
		// See if we need to set a namespace
		if (namespace == null) {
			if (parentConstructor.namespace && !newConstructor.namespace) {
				namespace = parentConstructor.namespace;
			}
		}

		if (namespace && namespace != '@') {
			// Ensure the namespace exists
			getNamespace(namespace);

			// Construct the new path, including the namespace
			targetPath = namespace + '.' + new_constructor_name;
		} else {
			targetPath = new_constructor_name;
		}
	}

	// Store the new class in Blast
	Obj.setPath(Blast.Classes, targetPath, newConstructor);

	// Create the type
	Obj.setPath(Blast.Types, targetPath, Blast.createType(newConstructor));

	if (Blast.emit) {
		Blast.queueTick(function emitExtension() {

			var data = {
				type       : 'extended',
				ancestor   : parentConstructor.name,
				descendant : new_constructor_name,
				namespace  : namespace
			};

			Blast.emit(data, parentConstructor, newConstructor, null);
		});
	}

	doPostInheritors(newConstructor);

	Blast.executeAfterLoadingCycle(function doConstitutorsWhenLoaded() {
		doConstitutors(newConstructor);
	});

	return newConstructor;
});

/**
 * Used for custom `toStringTag` behaviour (as a getter)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.14
 * @version  0.8.14
 */
function toStringTag() {
	let name = this.constructor.name;

	if (this.constructor.namespace) {
		name = this.constructor.namespace + '.' + name;
	}

	return name;
}

/**
 * Has this class been constituted?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Function}   constructor
 */
defClassMethod(function hasConstituted(constructor) {
	return CONSTITUTED_STATE.get(constructor) > 2;
});

/**
 * Do something after this class has constituted
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.20
 * @version  0.7.20
 *
 * @param    {Function}   constructor
 * @param    {Function}   task
 */
defClassMethod(function afterConstituted(constructor, task) {

	if (!task) {
		return;
	}

	if (constructor.hasConstituted()) {
		task.call(constructor);
	} else {

		if (!constructor[CONSTITUTED_LISTENERS]) {
			constructor[CONSTITUTED_LISTENERS] = [];
		}

		constructor[CONSTITUTED_LISTENERS].push(task);
	}
});

/**
 * Get all the descendants of this class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.7.26
 *
 * @param    {Function}   constructor
 *
 * @return   {Array}
 */
defClassMethod(function getDescendants(constructor) {

	let result = [];

	if (!constructor.children) {
		return result;
	}

	let i;

	for (i = 0; i < constructor.children.length; i++) {
		result.push(constructor.children[i]);
		result.push(...constructor.children[i].getDescendants());
	}

	return result;
});

/**
 * Get all the descendants of this class as a live map
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 */
defClassMethod(function getLiveDescendantsMap(constructor) {
	return new Classes.Develry.BackedMap(() => {
		return constructor.getDescendantsDict();
	});
});

/**
 * Get all the *current* descendants of this class as an enum dictionary
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.9.0
 */
defClassMethod(function getDescendantsDict(constructor) {

	let parent_namespace = constructor.namespace,
	    namespace,
	    type_path,
	    children = constructor.getDescendants(),
	    result = {},
	    child;
	
	for (child of children) {
		type_path = child.type_path;

		if (!type_path) {
			type_path = child.type_name;

			if (type_path == null) {
				continue;
			}

			namespace = child.namespace;
			
			// Add extra identifier info if this child comes from another namespace
			if (namespace != parent_namespace) {
				if (namespace.startsWith(parent_namespace)) {
					namespace = namespace.after(parent_namespace);

					if (namespace[0] == '.') {
						namespace = namespace.slice(1);
					}
				}

				namespace = Blast.parseClassPath(namespace).map(entry => Bound.String.underscore(entry)).join('.');

				type_path = namespace + '.' + type_path;
			}
		}

		result[type_path] = child;
	}

	return result;
});

/**
 * Get a specific descendant by their name
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.26
 * @version  0.9.0
 */
defClassMethod(function getDescendant(constructor, name) {

	if (!name) {
		throw new Error('Unable to get class member of ' + constructor.name + ', given name is empty');
	}

	const dict = constructor.getDescendantsDict();

	let result = dict[name];

	if (!result) {
		name = Blast.parseClassPath(name).map(entry => Bound.String.underscore(entry)).join('.');
		result = dict[name];
	}

	return result;
});

/**
 * Do the postInheritors for the given constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Function}   constructor
 */
function doPostInheritors(constructor) {
	return _doCPI(
		constructor,
		POST_INHERIT_STATE,
		'postInheritors',
		finished_post_inherits,
		POST_INHERIT_LISTENERS
	);
}

/**
 * Do the constitutors for the given constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.6
 * @version  0.7.20
 *
 * @param    {Function}   constructor
 */
function doConstitutors(constructor) {
	return _doCPI(
		constructor,
		CONSTITUTED_STATE,
		'constitutors',
		finished_constitutors,
		CONSTITUTED_LISTENERS
	);
}

/**
 * Do the constitutors for the given constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.6
 * @version  0.7.20
 *
 * @param    {Function}   constructor
 * @param    {WeakMap}    state_map
 * @param    {string}     task_key
 * @param    {WeakMap}    finished_map
 * @param    {Symbol}     listeners
 */
function _doCPI(constructor, state_map, task_key, finished_map, listeners) {

	// If this is in any constituted state, do nothing
	if (state_map.get(constructor)) {
		return;
	}

	// Set constituted state 1 (starting constitutors)
	state_map.set(constructor, 1);

	let tasks = constructor[task_key];

	if (tasks) {
		let i;

		for (i = 0; i < tasks.length; i++) {
			doConstructorTask(constructor, tasks[i], finished_map);
		}
	}

	// State 2: constitutors done, doing waiting children
	state_map.set(constructor, 2);

	let waiting = waiting_children.get(constructor);

	if (waiting && waiting.length) {
		let i;

		for (i = 0; i < waiting.length; i++) {
			_doCPI(waiting[i], state_map, task_key, finished_map);
		}
	}

	// State 3: children done, doing constituted listeners
	state_map.set(constructor, 3);

	if (constructor[listeners]) {
		while (constructor[listeners].length) {
			constructor[listeners].shift().call(constructor);
		}
	}

	// State 4: everything is done
	state_map.set(constructor, 4);
}

/**
 * Force the constitutors to execute now
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.10
 * @version  0.5.10
 *
 * @param    {Function}   constructor
 */
Blast.defineStatic('Function', doConstitutors);

/**
 * Do things to the class constructor as soon as it has inherited,
 * and inherit to children
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Function}   constructor
 * @param    {Function}   task
 */
defClassMethod(function postInherit(constructor, task) {

	if (constructor.prototype.waitingPostInherit) {
		constructor.prototype.waitingPostInherit.push(task);
		return;
	}

	let tasks = constructor.postInheritors;

	if (tasks == null) {
		tasks = [];
		Blast.defineValue(constructor, 'postInheritors', tasks);
	}

	// Store the task for inherited classes
	tasks.push(task);

	doConstructorTask(constructor, task, finished_post_inherits);

	// If this class already has children, add them there too
	if (constructor.children?.length) {
		let child;

		for (child of constructor.children) {
			if (!child.postInheritors || child.postInheritors.indexOf(task) == -1) {
				postInheritors(child, task);
			}
		}
	}
});

/**
 * Do things to the class constructor once it's ready,
 * and inherit to children
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.9.0
 *
 * @param    {Function}   constructor
 * @param    {Function}   task
 */
defClassMethod(function constitute(constructor, task) {

	if (constructor.prototype.waitingConstitute) {
		constructor.prototype.waitingConstitute.push(task);
		return;
	}

	addConstructorConstitutor(constructor, task, false);
});

/**
 * Actually add and maybe execute the constitutor to the given constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Function}   constructor
 * @param    {Function}   task
 */
function addConstructorConstitutor(constructor, task, after_wait = false) {

	let tasks = constructor.constitutors;

	if (tasks == null) {
		tasks = [];
		Blast.defineValue(constructor, 'constitutors', tasks);
	}

	// Store the task for inherited classes
	tasks.push(task);

	// If blast has already loaded, perform the constitutor
	if (Blast.loaded()) {

		// If doConstitutors has already been called for this constructor,
		// perform this task immediately
		if (CONSTITUTED_STATE.get(constructor)) {
			doConstructorTask(constructor, task, finished_constitutors);
		} else {
			Blast.queueImmediate(function doQueuedConstitutor() {
				doConstructorTask(constructor, task, finished_constitutors);
			});
		}
	} else if (Blast.didInitialLoad()) {
		Blast.loaded(() => {
			doConstructorTask(constructor, task, finished_constitutors);
		});
	}

	// If this class already has children, add them there too
	if (constructor.children?.length) {
		let child;

		for (child of constructor.children) {
			if (!child.constitutors || child.constitutors.indexOf(task) == -1) {
				child.constitute(task);
			}
		}
	}
}

/**
 * Add a class instance as a static property and add static traits
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {Mixed}      target
 * @param    {String}     key            Name to use
 * @param    {Function}   compositor
 * @param    {Object}     traits
 */
defClassMethod(function staticCompose(target, key, constructor, traits) {

	var data;

	if (target.composeData) {
		data = target.composeData;
	} else {
		if (target.super && target.super.composeData) {
			data = Object.assign({}, target.super.composeData);
		} else {
			data = {};
		}

		Blast.defineValue(target, 'composeData', data);
	}

	Fn.compose(target, key, constructor, traits);
});

/**
 * Add a class instance as a property and add traits
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.5.1
 *
 * @param    {Mixed}      target
 * @param    {String}     key            Name to use
 * @param    {Function}   compositor
 * @param    {Object}     traits
 */
defClassMethodForProto(function compose(target, key, compositor, traits) {

	var methodDefiner,
	    propDefiner,
	    methods,
	    temp,
	    prop,
	    keys,
	    fnc,
	    i;

	if (target == null) {
		throw new Error('Illegal target given');
	}

	if (typeof target === 'function') {
		methodDefiner = Fn.setStatic;
		propDefiner = Fn.prepareProperty;
	} else {
		methodDefiner = Fn.setMethod;
		propDefiner = Fn.prepareProperty;
	}

	if (traits == null) {
		traits = Collection.Object.enumerateOwnDescriptors(compositor.prototype);
	} else if (Array.isArray(traits)) {
		keys = traits;
		traits = {};

		for (i = 0; i < keys.length; i++) {
			traits[keys[i]] = Object.getOwnPropertyDescriptor(compositor.prototype, keys[i]);
		}
	}

	// Prepare the property
	propDefiner(target, key, function getComposite(doNext) {

		var result,
		    temp;

		result = Object.create(compositor.prototype, {
			compositorParent: {
				value: this
			}
		});

		// Call the function itself
		temp = result.constructor.call(result, doNext);

		// If the constructor returned an object, use that
		if (temp != null) {
			result = temp;

			if (result) {
				result.compositorParent = this;
			}
		}

		return result;
	});

	if (traits === false) {
		return;
	}

	// Add the traits
	for (prop in traits) {

		temp = traits[prop];

		if (temp != null) {
			if (temp.get || temp.set) {
				continue;
			}

			if (temp.value) {
				fnc = temp.value;
			} else {
				fnc = temp;
			}
		}

		if (target[prop] != null && target.hasOwnProperty(prop)) {
			continue;
		}

		(function doDefineProp(fnc, prop) {
			methodDefiner(target, prop, function trait() {
				return this[key][prop].apply(this[key], arguments);
			});
		}(fnc, prop));
	}
});

/**
 * Set a static method on the given constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Function}   constructor  Constructor to modify prototype of
 * @param    {Array}      argument_types   The argument types
 * @param    {Array}      return_types     Optional return types
 * @param    {String}     key          Name to use (defaults to method name)
 * @param    {Function}   method       The method to set
 *
 * @return   {Function}
 */
defClassMethod(function setTypedStatic(constructor, argument_types, return_types, key, method) {
	return Blast.addMethodSignature(constructor, argument_types, return_types, key, method);
});

/**
 * Instrument a static method
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.9
 * @version  0.8.9
 *
 * @param    {Function}   constructor      Constructor to modify prototype of
 * @param    {String}     method_name      The name of the method to instrument
 * @param    {Function}   before           Function to call before executing the main method
 * @param    {Function}   after            Function to call after executing the main method
 */
defClassMethod(function instrumentStaticMethod(constructor, method_name, before, after) {
	return Blast.addMethodInstrumentation(constructor, method_name, before, after);
});

/**
 * Set a static method on the given constructor.
 * Can also be used to set a static property. This won't fire an error
 * when not given a function, unlike setMethod
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.2.0
 *
 * @param    {Function}   target       Target object/function to use
 * @param    {String}     _key         Name to use (defaults to method name)
 * @param    {Function}   _value       The value to set
 * @param    {Boolean}    _inherit     Let children inherit this (true)
 */
defClassMethod(function setStatic(target, _key, _value, _inherit) {

	var enumerable,
	    descriptor,
	    inherit,
	    target,
	    value,
	    keys,
	    i;

	enumerable = false;

	if (typeof _key === 'function') {
		inherit = _value,
		value = _key;
		keys = Collection.Array.cast(value.name || undefined);
	} else {
		keys = Collection.Array.cast(_key);
		value = _value;
		inherit = _inherit;
	}

	if (inherit == null) {
		inherit = true;
	}

	if (keys.length === 0 || !keys[0]) {
		throw new Error('Static property must be set to a valid key');
	}

	descriptor = {
		value: value,
		enumerable: enumerable,
		configurable: true
	};

	for (i = 0; i < keys.length; i++) {
		addDescriptorToStatic(target, keys[i], descriptor, inherit);
	}
});

/**
 * Set a static getter property
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.4
 * @version  0.7.24
 *
 * @param    {Function}   target       Target object/function to use
 * @param    {String}     _key         Name to use (defaults to method name)
 * @param    {Function}   _getter      Function that returns a value OR value
 * @param    {Function}   _setter      Function that sets the value
 * @param    {Boolean}    _inherit     Let children inherit this (true)
 */
defClassMethod(function setStaticProperty(target, _key, _getter, _setter, _inherit) {

	var enumerable,
	    existing,
	    inherit,
	    getter,
	    setter,
	    config,
	    proto,
	    keys,
	    i;

	enumerable = false;

	if (typeof _key === 'function') {
		inherit = _setter;
		setter = _getter;
		getter = _key;
		keys = Collection.Array.cast(getter.name || undefined);
	} else {
		inherit = _inherit;
		setter = _setter;
		getter = _getter;
		keys = Collection.Array.cast(_key);
	}

	if (keys.length === 0 || !keys[0]) {
		throw new Error('Static property must be set to a valid key');
	}

	if (typeof setter == 'boolean') {
		inherit = setter;
		setter = null;
	}

	// Inherit defaults to true
	if (inherit == null) {
		inherit = true;
	}

	if (typeof getter == 'function') {
		config = {
			get: getter,
			set: setter || undefined,
			enumerable: enumerable,
			configurable: true
		};
	} else {
		config = {
			value: getter,
			enumerable: enumerable,
			configurable: true
		};
	}

	for (i = 0; i < keys.length; i++) {
		if (inherit) addToStaticChain(target, keys[i], config);
		Object.defineProperty(target, keys[i], config);
	}
});

/**
 * Set a prototype method on the given constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.25
 * @version  0.7.25
 *
 * @param    {Function}   constructor      Constructor to modify prototype of
 * @param    {Array}      argument_types   The argument types
 * @param    {Array}      return_types     Optional return types
 * @param    {String}     key              Name to use (defaults to method name)
 * @param    {Function}   method           The method to set
 *
 * @return   {Function}
 */
defClassMethod(function setTypedMethod(constructor, argument_types, return_types, key, method) {
	return Blast.addMethodSignature(constructor.prototype, argument_types, return_types, key, method);
});

/**
 * Instrument a method
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.9
 * @version  0.8.9
 *
 * @param    {Function}   constructor      Constructor to modify prototype of
 * @param    {String}     method_name      The name of the method to instrument
 * @param    {Function}   before           Function to call before executing the main method
 * @param    {Function}   after            Function to call after executing the main method
 */
defClassMethod(function instrumentMethod(constructor, method_name, before, after) {
	return Blast.addMethodInstrumentation(constructor.prototype, method_name, before, after);
});

/**
 * Set a prototype method on the given constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.8.9
 *
 * @param    {Function}   constructor  Constructor to modify prototype of
 * @param    {String}     _key         Name to use (defaults to method name)
 * @param    {Function}   _method      The method to set
 *
 * @return   {Function}
 */
defClassMethod(function setMethod(constructor, _key, _method) {

	let method,
	    proto,
	    keys;

	if (typeof constructor === 'function') {
		proto = constructor.prototype;
	} else {
		proto = constructor;
	}

	if (typeof _key === 'function') {
		method = _key;
		keys = Collection.Array.cast(method.name || undefined);
	} else {
		method = _method;
		keys = Collection.Array.cast(_key);
	}

	if (keys.length === 0 || !keys[0]) {
		throw new Error('Method must be set to a valid key');
	}

	let has_typed_wrapper,
	    i;

	for (i = 0; i < keys.length; i++) {

		// Set a super reference only for the first given method
		if (i == 0) {

			has_typed_wrapper = Blast.hasSignatureWrapperMethod(proto, keys[i]);

			// Get a possible existing value
			let existing = Blast.Bound.Object.getPropertyDescriptor(proto, keys[0]);

			// If there already was something here, set it as this method's parent
			if (!has_typed_wrapper && existing && typeof existing.value !== 'undefined') {
				if (typeof method == 'object') {
					Blast.defineValue(method.value, 'super', existing.value);
				} else {
					Blast.defineValue(method, 'super', existing.value);
				}
			}
		}

		// If this constructor is waiting on another class
		if (proto.waitingForClass && proto.hasOwnProperty('waitingForClass')) {
			proto.waitingMethods.push([keys, method]);
			proto[keys[i]] = method;
			continue;
		}

		if (Blast.hasSignatureWrapperMethod(proto, keys[i])) {
			Blast.addCatchallMethod(proto, keys[i], method);
		} else if (typeof method == 'function') {
			Blast.defineValue(proto, keys[i], method);
		} else {
			Blast.defineValue(proto, keys[i], null, method);
		}
	}

	return method;
});

/**
 * Set & decorate a method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.7.2
 *
 * @param    {Function}   constructor  Constructor to modify prototype of
 * @param    {Function}   decorator    The decorator to apply
 * @param    {String}     key          Name to use (defaults to method name)
 * @param    {Function}   method       The method to set
 *
 * @return   {Function}
 */
defClassMethod(function decorateMethod(constructor, decorator, key, method) {

	if (typeof key == 'function') {
		method = key;
		key = method.name;
	}

	let options = {
		kind       : 'method',
		key        : key,
		placement  : 'prototype',
		descriptor : {
			value : method
		}
	};

	if (typeof decorator == 'string') {
		decorator = Obj.path(Blast.Decorators, decorator)();
	}

	// Get the new options from the decorator
	options = decorator(options);

	return applyDecoration(constructor, key, options);
});

/**
 * Set an abstract method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.18
 * @version  0.7.18
 *
 * @param    {Function}   constructor  Constructor to modify prototype of
 * @param    {String}     name         The name of the method
 */
defClassMethod(function setAbstractMethod(constructor, name) {
	Fn.setMethod(constructor, name, function abstractMethod() {
		let message = 'The `' + name + '` method has not been implemented in the `' + this.constructor.name + '` class.';
		throw new Error(message);
	});
});

/**
 * Apply a decoration object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Function}         constructor
 * @param    {String|Symbol}    key
 * @param    {Object}           options
 */
function applyDecoration(constructor, key, options) {

	if (options.kind == 'method') {
		return Fn.setMethod(constructor, key, options.descriptor);
	}

	throw new Error('Decorating ' + options.kind + ' is not yet implemented');
}

/**
 * Set a getter on the given prototype, or a simple value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.8.15
 *
 * @param    {Function}   constructor  Constructor to modify prototype of
 * @param    {String}     _key         Name to use (defaults to method name)
 * @param    {Function}   _getter      Function that returns a value OR value
 * @param    {Function}   _setter      Function that sets the value
 */
defClassMethod(function setProperty(constructor, _key, _getter, _setter) {

	var enumerable,
	    super_desc,
	    is_getter,
	    existing,
	    getter,
	    setter,
	    target,
	    config,
	    keys,
	    i;

	if (typeof constructor == 'function') {
		target = constructor.prototype;
		enumerable = false;
	} else {
		target = constructor;
		enumerable = true;
	}

	if (typeof _key === 'function') {
		setter = _getter;
		getter = _key;
		keys = Collection.Array.cast(getter.name || undefined);
	} else {
		setter = _setter;
		getter = _getter;

		if (typeof _key == 'object') {
			if (Array.isArray(_key)) {
				keys = _key;
			} else {
				for (keys of Reflect.ownKeys(_key)) {
					setProperty(constructor, keys, _key[keys]);
				}
				return;
			}
		} else {
			keys = Collection.Array.cast(_key);
		}
	}

	if (keys.length === 0 || !keys[0]) {
		throw new Error('Property must be set to a valid key');
	}

	let getter_type = typeof getter;

	if (getter_type == 'function') {
		is_getter = true;

		config = {
			get: getter,
			set: setter || undefined,
			enumerable: enumerable
		};
	} else {

		if (getter_type == 'object' && getter && typeof getter.value == 'function') {
			getter = getter.value;
		}

		config = {
			value: getter,
			enumerable: enumerable,
			writable: true
		};
	}

	for (i = 0; i < keys.length; i++) {

		// If the target is still waiting on another class to extend
		if (target.waitingForClass && target.hasOwnProperty('waitingForClass')) {
			target.waitingProperties.push([keys[i], config]);
		} else if (is_getter && !super_desc && constructor.super && constructor.super.prototype) {
			// See if the super constructor already has a descriptor for this
			super_desc = Obj.getPropertyDescriptor(constructor.super.prototype, keys[i]);
		}

		if (super_desc) {

			// Set the parent getter as the new getter's `super` property
			Blast.defineValue(config.get, 'super', super_desc.get);

			// Do the same for setter,
			// but totally inherit the parent setter if we didn't add one
			if (super_desc.set) {
				if (config.set) {
					Blast.defineValue(config.set, 'super', super_desc.set);
				} else {
					config.set = super_desc.set;
				}
			}
		}

		Object.defineProperty(target, keys[i], config);
	}
});

/**
 * Prepare a property:
 * the getter will supply the value on first get
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.6
 *
 * @param    {Function}   target       Target object or function
 * @param    {String}     _key         Name to use (defaults to method name)
 * @param    {Function}   _getter      Function that returns a value
 */
defClassMethodForProto(function prepareProperty(target, _key, _getter, _enumerable) {

	var enumerable,
	    descriptor,
	    definer,
	    getter,
	    target,
	    config,
	    keys,
	    i;

	if (typeof _key === 'function') {
		enumerable = _getter;
		getter = _key;
		keys = Collection.Array.cast(getter.name || undefined);
	} else {
		enumerable = _enumerable;
		getter = _getter;
		keys = Collection.Array.cast(_key);
	}

	if (typeof enumerable == 'undefined') {
		enumerable = false;
	}

	if (keys.length === 0 || !keys[0]) {
		throw new Error('Property must be set to a valid key');
	}

	if (typeof getter !== 'function') {
		throw new Error('Getter must be a valid function');
	}

	// The function that redefined the value property
	definer = function definer(overrideValue) {

		if (this == this.constructor.prototype) {
			return;
		}

		let doNext,
		    list,
		    i;

		// Get the initial value
		if (arguments.length === 0) {
			if (getter.name[0] !== String(getter.name[0]).toUpperCase() && getter != Blast.Globals[getter]) {

				// Do something after this function has run?
				doNext = function doNext(fnc) {
					if (list == null) {
						list = [];
					}

					list.push(fnc);
				};

				overrideValue = getter.call(this, doNext);
			} else {
				overrideValue = getter.call(this);
			}
		}

		// Override the property
		for (i = 0; i < keys.length; i++) {
			Object.defineProperty(this, keys[i], {
				value: overrideValue,
				enumerable: enumerable,
				configurable: true
			});
		}

		// If something was scheduled to do next, that means now
		if (list != null) {
			while (list.length) {
				list.shift()();
			}
		}

		return overrideValue;
	};

	// Set the definer function as a configurable property
	// (It'll overwrite itself on first call)
	descriptor = {
		get: definer,
		set: definer,
		enumerable: enumerable,
		configurable: true
	};

	for (i = 0; i < keys.length; i++) {

		if (typeof target === 'function') {
			addToStaticChain(target, keys[i], descriptor);
		}

		// If the target is still waiting on another class to extend
		if (target.waitingForClass && target.hasOwnProperty('waitingForClass')) {
			target.waitingProperties.push([target, keys[i], descriptor]);
		}

		Object.defineProperty(target, keys[i], descriptor);
	}
});

/**
 * Enforce a property:
 * Define a setter (which will be called on first get)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.6
 * @version  0.7.23
 *
 * @param    {Function}   target       Target object or function
 * @param    {String}     key          Name to use (defaults to method name)
 * @param    {Function}   setter       Function that returns a value
 * @param    {Function}   defaulter    Function that will provide a default value
 */
defClassMethod(function enforceProperty(target, key, setter, defaulter) {

	let keys;

	if (typeof key === 'function') {
		defaulter = setter;
		setter = key;
		keys = Collection.Array.cast(setter.name || undefined);
	} else {
		keys = Collection.Array.cast(key);
	}

	// Turn the key into a string in case it's a symbol
	const has_default_function = typeof defaulter == 'function',
	      has_default_value = defaulter != null,
	      setting_symbol = Symbol('setting_' + String(keys[0])),
	      symbol = Symbol(String(keys[0]));

	// Already add the symbol to the prototype
	Fn.setProperty(target, symbol, undefined);
	Fn.setProperty(target, setting_symbol, false);

	// Prepare the setter wrapper function
	function _setter(value) {

		// Prevent infinite loops
		if (this[setting_symbol]) {
			return;
		}

		// Make sure this isn't called on the prototype
		if (this.constructor.prototype === this) {
			return;
		}

		this[setting_symbol] = true;

		try {
			this[symbol] = setter.call(this, value, this[symbol]);
			this[setting_symbol] = false;
		} catch (err) {
			this[setting_symbol] = false;
			throw err;
		}

		return _getter_or_default(this);
	}

	// Get the current result
	function _getter() {

		let result = this[symbol];

		if (result === undefined) {
			if (!this[setting_symbol]) {
				_setter.call(this);
				result = _getter_or_default(this);
			}
		}

		return result;
	}

	// Get the current result, but use a default if it's not set
	function _getter_or_default(self) {
		let result = self[symbol];

		if (result === undefined) {
			if (has_default_function) {
				result = defaulter.call(self);
			} else if (has_default_value) {
				result = defaulter;
			}
		}

		return result;
	}

	return Fn.setProperty(target, keys, _getter, _setter);
});

/**
 * Get all the children of a certain class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.11
 * @version  0.1.11
 *
 * @return   {Array}
 */
defClassMethod(function getChildren(constructor) {

	var result = [];

	if (constructor.children) {

		// Iterate over all the children
		constructor.children.forEach(function eachChild(child) {
			result.push(child);

			// Recursively iterate over the children's children
			if (child.children && child.children.length) {
				child.children.forEach(eachChild);
			}
		});
	}

	return result;
});

/**
 * Mark this class as being abstract
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.24
 * @version  0.7.24
 *
 * @param    {Function}   constructor
 * @param    {Boolean}    value
 */
defClassMethod(function makeAbstractClass(constructor, value) {

	if (value == null) {
		value = true;
	}

	constructor.setStatic('is_abstract_class', value, false);
});

/**
 * Inherit from the function
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.3
 * @version  0.2.0
 *
 * @param    {Function}   newConstructor
 *
 * @return   {Function}   newConstructor
 */
var protoExtend = function extend(newConstructor) {
	return Fn.inherits(this, newConstructor);
};

Blast.definePrototype('Function', protoExtend);

/**
 * Prepare a static property:
 * the getter will supply the value on first get
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @param    {String}     key         Name to use (defaults to method name)
 * @param    {Function}   getter      Function that returns a value
 */
var protoPrepareStaticProperty = function prepareStaticProperty(key, getter) {
	return Fn.prepareProperty(this, key, getter);
};

/**
 * Ensure a constructor has the required static methods
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.3.4
 * @version  0.3.4
 *
 * @param    {Function}   newConstructor
 */
function ensureConstructorStaticMethods(newConstructor) {

	if (typeof newConstructor.setMethod !== 'function') {

		let i;

		for (i = 0; i < proto_defs.length; i++) {
			Blast.defineValue(newConstructor, proto_defs[i]);
		}

		Blast.defineValue(newConstructor, protoPrepareStaticProperty);

		if (newConstructor.extend == null) {
			Blast.defineValue(newConstructor, 'extend', protoExtend);
		}
	}
}

Blast.definePrototype('Function', protoPrepareStaticProperty);