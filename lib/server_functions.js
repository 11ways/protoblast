module.exports = function serverFunctions(Blast, extras) {

	const REQUIRE_CACHE = new Map(),
	      libmodule = require('module'),
	      libpath = require('path'),
	      libvm = require('vm'),
	      cnst = require('constants'),
	      fs  = require('fs'),
	      os  = require('os'),
	      fsp = fs.promises,
	      Fn = Blast.Collection.Function;

	const temp_paths_to_track = [],
	      is_windows = process.platform === 'win32',
	      RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

	// We break this string up so the Blast.convertCoverage doesn't find this
	const source_map_url_prefix = '//# sourceMappingURL' + '=data:application/json;charset=utf-8;base64,';

	let temp_tracker_created,
	    temp_dir,
	    client_file_cache = {};

	/**
	 * Server side: create client side file
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.1.1
	 * @version   0.8.0
	 *
	 * @param     {Object}   options
	 *
	 * @return    {Pledge}
	 */
	Blast.getClientPath = function getClientPath(options) {

		let get_tokens = false,
		    refresh = false,
		    tokens,
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

		if (options.create_source_map || options.debug) {
			if (options.depropertize == null) {
				options.depropertize = false;
			}

			if (options.destringify == null) {
				options.destringify = false;
			}
		}

		if (options.depropertize == null || options.depropertize === true) {
			options.depropertize = {};
		}

		if (options.depropertize) {
			options.depropertize = Object.assign({
				setMethod       : true,
				setStatic       : true,
				setProperty     : true,
				enforceProperty : true,
				constitute      : true,
			}, options.depropertize);
		}

		if (options.destringify == null) {
			options.destringify = true;
		}

		get_tokens = !!(options.destringify || options.depropertize);

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

		if (client_file_cache[id] && !refresh) {
			return client_file_cache[id];
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

		if (client_file_cache[compose_id] && !refresh) {
			client_file_cache[id] = client_file_cache[compose_id];
			return client_file_cache[id];
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
		for (let name of files) {

			let path;

			name = name.toLowerCase();

			if (name == 'json-dry') {
				path = require.resolve('json-dry');
			} else {
				path = libpath.resolve(__dirname, name + '.js');
			}

			tasks.push(function getFile(next) {
				Blast.getCachedFile(path).then(function gotCode(code) {

					let filename = name + '.js';

					var data = 'Æ("' + filename + '", function(module, exports, require, Blast, Classes, Types, Collection, Bound, Obj, Fn){\n';
					data += code;
					data += '\n/**/});\n';

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
		};

		extra_files = sortExtraFiles(extra_files);

		for (let options of extra_files) {
			tasks.push(function getExtraFile(next) {

				if (options.resolver) {
					Classes.Pledge.done(options.resolver(), (err, result) => {

						if (err) {
							return next(err);
						}

						gotCode(''+result);
					});
				} else {
					Blast.getCachedFile(options.path).then(gotCode).catch(next);
				}

				function gotCode(code) {

					let source,
					    start = 0;

					if (create_source_map) {
						source = code;
					}

					let argument_configuration = Blast.getArgumentConfiguration(options.arguments);

					let name = options.name_id || options.name,
					    filename;
					
					if (options.path) {
						filename = libpath.basename(options.path);
					} else {
						filename = '';
					}

					code = 'Æ("' + name + '", function(module, exports, require, ' + argument_configuration.names.join(', ') + '){\n'
					     + code
					     + '\n/**/});\n';

					// Add 1 line for the `require` line
					start++;

					let result = {
						start    : start,
						code     : code,
						filename : filename,
						name     : options.name,
						name_id  : options.name_id,
						path     : options.path || '',
						source   : null
					};

					if (create_source_map && !options.resolver) {
						result.source = source;
					}

					next(null, result);

				}
			});
		};

		client_file_cache[id] = new Blast.Classes.Pledge();
		client_file_cache[compose_id] = client_file_cache[id];

		Fn.parallel(tasks, async (err, files) => {

			if (err) {
				return client_file_cache[id].reject(err);
			}

			try {
				await handleFiles(files);
			} catch (err) {
				return client_file_cache[id].reject(err);
			}
		});

		async function handleFiles(files) {

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
				return client_file_cache[id].reject(err);
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

				if (create_source_map && file.source) {

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
						tokens = Fn.tokenize(line, false);
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

				// Skip files without a valid name
				if (!options.name_id) {
					return;
				}

				client_extras.push([options.name_id, options.arguments]);
			});

			code += '\nclient_extras = ' + JSON.stringify(client_extras) + ';\n';

			template = template_start + code + template.slice(index);

			if (get_tokens) {
				tokens = Fn.tokenize(template, false);

				if (options.depropertize) {
					tokens = Blast.depropertizeCode(tokens, {
						properties: options.depropertize,
						return_tokens: true,
					});
				}

				if (options.destringify) {
					tokens = Blast.destringifyCode(tokens, {
						return_tokens : true,
						depropertize  : options.depropertize,
					});
				}

				template = tokens.join('');
			}

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

			fs.writeFile(temp_file.fd, template, err => {

				// Whatever happens: close the file
				Blast.closeFd(temp_file.fd);

				if (err) {
					return client_file_cache[id].reject(err);
				}

				client_file_cache[id].resolve(temp_file.path);
			});
		}

		return client_file_cache[id];
	};

	/**
	 * Sort the "extra_files" array
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.8.0
	 * @version   0.8.0
	 *
	 * @param     {Array}   files
	 *
	 * @return    {Array}
	 */
	function sortExtraFiles(files) {

		let parents = files.filter(file => !file.after),
		    children = files.filter(file => !!file.after),
		    child,
		    index,
		    size,
		    i;

		while (children.length) {
			size = children.length;

			for (i = 0; i < size; i++) {
				child = children.shift();
				index = parents.findIndex(parent => {
					let found = parent.name.includes(child.after);

					if (!found && parent.path) {
						found = parent.path.includes(child.after);
					}

					return found;
				});

				if (index == -1) {
					children.push(child);
				} else {
					parents.splice(index + 1, 0, child);
				}
			}

			// Children size didn't change, so don't iterate over them again
			if (size === children.length) {

				// Dump them all at the end
				for (i = 0; i < size; i++) {
					parents.push(children[i]);
				}

				break;
			}
		}

		return parents;
	}

	/**
	 * Get a file and cache it
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.0
	 * @version   0.9.0
	 *
	 * @param     {string}   path
	 *
	 * @return    {Promise}
	 */
	Blast.getCachedFile = function getCachedFile(path) {

		if (!path) {
			throw new Error('Blast.getCachedFile() requires a valid `path` argument');
		}

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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string|object}   options
	 *
	 * @return    {Object}
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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.11
	 *
	 * @param     {string}   path
	 * @param     {Object}   options
	 *
	 * @return    {Pledge<string>}
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

			pledge.resolve(path);
		});

		return pledge;
	};

	/**
	 * Create a directory synchronously
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 * @param     {Object}   options
	 *
	 * @return    {string}   Return the same path again
	 */
	Blast.mkdirpSync = function mkdirpSync(path, options) {

		options = normalizeMkdirOptions(options);

		try {
			fs.mkdirSync(path, options);
		} catch (err) {
			handleMkdirError(path, options, err);
		}

		return path;
	};

	const rm_options = {
		// Do not throw an error when the path does not exist
		force      : true,

		// If it's a directory, remove all its contents too
		recursive  : true,

		// If any target is busy, retry up to 5 times
		maxRetries : 5,

		// Wait 100ms before retrying
		retryDelay : 100,
	};

	const has_rm = typeof fsp.rm == 'function';

	/**
	 * Remove a file/directory and all its contents
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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
	 * Old rmrfsync for pre-v14 node & EPERM issues
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 * @param     {Error}    original_err
	 */
	function oldRmrfSync(path, original_err) {

		// We need to make sure the target is not a file on windows
		if (is_windows) {
			let stat;

			try {
				stat = fs.statSync(path);

				if (stat.isFile()) {
					fs.unlinkSync(path);
					return;
				}

			} catch (err) {
				// It's ok if the file does not exist
				if (err.code == 'ENOENT') {
					return;
				}

				if (err.code == 'EPERM' && !original_err) {
					return fixWinEPERMSync(path, stat, err);
				}

				throw err;
			}
		}

		return fs.rmdirSync(path, rm_options);
	};

	/**
	 * Handle EPERM errors on Windows
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {string}   path
	 * @param     {Object}   stat
	 * @param     {Error}    err
	 */
	function fixWinEPERMSync(path, stat, err) {

		fs.chmodSync(path, 0o666);

		try {
			return oldRmrfSync(path, err);
		} catch (new_error) {
			throw new_error;
		}
	};

	/**
	 * Remove a file/directory and all its contents
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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

		if (!tmpdir) {
			throw new Error('Unable to generate temp path without a root directory');
		}

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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.25
	 *
	 * @param     {Object}     options
	 * @param     {Function}   callback   Optional callback
	 *
	 * @return    {Pledge<string>}
	 */
	Blast.createTempDir = function createTempDir(options, callback) {

		if (typeof options == 'function') {
			callback = options;
			options = null;
		}

		let pledge = new Blast.Classes.Pledge(),
		    path = Blast.generateTempPath(options),
		    mode = options?.mode || 0o700;

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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.11
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

		Blast.mkdirpSync(path, mode);

		return path;
	};

	/**
	 * Open a temp file
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}     options
	 * @param     {Function}   callback   Optional callback
	 *
	 * @return    {Pledge<Object>}
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
	 * @author    Jelle De Loecker <jelle@elevenways.be>
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
	 * Create a temp file (but do not leave it open)
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}     options
	 * @param     {Function}   callback   Optional callback
	 *
	 * @return    {Pledge<String>}
	 */
	Blast.createTempFile = function createTempFile(options, callback) {

		let pledge = new Blast.Classes.Pledge();

		pledge.done(callback);

		this.openTempFile(options, (err, info) => {

			if (err) {
				return pledge.reject(err);
			}

			fs.close(info.fd, (err) => {
				pledge.resolve(info.path);
			});
		});

		return pledge;
	};

	/**
	 * Create a temp file (but do not leave it open) synchronously
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @param     {Object}     options
	 *
	 * @return    {string}
	 */
	Blast.createTempFileSync = function createTempFileSync(options) {
		let info = this.openTempFileSync(options);
		fs.closeSync(info.fd);
		return info.path;
	};

	/**
	 * Delete all temp paths
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 *
	 * @return    {Pledge}
	 */
	Blast.cleanupTempPaths = function cleanupTempPaths() {

		let tasks = [];

		Blast.temp_dir = null;
		client_file_cache = {};

		while (temp_paths_to_track.length) {
			let path = temp_paths_to_track.shift();

			tasks.push((next) => {
				Blast.rmrf(path, next);
			});
		}

		return Fn.parallel(4, tasks);
	};

	/**
	 * Delete all temp paths synchronously
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 */
	Blast.cleanupTempPathsSync = function cleanupTempPathsSync() {

		Blast.temp_dir = null;
		client_file_cache = {};

		while (temp_paths_to_track.length) {
			let path = temp_paths_to_track.shift();
			Blast.rmrfSync(path);
		}
	};

	/**
	 * Close a file descriptor
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.7.10
	 * @version   0.7.10
	 */
	Blast.closeFd = function closeFd(fd, callback) {

		if (!callback) {
			callback = Fn.dummy;
		}

		return fs.close(fd, callback);
	};

	/**
	 * Depropertize code
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.8.15
	 * @version   0.8.15
	 */
	Blast.depropertizeCode = function depropertizeCode(code, options) {

		let before_varname,
		    properties = options.properties,
		    new_code = '',
		    property,
		    applied = {},
		    previous,
		    varname,
		    tokens,
		    count = 0,
		    token,
		    index,
		    type,
		    next,
		    i;

		if (typeof code == 'string') {
			tokens = Fn.tokenize(code, false);
		} else {
			tokens = code;
		}

		for (property in properties) {
			if (!properties[property]) {
				continue;
			}

			count++;
			applied[property] = 0;

			index = -1;

			// We currently have to use short method names,
			// because terser refuses to mangle arrow function variables
			// when keep_fnames is enabled
			//let helper_method = '__$$depropertize_' + property;
			let helper_method = 'Þ' + count.toString(36);

			do {
				index = tokens.indexOf(property, index + 1);

				if (index == -1) {
					break;
				}

				previous = tokens[index - 1];

				if (previous != '.') {
					continue;
				}

				next = tokens[index + 1];

				if (next != '(') {
					continue;
				}

				before_varname = tokens[index - 3];

				if (before_varname) {

					if (!before_varname.trim()) {
						before_varname = tokens[index - 4];
					}

					if (before_varname.trim()) {
						type = Fn.getTokenType(before_varname);

						if (type == 'punct') {
							continue;
						}
					}
				}

				varname = tokens[index - 2];

				if (Fn.getTokenType(varname) != 'name') {
					continue;
				}

				token = tokens[index];

				tokens[index - 2] = '';
				tokens[index - 1] = '';
				tokens[index] = helper_method;
				tokens[index + 1] = '(' + varname + ', ';

				applied[property]++;

			} while (index != -1);

			if (!applied[property]) {
				continue;
			}

			// No newline, it has to remain on the same line
			new_code += `const ` + helper_method + ` = (target, ...args) => target.${property}(...args);`;
		}

		index = tokens.indexOf('//_DEPROPERTIZECODE_//');

		if (index > -1) {
			tokens.splice(index, 0, new_code);
		}

		if (options.return_tokens) {
			return tokens;
		}

		return tokens.join('');
	};

	/**
	 * Destringify code
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.8.15
	 * @version   0.8.15
	 */
	Blast.destringifyCode = function destringifyCode(code, options) {

		let tokens;

		if (typeof code == 'string') {
			tokens = Fn.tokenize(code, false);
		} else {
			tokens = code;
		}

		if (!options) {
			options = {};
		}

		let symbol_name_indexes = [],
		    remove_symbol_names = options.remove_symbol_names ?? true,
		    previous_type,
		    current_type,
		    depropertize = !!options.depropertize,
		    property_map = new Map(),
		    string_map = new Map(),
		    usage_map = new Map(),
		    first_char,
		    next_type,
		    last_char,
		    is_string,
		    new_code = 'const ',
		    replaced = 0,
		    new_name,
		    previous,
		    indexes,
		    index,
		    token,
		    next,
		    i;

		for (i = 0; i < tokens.length; i++) {
			token = tokens[i];
			first_char = token[0];
			is_string = false;

			if (first_char == '"' || first_char == "'") {
				is_string = true;
			}

			// The replaced variable names will be 3 characters long + 1 comma
			if (token.length < 4) {
				continue;
			}

			last_char = token[token.length - 1];

			if (last_char != first_char) {
				is_string = false;
			}

			if (is_string) {
				current_type = 'string';
			} else if (!depropertize) {
				continue;
			} else {
				current_type = Fn.getTokenType(token);
			}

			previous = tokens[i - 1];
			previous_type = Fn.getTokenType(previous);

			if (previous_type == 'name') {
				continue;
			}

			if (previous_type == 'whitespace') {
				previous = tokens[i - 2];
				previous_type = Fn.getTokenType(previous);
			}

			if (!is_string) {
				if (previous != '.' && previous != '?.') {
					continue;
				}
			}

			next = tokens[i + 1];
			next_type = Fn.getTokenType(next);

			if (next_type == 'whitespace') {
				next = tokens[i + 2];
				next_type = Fn.getTokenType(next);
			}

			if (next_type == 'name') {
				continue;
			}

			if (next == ':') {
				if (previous != 'case') {
					continue;
				}
			}

			if (remove_symbol_names && previous == '(' && next == ')') {
				let method_name = tokens[i - 2];

				if (method_name == 'Symbol') {
					let before_method_name = tokens[i - 3];

					if (before_method_name != '.') {
						symbol_name_indexes.push(i);
						continue;
					}
				}
			}

			if (!is_string) {
				token = "'" + token + "'";
			} else if (first_char == '"' && !token.includes("'")) {
				token = "'" + token.slice(1, -1) + "'";
			}

			indexes = string_map.get(token);

			// Always add at least an empty array of indexes to the string map
			if (!indexes) {
				indexes = [];
				string_map.set(token, indexes);
			}

			if (is_string) {
				indexes.push(i);
			} else {
				indexes = property_map.get(token);

				if (!indexes) {
					indexes = [];
					property_map.set(token, indexes);
				}

				indexes.push(i);
			}

			indexes = usage_map.get(token);

			if (!indexes) {
				indexes = [];
				usage_map.set(token, indexes);
			}

			indexes.push(i);
		}

		let sorted = [];

		for (let [string, string_indexes] of string_map) {

			indexes = usage_map.get(string);

			// Ignore strings that are only used once
			if (indexes.length < 2) {
				continue;
			}

			if (indexes.length < 8 && string.length < 5) {
				continue;
			}

			sorted.push({
				string           : string,
				string_indexes   : string_indexes,
				property_indexes : property_map.get(string),
				count            : indexes.length,
			});
		}

		// Sort them so that the ones that get used the most
		// will get the shortest placeholder
		sorted.sort((a, b) => {
			return b.count - a.count;
		});

		// Re-use the string map for mapping
		string_map = new Map();
		options.string_map = string_map;

		for (let {string, string_indexes, property_indexes} of sorted) {

			if (replaced) {
				new_code += '\n, ';
			}

			new_name = 'Ø' + replaced.toString(36);
			replaced++;

			new_code += new_name + ' = ' + string + '';

			string_map.set(string, new_name);

			for (i = 0; i < string_indexes.length; i++) {
				index = string_indexes[i];
				tokens[index] = new_name;
			}

			if (!property_indexes?.length) {
				continue;
			}

			for (i = 0; i < property_indexes.length; i++) {
				index = property_indexes[i];
				tokens[index] = '[' + new_name + ']';

				if (tokens[index - 1] === '.') {
					tokens[index - 1] = '';
				}
			}
		}

		if (remove_symbol_names) {
			// Remove all symbol names
			for (index of symbol_name_indexes) {
				tokens[index] = '';
			}
		}

		if (replaced) {
			new_code += ';';

			index = tokens.indexOf('//_DESTRINGIFYCODE_//');

			if (index > -1) {
				tokens.splice(index, 0, new_code);
			}
		}

		if (options.return_tokens) {
			return tokens;
		}

		return tokens.join('');
	};

	/**
	 * Require a file via the VM module
	 *
	 * @author    Jelle De Loecker <jelle@elevenways.be>
	 * @since     0.9.0
	 * @version   0.9.0
	 */
	Blast.requireFileViaVm = function requireFileViaVm(path, options) {

		let cached = REQUIRE_CACHE.get(path);

		if (cached) {
			return cached.exports;
		}

		let custom_arguments = options?.arguments;
		let source = fs.readFileSync(path, 'utf8');
		let argument_config = Blast.getArgumentConfiguration(custom_arguments);

		let module = {
			exports: {},
		};

		REQUIRE_CACHE.set(path, module);

		let head = '(function(module, exports, require, __dirname, __filename, ' + argument_config.names.join(', ') + ') {"use strict";\n';

		let exported_function = libvm.runInThisContext(head + source + '\n/**/})', {
			filename: path,
			lineOffset: -1,
		});

		let args = [
			module,
			module.exports,
			libmodule.createRequire(path),
			libpath.dirname(path),
			libpath.basename(path),
			...argument_config.values,
		];

		exported_function(...args);

		return module.exports;
	};
};
