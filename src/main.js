
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */

import HyperAPIDriver            from '@hyperapi/core/driver';
import HyperAPIRequest           from '@hyperapi/core/request';
import HyperAPIError             from '@hyperapi/core/error';
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
			development: false,
			port,
			fetch: async (request, server) => {
				const { address: ip_address } = server.requestIP(request); // FIXME: doesn't work after async functions
				const url = new URL(request.url);

				if (url.pathname.startsWith(path) !== true) {
					return new Response(
						'',
						{
							status: 404,
						},
					);
				}
				let args = {};
				const method = url.pathname.slice(path.length);
				const preffered_format = parseAcceptHeader(
					request.headers.get('Accept'),
				);
				try {
					args = await parseArguments(request, url);
				}
				catch (error) {
					if (error instanceof HyperAPIError) {
						return new Response(
							parseResponseTo(
								preffered_format,
								error.getResponse(),
							),
							{
								status: error.httpStatus,
								headers: {
									'Content-Type': 'application/' + preffered_format,
								},
							},
						);
					}
					return new Response(
						'',
						{
							status: 500,
						},
					);
				}

				if (args === null) {
					return new Response(
						'',
						{
							status: 415,
						},
					);
				}

				if (args instanceof HyperAPIError) {
					return new Response(
						parseResponseTo(
							preffered_format,
							args.getResponse(),
						),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/' + preffered_format,
							},
						},
					);
				}
				// const { address: ip_address } = server.requestIP(request);
				// FIXME: doesn't work after async functions

				const hyperApiRequest = new HyperAPIRequest(method, args);
				hyperApiRequest.set('request', request);
				hyperApiRequest.set('url', url);
				hyperApiRequest.set('ip', new IP(ip_address));

				const hyperAPIResponse = await this.onRequest(hyperApiRequest);

				if (
					hyperAPIResponse.is_success === false
					&& hyperAPIResponse.error.httpStatus === undefined
				) {
					const internal_error = new HyperAPIInternalError();

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

				if (request.method === 'HEAD') {
					return new Response(
						'',
						{
							status: hyperAPIResponse.error?.httpStatus ?? 200,
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
