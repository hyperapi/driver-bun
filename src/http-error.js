
export class HttpError extends Error {
	/** @type {number} */
	#status;

	/**
	 * @param {number} status - HTTP status code.
	 */
	constructor(status) {
		super('');
		this.#status = status;
	}

	/**
	 * Creates a Response from the error.
	 * @returns {Response} -
	 */
	getResponse() {
		return new Response(
			'',
			{
				status: this.#status,
			},
		);
	}
}
