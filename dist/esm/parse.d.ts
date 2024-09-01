import { ResponseFormat } from './main';
type RequestArgs = Record<string, unknown>;
/**
 * Parses arguments from request.
 * @param  request - Request object.
 * @param  url - URL object.
 * @param  multipart_formdata_enabled - Whether to enable multipart/form-data parsing.
 * @returns - Arguments.
 */
export declare function parseArguments(request: Request, url: URL, multipart_formdata_enabled: boolean): Promise<RequestArgs>;
/**
 * Parses accept header to determine response format.
 * @param header - Accept header.
 * @returns - Response format.
 */
export declare function parseAcceptHeader(header: string | null): ResponseFormat;
/**
 * Parses response to specified format.
 * @param format - Response format.
 * @param body - Response body.
 * @returns - Parsed response.
 */
export declare function parseResponseTo(format: ResponseFormat, body: unknown): string | Buffer;
export {};
