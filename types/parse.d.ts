/**
 * Parses arguments from request.
 * @param {Request} request - Request object.
 * @param {URL} url - URL object.
 * @param {boolean} multipart_formdata_enabled - Whether to enable multipart/form-data parsing.
 * @returns {Promise<Record<string, any>>} - Arguments.
 */
export function parseArguments(request: Request, url: URL, multipart_formdata_enabled: boolean): Promise<Record<string, any>>;
/**
 * Parses accept header to determine response format.
 * @param {string | null} header - Accept header.
 * @returns {'json' | 'cbor'} - Response format.
 */
export function parseAcceptHeader(header: string | null): "json" | "cbor";
/**
 * Parses response to specified format.
 * @param {'json' | 'cbor'} format - Response format.
 * @param {any} body - Response body.
 * @returns {string | Buffer} - Parsed response.
 */
export function parseResponseTo(format: "json" | "cbor", body: any): string | Buffer;
