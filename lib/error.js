const ERROR = Symbol('error');

/**
 * The custom Error class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {String}   str
 */
var CustomError = Collection.Function.inherits(Error, 'Develry', function Error(message) {
	this[ERROR] = createDummyError(1 + this.constructor.inheritance_level);
	this.message = message;
});

/**
 * Prepend a string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Number}   level
 * @param    {String}   message
 *
 * @return   {Error}
 */
function createDummyError(level, message) {

	let original_stack_limit = Error.stackTraceLimit;

	// Increase the stack
	Error.stackTraceLimit += level;

	let result = new Error(message || '');

	Error.stackTraceLimit = original_stack_limit;

	return result;
}

/**
 * Prepend a string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Number}   level
 */
CustomError.setStatic(function createStackTrace(level, error) {

	let original_stack_limit = Error.stackTraceLimit,
	    header,
	    frames,
	    stack;

	if (level == null) {
		level = 1;
	}

	if (!error) {
		error = createDummyError(level);
	}

	stack = error.stack;

	if (Blast.userAgent && Blast.userAgent.family == 'firefox') {
		header = '';
		frames = stack.split('\n');
		frames = frames.slice(level).join('\n');
	} else {
		let index = stack.indexOf('    at');

		header = stack.slice(0, index - 1);
		frames = stack.slice(index).split('\n');

		frames = frames.slice(level).join('\n');
	}

	stack = frames;

	return stack;
});

/**
 * Set the correct inheritance level
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Number}   level
 */
CustomError.setStaticProperty(function inheritance_level() {

	let current = this,
	    result = 0;

	while (current.super) {
		result += 1;
		current = current.super;
	}

	return result;
});

/**
 * Get the stack property
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @type     {String}
 */
CustomError.enforceProperty(function stack(new_value) {

	if (new_value == null) {
		new_value = CustomError.createStackTrace(1 + this.constructor.inheritance_level, this[ERROR]);

		if (!Blast.userAgent || Blast.userAgent.family != 'firefox') {
			new_value = this.toString() + '\n' + new_value;
		}
	}

	return new_value;
});

/**
 * Get the name of this error
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @type     {String}
 */
CustomError.setProperty(function name() {
	return this.constructor.name;
});

/**
 * Revive a JSON-dried error
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Object}
 */
Blast.defineStatic('Error', function unDry(obj) {

	var result = new Error(obj.message);

	result.stack = obj.stack;

	return result;
});

/**
 * Return an object for json-drying this error
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.1.4
 *
 * @return   {Object}
 */
Blast.definePrototype('Error', function toDry() {
	return {
		value: {
			message: this.message,
			stack: this.stack
		},
		path: 'Error'
	};
});