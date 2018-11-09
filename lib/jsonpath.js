module.exports = function BlastPath(Blast, Collection) {

	var internalJPCache = {},
	    vm;

	try {
		vm = require('vm');
	} catch (err) {
		vm = {
			runInNewContext: function(expr, context) { with (context) return eval(expr); }
		};
	}

	function push(arr, elem) { arr = arr.slice(); arr.push(elem); return arr; }
	function unshift(elem, arr) { arr = arr.slice(); arr.unshift(elem); return arr; }

	/**
	 * Extract data from objects using JSONPath
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {String}   expr   The string expression
	 */
	function JSONPath(expression, options) {

		if (!options || typeof options != 'object') {
			options = {};
		}

		if (!options.resultType) {
			options.resultType = 'value';
		}

		if (typeof options.flatten == 'undefined') {
			options.flatten = false;
		}

		if (typeof options.wrap == 'undefined') {
			options.wrap = true;
		}

		if (typeof options.sandbox == 'undefined') {
			options.sandbox = {};
		}

		this.expression = expression;
		this.options = options;
		this.resultType = options.resultType;
	};

	/**
	 * Compile a string expression
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {String}   expr   The string expression
	 * 
	 * @return    {Array}
	 */
	Blast.defineValue(JSONPath.prototype, function normalize(expr) {

		var normalized,
		    exprList,
		    subx;

		if (internalJPCache[expr]) return internalJPCache[expr];

		subx = [];

		normalized = expr.replace(/[\['](\??\(.*?\))[\]']/g, function($0,$1){return "[#"+(subx.push($1)-1)+"]";})
						.replace(/'?\.'?|\['?/g, ";")
						.replace(/(;)?(\^+)(;)?/g, function(_, front, ups, back) { return ';' + ups.split('').join(';') + ';'; })
						.replace(/;;;|;;/g, ";..;")
						.replace(/;$|'?\]|'$/g, "");

		exprList = normalized.split(';').map(function(expr) {
			var match = expr.match(/#([0-9]+)/);
			return !match || !match[1] ? expr : subx[match[1]];
		});

		return internalJPCache[expr] = exprList;
	});

	/**
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {String}   path
	 * 
	 * @return    {String}
	 */
	Blast.defineValue(JSONPath.prototype, function asPath(path) {

		var i, p, x;

		x = path;
		p = '$';

		for (i = 1, n = x.length; i < n; i++) {
			p += /^[0-9*]+$/.test(x[i]) ? ("["+x[i]+"]") : ("['"+x[i]+"']");
		}

		return p;
	});

	/**
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.2.0
	 * 
	 * @return    {Array}
	 */
	Blast.defineValue(JSONPath.prototype, function trace(expr, val, path) {

		var that = this,
		    result,
		    ea,
		    i;

		// no expr to follow? return path and value as the result of this trace branch
		if (!expr.length) return [{path: path, value: val}];

		var loc = expr[0], x = expr.slice(1);
		// the parent sel computation is handled in the frame above using the
		// ancestor object of val
		if (loc === '^') return path.length ? [{path: path.slice(0,-1), expr: x, isParentSelector: true}] : [];

		// we need to gather the return value of recursive trace calls in order to
		// do the parent sel computation.
		var ret = [];
		function addRet(elems) { ret = ret.concat(elems); }

		if (val && val.hasOwnProperty(loc)) // simple case, directly follow property
			addRet(that.trace(x, val[loc], push(path, loc)));
		else if (loc === "*") { // any property
			that.walk(loc, x, val, path, function(m,l,x,v,p) {
				addRet(that.trace(unshift(m, x), v, p)); });
		}
		else if (loc === "..") { // all chid properties
			addRet(that.trace(x, val, path));
			that.walk(loc, x, val, path, function(m,l,x,v,p) {
				if (typeof v[m] === "object")
					addRet(that.trace(unshift("..", x), v[m], push(p, m)));
			});
		}
		else if (loc[0] === '(') { // [(expr)]
			addRet(that.trace(unshift(that.eval(loc, val, path[path.length], path),x), val, path));
		}
		else if (loc.indexOf('?(') === 0) { // [?(expr)]
			that.walk(loc, x, val, path, function(m,l,x,v,p) {
				if (that.eval(l.replace(/^\?\((.*?)\)$/,"$1"),v[m],m, path))
					addRet(that.trace(unshift(m,x),v,p));
			});
		}
		else if (loc.indexOf(',') > -1) { // [name1,name2,...]
			for (var parts = loc.split(','), i = 0; i < parts.length; i++)
				addRet(that.trace(unshift(parts[i], x), val, path));
		}
		else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) { // [start:end:step]  python slice syntax
			addRet(that.slice(loc, x, val, path));
		}

		result = [];

		// we check the resulting values for parent selections. for parent
		// selections we discard the value object and continue the trace with the
		// current val object
		for (i = 0; i < ret.length; i++) {
			ea = ret[i];

			if (ea.isParentSelector) {
				result.push(that.trace(ea.expr, val, ea.path));
			} else {
				result.push(ea);
			}
		}

		return result;
	});

	/**
	 * Walk over the entries in a certain object
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @since     0.1.0
	 * @version   0.1.0
	 */
	Blast.defineValue(JSONPath.prototype, function walk(loc, expr, val, path, f) {

		var i, m, n;

		if (Array.isArray(val)) {
			for (i = 0, n = val.length; i < n; i++)
				f(i, loc, expr, val, path);
		} else if (typeof val === "object") {
			for (var m in val) {
				if (val.hasOwnProperty(m)) {
					f(m, loc, expr, val, path);
				}
			}
		}
	});

	/**
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @return    {Array}
	 */
	Blast.defineValue(JSONPath.prototype, function slice(loc, expr, val, path) {
		if (!Array.isArray(val)) return;
		var len = val.length, parts = loc.split(':'),
			 start = (parts[0] && parseInt(parts[0])) || 0,
			 end = (parts[1] && parseInt(parts[1])) || len,
			 step = (parts[2] && parseInt(parts[2])) || 1;
		start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
		end   = (end < 0)   ? Math.max(0,end+len)   : Math.min(len,end);
		var ret = [];
		for (var i = start; i < end; i += step)
			ret = ret.concat(this.trace(unshift(i,expr), val, path));
		return ret;
	});

	/**
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @since     0.1.0
	 * @version   0.1.0
	 */
	Blast.defineValue(JSONPath.prototype, function eval(code, _v, _vname, path) {
		if (!$ || !_v) return false;
		if (code.indexOf("@path") > -1) {
			this.sandbox["_path"] = this.asPath(path.concat([_vname]));
			code = code.replace(/@path/g, "_path");
		}
		if (code.indexOf("@") > -1) {
			this.sandbox["_v"] = _v;
			code = code.replace(/@/g, "_v");
		}
		try {
			return vm.runInNewContext(code, this.sandbox);
		}
		catch(e) {
			console.log(e);
			throw new Error("jsonPath: " + e.message + ": " + code);
		}
	});

	/**
	 * Execute this path on the given object
	 *
	 * @author    Stefan Goessner    <goessner.net>
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.0
	 * @version   0.1.0
	 *
	 * @param     {Object}   obj   The object to apply the path to
	 * 
	 * @return    {Array}
	 */
	Blast.defineValue(JSONPath.prototype, function exec(obj, resultType) {

		var that = this,
		    valOrPath,
		    exprList,
		    result,
		    traced,
		    temp,
		    i;

		if (!resultType) {
			resultType = 'value';
		}

		exprList = this.normalize(this.expression);
		if (exprList[0] === "$" && exprList.length > 1) exprList.shift();

		traced = this.trace(exprList, obj, ["$"]);

		temp = [];

		for (i = 0; i < traced.length; i++) {
			if (!traced[i].isParentSelector) {
				temp.push(traced[i]);
			}
		}

		if (!temp.length) {
			return this.wrap ? [] : false;
		}

		if (temp.length === 1 && !this.wrap && !Array.isArray(temp[0].value)) {
			return temp[0][resultType] || false;
		}

		result = [];

		for (i = 0; i < temp.length; i++) {

			valOrPath = temp[i][resultType];

			if (resultType === 'path') valOrPath = this.asPath(valOrPath);

			if (that.flatten && Array.isArray(valOrPath)) {
				result = result.concat(valOrPath);
			} else {
				result.push(valOrPath);
			}
		}

		return result;
	});

	Blast.defineClass('JSONPath', JSONPath);
};