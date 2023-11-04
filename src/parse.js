/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */

import { decode, encode } from 'cbor-x';
import { HyperAPIInvalidParametersError } from '@hyperapi/core/api-errors';

export function getMIME(type) {
	if (typeof type === 'string') {
		const index = type.indexOf(';');
		if (index !== -1) {
			return type.slice(0, index);
		}
	}

	return type;
}

export async function parseArguments(request, url) {
	let args = {};

	if (request.method === 'GET' || request.method === 'HEAD') {
		args = Object.fromEntries(
			url.searchParams.entries(),
		);
	}
	else if (request.body) {
		const type_header = request.headers.get('Content-Type');
		try {
			switch (getMIME(type_header)) {
				case 'application/json':
					args = await request.json();
					break;
				case 'application/x-www-form-urlencoded':
					args = Object.fromEntries(
						new URLSearchParams(
							await request.text(),
						),
					);
					break;
				case 'application/cbor':
					args = decode(await request.arrayBuffer());
					break;
				default:
					return null;
			}
		}
		catch (error) {
			console.error(error);
			return new HyperAPIInvalidParametersError();
		}
	}
	return args;
}

export function parseAcceptHeader(header) {
	if (typeof header === 'string') {
		for (const type of header.split(',')) {
			switch (getMIME(type.trim())) {
				case 'application/json':
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

export function parseResponseTo(format, body) {
	if (format === 'json') {
		return JSON.stringify(body);
	}
	if (format === 'cbor') {
		return encode(body);
	}
}

