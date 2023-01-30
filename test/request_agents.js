var assert = require('assert'),
    Blast;

const http = require('http');
const https = require('https');
const fs = require('fs');
const urlparse = require('url').parse;
const mm = require('mm');
let agentkeepalive;
let app;
let port = null;
let remotePort = null;
let HttpAgent;

function pedding(n, fn) {
	if (typeof n === 'function') {
		var tmp = n;
		n = fn;
		fn = tmp;
	}

	var called = false;
	var times = 0;
	var callStack = new Error();
	callStack.name = 'CallStack';
	return function (err) {
		if (called) {
			return;
		}
		if (err) {
			called = true;
			return fn(err);
		}
		times++;
		if (times === n) {
			fn();
		} else if (times > n) {
			var err = new Error('Expect to call ' + n + ' times, but got ' + times);
			err.stack += '\n' + callStack.stack;
			throw err;
		}
	};
}

function recreateAgentKeepAlive() {
	agentkeepalive = new HttpAgent({
		keepAliveTimeout: 1000,
		maxSockets: 5,
		maxFreeSockets: 5,
	});
}

describe('HttpAgent', function() {
	before(function(done) {
		Blast  = require('../index.js')();

		HttpAgent = Blast.Classes.Develry.HttpAgent;

		recreateAgentKeepAlive();

		app = http.createServer((req, res) => {
			if (req.url === '/error') {
				res.destroy();
				return;
			} else if (req.url === '/hang') {
				// Wait forever.
				return;
			} else if (req.url === '/remote_close') {
				setTimeout(() => {
					req.connection.end();
				}, 500);
			}

			const info = urlparse(req.url, true);

			if (info.query.timeout) {
				setTimeout(() => {
					res.end(info.query.timeout);
				}, parseInt(info.query.timeout));
				return;
			}

			res.end(JSON.stringify({
				info,
				url: req.url,
				headers: req.headers,
				socket: req.socket._getpeername(),
			}));
		});

		app.listen(0, () => {
			port = app.address().port;
			done();
		});
	});

	afterEach(mm.restore);

	it('should default options set right', () => {
		const agent = agentkeepalive;
		assert.strictEqual(agent.keepAlive, true);
		assert.strictEqual(agent.keepAliveMsecs, 1000);
		assert.strictEqual(agent.maxSockets, 5);
		assert.strictEqual(agent.maxFreeSockets, 5);
		assert.strictEqual(agent.options.timeout, 8000);
		
		assert.strictEqual(agent.options.freeSocketTimeout, 1000);
		assert.strictEqual(agent.options.socketActiveTTL, 0);
	});

	it('should request with connection: keep-alive with http.Agent(keepAlive=true)', done => {
		const agent = new http.Agent({
			keepAlive: true,
		});
		const req = http.request({
			method: 'GET',
			port,
			path: '/',
			agent,
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const data = JSON.parse(Buffer.concat(chunks));
				assert(data.headers.connection === 'keep-alive');
				done();
			});
		});
		req.end();
	});

	it('should request with connection: close with http.Agent()', done => {
		const req = http.request({
			method: 'GET',
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const data = JSON.parse(Buffer.concat(chunks));
				assert(data.headers.connection === 'close');
				done();
			});
		});
		req.end();
	});

	it('should destroy inactivity socket timeout by agent itself', done => {
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			freeSocketTimeout: '1s',
			timeout: '200ms',
		});
		assert.strictEqual(agentkeepalive.options.freeSocketTimeout, 1000);
		assert.strictEqual(agentkeepalive.options.timeout, 200);
		assert(!agentkeepalive.sockets[name]);
		assert(!agentkeepalive.freeSockets[name]);
		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.resume();
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const buf = Buffer.concat(chunks);
				
				const data = JSON.parse(buf);
				remotePort = data.socket.port;
				assert.strictEqual(data.headers.connection, 'keep-alive');
				assert(agentkeepalive.sockets[name]);
				assert(!agentkeepalive.freeSockets[name]);
				setTimeout(() => {
					assert(!agentkeepalive.sockets[name]);
					assert(agentkeepalive.freeSockets[name]);
					assert.strictEqual(agentkeepalive.freeSockets[name].length, 1);

					// request /hang timeout
					http.get({
						agent: agentkeepalive,
						port,
						path: '/hang',
					}, () => {
						assert(false, 'should not run this');
					}).on('error', err => {
						assert.strictEqual(err.message, 'Socket timeout');
						assert.strictEqual(err.code, 'ERR_SOCKET_TIMEOUT');
						done();
					});
				}, 20);
			});
		});
	});

	it('should let request handle the socket timeout', done => {
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			freeSocketTimeout: '1s',
			timeout: '80ms',
		});

		assert.strictEqual(agentkeepalive.options.freeSocketTimeout, 1000);
		assert.strictEqual(agentkeepalive.options.timeout, 80);
		assert(!agentkeepalive.sockets[name]);
		assert(!agentkeepalive.freeSockets[name]);

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.resume();
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const buf = Buffer.concat(chunks);

				const data = JSON.parse(buf);
				remotePort = data.socket.port;
				assert(data.headers.connection === 'keep-alive');
				assert(agentkeepalive.sockets[name]);
				assert(!agentkeepalive.freeSockets[name]);
				setTimeout(() => {
					assert(!agentkeepalive.sockets[name]);
					assert(agentkeepalive.freeSockets[name]);
					assert(agentkeepalive.freeSockets[name].length === 1);

					// request /hang timeout
					let handleTimeout = false;
					const req = http.get({
						agent: agentkeepalive,
						port,
						path: '/hang',
						timeout: 250,
					}, () => {
						assert(false, 'should not run this');
					}).on('error', err => {
						assert(handleTimeout);
						// TODO: should be a better error message than "socket hang up"
						assert.strictEqual(err.message, 'socket hang up');
						assert.strictEqual(err.code, 'ECONNRESET');
						done();
					});
					req.on('timeout', () => {
						handleTimeout = true;
						req.abort();
					});
				}, 20);
			});
		});
	});

	it('should request / 200 status', done => {
		const name = 'localhost:' + port + ':';
		assert(!agentkeepalive.sockets[name]);
		assert(!agentkeepalive.freeSockets[name]);

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const data = JSON.parse(Buffer.concat(chunks));
				remotePort = data.socket.port;
				assert(data.headers.connection === 'keep-alive');
				assert(agentkeepalive.sockets[name]);
				assert(!agentkeepalive.freeSockets[name]);
				setTimeout(() => {
					assert(!agentkeepalive.sockets[name]);
					assert(agentkeepalive.freeSockets[name]);
					assert(agentkeepalive.freeSockets[name].length === 1);
					done();
				}, 20);
			});
		});

		const status = agentkeepalive.getCurrentStatus();
		assert.strictEqual(status.createSocketCount, 1);
		assert.strictEqual(status.timeoutSocketCount, 0);
		assert.strictEqual(status.sockets[name], 1);
		assert(!status.freeSockets[name]);
	});

	it('should work on timeout same as freeSocketTimeout', done => {
		const agent = new HttpAgent({
			timeout: 1000,
			freeSocketTimeout: 1000,
		});

		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			const socket1 = res.socket;
			const timeout = socket1.timeout || socket1._idleTimeout;
			assert.strictEqual(timeout, 1000);
			assert.strictEqual(res.statusCode, 200);
			res.resume();
			res.on('end', () => {
				setImmediate(() => {
					const timeout = socket1.timeout || socket1._idleTimeout;
					assert.strictEqual(timeout, 1000);
					http.get({
						agent,
						port,
						path: '/',
					}, res => {
						const socket2 = res.socket;
						assert(socket2 === socket1);
						const timeout = socket2.timeout || socket2._idleTimeout;
						assert.strictEqual(timeout, 1000);
						assert.strictEqual(res.statusCode, 200);
						res.resume();
						res.on('end', done);
					});
				});
			});
		});
	});

	it('should work on freeSocketTimeout = 0', done => {
		const agent = new HttpAgent({
			timeout: 100,
			freeSocketTimeout: 0,
		});

		http.get({
			agent,
			port,
			path: '/?timeout=80',
		}, res => {
			const socket1 = res.socket;
			const timeout = socket1.timeout || socket1._idleTimeout;
			assert.strictEqual(timeout, 100);
			assert.strictEqual(res.statusCode, 200);
			res.resume();
			res.on('end', () => {
				setTimeout(() => {
					http.get({
						agent,
						port,
						path: '/',
					}, res => {
						const socket2 = res.socket;
						assert.strictEqual(socket2, socket1);
						const timeout = socket2.timeout || socket2._idleTimeout;
						assert.strictEqual(timeout, 100);
						assert.strictEqual(res.statusCode, 200);
						res.resume();
						res.on('end', done);
					});
				}, 80);
			});
		});
	});

	it('should createConnection error', done => {
		const agent = new HttpAgent();
		mm.error(HttpAgent.prototype.createConnection, 'super', 'mock createConnection error');
		http.get({
			agent,
			port,
			path: '/',
		}).on('error', err => {
			assert(err);
			assert.strictEqual(err.message, 'mock createConnection error');
			done();
		});
	});

	it('should keepSocketAlive return false, no use any socket', done => {
		const agent = new HttpAgent();
		mm(HttpAgent.prototype.keepSocketAlive, 'super', () => {
			return false;
		});
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			const socket1 = res.socket;
			res.resume();
			res.on('end', () => {
				setImmediate(() => {
					http.get({
						agent,
						port,
						path: '/',
					}, res => {
						const socket2 = res.socket;
						assert.notStrictEqual(socket2, socket1);
						res.resume();
						res.on('end', done);
					});
				});
			});
		});
	});

	it('should agent emit socket error event', done => {
		const agent = new HttpAgent({
			timeout: 100,
		});
		const req = http.get({
			agent,
			port,
			path: '/hang',
		});
		// remove mocha default handler
		const originalException = process.listeners('uncaughtException').pop();
		process.removeListener('uncaughtException', originalException);
		process.once('uncaughtException', err => {
			// ignore future req error
			req.on('error', () => {});
			process.on('uncaughtException', originalException);
			assert(err);
			assert.strictEqual(err.message, 'Socket timeout');
			done();
		});
	});

	it('should mock socket error', done => {
		done = pedding(2, done);
		const agent = new HttpAgent({
			timeout: 100,
		});
		const req = http.get({
			agent,
			port,
			path: '/hang',
		});
		req.on('socket', socket => {
			// remove req error listener
			const listener = socket.listeners('error').pop();
			socket.removeListener('error', listener);
			// must destroy before emit error
			socket.destroy();
			socket.emit('error', new Error('mock socket error'));
		}).on('error', err => {
			assert(err);
			assert.strictEqual(err.message, 'socket hang up');
			done();
		});
		// remove mocha default handler
		const originalException = process.listeners('uncaughtException').pop();
		process.removeListener('uncaughtException', originalException);
		assert(process.listeners('uncaughtException').length === 0);
		process.once('uncaughtException', err => {
			process.on('uncaughtException', originalException);
			assert(err);
			assert.strictEqual(err.message, 'mock socket error');
			done();
		});
	});

	it('should request again and use the same socket', done => {
		const name = 'localhost:' + port + ':';
		assert(!agentkeepalive.sockets[name]);
		assert(agentkeepalive.freeSockets[name]);
		assert.strictEqual(agentkeepalive.freeSockets[name].length, 1);

		http.get({
			agent: agentkeepalive,
			port,
			path: '/foo',
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const data = JSON.parse(Buffer.concat(chunks));
				assert(data.socket.port === remotePort);

				assert(agentkeepalive.sockets[name]);
				assert(!agentkeepalive.freeSockets[name]);
				setTimeout(() => {
					const status = agentkeepalive.getCurrentStatus();
					assert.strictEqual(status.createSocketCount, 1);
					assert.strictEqual(status.closeSocketCount, 0);
					assert.strictEqual(status.timeoutSocketCount, 0);
					assert.strictEqual(status.requestCount, 2);
					assert(!status.sockets[name]);
					assert(status.freeSockets[name]);
					assert.strictEqual(status.freeSockets[name], 1);
					done();
				}, 10);
			});
		});
		assert(agentkeepalive.sockets[name]);
		assert.strictEqual(agentkeepalive.sockets[name].length, 1);
		assert(!agentkeepalive.freeSockets[name]);
	});

	it('should remove keepalive socket when server side destroy()', done => {
		const agent = new HttpAgent({
			keepAliveTimeout: 1000,
			maxSockets: 5,
			maxFreeSockets: 5,
		});

		http.get({
			agent,
			port,
			path: '/foo',
		}, res => {
			assert(res.statusCode === 200);
			const chunks = [];
			res.on('data', data => {
				chunks.push(data);
			});
			res.on('end', () => {
				const data = JSON.parse(Buffer.concat(chunks));
				assert(data.socket.port);
				setTimeout(next, 1);
			});
		});

		function next() {
			const name = 'localhost:' + port + ':';
			assert(!agent.sockets[name]);
			assert.strictEqual(agent.freeSockets[name]?.length, 1);

			const req = http.get({
				agent,
				port,
				path: '/error',
			}, () => {
				assert.fail('should not call this');
			});
			req.on('error', err => {
				assert.strictEqual(err.message, 'socket hang up');
				assert.strictEqual(agent.sockets[name].length, 1);
				assert(!agent.freeSockets[name]);
				setTimeout(() => {
					assert(!agent.sockets[name]);
					assert(!agent.freeSockets[name]);
					done();
				}, 10);
			});
			assert.strictEqual(agent.sockets[name].length, 1);
			assert(!agent.freeSockets[name]);
		}
	});

	it('should remove socket when socket.destroy()', done => {
		const agentkeepalive = new HttpAgent({
			freeSocketTimeout: 1000,
			maxSockets: 5,
			maxFreeSockets: 5,
		});
		const name = 'localhost:' + port + ':';
		assert(!agentkeepalive.sockets[name]);
		assert(!agentkeepalive.freeSockets[name]);
		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name].length === 1);
				assert(!agentkeepalive.freeSockets[name]);
				setTimeout(() => {
					assert(!agentkeepalive.sockets[name]);
					assert(agentkeepalive.freeSockets[name].length === 1);
					agentkeepalive.freeSockets[name][0].destroy();
					setTimeout(() => {
						assert(!agentkeepalive.sockets[name]);
						assert(!agentkeepalive.freeSockets[name]);
						done();
					}, 10);
				}, 10);
			});
		}).on('error', done);
	});

	it('should use new socket when hit the max keepalive time: 500ms', done => {
		const agentkeepalive = new HttpAgent({
			freeSocketTimeout: 500,
			maxSockets: 5,
			maxFreeSockets: 5,
		});
		const name = 'localhost:' + port + ':';
		assert(!agentkeepalive.sockets[name]);
		assert(!agentkeepalive.freeSockets[name]);
		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			let lastPort = null;
			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				assert(agentkeepalive.sockets[name].length === 1);
				assert(!agentkeepalive.freeSockets[name]);

				// free keepAlive socket timeout and destroy
				setTimeout(() => {
					assert(!agentkeepalive.sockets[name]);
					assert(!agentkeepalive.freeSockets[name]);
					http.get({
						agent: agentkeepalive,
						port,
						path: '/',
					}, res => {
						assert(res.statusCode === 200);
						res.on('data', data => {
							data = JSON.parse(data);
							assert(data.socket.port > 0);
							assert(data.socket.port !== lastPort);
						});
						res.on('end', done);
					});
				}, 900);
			});
		});
	});

	it('should disable keepalive when keepAlive=false', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			keepAlive: false,
		});
		assert(agent.keepAlive === false);

		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.on('data', data => {
				assert(JSON.parse(data).headers.connection === 'close');
			});
			res.on('end', () => {
				assert(agent.sockets[name].length === 1);
				assert(!agent.freeSockets[name]);
				setTimeout(() => {
					assert(!agent.sockets[name]);
					assert(!agent.freeSockets[name]);
					done();
				}, 10);
			});
		});
	});

	it('should not keepalive when client.abort()', done => {
		const agentkeepalive = new HttpAgent({
			freeSocketTimeout: 1000,
			maxSockets: 5,
			maxFreeSockets: 5,
		});
		const name = 'localhost:' + port + ':';
		assert(!agentkeepalive.sockets[name]);
		const req = http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, () => {
			assert.fail('should not call this.');
		});
		req.on('error', err => {
			assert(err.message, 'socket hang up');
			assert(!agentkeepalive.sockets[name]);
			assert(!agentkeepalive.freeSockets[name]);
			done();
		});
		process.nextTick(() => {
			req.abort();
		});
		assert(agentkeepalive.sockets[name].length === 1);
	});

	it('should keep 1 socket', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			maxSockets: 1,
			maxFreeSockets: 1,
		});
		let lastPort = null;
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length === 1);
			assert(agent.requests[name].length === 1);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				// should be reuse
				process.nextTick(() => {
					assert(agent.sockets[name].length === 1);
					assert(!agent.freeSockets[name]);
				});
			});
		});

		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length === 1);
			assert(!agent.requests[name]);
			assert(res.statusCode === 200);

			res.on('data', data => {
				data = JSON.parse(data);
				assert(data.socket.port === lastPort);
			});
			res.on('end', () => {
				setTimeout(() => {
					// should keepalive 1 socket
					assert(!agent.sockets[name]);
					assert(agent.freeSockets[name].length === 1);
					done();
				}, 10);
			});
		});

		// has 1 request pedding in the requests queue
		assert(agent.requests[name].length === 1);
	});

	it('should keep 1 free socket', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			maxSockets: 2,
			maxFreeSockets: 1,
		});
		let lastPort = null;
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name]);
			assert(res.statusCode === 200);

			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				// should be reuse
				setTimeout(() => {
					assert(agent.freeSockets[name].length === 1);
				}, 100);
			});
		});

		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name]);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				assert(data.socket.port !== lastPort);
			});
			res.on('end', () => {
				setTimeout(() => {
					// should keepalive 1 socket
					assert(!agent.sockets[name]);
					assert(agent.freeSockets[name].length === 1);
					done();
				}, 100);
			});
		});
		assert(!agent.requests[name]);
	});

	it('should keep 2 free socket', done => {
		done = pedding(2, done);
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			maxSockets: 2,
			maxFreeSockets: 2,
		});
		let lastPort = null;
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				// should be reuse
				process.nextTick(() => {
					assert(agent.freeSockets[name]);
					done();
				});
			});
		});

		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				assert(data.socket.port !== lastPort);
			});
			res.on('end', () => {
				setTimeout(() => {
					// should keepalive 2 free sockets
					assert(!agent.sockets[name]);
					assert(agent.freeSockets[name].length === 2);
					done();
				}, 10);
			});
		});
		assert(!agent.requests[name]);
	});

	it('should request /remote_close 200 status, after 500ms free socket close', done => {
		const name = 'localhost:' + port + ':';
		assert(!agentkeepalive.sockets[name]);

		http.get({
			agent: agentkeepalive,
			port,
			path: '/remote_close',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name]);
				assert(!agentkeepalive.freeSockets[name]);
				setTimeout(() => {
					assert(!agentkeepalive.sockets[name]);
					assert(!agentkeepalive.freeSockets[name]);
					done();
				}, 600);
			});
		});
	});

	it('should fire req timeout callback the first use socket', done => {
		done = pedding(2, done);
		const agent = new HttpAgent({
			maxSockets: 2,
			maxFreeSockets: 2,
		});
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				const lastStatus = agent.getCurrentStatus();
				const req = http.get({
					agent,
					port,
					path: '/hang',
				}, () => {
					assert.fail('should not call this');
				});
				req.setTimeout(100, () => {
					const status = agent.getCurrentStatus();
					assert(status.timeoutSocketCount - lastStatus.timeoutSocketCount === 1);
					req.abort();
					done();
				});
				req.on('error', err => {
					assert(err.message === 'socket hang up');
					done();
				});
			});
		});
	});

	it('should fire req timeout callback the second use socket', done => {
		done = pedding(2, done);
		const agent = new HttpAgent({
			maxSockets: 2,
			maxFreeSockets: 2,
		});
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				const lastStatus = agent.getCurrentStatus();
				assert(lastStatus.createSocketCount === 1);
				// make sure reuse the same socket
				setImmediate(() => {
					const req = http.get({
						agent,
						port,
						path: '/hang',
					}, () => {
						assert.fail('should not call this');
					});
					req.setTimeout(100, () => {
						const status = agent.getCurrentStatus();
						assert(status.createSocketCount === 1);
						assert(status.timeoutSocketCount - lastStatus.timeoutSocketCount === 1);
						req.abort();
						done();
					});
					req.on('error', err => {
						assert(err.message === 'socket hang up');
						done();
					});
				});
			});
		});
	});

	it('should free socket timeout work', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			keepAliveTimeout: 100,
		});

		let lastPort = null;
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length === 1);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				process.nextTick(() => {
					assert(!agent.sockets[name]);
					assert(agent.freeSockets[name].length === 1);
					// free socket timeout after 100ms
					setTimeout(() => {
						assert(!agent.freeSockets[name]);
						done();
					}, 110);
				});
			});
		});
	});

	it('should first use working socket timeout', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			timeout: 100,
		});
		http.get({
			agent,
			port,
			path: '/hang',
		}, () => {
			throw new Error('should not run this');
		}).on('error', err => {
			assert(err.message === 'Socket timeout');
			assert(err.code === 'ERR_SOCKET_TIMEOUT');
			assert(!agent.sockets[name]);
			done();
		});
		assert(agent.sockets[name].length === 1);
	});

	it('should reuse working socket timeout', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			timeout: 100,
		});
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				setImmediate(() => {
					http.get({
						agent,
						port,
						path: '/hang',
					}, () => {
						throw new Error('should not run this');
					}).on('error', err => {
						assert(err.message === 'Socket timeout');
						assert(err.code === 'ERR_SOCKET_TIMEOUT');
						assert(!agent.sockets[name]);
						done();
					});
				});
			});
		});
		assert(agent.sockets[name].length === 1);
	});

	it('should destroy free socket before timeout', done => {
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent();
		let lastPort = null;
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length === 1);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				process.nextTick(() => {
					assert(!agent.sockets[name]);
					assert(agent.freeSockets[name].length === 1);
					agent.freeSockets[name][0].destroy();
					assert(agent.createSocketCount === 1);
					setTimeout(() => {
						assert(!agent.freeSockets[name]);
						// new request use the new socket
						http.get({
							agent,
							port,
							path: '/',
						}, res => {
							assert(agent.sockets[name].length === 1);
							assert(res.statusCode === 200);
							assert(agent.createSocketCount === 2);
							res.resume();
							res.on('end', done);
						});
					}, 10);
				});
			});
		});
		assert(agent.sockets[name].length === 1);
	});

	it('should remove error socket and create new one handle pedding request', done => {
		done = pedding(2, done);
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			maxSockets: 1,
			maxFreeSockets: 1,
		});
		let lastPort = null;
		http.get({
			agent,
			port,
			path: '/error',
		}, () => {
			throw new Error('never run this');
		}).on('error', err => {
			assert(err.message === 'socket hang up');
		}).on('close', () => done());

		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			assert(agent.sockets[name].length === 1);
			const socket = agent.sockets[name][0];
			assert.strictEqual(HttpAgent.getRequestCount(socket), 1);
			// not finish
			assert.strictEqual(HttpAgent.getRequestFinishedCount(socket), 0);
			assert(res.statusCode === 200);
			res.on('data', data => {
				data = JSON.parse(data);
				lastPort = data.socket.port;
				assert(lastPort > 0);
			});
			res.on('end', () => {
				process.nextTick(() => {
					assert(!agent.sockets[name]);
					assert(agent.freeSockets[name].length === 1);
					const socket = agent.freeSockets[name][0];
					assert(HttpAgent.getRequestCount(socket) === 1);
					// request finished
					assert(HttpAgent.getRequestFinishedCount(socket) === 1);
					done();
				});
			});
		});
		assert(agent.requests[name].length === 1);
	});

	it('should destroy all sockets when freeSockets is empty', done => {
		done = pedding(2, done);
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent();
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			http.get({
				agent,
				port,
				path: '/',
			}).on('error', err => {
				assert(err.message === 'socket hang up');
				setTimeout(() => {
					assert(!agent.sockets[name]);
					assert(!agent.freeSockets[name]);
					done();
				}, 10);
			});

			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agent.sockets[name].length === 2);
				agent.destroy();
				done();
			});
		});
	});

	it('should destroy both sockets and freeSockets', done => {
		done = pedding(2, done);
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent();
		http.get({
			agent,
			port,
			path: '/',
		}, res => {
			http.get({
				agent,
				port,
				path: '/',
			}).on('error', err => {
				assert(err.message === 'socket hang up');
				setTimeout(() => {
					assert(!agent.sockets[name]);
					assert(!agent.freeSockets[name]);
					done();
				}, 10);
			});

			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agent.sockets[name].length === 2);
				assert(!agent.freeSockets[name]);
				setImmediate(() => {
					assert(agent.sockets[name].length === 1);
					assert(agent.freeSockets[name].length === 1);
					agent.destroy();
					done();
				});
			});
		});
	});

	it('should keep max sockets: bugfix for orginal keepalive agent', _done => {
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			maxSockets: 2,
			maxFreeSockets: 2,
		});
		const done = pedding(2, err => {
			assert(!err);
			const pool = agentkeepalive.sockets[name];
			assert(!pool);
			// all sockets on free list now
			const freepool = agentkeepalive.freeSockets[name];
			assert(freepool.length === 2);
			_done();
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name]);
				setImmediate(done);
			});
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name]);
				setImmediate(done);
			});
		});
	});

	it('should make sure max sockets limit work', _done => {
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			maxSockets: 2,
			maxFreeSockets: 2,
		});
		const done = pedding(3, err => {
			assert(!err);
			const pool = agentkeepalive.sockets[name];
			assert(!pool);
			// all sockets on free list now
			const freepool = agentkeepalive.freeSockets[name];
			assert(freepool.length === 2);
			// make sure all free sockets SOCKET_REQUEST_FINISHED_COUNT equal to SOCKET_REQUEST_COUNT
			for (const s of freepool) {
				assert(HttpAgent.getRequestFinishedCount(s) === HttpAgent.getRequestCount(s));
			}
			_done();
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name]);
				setImmediate(done);
			});
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name]);
				setImmediate(done);
			});
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/',
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(agentkeepalive.sockets[name]);
				setImmediate(() => {
					// reuse free socket on addRequest
					assert(agentkeepalive.freeSockets[name]);
					http.get({
						agent: agentkeepalive,
						port,
						path: '/',
					}, res => {
						assert(res.statusCode === 200);
						res.resume();
						res.on('end', () => {
							assert(agentkeepalive.sockets[name]);
							setImmediate(done);
						});
					});
				});
			});
		});
		assert(agentkeepalive.sockets[name].length === 2);
		assert(!agentkeepalive.freeSockets[name]);
	});

	it('should timeout and remove free socket', done => {
		done = pedding(2, done);
		const name = 'localhost:' + port + ':';
		const agent = new HttpAgent({
			maxSockets: 1,
			maxFreeSockets: 1,
			freeSocketTimeout: 300,
		});

		const options = {
			hostname: 'registry.npmjs.org',
			port: 80,
			path: '/',
			method: 'GET',
			agent,
		};

		let index = 0;
		const getRequest = () => {
			const currentIndex = index++;
			const req = http.request(options, res => {
				let size = 0;
				res.on('data', chunk => {
					size += chunk.length;
				});
				res.on('end', () => {

					done();
				});
			});
			req.on('error', done);
			return req;
		};

		const req = getRequest();
		// Get a reference to the socket.
		req.on('socket', sock => {
			// Listen to timeout and send another request immediately.
			sock.on('timeout', () => {

				assert(!sock.writable);
				// sock has been removed from freeSockets list
				assert(!agent.freeSockets[name]);
				getRequest().end();
			});
		});
		req.end();
	});

	it('should not open more sockets than maxSockets when request success', done => {
		done = pedding(3, done);
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			keepAlive: true,
			keepAliveTimeout: 1000,
			maxSockets: 1,
			maxFreeSockets: 1,
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/hello1',
		}, res => {
			let info;
			assert(res.statusCode === 200);
			res.on('data', data => {
				info = JSON.parse(data);
			});
			res.on('end', () => {
				assert(info.url === '/hello1');
				assert(agentkeepalive.sockets[name].length === 1);
				done();
			});
			res.resume();
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/hello2',
		}, res => {
			let info;
			assert(res.statusCode === 200);
			res.on('data', data => {
				info = JSON.parse(data);
			});
			res.on('end', () => {
				assert(info.url === '/hello2');
				assert(agentkeepalive.sockets[name].length === 1);
				done();
			});
			res.resume();
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/hello3',
		}, res => {
			let info;
			assert(res.statusCode === 200);
			res.on('data', data => {
				info = JSON.parse(data);
			});
			res.on('end', () => {
				assert(info.url === '/hello3');
				assert(agentkeepalive.sockets[name].length === 1);
				done();
			});
			res.resume();
		});

		assert(Object.keys(agentkeepalive.sockets).length === 1);
		assert(agentkeepalive.sockets[name].length === 1);
	});

	it('should not open more sockets than maxSockets when request timeout', done => {
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			keepAlive: true,
			timeout: 200,
			maxSockets: 1,
			maxFreeSockets: 1,
		});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/hang',
		}, () => {
			throw new Error('should not run this');
		})
			.on('error', () => {
				assert(agentkeepalive.sockets[name].length === 1);
				done();
			});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/hang',
		}, () => {
			throw new Error('should not run this');
		})
			.on('error', () => {
			// do noting
			});

		http.get({
			agent: agentkeepalive,
			port,
			path: '/hang',
		}, () => {
			throw new Error('should not run this');
		})
			.on('error', () => {
				// do noting
			});

		assert(Object.keys(agentkeepalive.sockets).length === 1);
	});

	it('should set req.reusedSocket to true when reuse socket', done => {
		const agent = new HttpAgent({
			keepAlive: true,
		});

		// First request
		const req1 = http.get({
			port,
			path: '/',
			agent,
		}, res => {
			assert(res.statusCode === 200);
			res.on('data', () => {});
			res.on('end', () => {
				setTimeout(() => {
					// Second request
					const req2 = http.get({
						port,
						path: '/',
						agent,
					}, res => {
						assert(res.statusCode === 200);
						res.on('data', () => {});
						res.on('end', () => {
							done();
						});
					});
					// Second request reuses the socket
					assert(req2.reusedSocket);
				}, 10);
			});
		});

		// First request doesn't reuse the socket
		assert(!req1.reusedSocket);
	});

	describe('request timeout > agent timeout', () => {
		it('should use request timeout', done => {
			const agent = new HttpAgent({
				keepAlive: true,
				timeout: 50,
			});
			const req = http.get({
				agent,
				port,
				path: '/?timeout=150',
				timeout: 100,
			}, res => {
				console.error(res.statusCode, res.headers);
				assert.fail('should not get res here');
			});

			let isTimeout = false;
			req.on('timeout', () => {
				isTimeout = true;
				req.abort();
			});
			req.on('error', err => {
				assert(isTimeout);
				assert(err);
				assert(err.message === 'socket hang up');
				assert(err.code === 'ECONNRESET');
				done();
			});
		});
	});

	describe('keepAlive = false', () => {
		it('should close socket after request', done => {
			const name = 'localhost:' + port + ':';
			const agent = new HttpAgent({
				keepAlive: false,
			});
			http.get({
				agent,
				port,
				path: '/',
			}, res => {
				assert(res.statusCode === 200);
				res.resume();
				res.on('end', () => {
					setTimeout(() => {
						assert(!agent.sockets[name]);
						assert(!agent.freeSockets[name]);
						done();
					}, 10);
				});
			});
		});
	});

	describe('getCurrentStatus()', () => {
		it('should get current agent status', () => {
			const status = agentkeepalive.getCurrentStatus();
			assert.deepEqual(Object.keys(status), [
				'createSocketCount', 'createSocketErrorCount', 'closeSocketCount',
				'errorSocketCount', 'timeoutSocketCount',
				'requestCount', 'freeSockets', 'sockets', 'requests',
			]);
		});
	});

	describe('mock idle socket error', () => {
		it('should idle socket emit error event', done => {
			const agent = new HttpAgent();

			const options = {
				host: 'r.cnpmjs.org',
				port: 80,
				path: '/',
				agent,
			};

			const socketKey = agent.getName(options);
			const req = http.get(options, res => {
				let size = 0;
				assert(res.headers.connection === 'keep-alive');
				res.on('data', chunk => {
					size += chunk.length;
				});
				res.on('end', () => {
					assert(size > 0);
					assert(Object.keys(agent.sockets).length === 1);
					assert(Object.keys(agent.freeSockets).length === 0);
					process.nextTick(() => {
						assert(agent.freeSockets[socketKey].length === 1);
						setTimeout(() => {
							// agent should catch idle socket error event
							agent.freeSockets[socketKey][0].emit('error', new Error('mock read ECONNRESET'));

							setTimeout(() => {
								// error socket should be destroy and remove
								assert(Object.keys(agent.freeSockets).length === 0);
								done();
							}, 10);
						}, 10);
					});
				});
				res.resume();
			});
			req.on('error', done);
		});
	});

	describe('options.socketActiveTTL', () => {
		it('should expire on free socket timeout when it is out of ttl', done => {
			const agent = new HttpAgent({
				keepAlive: true,
				maxSockets: 5,
				maxFreeSockets: 5,
				timeout: 30000,
				freeSocketTimeout: 5000,
				socketActiveTTL: 100,
			});
			const req1 = http.get({
				agent,
				port,
				path: '/',
			}, res => {
				assert(res.statusCode === 200);
				res.resume();
				res.on('end', () => {
					const socket1 = req1.socket;
					const firstCreatedTime = HttpAgent.getCreatedTime(socket1);
					assert(firstCreatedTime && typeof firstCreatedTime === 'number');
					setTimeout(() => {
						const req2 = http.get({
							agent,
							port,
							path: '/',
						}, res => {
							assert(res.statusCode === 200);
							res.resume();
							res.on('end', () => {
								assert(req2.socket !== socket1);
								const currentCreatedTime = HttpAgent.getCreatedTime(req2.socket);
								assert(currentCreatedTime && typeof currentCreatedTime === 'number');
								assert(firstCreatedTime < currentCreatedTime);
								done();
							});
						});
					}, 200);
				});
			});
		});

		it('should expire on socket reuse detect when it is out of ttl', done => {
			const agent = new HttpAgent({
				keepAlive: true,
				socketActiveTTL: 10,
			});
			const req1 = http.get({
				agent,
				port,
				path: '/?timeout=20',
			}, res => {
				const socket1 = req1.socket;
				const firstCreatedTime = HttpAgent.getCreatedTime(socket1);
				assert(firstCreatedTime && typeof firstCreatedTime === 'number');
				assert(res.statusCode === 200);
				res.resume();
				res.on('end', () => {
					setImmediate(() => {
						const req2 = http.get({
							agent,
							port,
							path: '/',
						}, res => {
							// not the same socket
							assert(HttpAgent.getName(req2.socket) !== HttpAgent.getName(socket1));
							const currentCreatedTime = HttpAgent.getCreatedTime(req2.socket);
							assert(currentCreatedTime && typeof currentCreatedTime === 'number');
							assert(firstCreatedTime < currentCreatedTime);
							assert(res.statusCode === 200);
							res.resume();
							res.on('end', done);
						});
					});
				});
			});
		});

		it('should not expire active socket when it is in ttl', done => {
			const agent = new HttpAgent({
				socketActiveTTL: 1000,
			});
			const req1 = http.get({
				agent,
				port,
				path: '/',
			}, res => {
				const socket1 = req1.socket;
				const firstCreatedTime = HttpAgent.getCreatedTime(socket1);
				assert(firstCreatedTime && typeof firstCreatedTime === 'number');
				assert(res.statusCode === 200);
				res.resume();
				res.on('end', () => {
					setTimeout(function() {
						const timeout = socket1.timeout || socket1._idleTimeout;
						assert(timeout <= 1000);
						const req2 = http.get({
							agent,
							port,
							path: '/',
						}, res => {
							assert(res.statusCode === 200);
							res.resume();
							res.on('end', () => {
								assert(HttpAgent.getName(req2.socket) === HttpAgent.getName(socket1));
								const currentCreatedTime = HttpAgent.getCreatedTime(req2.socket);
								assert(currentCreatedTime && typeof currentCreatedTime === 'number');
								assert(firstCreatedTime === currentCreatedTime);
								done();
							});
						});
					}, 100);
				});
			});
		});

		it('should TTL diff > freeSocketTimeout', done => {
			const agent = new HttpAgent({
				freeSocketTimeout: 500,
				socketActiveTTL: 1000,
			});
			const req1 = http.get({
				agent,
				port,
				path: '/',
			}, res => {
				const socket1 = req1.socket;
				const firstCreatedTime = HttpAgent.getCreatedTime(socket1);
				assert(firstCreatedTime && typeof firstCreatedTime === 'number');
				assert(res.statusCode === 200);
				res.resume();
				res.on('end', () => {
					setTimeout(function() {
						const timeout = socket1.timeout || socket1._idleTimeout;
						assert(timeout === 500);
						const req2 = http.get({
							agent,
							port,
							path: '/',
						}, res => {
							assert(res.statusCode === 200);
							res.resume();
							res.on('end', () => {
								assert(HttpAgent.getName(req2.socket) === HttpAgent.getName(socket1));
								const currentCreatedTime = HttpAgent.getCreatedTime(req2.socket);
								assert(currentCreatedTime && typeof currentCreatedTime === 'number');
								assert(firstCreatedTime === currentCreatedTime);
								done();
							});
						});
					}, 100);
				});
			});
		});
	});

	// ECONNRESET tests
	describe('ECONNRESET handling', () => {

		let port;
		let server;
		let timer;

		before(done => {
			server = http.createServer((req, res) => {
				res.end('Hello World');
			});
			server.keepAliveTimeout = 30;
			server.listen(0, err => {
				port = server.address().port;
				done(err);
			});
		});
	  
		after(() => {
			clearInterval(timer);
		});
	  
		it('should close sockets before an ECONNRESET can happen when we know the server-side timeout', done => {
			const keepaliveAgent = new HttpAgent({
				keepAlive: true,
				freeSocketTimeout: 20,
			});
	  
			function request() {
				return new Promise((resolve, reject) => {
					const req = http.request({
						method: 'GET',
						port,
						path: '/',
						agent: keepaliveAgent,
					}, res => {
						const chunks = [];
						res.on('data', data => {
							chunks.push(data);
						});
						res.on('end', () => {
							const text = Buffer.concat(chunks).toString();
							resolve(text);
						});
					});

					req.on('error', err => {
						reject(err);
					});

					req.end();
				});
			}
	  
			async function startSendingRequests() {
				let successes = 0;
				const failures = {};

				for (let i = 0; i < 10; i++) {
					await Pledge.after(22);

					try {
						await request();
						successes++;
					} catch (e) {
						failures[e.message] = (failures[e.message] || 0) + 1;
					}
				}
				
				return { successes, failures };
			}

			startSendingRequests().then(({ successes, failures }) => {
				assert.strictEqual(Object.keys(failures).length, 0);
				assert.strictEqual(successes, 10);
				done();
			});
		});

		it('should report an ECONNRESET error when the server closes the socket', done => {

			// Free socket timeout is higher than the one on the server
			const keepaliveAgent = new HttpAgent({
				keepAlive: true,
				freeSocketTimeout: 50,
			});
	  
			function request() {
				return new Promise((resolve, reject) => {
					const req = http.request({
						method: 'GET',
						port,
						path: '/',
						agent: keepaliveAgent,
					}, res => {
						const chunks = [];
						res.on('data', data => {
							chunks.push(data);
						});
						res.on('end', () => {
							const text = Buffer.concat(chunks).toString();
							resolve(text);
						});
					});

					req.on('error', err => {
						reject(err);
					});

					req.end();
				});
			}
	  
			async function startSendingRequests() {
				let successes = 0;
				const failures = {};

				for (let i = 0; i < 10; i++) {
					await Pledge.after(30);

					try {
						await request();
						successes++;
					} catch (e) {
						failures[e.message] = (failures[e.message] || 0) + 1;
					}
				}
				
				return { successes, failures };
			}

			startSendingRequests().then(({ successes, failures }) => {

				assert(failures['socket hang up'] >= 2, 'At least 2 hang-ups should have occurred, but found ' + failures['socket hang up']);
				assert(successes >= 4, 'At least 4 successed should have happened, but found ' + successes);

				done();
			});

		});

		it('should be handled by Request automatically', done => {

			// Free socket timeout is higher than the one on the server
			const keepaliveAgent = new HttpAgent({
				keepAlive: true,
				freeSocketTimeout: 1000,
			});

			function request() {


				let pledge = new Pledge();

				Blast.fetch({
					url   : 'http://localhost:' + port + '/',
					agent : keepaliveAgent,
					cache : false,
				}, (err, response, output) => {

					if (err) {
						return pledge.reject(err);
					}

					let request = response.request;

					assert.strictEqual(request.from_cache, false);

					pledge.resolve(response);
				});

				return pledge;
			}

			async function startSendingRequests() {
				let successes = 0;
				const failures = {};
				let retries = 0;

				// This is a bit hard to test because we need to perform a request
				// at the exact same time as the servr closes the socket
				for (let i = 0; i < 10; i++) {
					await Pledge.after(29);

					try {
						let res = await request();

						if (res.request?.retries) {
							retries += res.request?.retries;
						}
						successes++;
					} catch (e) {
						console.log(e)
						failures[e.message] = (failures[e.message] || 0) + 1;
					}
				}
				
				return { successes, failures, retries };
			}

			startSendingRequests().then(({ successes, failures, retries }) => {

				assert(retries > 3, 'At least 3 retries should have occurred, but found ' + retries);
				assert.strictEqual(successes, 10, 'All 10 requests should have succeeded');

				done();
			});

		});
	});

	it('should not timeout when creating a new request that is almost timing out', async () => {
		const name = 'localhost:' + port + ':';
		const agentkeepalive = new HttpAgent({
			freeSocketTimeout: '2s',
			timeout: '20ms',
		});

		assert.strictEqual(agentkeepalive.options.freeSocketTimeout, 2000);
		assert.strictEqual(agentkeepalive.options.timeout, 20);
		assert(!agentkeepalive.sockets[name]);
		assert(!agentkeepalive.freeSockets[name]);

		function makeRequests() {

			let pledge = new Blast.Classes.Pledge();

			const finished = function(err) {
				if (err) {
					pledge.reject(err);
				} else {
					pledge.resolve();
				}
			};

			http.get({
				agent: agentkeepalive,
				port,
				path: '/',
			}, res => {
				assert.strictEqual(res.statusCode, 200);

				const chunks = [];
				res.resume();
				res.on('data', data => {
					chunks.push(data);
				});

				res.on('end', () => {
					const buf = Buffer.concat(chunks);

					const data = JSON.parse(buf);
					remotePort = data.socket.port;
					assert.strictEqual(data.headers.connection, 'keep-alive');

					assert(agentkeepalive.sockets[name]);
					assert(!agentkeepalive.freeSockets[name]);

					setTimeout(() => {
						assert(!agentkeepalive.sockets[name]);
						assert(agentkeepalive.freeSockets[name]);
						assert.strictEqual(agentkeepalive.freeSockets[name].length, 1);

						const req = http.get({
							agent: agentkeepalive,
							port,
							path: '/?timeout=15',
						}, (res) => {

							res.resume();

							// This DOES fire!
							res.on('end', () => {
								finished();
							})

						}).on('error', err => {
							finished(err);
						});
						req.on('timeout', () => {
							// This still happens!
							finished(new Error('Request timed out'));
						});
					}, 18);
				});
			});

			return pledge;
		};

		await makeRequests();
		await makeRequests();
		await makeRequests();
		await makeRequests();
		await makeRequests();
	});
});

