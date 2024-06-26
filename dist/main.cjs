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

// src/main.js
var main_exports = {};
__export(main_exports, {
  default: () => HyperAPIBunDriver
});
module.exports = __toCommonJS(main_exports);
var import_core3 = require("@hyperapi/core");
var import_ip = require("@kirick/ip");

// src/http-error.js
var HttpError = class extends Error {
  /** @type {number} */
  #status;
  /**
   * @param {number} status - HTTP status code.
   */
  constructor(status) {
    super("");
    this.#status = status;
  }
  /**
   * Creates a Response from the error.
   * @returns {Response} -
   */
  getResponse() {
    return new Response(
      "",
      {
        status: this.#status
      }
    );
  }
};

// src/parse.js
var import_core = require("@hyperapi/core");
var import_cbor_x = require("cbor-x");
function getMIME(type) {
  const index = type.indexOf(";");
  if (index !== -1) {
    return type.slice(0, index);
  }
  return type;
}
async function parseArguments(request, url, multipart_formdata_enabled) {
  let args = {};
  if (request.method === "GET" || request.method === "HEAD") {
    args = Object.fromEntries(
      url.searchParams.entries()
    );
  } else if (request.body) {
    const type_header = request.headers.get("Content-Type");
    switch (getMIME(type_header)) {
      case "application/json":
        try {
          args = await request.json();
        } catch {
          throw new import_core.HyperAPIInvalidParametersError();
        }
        break;
      case "multipart/form-data":
        if (multipart_formdata_enabled !== true) {
          throw new HttpError(415);
        }
        try {
          const formdata = await request.formData();
          args = Object.fromEntries(
            formdata.entries()
          );
        } catch (error) {
          console.error(error);
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
      case "application/cbor":
        try {
          args = (0, import_cbor_x.decode)(
            new Uint8Array(
              await request.arrayBuffer()
            )
          );
        } catch {
          throw new import_core.HyperAPIInvalidParametersError();
        }
        break;
      default:
        throw new HttpError(415);
    }
  }
  return args;
}
function parseAcceptHeader(header) {
  if (typeof header === "string") {
    for (const type of header.split(",")) {
      switch (getMIME(type.trim())) {
        case "application/json":
        case "application/*":
          return "json";
        case "application/cbor":
          return "cbor";
      }
    }
  }
  return "json";
}
function parseResponseTo(format, body) {
  if (format === "json") {
    return JSON.stringify(body);
  }
  if (format === "cbor") {
    return (0, import_cbor_x.encode)(body);
  }
  throw new TypeError("Invalid response format given.");
}

// src/request.js
var import_core2 = require("@hyperapi/core");
var HyperAPIBunRequest = class extends import_core2.HyperAPIRequest {
  /** @type {Request} */
  request;
  /** @type {URL} */
  url;
  /** @type {import('@kirick/ip').IP} */
  ip;
  /**
   * @param {string} module_path -
   * @param {HyperAPIRequestArgs} args -
   * @param {object} data -
   * @param {Request} data.request -
   * @param {URL} data.url -
   * @param {import('@kirick/ip').IP} data.ip -
   */
  constructor(module_path, args, {
    request,
    url,
    ip
  }) {
    super(module_path, args);
    this.request = request;
    this.url = url;
    this.ip = ip;
  }
};

// src/main.js
var HTTP_METHOD_NO_RESPONSE_BODY = /* @__PURE__ */ new Set([
  "HEAD",
  "OPTIONS"
]);
var HyperAPIBunDriver = class extends import_core3.HyperAPIDriver {
  #path;
  #multipart_formdata_enabled;
  #bunserver;
  /**
   * @param {object} options -
   * @param {string} [options.path] - Path to serve. Default: `/api/`.
   * @param {number} [options.port] - HTTP server port. Default: `8001`.
   * @param {boolean} [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
   */
  constructor({
    path = "/api/",
    port = 8001,
    multipart_formdata_enabled = false
  }) {
    if (typeof path !== "string") {
      throw new TypeError('Property "path" must be a string.');
    }
    if (typeof port !== "number") {
      throw new TypeError('Property "port" must be a number.');
    }
    super();
    this.#multipart_formdata_enabled = multipart_formdata_enabled;
    this.#path = path;
    this.#bunserver = Bun.serve({
      development: false,
      port,
      fetch: async (request, server) => this.#processRequest(request, server)
    });
  }
  /**
   * Stops the server.
   */
  destroy() {
    this.#bunserver.stop();
  }
  /**
   * Handles the HTTP request.
   * @param {Request} request - HTTP request.
   * @param {import('bun').Server} server - Bun server.
   * @returns {Promise<Response>} -
   */
  async #processRequest(request, server) {
    const { address: ip_address } = server.requestIP(request);
    const add_response_body = HTTP_METHOD_NO_RESPONSE_BODY.has(request.method) !== true;
    const url = new URL(request.url);
    let preffered_format;
    try {
      if (url.pathname.startsWith(this.#path) !== true) {
        throw new HttpError(404);
      }
      const method = url.pathname.slice(
        this.#path.length
      );
      preffered_format = parseAcceptHeader(
        request.headers.get("Accept")
      );
      const args = await parseArguments(
        request,
        url,
        this.#multipart_formdata_enabled
      );
      const hyperApiRequest = new HyperAPIBunRequest(
        method,
        args,
        {
          request,
          url,
          ip: new import_ip.IP(ip_address)
        }
      );
      const hyperAPIResponse = await this.processRequest(hyperApiRequest);
      if (hyperAPIResponse.error instanceof import_core3.HyperAPIError) {
        throw hyperAPIResponse.error;
      }
      return new Response(
        parseResponseTo(
          preffered_format,
          hyperAPIResponse.getResponse()
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/" + preffered_format
          }
        }
      );
    } catch (error) {
      if (error instanceof import_core3.HyperAPIError) {
        if (typeof error.httpStatus !== "number") {
          throw new TypeError('Property "httpStatus" of "HyperAPIError" must be a number.');
        }
        const headers = new Headers();
        headers.append(
          "Content-Type",
          "application/" + preffered_format
        );
        if (error.httpHeaders) {
          for (const [header, value] of Object.entries(error.httpHeaders)) {
            headers.append(
              header,
              value
            );
          }
        }
        let body;
        if (add_response_body) {
          body = parseResponseTo(
            preffered_format,
            error.getResponse()
          );
        }
        return new Response(
          body,
          {
            status: error.httpStatus,
            headers
          }
        );
      }
      if (error instanceof HttpError) {
        return error.getResponse();
      }
      return new HttpError(500).getResponse();
    }
  }
};
