module.exports = function BlastRequestBrowser(Blast, Collection) {

	var Request = Blast.Classes.Develry.Request,
	    original_send = XMLHttpRequest.prototype.send,
	    original_open = XMLHttpRequest.prototype.open;

	/**
	 * Actually make the request
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.6.2
	 *
	 * @return   {Pledge}
	 */
	Request.setMethod(function _make_request() {

		var that = this,
		    pledge = new Pledge(),
		    method = this.method_info,
		    is_form,
		    result,
		    error,
		    body = this.body,
		    type,
		    key,
		    xhr;

		if (this.get) {
			this.url.addQuery(this.get);
		}

		if (this.cache === false) {
			this.url.param('_', this.request_start);
		} else {
			this.url.param('_', null);
		}

		// Create the request
		xhr = new XMLHttpRequest();
		this.xhr = xhr;

		// DNS failures or no available connection will cause this error
		xhr.addEventListener('error', function onError(event) {

			error = new Error('Transfer failed');

			// Simulate a 408 "timeout"
			error.status = error.number = 408;

			done();
		}, false);

		// Catch aborts
		xhr.addEventListener('abort', function transferCanceled(event) {

			error = new Error('Transfer aborted');
			error.status = error.number = 0;

			done();
		}, false);

		// Set the ajax handler
		xhr.addEventListener('load', function transferComplete(event) {

			var download_url,
			    disposition = xhr.getResponseHeader('content-disposition'),
			    filename,
			    reader,
			    anchor;

			response = xhr.response || xhr.responseText;
			that.response = response;
			type = xhr.getResponseHeader('content-type') || '';

			// Intercept file downloads
			if (disposition && disposition.search('attachment') !== -1) {

				// Just browse to it if filereader doesn't exist
				if (typeof FileReader == 'undefined') {
					window.location = href;
					return done();
				}

				// Try getting the filename if it's available
				filename = /filename="(.*?)"/.exec(disposition);

				if (filename[1]) {
					filename = filename[1];
				} else {
					filename = that.url.href.split('/').pop() || 'download';
				}

				// We don't need to do the anchor trick on IE
				// (It won't work either, access denied)
				if (navigator.msSaveOrOpenBlob != null) {
					return navigator.msSaveOrOpenBlob(response, filename);
				}

				// Create a blob url
				download_url = URL.createObjectURL(response);

				// Create a temporary anchor for manipulating the filename
				anchor = document.createElement('a');
				document.body.appendChild(anchor);
				anchor.style = 'display: none';
				anchor.href = download_url;

				// Set the filename
				anchor.download = filename;

				// Download the file
				anchor.click();

				window.URL.revokeObjectURL(downloadUrl);
				return done();
			}

			if (typeof FileReader == 'undefined') {
				result = response;
				return done();
			}

			reader = new FileReader();

			reader.onloadend = function onReaderLoadend() {
				result = reader.result;
				type = response.type;
				done();
			};

			reader.readAsText(xhr.response);
		}, false);

		// Open the request
		xhr.open(method.name, this.url.href);

		// Set a request if needed
		if (this.timeout != null) {
			xhr.timeout = this.timeout;
		}

		// Always get the response as a blob
		xhr.responseType = 'blob';

		// Set the ajax header
		xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');

		for (key in this.headers) {
			xhr.setRequestHeader(key, this.headers[key]);
		}

		if (method.has_body && body) {

			if (body.constructor && body.constructor.name == 'FormData') {
				is_form = true;
			} else if (typeof FormData != 'undefined' && body instanceof FormData) {
				is_form = true;
			}

			if (typeof body == 'object' && !is_form) {
				body = JSON.stringify(body);
				xhr.setRequestHeader('content-type', 'application/json');
			}

			xhr.send(body);
		} else {
			xhr.send();
		}

		// Function that'll cleanup the request
		// & resolve or reject the pledge
		function done() {

			if (!error && xhr.status > 399) {
				error = new Error(xhr.statusText);
				error.status = error.number = xhr.status;
			}

			if (error) {
				pledge.reject(error);
				that.error = error;
			} else {
				if (type && type.indexOf('json') > -1 && result) {
					result = Collection.JSON.undry(result);
				}

				that.result = result;
				pledge.resolve(result);
			}
		}

		return pledge;
	});

	/**
	 * Hook into the original open method
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.6.2
	 *
	 * @param    {String}   method
	 * @param    {String}   url
	 */
	XMLHttpRequest.prototype.open = function open(method, url) {
		this.open_method = method;
		this.open_url = url;
		Blast.emit('xhr_open', this);
		return original_open.apply(this, arguments);
	};

	/**
	 * Hook into the original send method
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.6.2
	 */
	XMLHttpRequest.prototype.send = function send() {
		Blast.emit('xhr_send', this);
		return original_send.apply(this, arguments);
	};
};