/* eslint-disable node/no-unsupported-features/es-builtins */
/* eslint-disable import/extensions */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable import/no-unresolved */

import HyperAPIDriver  from '@hyperapi/core/driver';
import HyperAPIRequest from '@hyperapi/core/request';
import { decode }      from 'cbor-x';

const ERROR_RESPONSE = new Response(
	'',
	{
		status: 404,
	},
);

// TODO: new file with parseAcceptHeader, parseArgs

export default class HyperAPIBunDriver extends HyperAPIDriver {
	#bunserver;

	constructor({
		path = '/api/',
		port,
	}) {
		if (typeof path !== 'string') {
			throw new TypeError('Property "path" must be a string.');
		}
		super();
		this.#bunserver = Bun.serve({
			port,
			fetch: async (request) => {
				const url = new URL(request.url);

				if (url.pathname.startsWith(path) !== true) {
					return ERROR_RESPONSE;
				}

				const method = url.pathname.slice(path.length);

				// const args = await parseArgs(request, url)
				let args = {};

				// TODO: handle Accept header
				// (FUNCTION that returns preferable content-type)
				// (split by regexp << \s*(;|,)\s* >>)
				// switch s pereborom variantov

				// TODO: cbor -> response.object() + encode
				if (request.method === 'GET' || request.method === 'HEAD') {
					for (const [ key, value ] of url.searchParams.entries()) {
						args[key] = value;
					}
				}
				else if (request.body) {
					// TODO: check at jsperf.app regexp vs .split(';');
					const type_header = request.headers.get('Content-Type').replace(/;.+/, '');
					switch (type_header) {
						case 'application/json':
							args = await request.json();
							break;
						case 'application/x-www-form-urlencoded':
							args = Object.fromEntries(
								new URLSearchParams(await request.text()),
							);
							break;
						case 'application/cbor':
							args = decode(await request.arrayBuffer());
							break;
						default:
							return ERROR_RESPONSE;
					}
				}

				const {
					status,
					headers,
					body,
				} = await this.#onRequest(method, args);

				if (request.method === 'HEAD') {
					return new Response(
						null,
						{
							status,
							headers,
						},
					);
				}

				return new Response(
					body,
					{
						status,
						headers,
					},
				);
			},
		});
	}

	// put it in fetch
	async #onRequest(method, args) {
		const hyperAPIResponse = await this.onRequest(
			new HyperAPIRequest(method, args),
		);

		// TODO: if no httpStatus in error - return HyperAPIError code:3
		// and status: 500;

		return {
			body: hyperAPIResponse.json(),
			status: hyperAPIResponse.error?.httpStatus ?? 200,
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}

	destroy() {
		this.#bunserver.stop();
	}
}
