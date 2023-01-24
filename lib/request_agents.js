const OriginalAgent = require('http').Agent;
const OriginalHttpsAgent = require('https').Agent;
const CREATE_HTTPS_CONNECTION = OriginalHttpsAgent.prototype.createConnection;

const CURRENT_ID = Symbol('current_id'),
      CREATED_TIME = Symbol('created_time'),
      REQUEST_COUNT = Symbol('request_count'),
      REQUEST_FINISHED_COUNT = Symbol('request_finished_count'),
      NAME = Symbol('socket_name');

/**
 * Get the timeout value of a socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 *
 * @return   {Number}
 */
function getSocketTimeout(socket) {
	return socket.timeout || socket._idleTimeout;
}

/**
 * Normalize the options
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Object}   options
 *
 * @return   {Object}
 */
function normalizeOptions(options) {
	options = options || {};

	// Turn on keepAlive by default
	options.keepAlive = options.keepAlive !== false;

	if (options.keepAliveTimeout) {
		options.freeSocketTimeout = options.keepAliveTimeout;
	}

	// Timeout free sockets after a certain time of inactivity
	// By default this is set to 4000
	if (options.freeSocketTimeout == null) {
		options.freeSocketTimeout = 4000;
	} else {
		options.freeSocketTimeout = Bound.Date.parseDuration(options.freeSocketTimeout);
	}

	// Sets the socket to timeout after timeout milliseconds of inactivity on the socket.
	// By default is double free socket timeout.
	if (options.timeout == null) {
		// make sure socket default inactivity timeout >= 8s
		options.timeout = Math.max(options.freeSocketTimeout * 2, 8000);
	} else {
		// Parse as a duration
		options.timeout = Bound.Date.parseDuration(options.timeout);
	}

	if (options.socketActiveTTL) {
		options.socketActiveTTL = Bound.Date.parseDuration(options.socketActiveTTL);
	} else {
		options.socketActiveTTL = 0;
	}

	return options;
}

/**
 * Inspect a socket object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Object}   options
 *
 * @return   {Object}
 */
function inspect(obj) {
	const res = {};

	for (const key in obj) {
		res[key] = obj[key].length;
	}

	return res;
}

/**
 * Create an agent pool
 * 
 * Implementation was largely copied from
 * https://github.com/node-modules/agentkeepalive
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Object}   options
 */
const AgentPool = Fn.inherits(null, 'Develry', function AgentPool(options) {
	this.options = normalizeOptions(options);
});

/**
 * All the agent pools by name
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
AgentPool.pools = new Map();

/**
 * Get a certain pool by name
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {String|AgentPool}   name
 *
 * @return   {AgentPool}
 */
AgentPool.setStatic(function get(name) {

	if (!name) {
		name = 'default';
	} else if (typeof name == 'object' && name instanceof AgentPool) {
		return name;
	}

	let result = AgentPool.pools.get(name);

	if (!result) {
		result = new AgentPool({
			maxSockets: 10
		});
		AgentPool.pools.set(name, result);
	}

	return result;
});

/**
 * Set a certain pool by name
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {String}    name
 * @param    {AgentPool} pool
 */
AgentPool.setStatic(function set(name, pool) {

	if (!pool || !name) {
		return;
	}

	AgentPool.pools.set(name, pool);
});

/**
 * Get the HTTP agent version
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @type     {HttpsAgent}
 */
AgentPool.enforceProperty(function http_agent(new_value, old_value) {

	if (!new_value) {
		new_value = new HttpAgent(this.options);
	}

	return new_value;
});

/**
 * Get the HTTPS agent version
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @type     {HttpsAgent}
 */
AgentPool.enforceProperty(function https_agent(new_value, old_value) {

	if (!new_value) {
		new_value = new HttpsAgent(this.options);
	}

	return new_value;
});

/**
 * The HttpAgent: for improved keep-alive behavior
 * 
 * Implementation was largely copied from
 * https://github.com/node-modules/agentkeepalive
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Object}   options
 */
const HttpAgent = Fn.inherits(OriginalAgent, 'Develry', function HttpAgent(options) {

	options = normalizeOptions(options);

	HttpAgent.super.call(this, options);

	this[CURRENT_ID] = 0;

	// Create counters
	this.createSocketCount = 0;
	this.createSocketCountLastCheck = 0;

	this.createSocketErrorCount = 0;
	this.createSocketErrorCountLastCheck = 0;

	this.closeSocketCount = 0;
	this.closeSocketCountLastCheck = 0;

	// Create error counters
	this.errorSocketCount = 0;
	this.errorSocketCountLastCheck = 0;

	// Request finished counters
	this.requestCount = 0;
	this.requestCountLastCheck = 0;

	// Free socket timeout counter
	this.timeoutSocketCount = 0;
	this.timeoutSocketCountLastCheck = 0;

	this.on('free', socket => {
		// https://github.com/nodejs/node/pull/32000
		// Node.js native agent will check socket timeout eqs agent.options.timeout.
		// Use the ttl or freeSocketTimeout to overwrite.
		const timeout = this.calcSocketTimeout(socket);

		if (timeout > 0 && socket.timeout !== timeout) {
			socket.setTimeout(timeout);
		}
	});
});

