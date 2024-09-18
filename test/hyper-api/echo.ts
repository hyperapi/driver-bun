/* eslint-disable jsdoc/require-jsdoc */

import { type HyperAPIResponse } from '@hyperapi/core';
import { type HyperAPIBunRequest } from '../../src/main';

export default function (request: HyperAPIBunRequest<{ name: string }>): HyperAPIResponse {
	return {
		method: 'ALL',
		message: `Hello, ${request.args.name}!`,
	};
}
