export declare class HttpError extends Error {
    #private;
    /**
     * @param status - HTTP status code.
     */
    constructor(status: number);
    /**
     * Creates a Response from the error.
     * @returns -
     */
    getResponse(): Response;
}
