
import {
	HyperAPIDriver,
	HyperAPIError,
	HyperAPIRequest }  from '@hyperapi/core';
import IP              from '@kirick/ip';
import { HttpError }   from './libs/http-error.js';
import {
	parseAcceptHeader,
	parseArguments,
	parseResponseTo }  from './libs/parse.js';

const HTTP_METHOD_NO_RESPONSE_BODY = new Set([
	'HEAD',
	'OPTIONS',
]);

export default class HyperAPIBunDriver extends HyperAPIDriver {
	#path;
	#multipart_formdata_enabled;

	#bunserver;

	constructor({
		path = '/api/',
		port,
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

	destroy() {
		this.#bunserver.stop();
	}

	async #processRequest(request, server) {
		// FIXME: doesn't work after async functions
		const { address: ip_address } = server.requestIP(request);

		const add_response_body = HTTP_METHOD_NO_RESPONSE_BODY.has(request.method) !== true;
		const url = new URL(request.url);

		let preffered_format;

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

			const hyperApiRequest = new HyperAPIRequest(
				method,
				args,
			);
			hyperApiRequest.set(
				'request',
				request,
			);
			hyperApiRequest.set(
				'url',
				url,
			);
			hyperApiRequest.set(
				'ip',
				new IP(ip_address),
			);

			const hyperAPIResponse = await this.onRequest(hyperApiRequest);
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
						headers.append(header, value);
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
