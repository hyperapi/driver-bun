import { HyperAPIRequest } from '@hyperapi/core';
export class HyperAPIBunRequest extends HyperAPIRequest {
    request;
    url;
    ip;
    /**
     * @param module_path -
     * @param args -
     * @param data -
     * @param data.request -
     * @param data.url -
     * @param data.ip -
     */
    constructor(module_path, args, { request, url, ip, }) {
        super(module_path, args);
        this.request = request;
        this.url = url;
        this.ip = ip;
    }
}
