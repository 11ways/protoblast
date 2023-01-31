const libstream = require('stream');

/**
 * Put the given class in the Stream namespace
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 */
function extract(constructor) {
	Fn.inherits(null, 'Stream', constructor);
}

extract(libstream.Stream);
extract(libstream.Writable);
extract(libstream.Readable);
extract(libstream.Duplex);
extract(libstream.Transform);
extract(libstream.PassThrough);