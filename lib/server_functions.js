module.exports = function serverFunctions(Blast, extras) {

	const libpath = require('path'),
	      cnst = require('constants'),
	      fs  = require('fs'),
	      os  = require('os'),
	      fsp = fs.promises;

	const temp_paths_to_track = [],
	      RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

	// We break this string up so the Blast.convertCoverage doesn't find this
	const source_map_url_prefix = '//# sourceMappingURL' + '=data:application/json;charset=utf-8;base64,';

	let temp_tracker_created,
	    temp_dir,
	    cache = {};

	/**
	 * Server side: create client side file
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.1.1
	 * @version   0.7.2
	 *
	 * @param     {Object}   options
	 *
	 * @return    {Pledge}
	 */
	Blast.getClientPath = function getClientPath(options) {

		var refresh = false,
		    ua,
		    id;

		if (!options) {
			options = {};
		} else {
			if (options.ua) {
				ua = Blast.parseUseragent(options.ua);
				id = ua.family + '-' + ua.major + '.' + ua.minor;
			}

			if (options.refresh) {
				refresh = true;
			}
		}

		let create_source_map = options.create_source_map,
		    enable_coverage = options.enable_coverage;

		// If the source-map module couldn't be loaded, ignore it
		if (Blast.sourceMap === false) {
			create_source_map = false;
		}

		// If we want to add coverage, the sourcemap is required!
		if (enable_coverage) {
			create_source_map = true;

			if (!Blast.instrumentSource) {
				require('./coverage.js');
			}
		}

		// If we want to make a sourcemap, but the module hasn't been loaded
		// try to load it now
		if (create_source_map && Blast.sourceMap == null) {
			try {
				Blast.sourceMap = require('source-map');
			} catch (err) {
				create_source_map = false;
				Blast.sourceMap = false;
			}
		}

		if (!id) {
			id = 'full';
		}

		if (options.use_common) {
			id = 'common_' + id;
		} else if (options.modify_prototypes) {
			id = 'global_' + id;
		}

		if (enable_coverage) {
			id += '_cov';
		}

		if (cache[id] && !refresh) {
			return cache[id];
		}

		let extra_files = [],
		    compose_id = '',
		    extra,
		    i;

		// Now iterate over the extras
		for (i = 0; i < extras.length; i++) {
			extra = extras[i];

			if (!extra.client) {
				continue;
			}

			// See if we've been given a useragent
			if (ua && extra.versions && id != 'full' && id != 'full_common') {
				let entry = extra.versions[ua.family];

				// If the user's browser version is higher than the required max,
				// it is also not needed
				if (entry && ua.version.float > entry.max) {
					continue;
				}
			}

			extra_files.push(extra);
			compose_id += i + '-';
		}

		compose_id = Blast.Bound.Object.checksum(compose_id);

		if (enable_coverage) {
			compose_id += '_cov';
		}

		if (cache[compose_id] && !refresh) {
			cache[id] = cache[compose_id];
			return cache[id];
		}

		let files = [
			'init',
			'json-dry',
		];

		let code = '',
		    tasks = [];

		// The first file should be the template
		tasks.push(Blast.getCachedFile('client.js'));

		// Queue some basic, pre-wrapped files
		files.forEach(function eachFile(name, index) {

			var path;

			name = name.toLowerCase();

			if (name == 'json-dry') {
				path = require.resolve('json-dry');
			} else {
				path = libpath.resolve(__dirname, name + '.js');
			}

			tasks.push(function getFile(next) {
				Blast.getCachedFile(path).then(function gotCode(code) {

					let filename = name + '.js';

					var data = 'require.register("' + filename + '", function(module, exports, require){\n';
					data += code;
					data += '});\n';

					let result = {
						start    : 1, // Starts at 1 for the `require` line
						code     : data,
						filename : filename,
						name_id  : name,
						name     : name,
						path     : path,
						source   : null
					};

					if (create_source_map) {
						result.source = code;
					}

					next(null, result);
				}).catch(next);
			});
		});

		extra_files.forEach(function eachExtraFile(options) {
			tasks.push(function getExtraFile(next) {
				Blast.getCachedFile(options.path).then(function gotCode(code) {

					let source,
					    start = 0;

					if (create_source_map) {
						source = code;
					}

					if (options.add_wrapper !== false) {

						if (options.add_wrapper || code.slice(0, 14) != 'module.exports') {
							// Add 1 line for the `register` line
							start++;

							let data = 'module.exports = function(';

							if (options.arguments) {
								data += Blast.getArgumentConfiguration(options.arguments).names.join(',');
							} else {
								data += 'Blast, Collection, Bound, Obj, Fn';
							}

							data += ') {\n';

							code = data + code + '\n};';
						}
					}

					let name = options.name_id || options.name,
					    filename = libpath.basename(options.path);

					code = 'require.register("' + name + '", function(module, exports, require){\n'
					     + code
					     + '});\n';

					// Add 1 line for the `require` line
					start++;

					let result = {
						start    : start,
						code     : code,
						filename : filename,
						name     : options.name,
						name_id  : options.name_id,
						path     : options.path,
						source   : null
					};

					if (create_source_map) {
						result.source = source;
					}

					next(null, result);

				}).catch(next);
			});
		});

		cache[id] = new Blast.Classes.Pledge();
		cache[compose_id] = cache[id];

		Blast.Bound.Function.parallel(tasks, async function gotFiles(err, files) {

			if (err) {
				return cache[id].reject(err);
			}

			let current_line,
			    sourcemap,
			    template = files.shift(),
			    temp_file,
			    index    = template.indexOf('//_REGISTER_//'),
			    code     = '',
			    file,
			    i;

			try {
				temp_file = await Blast.openTempFile({prefix: 'clientfile_', suffix: '.js'});
			} catch (err) {
				return cache[id].reject(err);
			}

			let template_start = template.slice(0, index),
			    template_offset = Blast.Bound.String.count(template_start, '\n');

			if (create_source_map) {
				sourcemap = new Blast.sourceMap.SourceMapGenerator({
					file       : libpath.basename(temp_file.path),
					sourceRoot : ''
				});
			}

			for (i = 0; i < files.length; i++) {
				file = files[i];

				if (code) {
					code += '\n';
				}

				if (create_source_map) {
					// Count the current line we're on
					current_line = template_offset + Blast.Bound.String.count(code, '\n');
				}

				if (typeof file == 'string') {

					let path = libpath.resolve(__dirname, 'client.js');

					code += file;

					if (create_source_map) {
						// Ugly hack for the client.js file
						file = {
							start  : 0,
							code   : file,
							source : file,
							path   : path,
							name   : 'blast_template_client.js'
						};
					}
				} else {
					code += file.code;
				}

				if (create_source_map) {

					let filename = file.name;

					if (filename.indexOf('.js') == -1) {
						filename += '.js';
					}

					filename = file.path;

					sourcemap.setSourceContent(filename, file.source);

					let target_line = current_line + (file.start || 0),
					    char_start,
					    char_end,
					    tokens,
					    lines = file.source.split('\n'),
					    line,
					    i,
					    j;

					for (i = 0; i < lines.length; i++) {
						line = lines[i];
						tokens = Blast.Bound.Function.tokenize(line, false);
						char_start = 0;

						for (j = 0; j < tokens.length; j++) {
							char_end = char_start + tokens[j].length;

							sourcemap.addMapping({
								source    : filename,
								original  : {line: 1 + i, column: char_start},
								generated : {line: target_line + i + 1, column: char_start},
								name      : tokens[j]
							});

							char_start = char_end;
						}
					}
				}
			}

			if (options.use_common) {
				code += '\nuse_common = true;\n';
			} else if (options.modify_prototypes) {
				code += '\nmodify_prototypes = true;\n';
			}

			let client_extras = [];

			extra_files.forEach(function eachExtraFile(options) {
				if (options.client === false || options.is_extra === false) {
					return;
				}

				client_extras.push([options.name_id, options.arguments]);
			});

			code += '\nclient_extras = ' + JSON.stringify(client_extras) + ';\n';

			template = template_start + code + template.slice(index);

			let cut_rx = /\/\/\s?PROTOBLAST\s?START\s?CUT([\s\S]*?)(\/\/\s?PROTOBLAST\s?END\s?CUT)/gm;

			// Remove everything between "PROTOBLAST START CUT" and "PROTOBLAST END CUT" (with slashes)
			if (create_source_map) {
				// Instead of actually cutting the code when making a sourcemap,
				// the code is commented
				template = template.replace(cut_rx, function doReplace(match) {

					let result = '',
					    lines = match.split('\n'),
					    line,
					    i;

					for (i = 0; i < lines.length; i++) {

						if (i) {
							result += '\n';
						}

						line = lines[i];
						result += '// ' + line;
					}

					return result;
				});

				let sourcemap_64 = Buffer.from(sourcemap.toString()).toString('base64');
				let inline_source_map = source_map_url_prefix + sourcemap_64;

				template += '\n' + inline_source_map;

			} else {
				template = template.replace(cut_rx, '');
			}

			if (enable_coverage) {
				template = Blast.instrumentSource(template, 'test_path.js', JSON.parse(sourcemap.toString())).code;
			}

			fs.writeFile(temp_file.path, template, err => {

				if (err) {
					return cache[id].reject(err);
				}

				cache[id].resolve(temp_file.path);
			});
		});

		return cache[id];
	};

	/**
	 * Get a file and cache it
	 *
	 * @author    Jelle De Loecker   <jelle@develry.be>
	 * @since     0.7.0
	 * @version   0.7.0
	 *
	 * @param     {String}   path
	 *
	 * @return    {Promise}
	 */
	Blast.getCachedFile = function getCachedFile(path) {

		if (path[0] != '/') {
			path = libpath.resolve(__dirname, path);
		}

		return new Promise(function doReadFile(resolve, reject) {
			fs.readFile(path, 'utf8', function gotResult(err, data) {

				if (err) {
					return reject(err);
				}

				resolve(data);
			});
		});
	};

	/**
	 * Normalize mkdir options
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string|object}   options
	 *
	 * @return    {object}
	 */
	function normalizeMkdirOptions(options) {

		if (typeof options == 'string' || typeof options == 'number') {
			options = {
				mode : options
			};
		} else if (!options) {
			options = {
				mode : parseInt('0777', 8)
			};
		}

		options.recursive = true;

		return options;
	};

	/**
	 * Handle possible mkdir errors
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Error}   err
	 * @param     {Pledge}  pledge   The pledge (if it is not syncrhonous)
	 *
	 * @return    {*}
	 */
	function handleMkdirError(path, options, err, pledge) {

		if (!err) {
			return;
		}

		if (err && (path == '/' || (path.length == 3 && path[1] == ':'))) {
			return;
		}

		if (pledge) {
			pledge.reject(err);
			return true;
		}

		throw err;
	};

	/**
	 * Create a directory
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 * @param     {object}   options
	 *
	 * @return    {Pledge}
	 */
	Blast.mkdirp = function mkdirp(path, options, callback) {

		if (typeof options == 'function') {
			callback = options;
			options = null;
		}

		let pledge = new Blast.Classes.Pledge();

		options = normalizeMkdirOptions(options);
		pledge.done(callback);

		fs.mkdir(path, options, (err, created_path) => {

			if (handleMkdirError(path, options, err, pledge)) {
				return;
			}

			pledge.resolve(created_path);
		});

		return pledge;
	};

	/**
	 * Create a directory synchronously
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 * @param     {object}   options
	 *
	 * @return    {string}
	 */
	Blast.mkdirpSync = function mkdirpSync(path, options) {

		let created_path;

		options = normalizeMkdirOptions(options);

		try {
			created_path = fs.mkdirSync(path, options);
		} catch (err) {
			created_path = handleMkdirError(path, options, err);
		}

		return created_path;
	};

	const rm_options = {
		// Do not throw an error when the path does not exist
		force      : true,

		// If it's a directory, remove all its contents too
		recursive  : true,

		// If any target is busy, retry up to 10 times
		maxRetries : 10,

		// Wait 100ms before retrying
		retryDelay : 100,
	};

	const has_rm = typeof fsp.rm == 'function';

	/**
	 * Remove a file/directory and all its contents
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 * @param     {Function} callback
	 *
	 * @return    {Pledge}
	 */
	Blast.rmrf = function rmrf(path, callback) {

		let promise;

		// The `rm` method was only added in node v14
		if (has_rm) {
			promise = fsp.rm(path, rm_options)
		} else {
			// In earlier node versions, `rmdir` behaved a lot like the new `rm`
			promise = fsp.rmdir(path, rm_options);
		}

		let pledge = Blast.Classes.Pledge.cast(promise);

		if (callback) {
			pledge.done(callback);
		}

		return pledge;
	};

	/**
	 * Old rmrfsync for pre-v14 node
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 */
	function oldRmrfSync(path) {

		// We need to make sure the target is not a file on windows
		if (process.platform === 'win32') {
			try {
				let stat = fs.statSync(path);

				if (stat.isFile()) {
					fs.unlinkSync(path);
					return;
				}

			} catch (err) {
				// It's ok if the file does not exist
				if (err.code == 'ENOENT') {
					return;
				}

				throw err;
			}

			return
		}

		return fs.rmdirSync(path, rm_options);
	};

	/**
	 * Remove a file/directory and all its contents
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 */
	Blast.rmrfSync = function rmrfSync(path) {
		if (has_rm) {
			return fs.rmSync(path, rm_options);
		}

		return oldRmrfSync(path);
	};

	/**
	 * Track the given temp path
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 */
	function trackTempPath(path) {
		temp_paths_to_track.push(path);

		if (!temp_tracker_created) {
			temp_tracker_created = true;

			process.addListener('exit', () => {
				Blast.cleanupTempPathsSync();
			});
		}
	}

	/**
	 * Get the temp_dir Protoblast will use
	 * (Created synchronously upon first get)
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}   options
	 *
	 * @return    {string}
	 */
	Object.defineProperty(Blast, 'temp_dir', {
		get: function getTempDir() {

			if (!temp_dir) {
				// Temporarily set it to the os.tmpdir() for recursive reasons
				temp_dir = os.tmpdir();

				temp_dir = Blast.createTempDirSync({
					prefix: 'protoblast_'
				});
			}

			return temp_dir;
		},
		set: function setTempDir(value) {

			if (!value) {
				value = os.tmpdir();
			}

			return temp_dir = value;
		},
		enumerable: true,
		configurable: true
	});

	/**
	 * Generate a temporary path without actually creating it.
	 * It will still be cleaned up on exit.
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}   options
	 *
	 * @return    {string}
	 */
	Blast.generateTempPath = function generateTempPath(options) {

		if (typeof options == 'string') {
			options = {
				prefix : options,
			};
		} else if (!options || typeof options != 'object') {
			options = {};
		}

		// Get the target temporary dir
		let tmpdir = options.dir || Blast.temp_dir,
		    name;

		if (options.prefix) {
			name = options.prefix;
		} else {
			name = '';
		}

		name += Date.now() + '_' + Blast.Classes.Crypto.randomHex(4);

		if (options.suffix) {
			name += options.suffix;
		}

		let path = libpath.join(tmpdir, name);

		if (options.track !== false) {
			trackTempPath(path);
		}

		return path;
	};

	/**
	 * Create a temp directory
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}     options
	 * @param     {Function}   callback   Optional callback
	 *
	 * @return    {Pledge}
	 */
	Blast.createTempDir = function createTempDir(options, callback) {

		if (typeof options == 'function') {
			callback = options;
			options = null;
		}

		let pledge = new Blast.Classes.Pledge(),
		    path = Blast.generateTempPath(options),
		    mode = 0o700;

		if (options.mode != null) {
			mode = options.mode;
		}

		pledge.done(callback);

		Blast.mkdirp(path, mode, err => {

			if (err) {
				pledge.reject(err);
			} else {
				pledge.resolve(path);
			}

		});

		return pledge;
	};

	/**
	 * Create a temp directory synchronously
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}     options
	 *
	 * @return    {string}
	 */
	Blast.createTempDirSync = function createTempDirSync(options) {

		let path = Blast.generateTempPath(options),
		    mode = 0o700;

		if (options && options.mode != null) {
			mode = options.mode;
		}

		return Blast.mkdirpSync(path, mode);
	};

	/**
	 * Open a temp file
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}     options
	 * @param     {Function}   callback   Optional callback
	 *
	 * @return    {Pledge}
	 */
	Blast.openTempFile = function openTempFile(options, callback) {

		if (typeof options == 'function') {
			callback = options;
			options = null;
		}

		let pledge = new Blast.Classes.Pledge(),
		    path = Blast.generateTempPath(options);

		pledge.done(callback);

		fs.open(path, RDWR_EXCL, 0o600, (err, fd) => {

			if (err) {
				return pledge.reject(err);
			}

			pledge.resolve({path, fd});
		});

		return pledge;
	};

	/**
	 * Open a temp file synchronously
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}   options
	 *
	 * @return    {Object}
	 */
	Blast.openTempFileSync = function openTempFileSync(options) {
		let path = Blast.generateTempPath(options),
		    fd = fs.openSync(path, RDWR_EXCL, 0o600);

		return {path, fd};
	};

	/**
	 * Delete all temp paths
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @return    {Pledge}
	 */
	Blast.cleanupTempPaths = function cleanupTempPaths() {

		let tasks = [];

		Blast.temp_dir = null;

		while (temp_paths_to_track.length) {
			let path = temp_paths_to_track.shift();

			tasks.push((next) => {
				Blast.rmrf(path, next);
			});
		}

		return Blast.Collection.Function.parallel(4, tasks);
	};

	/**
	 * Delete all temp paths synchronously
	 *
	 * @author    Jelle De Loecker   <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 */
	Blast.cleanupTempPathsSync = function cleanupTempPathsSync() {

		Blast.temp_dir = null;

		while (temp_paths_to_track.length) {
			let path = temp_paths_to_track.shift();
			Blast.rmrfSync(path);
		}
	};
};