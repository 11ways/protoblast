/* istanbul ignore file */
const fs = require('fs');

let Blast = __Protoblast,
    source_map_url_prefix = '//# sourceMappingURL' + '=data:application/json;charset=utf-8;base64,';

/**
 * Convert puppeteer character-based coverage into line-column coverage
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.7.2
 * @version   0.7.2
 *
 * @param     {Array}   coverage
 *
 * @return    {Array}
 */
Blast.convertCoverage = async function convertCoverage(coverage, keep_absolute) {

	if (Blast.sourceMap == null) {
		Blast.sourceMap = require('source-map');
	}

	if (Blast.sourceMap === false) {
		throw new Error('The source-map module could not be found');
	}

	let new_coverage = [],
	    current_file,
	    source_lines,
	    new_ranges = [],
	    new_entry,
	    ranges,
	    result = [],
	    source,
	    entry,
	    index,
	    range,
	    start,
	    end,
	    pos,
	    map;

	if (keep_absolute == null) {
		keep_absolute = false;
	}

	for (entry of coverage) {
		source = entry.text;

		// We require an inline sourcemap
		// if it's not there, ignore the file
		index = source.indexOf(source_map_url_prefix);

		if (index == -1) {
			continue;
		}

		// Parse the sourcemap
		map = source.slice(index + source_map_url_prefix.length);
		map = Buffer.from(map, 'base64').toString('utf-8');
		map = await new Blast.sourceMap.SourceMapConsumer(map);

		// Convert the absolute char-index based ranges
		// to line-column ranges instead
		ranges = convertIndexRangesToLines(entry.ranges, source.slice(0, index), map);
		ranges = ranges.ranges;

		for (range of ranges) {

			// Get the original position
			start = map.originalPositionFor(range.start);

			if (!start.source) {
				continue;
			}

			end = map.originalPositionFor(range.end);

			// If the source doesn't match, start a new file!
			if (start.source != current_file) {
				current_file = start.source;
				new_ranges = [];

				new_entry = {
					// @TODO: should be some path?
					url    : start.source,
					text   : map.sourceContentFor(start.source),
					ranges : new_ranges,
				};

				source_lines = new_entry.text.split('\n');
				new_coverage.push(new_entry);
			}

			if (keep_absolute) {
				start = getAbsoluteIndex(source_lines, start);
				end   = getAbsoluteIndex(source_lines, end, true);
			}

			if (start == null || end == null) {
				continue;
			}

			new_ranges.push({
				start : start,
				end   : end
			});
		}
	}

	return new_coverage;
};

/**
 * Instrument source code using istanbul
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.7.2
 * @version   0.7.2
 *
 * @param    {string}   source
 * @param    {string}   path
 * @param    {Object}   sourcemap
 *
 * @return   {Object}
 */
Blast.instrumentSource = function instrumentSource(source, path, sourcemap) {

	if (Blast.istanbulInstrumenter == null) {
		let instrument = require('istanbul-lib-instrument');

		Blast.istanbulInstrumenter = instrument.createInstrumenter({
			autoWrap : true,
			coverageVariable: '__coverage__',
			coverageGlobalScope : 'this',
			coverageGlobalScopeFunc: true,
			esModules: true,
			embedSource: true,
			parserPlugins: [
				'asyncGenerators',
				'bigInt',
				'classProperties',
				'classPrivateProperties',
				'dynamicImport',
				'importMeta',
				'objectRestSpread',
				'optionalCatchBinding'
			],
			compact: true,
			preserveComments: true,
		});
	}

	let code = Blast.istanbulInstrumenter.instrumentSync(source, path, sourcemap);

	return {
		code          : code,
		file_coverage : Blast.istanbulInstrumenter.lastFileCoverage()
	};
};

/**
 * Create istanbul coverage info
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.7.2
 * @version   0.7.2
 *
 * @param     {Array}   coverage
 *
 * @return    {Object}
 */
Blast.createIstanbulCoverage = function createIstanbulCoverage(coverage) {

	let file_coverage,
	    branch_result,
	    statement,
	    result = {},
	    branch,
	    entry,
	    start,
	    end,
	    loc,
	    id;

	for (entry of coverage) {

		if (entry.url.indexOf('base.js') == -1) {
			continue;
		}

		// Instrument the source code
		file_coverage = Blast.instrumentSource(entry.text, entry.url).file_coverage;

		file_coverage.path = entry.url;

		// Map the statements
		for (id in file_coverage.statementMap) {
			statement = file_coverage.statementMap[id];
			start = statement.start;
			end = statement.end;

			file_coverage.s[id] = hasRangeBeenCovered(entry.ranges, start, end);
		}

		// Map the functions?
		for (id in file_coverage.fnMap) {
			statement = file_coverage.fnMap[id];
			start = statement.decl.start;
			end = statement.decl.end;

			file_coverage.f[id] = hasRangeBeenCovered(entry.ranges, start, end);
		}

		// And the branches...
		for (id in file_coverage.branchMap) {
			branch = file_coverage.branchMap[id];
			branch_result = [];

			for (loc of branch.locations) {
				branch_result.push(hasRangeBeenCovered(entry.ranges, loc.start, loc.end));
			}

			file_coverage.b[id] = branch_result;
		}

		result[entry.url] = file_coverage;
	}

	fs.writeFileSync('./.nyc_output/protoblast.json', JSON.stringify(result, null, '\t'));

	return result;
};

