var online_change_symbol = Symbol('online_change'),
    check_count_symbol = Symbol('check_count'),
    set_online_symbol = Symbol('set_online'),
    visibility_symbol = Symbol('visibility'),
    save_data_symbol = Symbol('save_data'),
    endpoint_symbol = Symbol('endpoint'),
    success_symbol = Symbol('success'),
    online_symbol = Symbol('online'),
    queue_symbol = Symbol('queue_id'),
    busy_symbol = Symbol('busy'),
    same_symbol = Symbol('same'),
    nav;

if (typeof navigator != 'undefined') {
	nav = navigator;
}

/**
 * State class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 */
var State = Fn.inherits('Informer', function State() {
	this.init();
});

/**
 * How many endpoint checks were there?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {Number}
 */
State.setProperty(function check_count() {
	return this[check_count_symbol] || 0;
});

/**
 * The last successful request timestamp
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {Number}
 */
State.setProperty(function last_success() {
	return this[success_symbol] || 0;
});

/**
 * Should we save data?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Boolean}
 */
State.setProperty(function save_data() {

	if (this[save_data_symbol] != null) {
		return this[save_data_symbol];
	}

	if (nav && nav.connection) {
		return nav.connection.saveData;
	}

	return false;
});

/**
 * The round-trip-type in ms
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Number}
 */
State.setProperty(function rtt() {

	if (nav && nav.connection && nav.connection.rtt != null) {
		return nav.connection.rtt;
	}

	// Generous 50ms
	return 50;
});

/**
 * The timeout in ms to use
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @type     {Number}
 */
State.setProperty(function rtt_timeout() {

	var timeout = this.rtt;

	if (!timeout) {
		timeout = 2500;
	} else if (timeout < 1000) {
		timeout = 1000;
	} else if (timeout > 5000) {
		timeout = 5000;
	}

	return timeout;
});

/**
 * The estimated downlink in mbit/s
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Number}
 */
State.setProperty(function downlink() {

	if (nav && nav.connection && nav.connection.downlink != null) {
		return nav.connection.downlink;
	}

	// 10 mbits
	return 10;
});

/**
 * Are we on-line?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Boolean}
 */
State.setProperty(function online() {
	return !!this[online_symbol];
}, function setOnline(value) {
	return this[set_online_symbol](!!value);
});

/**
 * Are we off-line?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Boolean}
 */
State.setProperty(function offline() {
	return !this[online_symbol];
}, function setOffline(value) {
	return !this[set_online_symbol](!value);
});

/**
 * Get the duration of the current online status
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 *
 * @type     {Number}
 */
State.setProperty(function current_status_duration() {

	if (!this[online_change_symbol]) {
		return ~~Blast.performanceNow();
	}

	return Date.now() - this[online_change_symbol];
});

/**
 * The website endpoint to check
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {String}
 */
State.setProperty(function website_endpoint() {

	if (this[endpoint_symbol] != null) {
		return this[endpoint_symbol];
	}

	return '';
}, function setWebsiteEndpoint(value) {
	return this[endpoint_symbol] = value;
});

/**
 * Is the current tab visible?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 *
 * @type     {Boolean}
 */
State.setProperty(function is_visible() {

	if (this._hidden_property_name && typeof document != 'undefined') {
		return !document[this._hidden_property_name];
	}

	// Default to true
	return true;
});

/**
 * Set the online status
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 *
 * @param    {Boolean}   value
 */
State.setMethod(set_online_symbol, function setOnline(value) {

	var was_online = this[online_symbol],
	    now = Date.now();

	value = !!value;

	this[online_symbol] = value;

	// If on-line, set the last successful time
	if (value) {
		this[success_symbol] = now;
	}

	if (was_online !== value) {
		this[online_change_symbol] = now;
		this[same_symbol] = 0;
	} else {
		this[same_symbol]++;
	}

	if (value && (!was_online || was_online == null)) {
		this.unsee('offline');
		this.emit('online');
	} else if (!value && (was_online || was_online == null)) {
		this.unsee('online');
		this.emit('offline');
	}

	return value;
});

/**
 * Initialize the checker
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 */
State.setMethod(function init() {

	var that = this;

	if (this[same_symbol] != null) {
		return;
	}

	this.initVisibilityChange();

	// Default to true
	this.online = true;

	// Keep count on how many times the current value has been seen
	this[same_symbol] = 0;

	// Check the connection
	that.checkConnection(function done() {

		var timeout,
		    ref;

		if (that.offline) {
			timeout = 2500 + (that[same_symbol] * 2500);

			if (timeout > 60 * 1000) {
				timeout = 60 * 1000;
			}
		} else {
			timeout = 30 * 1000;
		}

		ref = setTimeout(function doCheck() {
			that.checkConnection(done);
		}, timeout);

		if (ref && ref.unref) {
			ref.unref();
		}
	});

	if (typeof window == 'undefined' || typeof window.addEventListener == 'undefined') {
		return false;
	}

	window.addEventListener('offline', function onOffline() {
		that.offline = true;
	});

	window.addEventListener('online', function onOnline() {
		that.checkConnection(true);
	});

	// Check the connection as soon as the tab becomes visible again
	this.on('visible', function onVisible() {
		that.checkConnection();
	});
});

