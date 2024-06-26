export class HttpError extends Error {
    /**
     * @param {number} status - HTTP status code.
     */
    constructor(status: number);
    /**
     * Creates a Response from the error.
     * @returns {Response} -
     */
    getResponse(): Response;
    #private;
}
