module.exports = function BlastCompression(Blast, Collection) {

	'use strict';

	var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	    utfMap = [-1, 16383, 8191, 4095, 2047, 1023, 511, 255, 127, 63, 31, 15, 7, 3, 1],
	    f = String.fromCharCode,
	    i;

	/**
	 * Compress the string using `String.compress`,
	 * but encode the UTF-16 result using Base64.
	 * (For safe transportation, no url-encoding problems)
	 *
	 * Can be safely stored inside any localStorage.
	 *
	 * Warning: output is 166% bigger than `String.compress`
	 *
	 * @author   Pieroxy <pieroxy@pieroxy.net>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   input   The string to compress
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'compressToBase64', function compressToBase64(input) {

		var charcode,
		    output,
		    length,
		    chr1,
		    chr2,
		    chr3,
		    enc1,
		    enc2,
		    enc3,
		    enc4,
		    i;

		if (input == null) {
			return '';
		}

		i = 0;
		output = '';

		input = Collection.String.compress(input);
		length = input.length;

		while (i < length*2) {

			if (i%2==0) {

				charcode = input.charCodeAt(i/2);

				chr1 = charcode >> 8;
				chr2 = charcode & 255;

				if (i/2+1 < length) {
					chr3 = input.charCodeAt(i/2+1) >> 8;
				} else{
					chr3 = NaN;
				}

			} else {

				chr1 = input.charCodeAt((i-1)/2) & 255;

				if ((i+1)/2 < length) {

					charcode =input.charCodeAt((i+1)/2);

					chr2 = charcode >> 8;
					chr3 = charcode & 255;
				} else
					chr2=chr3=NaN;
			}
			i+=3;

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (chr2 != chr2) {
				enc3 = enc4 = 64;
			} else if (chr3 != chr3) {
				enc4 = 64;
			}

			output = output
			       + keyStr.charAt(enc1) + keyStr.charAt(enc2)
			       + keyStr.charAt(enc3) + keyStr.charAt(enc4);
		}

		return output;
	});

	/**
	 * Decompress a Base64 compressed string
	 *
	 * @author   Pieroxy <pieroxy@pieroxy.net>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   input   The string to decompress
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'decompressFromBase64', function decompressFromBase64(input) {

		if (input == null) return '';

		var output = '',
		    ol = 0,
		    output_,
		    chr1, chr2, chr3,
		    enc1, enc2, enc3, enc4,
		    i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

		while (i < input.length) {

			enc1 = keyStr.indexOf(input.charAt(i++));
			enc2 = keyStr.indexOf(input.charAt(i++));
			enc3 = keyStr.indexOf(input.charAt(i++));
			enc4 = keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			if (ol%2==0) {
				output_ = chr1 << 8;

				if (enc3 != 64) {
					output += f(output_ | chr2);
				}
				if (enc4 != 64) {
					output_ = chr3 << 8;
				}
			} else {
				output = output + f(output_ | chr1);

				if (enc3 != 64) {
					output_ = chr2 << 8;
				}
				if (enc4 != 64) {
					output += f(output_ | chr3);
				}
			}
			ol+=3;
		}

		return Collection.String.decompress(output);
	});

	/**
	 * Compress the string using `String.compress`,
	 * but only use 15bits of storage per character,
	 * instead of the full 16.
	 *
	 * Can be safely stored inside any localStorage.
	 *
	 * Warning: output is 6.66% bigger than `String.compress`
	 *
	 * @author   Pieroxy <pieroxy@pieroxy.net>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   input   The string to compress
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'compressToUTF16', function compressToUTF16(input) {

		if (input == null) return '';

		var output = '',
		    current,
		    status = 0,
		    state,
		    i,c,

		input = Collection.String.compress(input);

		for (i=0 ; i<input.length ; i++) {

			c = input.charCodeAt(i);
			state = status++;

			if (state == 0) {
				output += f((c >> 1)+32);
				current = (c & 1) << 14;
			} else if (state == 14) {
				output += f((current + (c >> 15))+32, (c & 32767)+32);
				status = 0;
			} else {
				output += f((current + (c >> (state+1)))+32);
				current = (c & utfMap[14-state]) << (14-state);
			}
		}

		return output + f(current + 32);
	});

	/**
	 * Decompress a Base64 compressed string
	 *
	 * @author   Pieroxy <pieroxy@pieroxy.net>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   input   The string to decompress
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'decompressFromUTF16', function decompressFromUTF16(input) {

		if (input == null) return '';

		var output = '',
		    current,
		    status = 0,
		    state,
		    i = 0,
		    c;

		while (i < input.length) {

			c = input.charCodeAt(i) - 32;
			state = status++;

			if (state == 0) {
				current = c << 1;
			} else if (state == 15) {
				output += f(current | c);
				status = 0;
			} else {
				output += f(current | (c >> (15-state)));
				current = (c&utfMap[state]) << state+1;
			}

			i++;
		}

		return Collection.String.decompress(output);
	});

	/**
	 * Compress the string,
	 * output is an "invalid" UTF-16 string.
	 * These can only be safely stored in localStorage on webkit/blink browsers.
	 *
	 * @author   Pieroxy <pieroxy@pieroxy.net>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   uncompressed   The uncompressed string to compress
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'compress', function compress(uncompressed) {

		if (uncompressed == null) return '';

		var context_dictionary = Object.create(null),
		    context_dictionaryToCreate = Object.create(null),
		    context_c = '',
		    context_wc = '',
		    context_w = '',
		    context_enlargeIn = 2, // Compensate for the first entry which should not count
		    context_dictSize = 3,
		    context_numBits = 2,
		    context_data_string = '',
		    context_data_val = 0,
		    context_data_position = 0,
		    charcode,
		    length,
		    value,
		    ii,
		    i;

		length = uncompressed.length;

		for (ii = 0; ii < length; ii += 1) {

			context_c = uncompressed.charAt(ii);

			if (context_dictionary[context_c] === undefined) {
				context_dictionary[context_c] = context_dictSize++;
				context_dictionaryToCreate[context_c] = true;
			}

			context_wc = context_w + context_c;

			if (context_dictionary[context_wc] !== undefined) {
				context_w = context_wc;
			} else {
				if (context_dictionaryToCreate[context_w] !== undefined) {

					charcode = context_w.charCodeAt(0);

					if (charcode<256) {
						for (i=0 ; i<context_numBits ; i++) {
							context_data_val = (context_data_val << 1);
							if (context_data_position == 15) {
								context_data_position = 0;
								context_data_string += f(context_data_val);
								context_data_val = 0;
							} else {
								context_data_position++;
							}
						}
						value = charcode;
						for (i=0 ; i<8 ; i++) {
							context_data_val = (context_data_val << 1) | (value&1);
							if (context_data_position == 15) {
								context_data_position = 0;
								context_data_string += f(context_data_val);
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = value >> 1;
						}
					} else {
						value = 1;
						for (i=0 ; i<context_numBits ; i++) {
							context_data_val = (context_data_val << 1) | value;
							if (context_data_position == 15) {
								context_data_position = 0;
								context_data_string += f(context_data_val);
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = 0;
						}
						value = charcode;
						for (i=0 ; i<16 ; i++) {
							context_data_val = (context_data_val << 1) | (value&1);
							if (context_data_position == 15) {
								context_data_position = 0;
								context_data_string += f(context_data_val);
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = value >> 1;
						}
					}

					context_enlargeIn--;

					if (context_enlargeIn == 0) {
						context_enlargeIn = Math.pow(2, context_numBits);
						context_numBits++;
					}

					context_dictionaryToCreate[context_w] = undefined;
				} else {
					value = context_dictionary[context_w];
					for (i=0 ; i<context_numBits ; i++) {
						context_data_val = (context_data_val << 1) | (value&1);
						if (context_data_position == 15) {
							context_data_position = 0;
							context_data_string += f(context_data_val);
							context_data_val = 0;
						} else {
							context_data_position++;
						}
						value = value >> 1;
					}
				}
				context_enlargeIn--;
				if (context_enlargeIn == 0) {
					context_enlargeIn = Math.pow(2, context_numBits);
					context_numBits++;
				}
				// Add wc to the dictionary.
				context_dictionary[context_wc] = context_dictSize++;
				context_w = context_c;
			}
		}

		// Output the code for w.
		if (context_w !== "") {

			if (context_dictionaryToCreate[context_w] !== undefined) {

				charcode = context_w.charCodeAt(0);

				if (charcode<256) {
					for (i=0 ; i<context_numBits ; i++) {
						context_data_val = (context_data_val << 1);
						if (context_data_position == 15) {
							context_data_position = 0;
							context_data_string += f(context_data_val);
							context_data_val = 0;
						} else {
							context_data_position++;
						}
					}

					value = charcode;

					for (i=0 ; i<8 ; i++) {
						context_data_val = (context_data_val << 1) | (value&1);
						if (context_data_position == 15) {
							context_data_position = 0;
							context_data_string += f(context_data_val);
							context_data_val = 0;
						} else {
							context_data_position++;
						}
						value = value >> 1;
					}
				} else {
					value = 1;
					for (i=0 ; i<context_numBits ; i++) {
						context_data_val = (context_data_val << 1) | value;
						if (context_data_position == 15) {
							context_data_position = 0;
							context_data_string += f(context_data_val);
							context_data_val = 0;
						} else {
							context_data_position++;
						}
						value = 0;
					}

					value = charcode;

					for (i=0 ; i<16 ; i++) {
						context_data_val = (context_data_val << 1) | (value&1);
						if (context_data_position == 15) {
							context_data_position = 0;
							context_data_string += f(context_data_val);
							context_data_val = 0;
						} else {
							context_data_position++;
						}
						value = value >> 1;
					}
				}
				context_enlargeIn--;
				if (context_enlargeIn == 0) {
					context_enlargeIn = Math.pow(2, context_numBits);
					context_numBits++;
				}

				context_dictionaryToCreate[context_w] = undefined;
			} else {
				value = context_dictionary[context_w];
				for (i=0 ; i<context_numBits ; i++) {
					context_data_val = (context_data_val << 1) | (value&1);
					if (context_data_position == 15) {
						context_data_position = 0;
						context_data_string += f(context_data_val);
						context_data_val = 0;
					} else {
						context_data_position++;
					}
					value = value >> 1;
				}
			}

			context_enlargeIn--;

			if (context_enlargeIn == 0) {
				context_enlargeIn = Math.pow(2, context_numBits);
				context_numBits++;
			}
		}

		// Mark the end of the stream
		value = 2;

		for (i=0 ; i<context_numBits ; i++) {
			context_data_val = (context_data_val << 1) | (value&1);
			if (context_data_position == 15) {
				context_data_position = 0;
				context_data_string += f(context_data_val);
				context_data_val = 0;
			} else {
				context_data_position++;
			}
			value = value >> 1;
		}

		// Flush the last char
		while (true) {
			context_data_val = (context_data_val << 1);
			if (context_data_position == 15) {
				context_data_string += f(context_data_val);
				break;
			}
			else context_data_position++;
		}

		return context_data_string;
	});

	/**
	 * Decompress the string
	 *
	 * @author   Pieroxy <pieroxy@pieroxy.net>
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   compressed   The compressed string to decompress
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('String', 'decompress', function decompress(compressed) {

		if (compressed == null) return '';
		if (compressed == '') return null;

		var dictionary = [],
		    next,
		    enlargeIn = 4,
		    dictSize = 4,
		    numBits = 3,
		    entry = '',
		    result = '',
		    i,
		    w,
		    bits, resb, maxpower, power,
		    c,
		    data = {string:compressed, val:compressed.charCodeAt(0), position:32768, index:1};

		for (i = 0; i < 3; i += 1) {
			dictionary[i] = i;
		}

		bits = 0;
		maxpower = Math.pow(2,2);
		power=1;

		while (power!=maxpower) {
			resb = data.val & data.position;
			data.position >>= 1;
			if (data.position == 0) {
				data.position = 32768;
				data.val = data.string.charCodeAt(data.index++);
			}
			bits |= (resb>0 ? 1 : 0) * power;
			power <<= 1;
		}

		switch (next = bits) {
			case 0:
					bits = 0;
					maxpower = Math.pow(2,8);
					power=1;
					while (power!=maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if (data.position == 0) {
							data.position = 32768;
							data.val = data.string.charCodeAt(data.index++);
						}
						bits |= (resb>0 ? 1 : 0) * power;
						power <<= 1;
					}
				c = f(bits);
				break;
			case 1:
					bits = 0;
					maxpower = Math.pow(2,16);
					power=1;
					while (power!=maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if (data.position == 0) {
							data.position = 32768;
							data.val = data.string.charCodeAt(data.index++);
						}
						bits |= (resb>0 ? 1 : 0) * power;
						power <<= 1;
					}
				c = f(bits);
				break;
			case 2:
				return '';
		}

		dictionary[3] = c;
		w = result = c;

		while (true) {

			if (data.index > data.string.length) {
				return '';
			}

			bits = 0;
			maxpower = Math.pow(2,numBits);
			power=1;

			while (power!=maxpower) {
				resb = data.val & data.position;
				data.position >>= 1;
				if (data.position == 0) {
					data.position = 32768;
					data.val = data.string.charCodeAt(data.index++);
				}
				bits |= (resb>0 ? 1 : 0) * power;
				power <<= 1;
			}

			switch (c = bits) {
				case 0:
					bits = 0;
					maxpower = Math.pow(2,8);
					power=1;
					while (power!=maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if (data.position == 0) {
							data.position = 32768;
							data.val = data.string.charCodeAt(data.index++);
						}
						bits |= (resb>0 ? 1 : 0) * power;
						power <<= 1;
					}

					dictionary[dictSize++] = f(bits);
					c = dictSize-1;
					enlargeIn--;
					break;
				case 1:
					bits = 0;
					maxpower = Math.pow(2,16);
					power=1;
					while (power!=maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if (data.position == 0) {
							data.position = 32768;
							data.val = data.string.charCodeAt(data.index++);
						}
						bits |= (resb>0 ? 1 : 0) * power;
						power <<= 1;
					}
					dictionary[dictSize++] = f(bits);
					c = dictSize-1;
					enlargeIn--;
					break;
				case 2:
					return result;
			}

			if (enlargeIn == 0) {
				enlargeIn = Math.pow(2, numBits);
				numBits++;
			}

			if (dictionary[c]) {
				entry = dictionary[c];
			} else {
				if (c === dictSize) {
					entry = w + w.charAt(0);
				} else {
					return null;
				}
			}

			result += entry;

			// Add w+entry[0] to the dictionary.
			dictionary[dictSize++] = w + entry.charAt(0);
			enlargeIn--;

			w = entry;

			if (enlargeIn == 0) {
				enlargeIn = Math.pow(2, numBits);
				numBits++;
			}
		}
	});

};