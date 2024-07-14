export default class HyperAPIBunDriver extends HyperAPIDriver {
    /**
     * @param {object} options -
     * @param {string} [options.path] - Path to serve. Default: `/api/`.
     * @param {number} [options.port] - HTTP server port. Default: `8001`.
     * @param {boolean} [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
     */
    constructor({ path, port, multipart_formdata_enabled, }: {
        path?: string | undefined;
        port?: number | undefined;
        multipart_formdata_enabled?: boolean | undefined;
    });
    /**
     * Stops the server.
     */
    destroy(): void;
    #private;
}
export { HyperAPIBunRequest } from "./request.js";
import { HyperAPIDriver } from '@hyperapi/core';
