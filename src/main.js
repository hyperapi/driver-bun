
import {
	HyperAPIDriver,
	HyperAPIError }           from '@hyperapi/core';
import { IP }                 from '@kirick/ip';
import { HttpError }          from './http-error.js';
import {
	parseAcceptHeader,
	parseArguments,
	parseResponseTo }         from './parse.js';
import { HyperAPIBunRequest } from './request.js';

const HTTP_METHOD_NO_RESPONSE_BODY = new Set([
	'HEAD',
	'OPTIONS',
]);

export default class HyperAPIBunDriver extends HyperAPIDriver {
	#path;
	#multipart_formdata_enabled;

	#bunserver;

	/**
	 * @param {object} options -
	 * @param {string} [options.path] - Path to serve. Default: `/api/`.
	 * @param {number} [options.port] - HTTP server port. Default: `8001`.
	 * @param {boolean} [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
	 */
	constructor({
		path = '/api/',
		port = 8001,
		multipart_formdata_enabled = false,
	}) {
		if (typeof path !== 'string') {
			throw new TypeError('Property "path" must be a string.');
		}
		if (typeof port !== 'number') {
			throw new TypeError('Property "port" must be a number.');
		}

		super();

		this.#multipart_formdata_enabled = multipart_formdata_enabled;
		this.#path = path;

		this.#bunserver = Bun.serve({
			development: false,
			port,
			fetch: async (request, server) => this.#processRequest(request, server),
		});
	}

	/**
	 * Stops the server.
	 */
	destroy() {
		this.#bunserver.stop();
	}

	/**
	 * Handles the HTTP request.
	 * @param {Request} request - HTTP request.
	 * @param {import('bun').Server} server - Bun server.
	 * @returns {Promise<Response>} -
	 */
	async #processRequest(request, server) {
		// FIXME: doesn't work after async functions
		const socket_address = server.requestIP(request);
		if (socket_address === null) {
			throw new Error('Cannot get IP address from request.');
		}

		const add_response_body = HTTP_METHOD_NO_RESPONSE_BODY.has(request.method) !== true;
		const url = new URL(request.url);

		/** @type {'json' | 'cbor'} */
		let preffered_format = 'json';

		try {
			if (url.pathname.startsWith(this.#path) !== true) {
				throw new HttpError(404);
			}

			const method = url.pathname.slice(
				this.#path.length,
			);

			preffered_format = parseAcceptHeader(
				request.headers.get('Accept'),
			);

			const args = await parseArguments(
				request,
				url,
				this.#multipart_formdata_enabled,
			);

			// FIXME: doesn't work after async functions
			// const { address: ip_address } = server.requestIP(request);

			const hyperApiRequest = new HyperAPIBunRequest(
				method,
				args,
				{
					request,
					url,
					ip: new IP(socket_address.address),
				},
			);

			const hyperAPIResponse = await this.processRequest(hyperApiRequest);
			if (hyperAPIResponse.error instanceof HyperAPIError) {
				throw hyperAPIResponse.error;
			}

			return new Response(
				parseResponseTo(
					preffered_format,
					hyperAPIResponse.getResponse(),
				),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/' + preffered_format,
					},
				},
			);
		}
		catch (error) {
			if (error instanceof HyperAPIError) {
				if (typeof error.httpStatus !== 'number') {
					throw new TypeError('Property "httpStatus" of "HyperAPIError" must be a number.');
				}

				const headers = new Headers();
				headers.append(
					'Content-Type',
					'application/' + preffered_format,
				);
				if (error.httpHeaders) {
					for (const [ header, value ] of Object.entries(error.httpHeaders)) {
						headers.append(
							header,
							value,
						);
					}
				}

				let body;
				if (add_response_body) {
					body = parseResponseTo(
						preffered_format,
						error.getResponse(),
					);
				}

				return new Response(
					body,
					{
						status: error.httpStatus,
						headers,
					},
				);
			}

			if (error instanceof HttpError) {
				return error.getResponse();
			}

			return new HttpError(500).getResponse();
		}
	}
}

export { HyperAPIBunRequest } from './request.js';
