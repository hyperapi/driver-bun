"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  HyperAPIBunDriver: () => HyperAPIBunDriver
});
module.exports = __toCommonJS(main_exports);
var import_core2 = require("@hyperapi/core");
var import_ip = require("@kirick/ip");

// src/utils/parse.ts
var import_core = require("@hyperapi/core");

// src/utils/is-record.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value.constructor === Object && Object.prototype.toString.call(value) === "[object Object]";
}

// src/utils/parse.ts
function getMIME(type) {
  const index = type.indexOf(";");
  if (index !== -1) {
    return type.slice(0, index).trim();
  }
  return type.trim();
}
var HyperAPIBodyInvalidError = class extends import_core.HyperAPIInvalidParametersError {
  data = {
    message: "Could not parse body"
  };
  httpStatus = 400;
  constructor(message) {
    super();
    if (message) {
      this.data.message = message;
    }
  }
};
var HyperAPIBodyUnknownError = class extends import_core.HyperAPIInvalidParametersError {
  data = {
    message: "Unsupported body type"
  };
  httpStatus = 415;
  constructor(mime) {
    super();
    this.data.message = `Unsupported body type: ${mime}`;
  }
};
async function parseArguments(request, url, multipart_formdata_enabled) {
  let args = {};
  if (request.method === "GET" || request.method === "HEAD") {
    args = Object.fromEntries(
      url.searchParams.entries()
    );
  } else if (request.body) {
    const type_header = request.headers.get("Content-Type");
    const type_mime = type_header === null ? "<no Content-Type header provided>" : getMIME(type_header);
    switch (type_mime) {
      case "application/json":
        {
          let args_json;
          try {
            args_json = await request.json();
          } catch {
            throw new HyperAPIBodyInvalidError();
          }
          if (isRecord(args_json) !== true) {
            throw new HyperAPIBodyInvalidError("JSON body must be an object.");
          }
          args = args_json;
        }
        break;
      case "multipart/form-data":
        if (multipart_formdata_enabled !== true) {
          throw new HyperAPIBodyUnknownError(type_mime);
        }
        try {
          const formdata = await request.formData();
          args = Object.fromEntries(
            formdata.entries()
          );
        } catch {
          throw new import_core.HyperAPIInvalidParametersError();
        }
        break;
      case "application/x-www-form-urlencoded":
        try {
          args = Object.fromEntries(
            new URLSearchParams(
              await request.text()
            )
          );
        } catch {
          throw new import_core.HyperAPIInvalidParametersError();
        }
        break;
      default:
        throw new HyperAPIBodyUnknownError(type_mime);
    }
  }
  return args;
}

// src/utils/hyperapi-error.ts
function hyperApiErrorToResponse(error, add_body) {
  if (typeof error.httpStatus !== "number") {
    console.warn(`No HTTP status code provided for error ${error.name}, using 500.`);
  }
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (error.httpHeaders) {
    for (const [header, value] of Object.entries(error.httpHeaders)) {
      headers.set(header, value);
    }
  }
  let body;
  if (add_body) {
    body = JSON.stringify(
      error.getResponse()
    );
  }
  return new Response(
    body,
    {
      status: error.httpStatus ?? 500,
      headers
    }
  );
}

// src/utils/http.ts
function isHttpMethodSupported(http_method) {
  return http_method === "GET" || http_method === "POST" || http_method === "PUT" || http_method === "PATCH" || http_method === "DELETE" || http_method === "HEAD" || http_method === "OPTIONS";
}
function isResponseBodyRequired(http_method) {
  return http_method !== "HEAD" && http_method !== "OPTIONS";
}

// src/main.ts
var HyperAPIBunDriver = class {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler = null;
  port;
  path;
  multipart_formdata_enabled;
  bunserver = null;
  /**
   * @param options -
   * @param options.port - HTTP server port. Default: `8001`.
   * @param [options.path] - Path to serve. Default: `/api/`.
   * @param [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
   */
  constructor({
    port,
    path = "/api/",
    multipart_formdata_enabled = false
  }) {
    this.port = port;
    this.path = path;
    this.multipart_formdata_enabled = multipart_formdata_enabled;
  }
  /**
   * Starts the server.
   * @param handler - The handler to use.
   */
  start(handler) {
    this.handler = handler;
    this.bunserver = Bun.serve({
      development: false,
      port: this.port,
      fetch: async (request, server) => {
        try {
          return await this.processRequest(request, server);
        } catch (error) {
          if (error instanceof import_core2.HyperAPIError) {
            return hyperApiErrorToResponse(
              error,
              isResponseBodyRequired(request.method)
            );
          }
          console.error("Unhandled error in @hyperapi/driver-bun:");
          console.error(error);
          return new Response(
            void 0,
            { status: 500 }
          );
        }
      }
    });
  }
  /** Stops the server. */
  stop() {
    this.bunserver?.stop();
  }
  /**
   * Handles the HTTP request.
   * @param request - HTTP request.
   * @param server - Bun server.
   * @returns -
   */
  async processRequest(request, server) {
    if (!this.handler) {
      throw new Error("No handler available.");
    }
    const socket_address = server.requestIP(request);
    if (socket_address === null) {
      throw new Error("Cannot get IP address from request.");
    }
    const http_method = request.method;
    if (isHttpMethodSupported(http_method) !== true) {
      return new Response(
        void 0,
        { status: 405 }
      );
    }
    const url = new URL(request.url);
    if (url.pathname.startsWith(this.path) !== true) {
      return new Response(
        void 0,
        { status: 404 }
      );
    }
    const hyperapi_method = url.pathname.slice(
      this.path.length
    );
    const hyperapi_args = await parseArguments(
      request,
      url,
      this.multipart_formdata_enabled
    );
    const hyperapi_response = await this.handler({
      method: http_method,
      path: hyperapi_method,
      args: hyperapi_args,
      url,
      headers: Object.fromEntries(request.headers),
      ip: new import_ip.IP(socket_address.address)
    });
    if (hyperapi_response instanceof import_core2.HyperAPIError) {
      throw hyperapi_response;
    }
    return new Response(
      isResponseBodyRequired(http_method) ? JSON.stringify(hyperapi_response) : void 0,
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HyperAPIBunDriver
});
