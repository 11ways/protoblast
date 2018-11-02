module.exports = function BlastRequestBrowser(Blast, Collection) {

	var Request = Blast.Classes.Develry.Request;

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

			var reader;

			response = xhr.response || xhr.responseText;
			that.response = response;

			if (typeof FileReader == 'undefined') {
				type = xhr.getResponseHeader('content-type') || '';
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

};