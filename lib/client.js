(function() {
	"use strict";

	//_DESTRINGIFYCODE_//

	let modify_prototypes,
	    client_extras = [],
	    use_common;

	function require(p, arg_config) {

		let path = require.resolve(p),
		    mod  = require.modules[path];

		if (!mod) {
			throw new Error('failed to require "' + p + '"');
		}

		if (!mod.exports) {
			mod.exports = {};

			let extra_values = arg_config?.values || [];

			mod.call(mod.exports, mod, mod.exports, require.relative(path), ...extra_values);
		}

		return mod.exports;
	}

	require.modules = {};

	require.resolve = function resolve(path) {
		let orig = path,
		    reg = path + '.js',
		    index = path + '/index.js';

		return require.modules[reg] && reg
			|| require.modules[index] && index
			|| orig;
	};

	const Æ = require.register = function register(path, fn){
		require.modules[path] = fn;
	};

	require.relative = function relative(parent) {
		return function gotRelative(p, arg_config) {

			if ('.' != p.substr(0, 1)) {
				return require(p, arg_config);
			}

			let path = parent.split('/'),
			    segs = p.split('/');

			path.pop();

			for (var i = 0; i < segs.length; i++) {
				var seg = segs[i];
				if ('..' == seg) path.pop();
				else if ('.' != seg) path.push(seg);
			}

			return require(path.join('/'), arg_config);
		};
	};

	//_DEPROPERTIZECODE_//
	//_REGISTER_//

	if (use_common) {
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = require('init.js');
		} else {
			self.Protoblast = require('init.js');
		}
	} else {
		self.Protoblast = require('init.js')(modify_prototypes);
	}

}());