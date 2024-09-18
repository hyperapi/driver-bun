import { HyperAPIInvalidParametersError } from '@hyperapi/core';
import { isRecord } from './is-record.js';

/**
 * Gets only MIME type from Content-Type header, stripping parameters.
 * @param  type - MIME type.
 * @returns  - MIME type.
 */
function getMIME(type: string): string {
	const index = type.indexOf(';');
	if (index !== -1) {
		return type.slice(0, index).trim();
	}

	return type.trim();
}

type RequestArgs = Record<string, unknown>;

class HyperAPIBodyInvalidError extends HyperAPIInvalidParametersError<{ message: string }> {
	data = {
		message: 'Could not parse body',
	};
	httpStatus = 400;

	constructor(message?: string) {
		super();

		if (message) {
			this.data.message = message;
		}
	}
}

class HyperAPIBodyUnknownError extends HyperAPIInvalidParametersError<{ message: string }> {
	data = {
		message: 'Unsupported body type',
	};
	httpStatus = 415;

	constructor(mime: string) {
		super();
		this.data.message = `Unsupported body type: ${mime}`;
	}
}

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
		const type_mime = type_header === null
			? '<no Content-Type header provided>'
			: getMIME(type_header);

		switch (type_mime) {
			case 'application/json': {
				let args_json: unknown;
				try {
					args_json = await request.json();
				}
				catch {
					throw new HyperAPIBodyInvalidError();
				}

				if (isRecord(args_json) !== true) {
					throw new HyperAPIBodyInvalidError('JSON body must be an object.');
				}

				args = args_json;
			} break;

			case 'multipart/form-data':
				if (multipart_formdata_enabled !== true) {
					throw new HyperAPIBodyUnknownError(type_mime);
				}

				try {
					const formdata = await request.formData();
					args = Object.fromEntries(
						formdata.entries(),
					);
				}
				catch {
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

			default:
				throw new HyperAPIBodyUnknownError(type_mime);
		}
	}

	return args;
}
