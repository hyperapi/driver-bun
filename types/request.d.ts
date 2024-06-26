/**
 * @class HyperAPIBunRequest
 * @template {Record<string, any>} HyperAPIRequestArgs
 * @augments HyperAPIRequest<HyperAPIRequestArgs>
 */
export class HyperAPIBunRequest<HyperAPIRequestArgs extends Record<string, any>> extends HyperAPIRequest<HyperAPIRequestArgs> {
    /**
     * @param {string} module_path -
     * @param {HyperAPIRequestArgs} args -
     * @param {object} data -
     * @param {Request} data.request -
     * @param {URL} data.url -
     * @param {import('@kirick/ip').IP} data.ip -
     */
    constructor(module_path: string, args: HyperAPIRequestArgs, { request, url, ip, }: {
        request: Request;
        url: URL;
        ip: import("@kirick/ip").IP;
    });
    /** @type {Request} */
    request: Request;
    /** @type {URL} */
    url: URL;
    /** @type {import('@kirick/ip').IP} */
    ip: import("@kirick/ip").IP;
}
import { HyperAPIRequest } from '@hyperapi/core';
