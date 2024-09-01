export class HttpError extends Error {
	#status: number;

	/**
	 * @param status - HTTP status code.
	 */
	constructor(status: number) {
		super('');
		this.#status = status;
	}

	/**
	 * Creates a Response from the error.
	 * @returns -
	 */
	getResponse(): Response {
		return new Response(
			'',
			{
				status: this.#status,
			},
		);
	}
}
