
export class HttpError extends Error {
	#status;

	constructor(status) {
		super('');
		this.#status = status;
	}

	getResponse() {
		return new Response(
			'',
			{
				status: this.#status,
			},
		);
	}
}
