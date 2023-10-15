module.exports = function(Blast) {
	if (Blast.isBun) {
		const fs = require('fs'),
		      libpath = require('path'),
		      vm = require('vm');

		let modulep = Blast._bun_modulep;

		modulep.original_wrap = modulep.wrap = function(script) {
			return modulep.wrapper[0] + script + modulep.wrapper[1];
		};

		modulep.original_wrapper = modulep.wrapper = [
			'(function (exports, require, module, __filename, __dirname) { ',
			'\n});'
		];

		modulep.strict_wrapper = modulep.original_wrapper[0] + '"use strict";';

		return function _require(module_id) {
			
			let path = Bun.resolveSync(module_id, __dirname);

			if (path.indexOf('/bun-vfs') === 0 || path.indexOf('node:') === 0) {
				return require(module_id);
			}

			if (module_id == path && path.indexOf('/') === -1) {
				return require(module_id);
			}

			let source;

			try {
				source = fs.readFileSync(path, 'utf8');
			} catch (err) {
				if (err.code == 'ENOENT') {
					return require(module_id);
				}

				throw err;
			}

			let module_dir = libpath.dirname(path);

			let wrapped = modulep.wrap(source);

			// At the time of writing, Bun still basically just does an eval,
			// and ignores the `filename` option
			let fnc = vm.runInThisContext(wrapped, {
				filename : path,
			});

			let module = {
				exports : {}
			};

			let module_exports = module.exports;

			fnc(module_exports, _require, module, path, module_dir);

			return module.exports;
		};
	} else {
		return require;
	}
}