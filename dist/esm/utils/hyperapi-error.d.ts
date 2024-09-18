import { HyperAPIError } from '@hyperapi/core';
/**
 * Converts a HyperAPIError to a Response.
 * @param error - The error to convert.
 * @param add_body - Whether to add the response body.
 * @returns -
 */
export declare function hyperApiErrorToResponse(error: HyperAPIError<any>, add_body: boolean): Response;
