
import { HyperAPIInvalidParametersError } from '@hyperapi/core';
import {
	decode as decodeCbor,
	encode as encodeCbor }                from 'cbor-x';
import { HttpError }                      from './http-error.js';

/**
 * Gets only MIME type from Content-Type header, stripping parameters.
 * @param {string} type - MIME type.
 * @returns {string} - MIME type.
 */
function getMIME(type) {
	const index = type.indexOf(';');
	if (index !== -1) {
		return type.slice(0, index);
	}

	return type;
}

/**
 * Parses arguments from request.
 * @param {Request} request - Request object.
 * @param {URL} url - URL object.
 * @param {boolean} multipart_formdata_enabled - Whether to enable multipart/form-data parsing.
 * @returns {Promise<Record<string, any>>} - Arguments.
 */
export async function parseArguments(request, url, multipart_formdata_enabled) {
	let args = {};

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

		switch (getMIME(type_header)) {
			case 'application/json':
				try {
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
 * @param {string} header - Accept header.
 * @returns {'json' | 'cbor'} - Response format.
 */
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

/**
 * Parses response to specified format.
 * @param {'json' | 'cbor'} format - Response format.
 * @param {any} body - Response body.
 * @returns {string | Buffer} - Parsed response.
 */
export function parseResponseTo(format, body) {
	if (format === 'json') {
		return JSON.stringify(body);
	}

	if (format === 'cbor') {
		return encodeCbor(body);
	}

	throw new TypeError('Invalid response format given.');
}
