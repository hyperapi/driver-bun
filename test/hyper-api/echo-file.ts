/* eslint-disable jsdoc/require-jsdoc */

import { type HyperAPIResponse } from '@hyperapi/core';
import { type HyperAPIBunRequest } from '../../src/main';

export default async function (request: HyperAPIBunRequest<{ name: Blob }>): Promise<HyperAPIResponse> {
	const name = await request.args.name.text();

	return {
		method: 'ALL',
		message: `Hello, ${name}!`,
	};
}
