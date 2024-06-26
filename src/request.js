
import { HyperAPIRequest } from '@hyperapi/core';

/**
 * @class HyperAPIBunRequest
 * @template {Record<string, any>} HyperAPIRequestArgs
 * @augments HyperAPIRequest<HyperAPIRequestArgs>
 */
export class HyperAPIBunRequest extends HyperAPIRequest {
	/** @type {Request} */
	request;

	/** @type {URL} */
	url;

	/** @type {import('@kirick/ip').IP} */
	ip;

	/**
	 * @param {string} module_path -
	 * @param {HyperAPIRequestArgs} args -
	 * @param {object} data -
	 * @param {Request} data.request -
	 * @param {URL} data.url -
	 * @param {import('@kirick/ip').IP} data.ip -
	 */
	constructor(
		module_path,
		args,
		{
			request,
			url,
			ip,
		},
	) {
		super(module_path, args);

		this.request = request;
		this.url = url;
		this.ip = ip;
	}
}
