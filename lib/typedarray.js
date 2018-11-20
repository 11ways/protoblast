module.exports = function BlastTypesArray(Blast, Collection, Bound, Obj) {

	if (!Blast.Globals.TypedArray) {
		Blast.Globals.TypedArray = Object.getPrototypeOf(Uint8Array);
	}

	/**
	 * Yencode a buffer
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('TypedArray', function yencode() {

		var output = '',
		    converted,
		    arr,
		    i;

		arr = new Uint8Array(this.buffer || this);

		for (i = 0; i < arr.length; i++) {
			converted = (arr[i] + 42) % 256;

			switch (converted) {
				case 0:
				case 10:
				case 13:
				case 61:
					converted = (converted + 64) % 256;
					output += '=';
			}

			output += String.fromCharCode(converted);
		}

		return output;
	});

	/**
	 * Decode a yencoded buffer
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {Uint8Array}
	 */
	Blast.definePrototype('TypedArray', function deyencode() {

		var source = this,
		    buf,
		    res,
		    ck = false,
		    i = 0,
		    c;

		if (!(source instanceof Uint8Array)) {
			source = new Uint8Array(source.buffer || source);
		}

		buf = new ArrayBuffer(source.length);
		res = new Uint8Array(buf);

		for (i = 0; i < source.length; i++) {
			c = source[i];

			// Ignore newlines
			if (c === 13 || c === 10) {
				continue;
			}

			// Equal signs are flags
			if (c === 61 && !ck) {
				ck = true;
				continue;
			}

			if (ck) {
				ck = false;
				c = c - 64;
			}

			if (c < 42 && c > 0) {
				c += 214;
			} else {
				c -= 42;
			}

			res[i] = c;
		}

		return res;
	});

	/**
	 * Pack the values to 12bit
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {Uint8Array}
	 */
	Blast.definePrototype('TypedArray', function pack12bit() {

		var source = this,
		    result,
		    val,
		    i,
		    j;

		if (!(source instanceof Uint16Array)) {
			source = new Uint16Array(source.buffer || source);
		}

		result = new Uint8Array(source.length * 3);

		for (i = 0, j = 0; i < source.length; i++) {
			val = source[i];

			if (i % 2 == 0) {
				result[j++] = val & 0xFF;
				result[j] = (val >> 8 | result[j] & 0xF0);
			} else {
				result[j] = result[j] & 0x0F | val << 4;
				j++;
				result[j] = val >> 4;
				j++;
			}
		}

		return result.slice(0, j + 1);
	});

	/**
	 * Unpack a 12bit packed Uint8Array and return a Uint16Array
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {Uint16Array}
	 */
	Blast.definePrototype('TypedArray', function unpack12bit() {

		var source = this,
		    length,
		    result,
		    val,
		    i,
		    j;

		if (!(source instanceof Uint8Array)) {
			source = new Uint8Array(source.buffer || source);
		}

		length = ~~(source.length * 2 / 3);
		result = new Uint16Array(length);

		for (i = 0, j = 0; i < length; i++) {

			if (i % 2 == 0) {
				val = source[j + 1] << 8 & 0x0F00 | source[j];
			} else {
				val = source[j+2] << 4 | source[j+1] >> 4;
				j += 3;
			}

			result[i] = val;
		}

		return result;
	});

	/**
	 * Compress with LZW
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {Uint8Array}
	 */
	Blast.definePrototype('TypedArray', function compressWithLZW() {

		var dictionary = Object.create(null),
		    dict_size  = 256,
		    result     = new Uint16Array(this.length * 2),
		    wc,
		    w = '',
		    c,
		    i,
		    j = 0;

		for (i = 0; i < dict_size; i++) {
			dictionary[String.fromCharCode(i)] = i;
		}

		for (i = 0; i < this.length; i++) {
			c = String.fromCharCode(this[i]);
			wc = w + c;

			if (dictionary[wc] != null) {
				w = wc;
			} else {
				result[j++] = dictionary[w];

				if (dict_size < 4096) {
					// Add the new, longer string to the dictionary
					dictionary[wc] = dict_size++;
				}

				w = c;
			}
		}

		if (w !== '') {
			result[j++] = dictionary[w];
		}

		// Strip off the unused bytes
		result = result.slice(0, j);

		return Bound.TypedArray.pack12bit(result);
	});

	/**
	 * Decompress from LZW
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @param    {Boolean}   unpack   Unpack the values first [true]
	 *
	 * @return   {Uint8Array}
	 */
	Blast.definePrototype('TypedArray', function decompressFromLZW(unpack) {

		var dictionary = [],
		    dict_size  = 256,
		    result = [],
		    source = this,
		    entry = '',
		    i,
		    j,
		    k,
		    w;

		if ((unpack || unpack == null) && source instanceof Uint8Array) {
			source = Bound.TypedArray.unpack12bit(source);
		} else if (!(source instanceof Uint16Array)) {
			source = new Uint16Array(source.buffer || source);
		}

		for (i = 0; i < dict_size; i++) {
			dictionary[i] = [i];
		}

		// Get the first value
		w = dictionary[source[0]];
		result[0] = w[0];

		for (i = 1; i < source.length; i++) {
			k = source[i];

			if (dictionary[k]) {
				entry = dictionary[k];
			} else {
				if (k === dict_size) {
					entry = w.slice(0);
					entry.push(w[0]);
				} else {
					return null;
				}
			}

			for (j = 0; j < entry.length; j++) {
				result.push(entry[j]);
			}

			// Add w + entry[0] to the dictionary
			dictionary[dict_size] = w.slice(0);
			dictionary[dict_size].push(entry[0]);

			dict_size++;
			w = entry;
		}

		result = new Uint8Array(result);

		return result;
	});
};