import { type HyperAPIDriver, type HyperAPIDriverHandler } from '@hyperapi/core';
import { type HyperAPIBunRequest } from './request.js';
interface Config {
    port: number;
    path?: string;
    multipart_formdata_enabled?: boolean;
}
export declare class HyperAPIBunDriver implements HyperAPIDriver<HyperAPIBunRequest<any>> {
    private handler;
    private port;
    private path;
    private multipart_formdata_enabled;
    private server;
    /**
     * @param options -
     * @param options.port - HTTP server port. Default: `8001`.
     * @param [options.path] - Path to serve. Default: `/api/`.
     * @param [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
     */
    constructor({ port, path, multipart_formdata_enabled, }: Config);
    /**
     * Starts the server.
     * @param handler - The handler to use.
     */
    start(handler: HyperAPIDriverHandler<HyperAPIBunRequest>): void;
    /** Stops the server. */
    stop(): void;
    /**
     * Handles the HTTP request.
     * @param request - HTTP request.
     * @param server - Bun server.
     * @returns -
     */
    private processRequest;
}
export { type HyperAPIBunRequest } from './request.js';