/**
 * Get the current id
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @type     {Number}
 */
HttpAgent.setProperty(function current_id() {
	return this[CURRENT_ID];
});

/**
 * Get the created time of a socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 *
 * @return   {Number}
 */
HttpAgent.setStatic(function getCreatedTime(socket) {
	return socket?.[CREATED_TIME];
});

/**
 * Get the name of a socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 *
 * @return   {String}
 */
HttpAgent.setStatic(function getName(socket) {
	return socket?.[NAME];
});


/**
 * Get the request count of a socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 *
 * @return   {Number}
 */
HttpAgent.setStatic(function getRequestCount(socket) {
	return socket?.[REQUEST_COUNT];
});

/**
 * Get the finished request count of a socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 *
 * @return   {Number}
 */
 HttpAgent.setStatic(function getRequestFinishedCount(socket) {
	return socket?.[REQUEST_FINISHED_COUNT];
});

/**
 * Calculate the socket timeout.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 *
 * @return   {Number|undefined}   If <=0 the socket should be freed,
 *                                of  >0 the socket timeout should be updated
 *                                if undefined no custom timeout was found
 */
HttpAgent.setMethod(function calcSocketTimeout(socket) {

	let freeSocketTimeout = this.options.freeSocketTimeout;
	const socketActiveTTL = this.options.socketActiveTTL;

	if (socketActiveTTL) {

		const aliveTime = Date.now() - socket[CREATED_TIME];
		const diff = socketActiveTTL - aliveTime;

		if (diff <= 0) {
			return diff;
		}

		if (freeSocketTimeout && diff < freeSocketTimeout) {
			freeSocketTimeout = diff;
		}
	}

	// Set the timeout
	if (freeSocketTimeout) {
		// set free keepalive timer
		// try to use socket custom freeSocketTimeout first, support headers['keep-alive']
		// https://github.com/node-modules/urllib/blob/b76053020923f4d99a1c93cf2e16e0c5ba10bacf/lib/urllib.js#L498
		const customFreeSocketTimeout = socket.freeSocketTimeout || socket.freeSocketKeepAliveTimeout;
		return customFreeSocketTimeout || freeSocketTimeout;
	}
});

/**
 * Keep the socket alive
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Socket}   socket
 */
HttpAgent.setMethod(function keepSocketAlive(socket) {

	const result = keepSocketAlive.super.call(this, socket);

	// should not keepAlive, do nothing
	if (!result) {
		return result;
	}

	const customTimeout = this.calcSocketTimeout(socket);

	if (typeof customTimeout === 'undefined') {
		return true;
	}

	if (customTimeout <= 0) {
		return false;
	}

	if (socket.timeout !== customTimeout) {
		socket.setTimeout(customTimeout);
	}

	return true;
});