let HttpsAgent;

describe('HttpsAgent', function() {

	before(done => {

		Blast  = require('../index.js')();
		HttpsAgent = Blast.Classes.Develry.HttpsAgent;

		agentkeepalive = new HttpsAgent({
			freeSocketTimeout: 100,
			timeout: 200,
			maxSockets: 5,
			maxFreeSockets: 5,
		});

		app = https.createServer({
			key: fs.readFileSync(__dirname + '/assets/agenttest-key.pem'),
			cert: fs.readFileSync(__dirname + '/assets/agenttest-cert.pem'),
		}, (req, res) => {
			req.resume();
			if (req.url === '/error') {
				res.destroy();
				return;
			} else if (req.url === '/hang') {
				// Wait forever.
				return;
			}
			const info = urlparse(req.url, true);
			if (info.query.timeout) {
				setTimeout(() => {
					res.writeHeader(200, {
						'Content-Length': `${info.query.timeout.length}`,
					});
					res.end(info.query.timeout);
				}, parseInt(info.query.timeout));
				return;
			}
			res.end(JSON.stringify({
				info,
				url: req.url,
				headers: req.headers,
				remotePort: req.socket.remotePort,
			}));
		});
		app.listen(0, () => {
			port = app.address().port;
			done();
		});
	});

	it('should GET / success with 200 status', done => {
		https.get({
			agent: agentkeepalive,
			port,
			path: '/',
			ca: fs.readFileSync(__dirname + '/assets/ca.pem'),
			rejectUnauthorized: false,
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				assert(Object.keys(agentkeepalive.sockets).length === 1);
				assert(Object.keys(agentkeepalive.freeSockets).length === 0);
				setImmediate(() => {
					assert(Object.keys(agentkeepalive.sockets).length === 0);
					assert(Object.keys(agentkeepalive.freeSockets).length === 1);
					done();
				});
			});
		});
		assert(Object.keys(agentkeepalive.sockets).length === 1);
		assert(Object.keys(agentkeepalive.freeSockets).length === 0);
	});

	it('should req handle custom timeout error', done => {
		const req = https.get({
			agent: agentkeepalive,
			port,
			path: '/?timeout=100',
			ca: fs.readFileSync(__dirname + '/assets/ca.pem'),
			timeout: 50,
			rejectUnauthorized: false,
		}, res => {
			console.log(res.statusCode, res.headers);
			res.resume();
			res.on('end', () => {
				done(new Error('should not run this'));
			});
		}).on('error', err => {
			assert(err);
			assert(err.message === 'socket hang up');
			done();
		});

		// node 8 don't support options.timeout on http.get
		if (process.version.startsWith('v8.')) {
			req.setTimeout(50);
		}
		req.on('timeout', () => {
			req.abort();
		});
	});

	it('should don\'t set timeout on options.timeout = 0', done => {
		const agent = new HttpsAgent({
			freeSocketTimeout: 1000,
			timeout: 0,
			maxSockets: 5,
			maxFreeSockets: 5,
			rejectUnauthorized: false,
		});
		https.get({
			agent,
			port,
			path: '/',
			ca: fs.readFileSync(__dirname + '/assets/ca.pem'),
		}, res => {
			res.resume();
			res.on('end', done);
		});
	});

	it('should free socket timeout', done => {
		https.get({
			agent: agentkeepalive,
			port,
			path: '/',
			ca: fs.readFileSync(__dirname + '/assets/ca.pem'),
			rejectUnauthorized: false,
		}, res => {
			assert(res.statusCode === 200);
			res.resume();
			res.on('end', () => {
				process.nextTick(() => {
					assert(Object.keys(agentkeepalive.sockets).length === 0);
					assert(Object.keys(agentkeepalive.freeSockets).length === 1);
					// wait for timeout
					setTimeout(() => {
						assert(Object.keys(agentkeepalive.sockets).length === 0);
						assert(Object.keys(agentkeepalive.freeSockets).length === 0);
						done();
					}, 250);
				});
			});
		});
		assert(Object.keys(agentkeepalive.sockets).length === 1);
	});

	it('should GET / and /foo use the same socket', done => {
		const options = {
			port,
			path: '/',
			agent: agentkeepalive,
			rejectUnauthorized: false,
		};
		let remotePort = null;
		https.get(options, res => {
			assert(res.statusCode === 200);
			let data = null;
			res.on('data', chunk => {
				data = JSON.parse(chunk);
			});
			res.on('end', () => {
				assert(data.remotePort > 0);
				assert(data.url === '/');
				remotePort = data.remotePort;

				// request again
				options.path = '/foo';
				process.nextTick(() => {
					https.get(options, res => {
						assert(res.statusCode === 200);
						let data = null;
						res.on('data', chunk => {
							data = JSON.parse(chunk);
						});
						res.on('end', () => {
							assert(data.remotePort === remotePort);
							assert(data.url === '/foo');
							process.nextTick(() => {
								assert(Object.keys(agentkeepalive.sockets).length === 0);
								assert(Object.keys(agentkeepalive.freeSockets).length === 1);
								done();
							});
						});
					});
				});
			});
		});
	});

	it('should GET / and /foo using the same socket via Request class', done => {

		const options = {
			port,
			path: '/',
			agent: agentkeepalive,
			rejectUnauthorized: false,
		};

		let remotePort = null;

		Blast.fetch({
			url : 'https://localhost:' + port + '/',
			rejectUnauthorized: false,
			cache: false,
		}, (err, response, output) => {

			let res = response.request.incoming_res;

			assert.strictEqual(res.statusCode, 200);

			let data = JSON.parse(output);

			assert(data.remotePort > 0);
			assert.strictEqual(data.url, '/');
			remotePort = data.remotePort;

			process.nextTick(() => {

				Blast.fetch({
					url : 'https://localhost:' + port + '/foo',
					rejectUnauthorized : false,
					cache: false,
				}, (err, response, output) => {

					let res = response.request.incoming_res;

					assert(res.statusCode === 200);
					let data = JSON.parse(output);
					
					assert.strictEqual(data.remotePort, remotePort);
					assert.strictEqual(data.url, '/foo');

					process.nextTick(() => {
						assert.strictEqual(Object.keys(agentkeepalive.sockets).length, 0);
						assert.strictEqual(Object.keys(agentkeepalive.freeSockets).length, 1);
						done();
					});
				});

			});
		});
	});

	describe('request timeout > agent timeout', () => {
		it('should use request timeout', done => {
			const agent = new HttpsAgent({
				keepAlive: true,
				timeout: 100,
			});
			const req = https.get({
				agent,
				port,
				path: '/?timeout=10000',
				timeout: 150,
				rejectUnauthorized: false,
				ca: fs.readFileSync(__dirname + '/assets/ca.pem'),
			}, res => {
				console.error(res.statusCode, res.headers);
				assert.fail('should not get res here');
			});

			let isTimeout = false;
			req.on('timeout', () => {
				isTimeout = true;
				req.abort();
			});
			req.on('error', err => {
				assert(isTimeout);
				assert(err);
				assert(err.message === 'socket hang up');
				assert(err.code === 'ECONNRESET');
				done();
			});
		});
	});

});