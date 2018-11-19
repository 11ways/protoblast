module.exports = function BlastTypesArray(Blast, Collection, Bound, Obj) {

	if (!Blast.Globals.TypedArray) {
		Blast.Globals.TypedArray = Object.getPrototypeOf(Uint8Array);
	}

	/**
	 * Decode a yencoded string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.3
	 * @version  0.6.3
	 *
	 * @return   {Uint8Array}
	 */
	Blast.defineStatic('TypedArray', function deyencode(str) {

		var buf,
		    res,
		    ck = false,
		    i = 0,
		    c;

		buf = new ArrayBuffer(str.length);
		res = new Uint8Array(buf);

		for (i = 0; i < str.length; i++) {
			c = str.charCodeAt(i);

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

};