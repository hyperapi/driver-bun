import { type Server } from 'bun';
import {
	HyperAPIError,
	type HyperAPIDriver,
	type HyperAPIDriverHandler,
} from '@hyperapi/core';
import { IP } from '@kirick/ip';
import { parseArguments } from './utils/parse';
import { type HyperAPIBunRequest } from './request';
import { hyperApiErrorToResponse } from './utils/hyperapi-error';
import {
	isHttpMethodSupported,
	isResponseBodyRequired,
} from './utils/http';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HyperAPIBunDriver implements HyperAPIDriver<HyperAPIBunRequest<any>> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private handler: HyperAPIDriverHandler<HyperAPIBunRequest<any>> | null = null;
	private port: number;
	private path: string;
	private multipart_formdata_enabled: boolean;
	private bunserver: Server | null = null;

	/**
	 * @param options -
	 * @param options.port - HTTP server port. Default: `8001`.
	 * @param [options.path] - Path to serve. Default: `/api/`.
	 * @param [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
	 */
	constructor({
		port,
		path = '/api/',
		multipart_formdata_enabled = false,
	}: {
		port: number,
		path?: string,
		multipart_formdata_enabled?: boolean,
	}) {
		this.port = port;
		this.path = path;
		this.multipart_formdata_enabled = multipart_formdata_enabled;
	}

	/**
	 * Starts the server.
	 * @param handler - The handler to use.
	 */
	start(handler: HyperAPIDriverHandler<HyperAPIBunRequest>) {
		this.handler = handler;
		this.bunserver = Bun.serve({
			development: false,
			port: this.port,
			fetch: async (request, server) => {
				try {
					return await this.processRequest(request, server);
				}
				catch (error) {
					if (error instanceof HyperAPIError) {
						return hyperApiErrorToResponse(
							error,
							isResponseBodyRequired(request.method),
						);
					}

					// eslint-disable-next-line no-console
					console.error('Unhandled error in @hyperapi/driver-bun:');
					// eslint-disable-next-line no-console
					console.error(error);

					return new Response(
						undefined,
						{ status: 500 },
					);
				}
			},
		});
	}

	/** Stops the server. */
	stop() {
		this.bunserver?.stop();
	}

	/**
	 * Handles the HTTP request.
	 * @param request - HTTP request.
	 * @param server - Bun server.
	 * @returns -
	 */
	private async processRequest(
		request: Request,
		server: Server,
	): Promise<Response> {
		if (!this.handler) {
			throw new Error('No handler available.');
		}

		// FIXME: doesn't work after async functions
		const socket_address = server.requestIP(request);
		if (socket_address === null) {
			throw new Error('Cannot get IP address from request.');
		}

		const http_method = request.method;
		if (isHttpMethodSupported(http_method) !== true) {
			return new Response(
				undefined,
				{ status: 405 },
			);
		}

		const url = new URL(request.url);
		if (url.pathname.startsWith(this.path) !== true) {
			return new Response(
				undefined,
				{ status: 404 },
			);
		}

		const hyperapi_method = url.pathname.slice(
			this.path.length,
		);

		const hyperapi_args = await parseArguments(
			request,
			url as URL,
			this.multipart_formdata_enabled,
		);

		// FIXME: doesn't work after async functions
		// const { address: ip_address } = server.requestIP(request);

		const hyperapi_response = await this.handler({
			method: http_method,
			path: hyperapi_method,
			args: hyperapi_args,
			url: url as URL,
			headers: Object.fromEntries(request.headers),
			ip: new IP(socket_address.address),
		});

		if (hyperapi_response instanceof HyperAPIError) {
			throw hyperapi_response;
		}

		return new Response(
			isResponseBodyRequired(http_method)
				? JSON.stringify(hyperapi_response)
				: undefined,
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}

export { type HyperAPIBunRequest } from './request';
