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
};