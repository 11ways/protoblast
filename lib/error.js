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
	result.trace_depth = level;

	Error.stackTraceLimit = original_stack_limit;

	return result;
}

/**
 * Create a stack trace string
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Number}   level
 * @param    {Error}    error
 *
 * @return   {String}
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

	if (new_value === undefined && this.capture_stack !== false) {
		let skip_levels = this[ERROR].trace_depth || 1 + this.constructor.inheritance_level;

		if (this[Symbol.for('extra_skip_levels')]) {
			skip_levels += this[Symbol.for('extra_skip_levels')];
		}

		new_value = CustomError.createStackTrace(skip_levels, this[ERROR]);

		if (!Blast.userAgent || Blast.userAgent.family != 'firefox') {
			new_value = this.toString() + '\n' + new_value;
		}
	}

	// If the given value was null, turn it back into undefined
	// This will re-get the stack on next get
	if (new_value == null) {
		return undefined;
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
 * Capture a new stacktrace
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.1
 * @version  0.7.1
 */
CustomError.setMethod(function captureStackTrace() {
	this[ERROR] = createDummyError(1);
	this.capture_stack = true;
	this.stack = null;
});

/**
 * Set extra skip level
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.1
 * @version  0.7.1
 *
 * @param    {Number}   amount
 */
CustomError.setMethod(function skipTraceLines(amount) {
	this[Symbol.for('extra_skip_levels')] = amount || 0;
});

/**
 * Revive a JSON-dried error
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.1
 *
 * @param    {Object}   obj
 *
 * @return   {Error}
 */
Fn.setStatic(Error, function unDry(obj) {
	return Object.assign(new this, obj);
});

/**
 * Return an object for json-drying this error
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.4
 * @version  0.7.1
 *
 * @return   {Object}
 */
Blast.definePrototype('Error', function toDry() {

	let properties = this.properties_to_serialize || ['message', 'stack'],
	    values = {},
	    i;

	for (i = 0; i < properties.length; i++) {
		values[properties[i]] = this[properties[i]];
	}

	return {
		value : values
	};
});

const V8_NAMED_ANON_LINE = /at (.*?) \((?:.*?):(?:\d*):(?:\d*)\), (.*?):(\d*):(\d*)\)/,
      V8_NAMED_LINE = /at (.*?) \((.*?):(\d*):(\d*)\)/,
      V8_ANON_LINE = /at (.*?):(\d*):(\d*)/,
      FX_LINE = /(.*?)@(.*):(\d*):(\d*)/,
      UNKNOWN = 'unknown';

/**
 * Parse an error's stacktrace
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.13
 * @version  0.7.25
 *
 * @param    {Error|string}   error
 *
 * @return   {Array<Object>}
 */
Blast.defineStatic('Error', function parseStack(error) {

	if (!error) {
		return {};
	}

	let stack,
	    is_v8;

	if (typeof error == 'string') {
		stack = error;
	} else {
		stack = error.stack || '';
	}

	// Turn the stack string into an array
	let result = [],
	    lines = stack.split('\n'),
	    temp,
	    line,
	    i;

	if (stack.indexOf('\n    at ') > -1) {
		is_v8 = true;
		i = 1;
	} else {
		i = 0;
	}

	for (; i < lines.length; i++) {
		line = lines[i];

		if (is_v8) {

			// Skip extra lines
			if (line.indexOf(' at ') == -1) {
				continue;
			}

			if (line.indexOf('(') > -1) {

				temp = V8_NAMED_ANON_LINE.exec(line);

				if (!temp) {
					temp = V8_NAMED_LINE.exec(line);
				}
			} else {
				temp = V8_ANON_LINE.exec(line);

				if (temp) {
					temp.splice(1, 0, 'anonymous');
				}
			}
		} else {
			// It's probably firefox
			temp = FX_LINE.exec(line);

			if (temp && !temp[1]) {
				temp[1] = 'anonymous';
			}
		}

		if (!temp) {
			temp = ['', UNKNOWN, UNKNOWN, UNKNOWN, UNKNOWN];
		}

		result.push({
			// Chrome includes the instance name (Instance.method),
			// firefox does not
			name : temp[1],
			path : temp[2],
			file : temp[2].split(/\/|\\/g).pop(),
			line : +temp[3],
			char : +temp[4],
		});
	}

	return result;
});

Blast.Classes.EvalError = EvalError;
Blast.Classes.RangeError = RangeError;
Blast.Classes.ReferenceError = ReferenceError;
Blast.Classes.SyntaxError = SyntaxError;
Blast.Classes.TypeError = TypeError;
Blast.Classes.URIError = URIError;
Blast.Classes.AggregateError = Blast.Globals.AggregateError;