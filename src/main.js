
/* eslint-disable import/extensions */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable import/no-unresolved */

import HyperAPIDriver            from '@hyperapi/core/driver';
import HyperAPIRequest           from '@hyperapi/core/request';
import HyperAPIResponse          from '@hyperapi/core/response';
import { HyperAPIInternalError } from '@hyperapi/core/api-errors';
import IP                        from '@kirick/ip';

import {
	parseAcceptHeader,
	parseArguments,
	parseResponseTo }            from './parse.js';

export default class HyperAPIBunDriver extends HyperAPIDriver {
	#bunserver;

	constructor({
		path = '/api/',
		port,
	}) {
		if (typeof path !== 'string') {
			throw new TypeError('Property "path" must be a string.');
		}
		if (typeof port !== 'number') {
			throw new TypeError('Property "port" must be a number.');
		}

		super();
		this.#bunserver = Bun.serve({
			port,
			fetch: async (request, server) => {
				const url = new URL(request.url);

				if (url.pathname.startsWith(path) !== true) {
					return new Response(
						'',
						{
							status: 404,
						},
					);
				}

				const method = url.pathname.slice(path.length);
				const args = await parseArguments(request, url);
				const preffered_format = parseAcceptHeader(
					request.headers.get('Accept'),
				);

				if (args === 'UNSUPPORTED_CONTENT_TYPE') {
					return new Response(
						'',
						{
							status: 415,
						},
					);
				}
				const { address: ip_address } = server.requestIP(request);

				const hyperApiRequest = new HyperAPIRequest(method, args);
				hyperApiRequest.set('request', request);
				hyperApiRequest.set('url', url);
				hyperApiRequest.set('ip', new IP(ip_address));

				const hyperAPIResponse = await this.onRequest(hyperApiRequest);

				if (
					hyperAPIResponse.is_success === false
					&& hyperAPIResponse.error.httpStatus === undefined
				) {
					const internal_error = new HyperAPIResponse(
						new HyperAPIInternalError(),
					);

					return new Response(
						parseResponseTo(
							preffered_format,
							internal_error.getResponse(),
						),
						{
							status: 500,
							headers: {
								'Content-Type': 'application/' + preffered_format,
							},
						},
					);
				}

				return new Response(
					parseResponseTo(
						preffered_format,
						hyperAPIResponse.getResponse(),
					),
					{
						status: hyperAPIResponse.error?.httpStatus ?? 200,
						headers: {
							'Content-Type': 'application/' + preffered_format,
						},
					},
				);
			},
		});
	}

	destroy() {
		this.#bunserver.stop();
	}
}
