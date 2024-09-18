import { HyperAPI } from '@hyperapi/core';
import { HyperAPIBunDriver } from '../src/main.js';

export const hyperApi = new HyperAPI({
	driver: new HyperAPIBunDriver({
		port: 18001,
		// multipart_formdata_enabled: true,
	}),
	root: new URL('hyper-api', import.meta.url).pathname,
});

export const hyperApiMultipart = new HyperAPI({
	driver: new HyperAPIBunDriver({
		port: 18002,
		multipart_formdata_enabled: true,
	}),
	root: new URL('hyper-api', import.meta.url).pathname,
});
