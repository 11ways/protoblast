module.exports = function serverFunctions(Blast, extras) {

	const libpath = require('path'),
	      fs = require('fs'),
	      os = require('os');

	// We break this string up so the Blast.convertCoverage doesn't find this
	const source_map_url_prefix = '//# sourceMappingURL' + '=data:application/json;charset=utf-8;base64,';

	let tmpdir = fs.mkdtempSync(libpath.resolve(os.tmpdir(), 'protoblast')),
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

		Blast.Bound.Function.parallel(tasks, function gotFiles(err, files) {

			if (err) {
				return cache[id].reject(err);
			}

			let current_line,
			    sourcemap,
			    template = files.shift(),
			    index    = template.indexOf('//_REGISTER_//'),
			    filename = libpath.resolve(tmpdir, compose_id + '.js'),
			    code     = '',
			    file,
			    i;

			let template_start = template.slice(0, index),
			    template_offset = Blast.Bound.String.count(template_start, '\n');

			if (create_source_map) {
				sourcemap = new Blast.sourceMap.SourceMapGenerator({
					file       : compose_id + '.js',
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

			let retries = 0;

			function retryWithTempdir(filename, template) {
				retries++;

				fs.mkdtemp(libpath.resolve(os.tmpdir(), 'protoblast'), function madeDir(err, result) {

					if (err) {
						return cache[id].reject(err);
					}

					tmpdir = result;
					filename = libpath.resolve(tmpdir, compose_id + '.js');

					writeFile(filename, template);
				});
			}

			function writeFile(filename, template) {
				fs.writeFile(filename, template, function written(err) {

					if (err) {

						if (retries == 0) {
							return retryWithTempdir(filename, template);
						}

						return cache[id].reject(err);
					}

					cache[id].resolve(filename);
				});
			}

			writeFile(filename, template);
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
	Blast.mkdirp = function mkdirp(path, options) {

		let pledge = new Blast.Classes.Pledge();

		options = normalizeMkdirOptions(options);

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
	 * @return    {Pledge}
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
};