
import { HyperAPIInvalidParametersError } from '@hyperapi/core';
import {
	decode as decodeCbor,
	encode as encodeCbor,
}                                         from 'cbor-x';
import { HttpError }                      from './http-error';
import { ResponseFormat }                 from './main';

/**
 * Gets only MIME type from Content-Type header, stripping parameters.
 * @param  type - MIME type.
 * @returns  - MIME type.
 */
function getMIME(type: string): string {
	const index = type.indexOf(';');
	if (index !== -1) {
		return type.slice(0, index);
	}

	return type;
}

type RequestArgs = Record<string, unknown>;

/**
 * Parses arguments from request.
 * @param  request - Request object.
 * @param  url - URL object.
 * @param  multipart_formdata_enabled - Whether to enable multipart/form-data parsing.
 * @returns - Arguments.
 */
export async function parseArguments(
	request: Request,
	url: URL,
	multipart_formdata_enabled: boolean,
): Promise<RequestArgs> {
	let args: RequestArgs = {};

	if (
		request.method === 'GET'
		|| request.method === 'HEAD'
	) {
		args = Object.fromEntries(
			url.searchParams.entries(),
		);
	}
	else if (request.body) {
		const type_header = request.headers.get('Content-Type');

		switch (
			type_header === null
				? null
				: getMIME(type_header)
		) {
			case 'application/json':
				try {
					// @ts-expect-error - ignore possible array
					args = await request.json();
				}
				catch {
					throw new HyperAPIInvalidParametersError();
				}
				break;

			case 'multipart/form-data':
				if (multipart_formdata_enabled !== true) {
					throw new HttpError(415);
				}

				try {
					const formdata = await request.formData();
					args = Object.fromEntries(
						formdata.entries(),
					);
				}
				catch (error) {
					// eslint-disable-next-line no-console
					console.error(error);
					throw new HyperAPIInvalidParametersError();
				}
				break;

			case 'application/x-www-form-urlencoded':
				try {
					args = Object.fromEntries(
						new URLSearchParams(
							await request.text(),
						),
					);
				}
				catch {
					throw new HyperAPIInvalidParametersError();
				}
				break;

			case 'application/cbor':
				try {
					args = decodeCbor(
						new Uint8Array(
							await request.arrayBuffer(),
						),
					);
				}
				catch {
					throw new HyperAPIInvalidParametersError();
				}
				break;

			default:
				throw new HttpError(415);
		}
	}

	return args;
}

/**
 * Parses accept header to determine response format.
 * @param header - Accept header.
 * @returns - Response format.
 */
export function parseAcceptHeader(header: string | null): ResponseFormat {
	if (typeof header === 'string') {
		for (const type of header.split(',')) {
			switch (getMIME(type.trim())) {
				case 'application/json':
				// eslint-disable-next-line @stylistic/padding-line-between-statements, no-fallthrough
				case 'application/*':
					return 'json';

				case 'application/cbor':
					return 'cbor';
				// no default
			}
		}
	}

	return 'json';
}

/**
 * Parses response to specified format.
 * @param format - Response format.
 * @param body - Response body.
 * @returns - Parsed response.
 */
export function parseResponseTo(
	format: ResponseFormat,
	body: unknown,
): string | Buffer {
	if (format === 'json') {
		return JSON.stringify(body);
	}

	if (format === 'cbor') {
		return encodeCbor(body);
	}

	throw new TypeError('Invalid response format given.');
}
