
import { HyperAPIInvalidParametersError } from '@hyperapi/core';
import {
	decode,
	encode }                              from 'cbor-x';
import { HttpError }                      from './http-error.js';

function getMIME(type) {
	if (typeof type === 'string') {
		const index = type.indexOf(';');
		if (index !== -1) {
			return type.slice(0, index);
		}
	}

	return type;
}

export async function parseArguments(request, url, multipart_formdata_enabled) {
	let args = {};

	if (request.method === 'GET' || request.method === 'HEAD') {
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
					args = decode(
						await request.arrayBuffer(),
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

