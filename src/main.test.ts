import {
	describe,
	expect,
	test,
} from 'bun:test';
import '../test/setup.js';

describe('args', () => {
	test('GET', async () => {
		const response = await fetch('http://localhost:18001/api/echo?name=world');

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/json');

		const body = await response.json();
		expect(body).toStrictEqual({
			method: 'ALL',
			message: 'Hello, world!',
		});
	});

	test('HEAD', async () => {
		const response = await fetch(
			'http://localhost:18001/api/echo?name=world',
			{
				method: 'HEAD',
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/json');

		const body = await response.text();
		expect(body).toStrictEqual('');
	});

	describe('POST', () => {
		test('JSON', async () => {
			const response = await fetch(
				'http://localhost:18001/api/echo',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name: 'foo',
					}),
				},
			);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toStrictEqual({
				method: 'ALL',
				message: 'Hello, foo!',
			});
		});

		test('form', async () => {
			const response = await fetch(
				'http://localhost:18001/api/echo',
				{
					method: 'POST',
					body: new URLSearchParams({
						name: 'bar bar',
					}),
				},
			);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toStrictEqual({
				method: 'ALL',
				message: 'Hello, bar bar!',
			});
		});

		test('multipart', async () => {
			const form_data = new FormData();
			form_data.append(
				'name',
				new Blob(
					[ 'baz' ],
					{ type: 'text/plain' },
				),
			);

			const response = await fetch(
				'http://localhost:18002/api/echo-file',
				{
					method: 'POST',
					body: form_data,
				},
			);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toStrictEqual({
				method: 'ALL',
				message: 'Hello, baz!',
			});
		});
	});
});

test('HyperAPIError with HTTP headers', async () => {
	const response = await fetch('http://localhost:18001/api/error');

	expect(response.status).toBe(429);
	expect(response.headers.get('Content-Type')).toBe('application/json');
	expect(response.headers.get('Retry-After')).toBe('3600');

	const body = await response.json();
	expect(body).toStrictEqual({
		code: 7,
		description: 'Rate limit exceeded',
	});
});

describe('errors', () => {
	test('unsupported HTTP method', async () => {
		const response = await fetch(
			'http://localhost:18001/api/echo?name=world',
			{
				method: 'CONNECT', // need to be existing HTTP method, otherwise fetch will set it to GET
			},
		);

		expect(response.status).toBe(405);
	});

	test('invalid path', async () => {
		const response = await fetch('http://localhost:18001/echo');

		expect(response.status).toBe(404);
	});

	describe('invalid body', () => {
		test('malformed JSON', async () => {
			const response = await fetch(
				'http://localhost:18001/api/echo',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: '{',
				},
			);

			expect(response.status).toBe(400);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toStrictEqual({
				code: 2,
				description: 'One of the parameters specified was missing or invalid',
				data: {
					message: 'Could not parse body',
				},
			});
		});

		// malformed forms isn't a thing with URLSearchParams

		test('multipart disabled', async () => {
			const form_data = new FormData();
			form_data.append(
				'name',
				new Blob(
					[ 'baz' ],
					{ type: 'text/plain' },
				),
			);

			const response = await fetch(
				'http://localhost:18001/api/echo-file',
				{
					method: 'POST',
					body: form_data,
				},
			);

			expect(response.status).toBe(415);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toStrictEqual({
				code: 2,
				description: 'One of the parameters specified was missing or invalid',
				data: {
					message: 'Unsupported body type: multipart/form-data',
				},
			});
		});
	});
});
