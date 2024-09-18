/**
 * Converts a HyperAPIError to a Response.
 * @param error - The error to convert.
 * @param add_body - Whether to add the response body.
 * @returns -
 */
export function hyperApiErrorToResponse(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
error, add_body) {
    if (typeof error.httpStatus !== 'number') {
        // eslint-disable-next-line no-console
        console.warn(`No HTTP status code provided for error ${error.name}, using 500.`);
    }
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (error.httpHeaders) {
        for (const [header, value] of Object.entries(error.httpHeaders)) {
            headers.set(header, value);
        }
    }
    let body;
    if (add_body) {
        body = JSON.stringify(error.getResponse());
    }
    return new Response(body, {
        status: error.httpStatus ?? 500,
        headers,
    });
}
