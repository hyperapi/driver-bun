import { HyperAPIDriver } from '@hyperapi/core';
export type ResponseFormat = 'json' | 'cbor';
export declare class HyperAPIBunDriver extends HyperAPIDriver {
    #private;
    /**
     * @param options -
     * @param [options.path] - Path to serve. Default: `/api/`.
     * @param [options.port] - HTTP server port. Default: `8001`.
     * @param [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
     */
    constructor({ path, port, multipart_formdata_enabled, }: {
        path?: string;
        port?: number;
        multipart_formdata_enabled?: boolean;
    });
    /**
     * Stops the server.
     */
    destroy(): void;
}
export { HyperAPIBunRequest } from './request';