/**
 * Initialize the visibility checker
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 */
State.setMethod(function initVisibilityChange() {

	var that = this,
	    visibility_change,
	    hidden;

	if (typeof document == 'undefined') {
		return;
	}

	if (document.hidden != null) {
		hidden = 'hidden';
		visibility_change = 'visibilitychange';
	} else if (document.msHidden != null) {
		hidden = 'msHidden';
		visibility_change = 'msvisibilitychange';
	} else if (document.webkitHidden != null) {
		hidden = 'webkitHidden';
		visibility_change = 'webkitvisibilitychange';
	}

	this._hidden_property_name = hidden;
	this._visibility_change_property_name = visibility_change;

	// Do a first visibility check
	this.checkVisibilityChange();

	document.addEventListener(visibility_change, function handleVisibilityChange() {
		that.checkVisibilityChange();
	}, false);
});

/**
 * Check visibility change
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.2
 * @version  0.6.2
 */
State.setMethod(function checkVisibilityChange() {

	var old_value = this[visibility_symbol],
	    new_value = this.is_visible;

	if (old_value != new_value) {
		if (new_value) {
			this.unsee('hidden');
			this.emit('visible');
		} else {
			this.unsee('visible');
			this.emit('hidden');
		}

		this[visibility_symbol] = new_value;
	}
});

/**
 * Check the current connection
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.2
 * @version  0.7.0
 *
 * @param    {Function}   callback
 *
 * @return   {Pledge}
 */
State.setMethod(function checkConnection(hint, callback) {

	var that = this,
	    timeout,
	    pledge = new Blast.Classes.Pledge(),
	    bomb,
	    url;

	if (typeof hint == 'function') {
		callback = hint;
		hint = null;
	}

	pledge.done(callback);

	// Use browser navigator object to see if it's absolutely off-line
	if (nav && nav.onLine === false) {
		this.online = false;
		pledge.resolve(false);
		return pledge;
	}

	if (this[busy_symbol]) {
		this[busy_symbol].done(callback);
		return this[busy_symbol];
	}

	if (this.website_endpoint) {
		timeout = this.rtt_timeout;

		this[busy_symbol] = pledge;

		bomb = Fn.timebomb(timeout, function timeout() {
			that[busy_symbol] = false;
			that.online = false;
			pledge.resolve(false);
		});

		url = this.website_endpoint;

		if (url.indexOf('?') > -1) {
			url += '&';
		} else {
			url += '?';
		}

		url += 'hajax=' + Date.now();

		if (!this[check_count_symbol]) {
			this[check_count_symbol] = 0;
		}

		this[check_count_symbol]++;

		Blast.fetch({url: url, head: true}, function done(err, body, xhr) {

			that[busy_symbol] = false;

			if (err && (!xhr.status || xhr.status < 400)) {
				that.online = false;
			} else {
				bomb.defuse();
				that.online = true;
			}

			pledge.resolve(that.online);
		});
	} else {

		if (hint != null) {
			this.online = hint;
		} else if (this.current_status_duration < this.rtt_timeout * 2) {
			// Queue a new check
			this.queueCheck(Math.min(1000, Math.max(this.rtt_timeout, 1000)));
		} else {

			// When we have no endpoint to check and the online status
			// has not yet been set, we'll set it once now.
			if (this[online_symbol] == null) {
				this.online = true;
			}
		}

		pledge.resolve(!!this.online);
	}

	return pledge;
});

/**
 * Report a connection error
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.22
 */
State.setMethod(function reportError(error) {

	if (!error) {
		return;
	}

	// Aborts can be ignored
	if (error.number === 0) {
		return;
	}

	// Actual dns or other kind of timeout
	if (error.number === 408) {
		console.log('Reported error, setting to offline:', error)

		// If a timeout amount is given,
		// see if any other request has successfully finished in that time
		if (error.timeout || error.request_start) {
			let start = error.request_start || (Date.now() - error.timeout),
			    diff = this.last_success - start;

			if (diff > 0) {
				console.log('... Other request finished after this started, not setting offline');
				return;
			}
		}

		// Timeout errors don't mean we're off-line, it can mean the endpoint
		// is misbehaving. So schedule a check
		this.checkConnection(false, (err, online) => {
			if (err) {
				this.online = false;
			} else {
				this.online = online;
			}
		});
	}
});

/**
 * Report a successful connection
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {String}   type
 * @param    {Object}   event
 */
State.setMethod(function reportSuccess(type, event) {
	this.online = true;
});

/**
 * See if the given ms can be counted as a connection timeout
 * (If any other request was successful, then it has not timedout)
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {Boolean}
 */
State.setMethod(function connectionHasTimedOut(ms) {

	if (ms == null) {
		ms = this.rtt_timeout;
	}

	return this.msUntilTimeout(ms) <= 0;
});

/**
 * Get the time (in ms) until a timeout could occur
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Number}   ms   The milliseconds that should count as a timeout
 *
 * @return   {Number}
 */
State.setMethod(function msUntilTimeout(ms) {

	if (!this.online) {
		return 0;
	}

	if (ms == null) {
		ms = this.rtt_timeout;
	}

	// See if any last success has been registered
	if (this.last_success) {
		let now  = Date.now(),
		    ago  = now - this.last_success,
		    left = ms - ago;

		// If a success has happened in less time than the given ms,
		// we still have some time left
		if (left <= 0) {
			return 0;
		} else if (left < ms) {
			return left;
		}
	}

	// No timeout has been detected, so the given time should be kept
	return ms;
});

/**
 * Queue a new check
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {Number}   ms   The milliseconds to wait before checking again
 */
State.setMethod(function queueCheck(ms) {

	if (this[queue_symbol]) {
		// @TODO: could starve the checks?
		clearTimeout(this[queue_symbol]);
	}

	if (!ms) {
		ms = 200;
	}

	let that = this;

	this[queue_symbol] = setTimeout(function doCheck() {
		that.checkConnection();
		that[queue_symbol] = null;
	}, ms);
});