/**
 * @license
 * Copyright 2019-2020 Balena Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as http from 'http';
import * as _ from 'lodash';

const proxyServers: http.Server[] = [];

after(function() {
	if (proxyServers.length) {
		console.error(`closing proxy servers (count=${proxyServers.length})`);
		proxyServers.forEach(s => s.close());
		proxyServers.splice(0);
	}
});

export const createProxyServerOnce = _.once(createProxyServer);

async function createProxyServer(): Promise<number> {
	const httpProxy = require('http-proxy') as typeof import('http-proxy');

	const interceptorPort = await createInterceptorServer();

	const proxy = httpProxy.createProxyServer();
	proxy.on('error', function(
		err: Error,
		_req: http.IncomingMessage,
		res: http.ServerResponse,
	) {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		const msg = `Proxy server error: ${err}`;
		console.error(msg);
		res.end(msg);
	});

	const server = http.createServer(function(
		req: http.IncomingMessage,
		res: http.ServerResponse,
	) {
		proxy.web(req, res, { target: `http://127.0.0.1:${interceptorPort}` });
	});
	proxyServers.push(server);

	server.on('error', (err: Error) => {
		console.error(`Proxy server error (http.createServer):\n${err}`);
	});

	let proxyServerPort = 0; // TCP port number, 0 means automatic allocation

	await new Promise((resolve, reject) => {
		const listener = server.listen(0, '127.0.0.1', (err: Error) => {
			if (err) {
				console.error(`Error starting proxy server:\n${err}`);
				reject(err);
			} else {
				const info: any = listener.address();
				proxyServerPort = info.port;
				console.error(
					`[Info] CONNECT proxy server listening on ${info.address}:${proxyServerPort}`,
				);
				resolve();
			}
		});
	});

	return proxyServerPort;
}

async function createInterceptorServer(): Promise<number> {
	const url = await import('url');

	const server = http.createServer();
	proxyServers.push(server);

	server
		.on('error', (err: Error) => {
			console.error(`Interceptor server error: ${err}`);
		})
		.on(
			'request',
			(cliReq: http.IncomingMessage, cliRes: http.ServerResponse) => {
				const proxiedFor = `http://${cliReq.headers.host}${cliReq.url}`;
				// tslint:disable-next-line:prefer-const
				let { protocol, hostname, port, path: urlPath, hash } = url.parse(
					proxiedFor,
				);
				protocol = (protocol || 'http:').toLowerCase();
				port = port || (protocol === 'https:' ? '443' : '80');
				const reqOpts = {
					protocol,
					port,
					host: hostname,
					path: `${urlPath || ''}${hash || ''}`,
					method: cliReq.method,
					headers: cliReq.headers,
				};
				const srvReq = http.request(reqOpts);
				srvReq
				.on('error', err => {
					console.error(`Interceptor server error in onward request:\n${err}`);
				})
				.on('response', (srvRes: http.IncomingMessage) => {
					for (const [key, val] of Object.entries(srvRes.headers)) {
						if (key && val) {
							cliRes.setHeader(key, val);
						}
					}
					cliRes.statusCode = srvRes.statusCode || cliRes.statusCode;
					cliRes.statusMessage = srvRes.statusMessage || cliRes.statusMessage;
					srvRes.pipe(cliRes).on('error', err => {
						console.error(
							`Interceptor server error piping response to proxy server:\n${err}`,
						);
					});
				});
				cliReq.pipe(srvReq).on('error', (err: Error) => {
					console.error(
						`Proxy server error piping client request onward:\n${err}`,
					);
				});
			},
		);

	let interceptorPort = 0;

	await new Promise((resolve, reject) => {
		const listener = server.listen(0, '127.0.0.1', (err: Error) => {
			if (err) {
				console.error(`Error starting interceptor server:\n${err}`);
				reject(err);
			} else {
				const info: any = listener.address();
				interceptorPort = info.port;
				console.error(
					`[Info] Interceptor server listening on ${info.address}:${interceptorPort}`,
				);
				resolve();
			}
		});
	});

	return interceptorPort;
}