/**
 * See if the given start & end range has been covered
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.7.2
 * @version   0.7.2
 *
 * @param     {Array}   ranges
 * @param     {Object}  start
 * @param     {Object}  end
 *
 * @return    {number}
 */
function hasRangeBeenCovered(ranges, start, end) {

	let result = 0,
	    range;

	for (range of ranges) {

		if (start.line < range.start.line) {
			continue;
		}

		if (start.line == range.start.line && start.column < range.start.column) {
			continue;
		}

		if (end.line > range.end.line) {
			continue;
		}

		if (end.line == range.end.line && end.column > range.end.column) {
			continue;
		}

		result = 1;
	}

	return result;
}

/**
 * Get the absolute index of the given position in the given source lines
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.7.2
 * @version   0.7.2
 *
 * @param     {Array}      ranges
 * @param     {string}     source
 * @param     {SourceMap}  map
 *
 * @return    {Object}
 */
function getAbsoluteIndex(source_lines, position, for_end) {

	if (!position || position.line == null) {

		if (for_end) {
			// Probably means till the end of the file
			position = {
				line   : source_lines.length,
				column : source_lines[source_lines.length - 1].length - 1
			};
		} else {
			return null;
		}
	}

	let result = 0,
	    line,
	    i;

	for (i = 0; i < source_lines.length; i++) {
		line = source_lines[i];

		if (position.line > i + 1) {
			result += line.length + 1;
		} else if (position.line == i + 1) {

			// @TODO: fix column positioning
			if (for_end && position.column == 0) {
				result += line.length - 1;
			} else {
				result += position.column;
			}

			break;
		}
	}

	return result;
}

/**
 * Convert index ranges to line-columns
 *
 * @author    Jelle De Loecker <jelle@elevenways.be>
 * @since     0.7.2
 * @version   0.7.2
 *
 * @param     {Array}      ranges
 * @param     {string}     source
 * @param     {SourceMap}  map
 *
 * @return    {Object}
 */
function convertIndexRangesToLines(ranges, source, map) {

	let found_start,
	    found_end,
	    new_ranges = [],
	    current = 0,
	    lines = source.split('\n'),
	    range,
	    line,
	    i,
	    j;

	// First split the sourcecode into lines
	for (i = 0; i < lines.length; i++) {
		line = lines[i];

		lines[i] = {
			start : current,
			end   : (current += line.length + 1),
			line  : i + 1, // Sourcemaps line numbers start at 1!
			text  : line,
		};
	}

	for (i = 0; i < ranges.length; i++) {
		range = ranges[i];
		found_start = false;
		found_end = false;

		for (j = 0; j < lines.length; j++) {
			line = lines[j];

			if (!found_start && range.start >= line.start && range.start <= line.end) {
				range.start = {
					index  : range.start,
					line   : line.line,
					column : range.start - line.start,
				};
				found_start = true;
			}

			if (!found_end && range.end >= line.start && range.end <= line.end) {
				range.end = {
					index  : range.end,
					line   : line.line,
					column : range.end - line.start,
				};
				found_end = true;
			}

			if (found_start && found_end) {
				break;
			}
		}

		// Uhoh, we didn't find the end?
		// Just use the last found line then?
		if (!found_end) {
			range.end = {
				index  : range.end,
				line   : line.line,
				column : range.end,
			};
		}

		// If a map is given, see if the start & end is in the same file
		// If not we should split it up
		if (map) {

			let position_start = map.originalPositionFor(range.start),
			    position_end   = map.originalPositionFor(range.end);

			// The start & end files don't match
			if (position_start.source && position_end.source && position_start.source != position_end.source) {

				// Lookup each line and see which file it belongs to
				let line_nr = 1,
				    positions,
				    last_line = line_nr,
				    first_pos,
				    last_col = range.start.column,
				    last_pos,
				    ori_pos,
				    temp;

				do {
					positions = temp;

					// We have to lookup each line in the ORIGINAL
					// source file
					ori_pos = {
						line   : line_nr++,
						source : position_start.source
					};

					temp = map.allGeneratedPositionsFor(ori_pos);

				} while (temp && temp.length);

				last_pos = positions[positions.length - 1];

				let new_range = {
					start : range.start,
					end   : {
						// We don't have the real column for now,
						// so just add another line and set the column to 0
						line   : last_pos.line,
						column : last_pos.column
					}
				};

				// We can safely push the new range for the first file
				new_ranges.push(new_range);

				// Now let's do the second file
				positions = map.allGeneratedPositionsFor({
					line   : 1,
					source : position_end.source
				});

				first_pos = positions[0];

				// And overwrite the second range, it'll get pushed later
				range = {
					start : {
						line   : first_pos.line,
						column : first_pos.column,
					},
					end : range.end
				};
			}
		}

		new_ranges.push(range);
	}

	let result = {
		ranges : new_ranges,
		lines  : lines,
	};

	return result;
}