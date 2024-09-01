
import { HyperAPIRequest } from '@hyperapi/core';
import { IP }              from '@kirick/ip';

export class HyperAPIBunRequest<T extends Record<string, unknown>> extends HyperAPIRequest<T> {
	request: Request;
	url: URL;
	ip: IP;

	/**
	 * @param module_path -
	 * @param args -
	 * @param data -
	 * @param data.request -
	 * @param data.url -
	 * @param data.ip -
	 */
	constructor(
		module_path: string,
		args: T,
		{
			request,
			url,
			ip,
		}: {
			request: Request,
			url: URL,
			ip: IP,
		},
	) {
		super(module_path, args);

		this.request = request;
		this.url = url;
		this.ip = ip;
	}
}