/**
 * Reuse the socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
HttpAgent.setMethod(function reuseSocket(...args) {

	reuseSocket.super.apply(this, args);

	const socket = args[0];
	const req = args[1];

	req.reusedSocket = true;

	const agentTimeout = this.options.timeout;

	if (getSocketTimeout(socket) !== agentTimeout) {
		// Reset the timeout
		socket.setTimeout(agentTimeout);
	}

	socket[REQUEST_COUNT]++;
});

/**
 * Create an id
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
HttpAgent.setMethod(function createSocketId() {

	const id = ++this[CURRENT_ID];

	if (id === Number.MAX_SAFE_INTEGER) {
		id = this[CURRENT_ID] = 0;
	}

	return id;
});

/**
 * Initialize a socket
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
HttpAgent.setMethod(function initializeSocket(socket, options) {

	if (options.timeout) {
		const timeout = getSocketTimeout(socket);
		if (!timeout) {
			console.log('--------- set timeout', options.timeout)
		  socket.setTimeout(options.timeout);
		}
	}

	// Disable Nagle algorithm
	if (this.options.keepAlive) {
		socket.setNoDelay(true);
	}

	this.createSocketCount++;

	if (this.options.socketActiveTTL) {
		socket[CREATED_TIME] = Date.now();
	}

	socket[NAME] = `sock[${this.createSocketId()}#${options._agentKey}]`.split('-----BEGIN', 1)[0];
	socket[REQUEST_COUNT] = 1;
	socket[REQUEST_FINISHED_COUNT] = 0;

	const on_free = () => {

		if (!socket._httpMessage && socket[REQUEST_COUNT] === 1) {
			return;
		}

		socket[REQUEST_FINISHED_COUNT]++;
		this.requestCount++;

		const name = this.getName(options);

		if (socket.writable && this.requests[name] && this.requests[name].length) {
			socket[REQUEST_COUNT]++;
		}
	};
	socket.on('free', on_free);

	const on_close = (is_error) => {
		this.closeSocketCount++;
	};
	socket.on('close', on_close);

	const on_timeout = () => {

		const timeout = getSocketTimeout(socket);
		const req = socket._httpMessage;

		this.timeoutSocketCount++;

		const name = this.getName(options);

		if (this.freeSockets[name] && this.freeSockets[name].indexOf(socket) !== -1) {
			// free socket timeout, destroy quietly
			socket.destroy();

			// Remove it from freeSockets list immediately to prevent new requests
			// from being sent through this socket.
			this.removeSocket(socket, options);
		} else {

			const reqTimeoutListenerCount = req && req.listeners('timeout').length || 0;

			// if there is no any request socket timeout handler,
			// agent need to handle socket timeout itself.
			//
			// custom request socket timeout handle logic must follow these rules:
			//  1. Destroy socket first
			//  2. Must emit socket 'agentRemove' event tell agent remove socket
			//     from freeSockets list immediately.
			//     Otherise you may be get 'socket hang up' error when reuse
			//     free socket and timeout happen in the same time.
			if (reqTimeoutListenerCount === 0) {
				const error = new Error('Socket timeout');
				error.code = 'ERR_SOCKET_TIMEOUT';
				error.timeout = timeout;

				// must manually call socket.end() or socket.destroy() to end the connection.
				// https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_socket_settimeout_timeout_callback
				socket.destroy(error);
				this.removeSocket(socket, options);
			}
		}
	};
	socket.on('timeout', on_timeout);

	const on_error = (err) => {

		const listenerCount = socket.listeners('error').length;

		this.errorSocketCount++;

		if (listenerCount === 1) {
			// if socket don't contain error event handler, don't catch it, emit it again
			socket.removeListener('error', on_error);
			socket.emit('error', err);
		}
	};
	socket.on('error', on_error);

	const on_remove = () => {

		// We need this function for cases like HTTP 'upgrade'
		// (defined by WebSockets) where we need to remove a socket from the
		// pool because it'll be locked up indefinitely
		socket.removeListener('close', on_close);
		socket.removeListener('error', on_error);
		socket.removeListener('free', on_free);
		socket.removeListener('timeout', on_timeout);
		socket.removeListener('agentRemove', on_remove);
	};
	socket.on('agentRemove', on_remove);
});

/**
 * Create a connection
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
HttpAgent.setMethod(function createConnection(options, on_create) {

	let called = false;

	const on_new_create = (err, socket) => {

		if (called) {
			return;
		}

		called = true;

		if (err) {
			this.createSocketErrorCount++;
			return on_create(err);
		}

		this.initializeSocket(socket, options);

		on_create(err, socket);
	};

	const new_socket = createConnection.super.call(this, options, on_new_create);

	if (new_socket) {
		on_new_create(null, new_socket);
	}
});

/**
 * Get the current status
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
HttpAgent.setMethod(function getCurrentStatus() {

	return {
		createSocketCount: this.createSocketCount,
		createSocketErrorCount: this.createSocketErrorCount,
		closeSocketCount: this.closeSocketCount,
		errorSocketCount: this.errorSocketCount,
		timeoutSocketCount: this.timeoutSocketCount,
		requestCount: this.requestCount,
		freeSockets: inspect(this.freeSockets),
		sockets: inspect(this.sockets),
		requests: inspect(this.requests),
	};

});

/**
 * The HttpsAgent: for improved keep-alive behavior for secure connections
 * 
 * Implementation was largely copied from
 * https://github.com/node-modules/agentkeepalive
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {Object}   options
 */
const HttpsAgent = Fn.inherits('Develry.HttpAgent', function HttpsAgent(options) {

	HttpsAgent.super.call(this, options);

	this.defaultPort = 443;
	this.protocol = 'https:';
	this.maxCachedSessions = this.options.maxCachedSessions;

	if (this.maxCachedSessions == null) {
		this.maxCachedSessions = 100;
	}

	this._sessionCache = {
		map: {},
		list: [],
	};
});

/**
 * Create a secure connection
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
HttpsAgent.setMethod(function createConnection(options) {

	const socket = CREATE_HTTPS_CONNECTION.call(this, options);

	this.initializeSocket(socket, options);
	return socket;
});

/**
 * Copy some existing methods
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 */
for (let key of ['getName', '_getSession', '_cacheSession', '_evictSession']) {
	let method = OriginalHttpsAgent.prototype[key];

	if (typeof method == 'function') {
		HttpsAgent.setMethod(key, method);
	}
}