module.exports = function BlastInheritance(Blast, Collection) {

	var Obj = Blast.Collection.Object;

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
	function addToStaticChain(newConstructor, key, descriptor) {

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
	}

	/**
	 * Add a static method/property to the children
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.1.9
	 * @version  0.1.9
	 *
	 * @param    {Function}   newConstructor
	 * @param    {String}     key
	 * @param    {Object}     descriptor
	 */
	function addToChildren(parent, key, descriptor) {

		var target,
		    i;

		if (!parent.children || !parent.children.length) {
			return;
		}

		for (i = 0; i < parent.children.length; i++) {
			target = parent.children[i];
			Object.defineProperty(target, key, descriptor);
			addToStaticChain(target, key, descriptor);
		}
	}

	/**
	 * Get a namespace object, or create it if it doesn't exist
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.1
	 * @version  0.2.1
	 *
	 * @param    {String}   namespace
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('Function', 'getNamespace', function getNamespace(namespace) {

		var result;

		// Try getting the namespace
		result = Obj.path(Blast.Classes, namespace);

		if (result == null) {
			result = {};

			// Create the namespace object
			Obj.setPath(Blast.Classes, namespace, result);
		}

		return result;
	});

	/**
	 * Make one class inherit from the other
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.3.6
	 *
	 * @param    {String|Function|Array}   _parent           Parent class to inherit from
	 * @param    {String}                  _namespace        Namespace to store class in
	 * @param    {Function}                _newConstructor   New class constructor
	 * @param    {Boolean}                 _do_constitutors  Do the constitutors [true]
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'inherits', function inherits(_parent, _namespace, _newConstructor, _do_constitutors) {

		var parent_namespace,
		    parentConstructor = _parent,
		    newConstructor = _newConstructor,
		    targetPath,
		    namespace = _namespace,
		    multiple,
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
			namespace = null;
		} else {

			// No namespace has been given
			if (typeof namespace == 'function') {
				newConstructor = namespace;
				namespace = null;
			}

			if (typeof parentConstructor === 'string') {
				names = [parentConstructor];
			} else if (Array.isArray(parentConstructor)) {
				names = parentConstructor;
			}
		}

		// Set the namespace on the constructor if it's given
		if (!newConstructor.namespace) {

			if (namespace == null && typeof parentConstructor == 'function') {
				namespace = parentConstructor.namespace;
			}

			if (namespace) {
				Blast.defineValue(newConstructor, 'namespace', namespace);
			}
		}

		if (_do_constitutors == null) {
			_do_constitutors = true;
		}

		if (Array.isArray(names)) {

			// Make sure all super constructors are available first
			for (i = 0; i < names.length; i++) {
				name = names[i];

				if (name.indexOf('.') > -1) {
					path = name;

					// Split the path
					temp = path.split('.');

					// The last part is actually the name
					name = temp.pop();

					// The namespace is what's left over
					parent_namespace = temp.join('.');
				} else {
					path = name;
				}

				// If one of the classes isn't available, schedule it for later
				if (typeof Obj.path(Blast.Classes, path) !== 'function' && typeof Obj.path(Blast.Globals, path) !== 'function') {
					Blast.once({type: 'extended', descendant: name, namespace: parent_namespace}, function whenClassAvailable() {

						var oldProto = newConstructor.prototype,
						    arr,
						    i;

						inherits(names, namespace, newConstructor, false);

						if (!oldProto.waitingForClass || !oldProto.hasOwnProperty('waitingForClass')) return;

						for (i = 0; i < oldProto.waitingMethods.length; i++) {
							arr = oldProto.waitingMethods[i];
							newConstructor.setMethod(arr[0], arr[1]);
						}

						for (i = 0; i < oldProto.waitingProperties.length; i++) {
							arr = oldProto.waitingProperties[i];
							Object.defineProperty(newConstructor.prototype, arr[0], arr[1]);
						}

						// Add the parent constitutors to the new constructor
						if (newConstructor.super.constitutors != null) {
							for (i = 0; i < newConstructor.super.constitutors.length; i++) {
								newConstructor.constitute(newConstructor.super.constitutors[i]);
							}
						};

						for (i = 0; i < oldProto.waitingConstitute.length; i++) {
							newConstructor.constitute(oldProto.waitingConstitute[i]);
						}
					});

					// Set this on the current prototype
					newConstructor.prototype.waitingForClass = true;
					newConstructor.prototype.waitingMethods = [];
					newConstructor.prototype.waitingProperties = [];
					newConstructor.prototype.waitingConstitute = [];

					// Ensure the constructor has static methods
					ensureConstructorStaticMethods(newConstructor);

					return newConstructor;
				}
			}

			// Everything is available, iterate again
			for (i = 0; i < names.length; i++) {
				path = names[i];
				temp = Obj.path(Blast.Classes, path);

				if (typeof temp === 'function') {
					superConstructor = temp;
				} else {
					superConstructor = Obj.path(Blast.Globals, path);
				}

				inherits(superConstructor, namespace, newConstructor, _do_constitutors);
			}

			return newConstructor;
		}

		if (typeof newConstructor !== 'function') {
			throw new Error('Only functions can inherit from another function');
		}

		if (parentConstructor) {

			// Add this class to the parent's children property array
			if (!parentConstructor.children) {
				Blast.defineValue(parentConstructor, 'children', []);
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
				proto = Object.create(newConstructor.prototype);
				Collection.Object.inject(proto, parentConstructor.prototype);
			} else {
				proto = parentConstructor.prototype;
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

			// Get the parent constitutors and execute them
			if (_do_constitutors && parentConstructor.constitutors != null) {
				for (i = 0; i < parentConstructor.constitutors.length; i++) {
					newConstructor.constitute(parentConstructor.constitutors[i]);
				}
			}
		} else {
			parentConstructor = Function;
		}

		// See if `setMethod` is available, if not this means
		// Protoblast was loaded without modifying the native objects
		// So we add it to this extended class' constructor
		ensureConstructorStaticMethods(newConstructor);

		if (!targetPath) {
			// See if we need to set a namespace
			if (namespace == null) {
				if (parentConstructor.namespace && !newConstructor.namespace) {
					namespace = parentConstructor.namespace;
				}
			}

			if (namespace) {
				targetPath = namespace + '.' + newConstructor.name;
			} else {
				targetPath = newConstructor.name;
			}
		}

		// Store the new class in Blast
		Obj.setPath(Blast.Classes, targetPath, newConstructor);

		if (Blast.emit) {
			Blast.queueTick(function emitExtension() {

				var data = {
					type: 'extended',
					ancestor: parentConstructor.name,
					descendant: newConstructor.name,
					namespace: namespace
				};

				Blast.emit(data, parentConstructor, newConstructor, null);
			});
		}

		return newConstructor;
	});

	/**
	 * Do things to the class constructor once it's ready,
	 * and inherit to children
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.10
	 *
	 * @param    {Function}   constructor
	 * @param    {Function}   task
	 */
	Blast.defineStatic('Function', 'constitute', function constitute(constructor, task) {

		var tasks = constructor.constitutors;

		if (constructor.prototype.waitingConstitute) {
			constructor.prototype.waitingConstitute.push(task);
			return;
		}

		if (tasks == null) {
			tasks = [];
			Blast.defineValue(constructor, 'constitutors', tasks);
		}

		// Store the task for inherited classes
		tasks.push(task);

		// Execute the task on this constructor as soon as possible,
		// but after all the scripts have finished
		Blast.loaded(function doTask() {
			task.call(constructor);
		});
	});

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
	Blast.defineStatic('Function', 'staticCompose', function staticCompose(target, key, constructor, traits) {

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
	 * @version  0.1.4
	 *
	 * @param    {Mixed}      target
	 * @param    {String}     key            Name to use
	 * @param    {Function}   compositor
	 * @param    {Object}     traits
	 */
	Blast.defineStatic('Function', 'compose', function compose(target, key, compositor, traits) {

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
				result.compositorParent = this;
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

			(function(fnc, prop) {
				methodDefiner(target, prop, function trait() {
					return this[key][prop].apply(this[key], arguments);
				});
			}(fnc, prop));
		}
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
	Blast.defineStatic('Function', 'setStatic', function setStatic(target, _key, _value, _inherit) {

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
			if (inherit) addToStaticChain(target, keys[i], descriptor);
			Object.defineProperty(target, keys[i], descriptor);
		}
	});

	/**
	 * Set a static getter property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   target       Target object/function to use
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value OR value
	 * @param    {Function}   _setter      Function that sets the value
	 * @param    {Boolean}    _inherit     Let children inherit this (true)
	 */
	Blast.defineStatic('Function', 'setStaticProperty', function setStaticProperty(target, _key, _getter, _setter, _inherit) {

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
				set: setter,
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.4
	 *
	 * @param    {Function}   constructor  Constructor to modify prototype of
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _method      The method to set
	 *
	 * @return   {Function}
	 */
	Blast.defineStatic('Function', 'setMethod', function setMethod(constructor, _key, _method) {

		var existing,
		    method,
		    proto,
		    keys,
		    i;

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

		for (i = 0; i < keys.length; i++) {

			// Set a super reference only for the first given method
			if (i == 0) {
				// Get a possible existing value
				existing = proto[keys[0]];

				// If there already was something here, set it as this method's parent
				if (typeof existing !== 'undefined') {
					Blast.defineValue(method, 'super', existing);
				}
			}

			// If this constructor is waiting on another class
			if (proto.waitingForClass && proto.hasOwnProperty('waitingForClass')) {
				proto.waitingMethods.push([keys, method]);
				proto[keys[i]] = method;
				continue;
			}

			// Now set the method on the prototype
			Blast.defineValue(proto, keys[i], method);
		}

		return method;
	});

	/**
	 * Set a getter on the given prototype, or a simple value
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   constructor  Constructor to modify prototype of
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value OR value
	 * @param    {Function}   _setter      Function that sets the value
	 */
	Blast.defineStatic('Function', 'setProperty', function setProperty(constructor, _key, _getter, _setter) {

		var enumerable,
		    existing,
		    getter,
		    setter,
		    target,
		    config,
		    proto,
		    keys,
		    i;

		if (typeof constructor == 'function') {
			target = constructor.prototype;
			proto = true;
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
			keys = Collection.Array.cast(_key);
		}

		if (keys.length === 0 || !keys[0]) {
			throw new Error('Property must be set to a valid key');
		}

		if (typeof getter == 'function') {
			config = {
				get: getter,
				set: setter,
				enumerable: enumerable
			};
		} else {
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
	 * @version  0.1.5
	 *
	 * @param    {Function}   target       Target object or function
	 * @param    {String}     _key         Name to use (defaults to method name)
	 * @param    {Function}   _getter      Function that returns a value
	 */
	Blast.defineStatic('Function', 'prepareProperty', function prepareProperty(target, _key, _getter, _enumerable) {

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

			var doNext,
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
				for (i = 0; i < list.length; i++) {
					list[i]();
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
	 * Get all the children of a certain class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 *
	 * @return   {Array}
	 */
	Blast.defineStatic('Function', 'getChildren', function getChildren(constructor) {

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

	Blast.definePrototype('Function', 'extend', protoExtend);

	/**
	 * Set a static method/property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.2.0
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   value       The value to set
	 * @param    {Boolean}    inherit     Let children inherit this (true)
	 */
	var protoSetStatic = function setStatic(key, value, inherit) {
		return Fn.setStatic(this, key, value, inherit);
	};

	/**
	 * Set a static getter property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   getter      Function that returns a value OR value
	 * @param    {Function}   setter      Function that sets the value
	 * @param    {Boolean}    inherit     Let children inherit this (true)
	 */
	var protoSetStaticProperty = function setStaticProperty(key, getter, setter, inherit) {
		return Fn.setStaticProperty(this, key, getter, setter, inherit);
	};

	/**
	 * Set a prototype method
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}     key
	 * @param    {Function}   method
	 */
	var protoSetMethod = function setMethod(key, method) {
		return Fn.setMethod(this, key, method);
	};

	/**
	 * Set a prototype property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key
	 * @param    {Function}   getter
	 * @param    {Function}   setter
	 */
	var protoSetProperty = function setProperty(key, getter, setter) {
		return Fn.setProperty(this, key, getter, setter);
	};

	/**
	 * Prepare a property:
	 * the getter will supply the value on first get
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use (defaults to method name)
	 * @param    {Function}   getter      Function that returns a value
	 */
	var protoPrepareProperty = function prepareProperty(key, getter) {
		return Fn.prepareProperty(this.prototype, key, getter);
	};

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
	 * Compose a class as a property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use
	 * @param    {Function}   compositor
	 * @param    {Object}     traits
	 */
	var protoCompose = function compose(key, compositor, traits) {
		return Fn.compose(this.prototype, key, compositor, traits);
	};

	/**
	 * Compose a class as a static property
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}     key         Name to use
	 * @param    {Function}   compositor
	 * @param    {Object}     traits
	 */
	var protoStaticCompose = function staticCompose(key, compositor, traits) {
		return Fn.staticCompose(this, key, compositor, traits);
	};

	/**
	 * Do things to the class constructor once it's ready,
	 * and inherit to children
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {Function}   constructor
	 * @param    {Function}   task
	 */
	var protoConstitute = function constitute(task) {
		return Fn.constitute(this, task);
	};

	/**
	 * Get all the children of a certain class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.11
	 * @version  0.1.11
	 *
	 * @return   {Array}
	 */
	var protoGetChildren = function getChildren() {
		return Fn.getChildren(this);
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
			Blast.defineValue(newConstructor, 'prepareStaticProperty', protoPrepareStaticProperty);
			Blast.defineValue(newConstructor, 'setStaticProperty', protoSetStaticProperty);
			Blast.defineValue(newConstructor, 'prepareProperty', protoPrepareProperty);
			Blast.defineValue(newConstructor, 'staticCompose', protoStaticCompose);
			Blast.defineValue(newConstructor, 'getChildren', protoGetChildren);
			Blast.defineValue(newConstructor, 'setProperty', protoSetProperty);
			Blast.defineValue(newConstructor, 'constitute', protoConstitute);
			Blast.defineValue(newConstructor, 'setStatic', protoSetStatic);
			Blast.defineValue(newConstructor, 'setMethod', protoSetMethod);
			Blast.defineValue(newConstructor, 'compose', protoCompose);

			if (newConstructor.extend == null) {
				Blast.defineValue(newConstructor, 'extend', protoExtend);
			}
		}
	}

	Blast.definePrototype('Function', 'prepareStaticProperty', protoPrepareStaticProperty);
	Blast.definePrototype('Function', 'setStaticProperty', protoSetStaticProperty);
	Blast.definePrototype('Function', 'prepareProperty', protoPrepareProperty);
	Blast.definePrototype('Function', 'staticCompose', protoStaticCompose);
	Blast.definePrototype('Function', 'getChildren', protoGetChildren);
	Blast.definePrototype('Function', 'setProperty', protoSetProperty);
	Blast.definePrototype('Function', 'constitute', protoConstitute);
	Blast.definePrototype('Function', 'setStatic', protoSetStatic);
	Blast.definePrototype('Function', 'setMethod', protoSetMethod);
	Blast.definePrototype('Function', 'compose', protoCompose);

	var Fn = Blast.Collection.Function;
};