export class HttpError extends Error {
    #status;
    /**
     * @param status - HTTP status code.
     */
    constructor(status) {
        super('');
        this.#status = status;
    }
    /**
     * Creates a Response from the error.
     * @returns -
     */
    getResponse() {
        return new Response('', {
            status: this.#status,
        });
    }
}
