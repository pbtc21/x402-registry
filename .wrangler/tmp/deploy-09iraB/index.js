var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/routes/registry.ts
var registry = new Hono2();
function rowToEndpoint(row) {
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    description: row.description || "",
    owner: row.owner,
    price: row.price,
    token: row.token,
    tags: JSON.parse(row.tags || "[]"),
    category: row.category || "utility",
    openApiSpec: row.open_api_spec,
    verified: Boolean(row.verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stats: {
      totalCalls: row.total_calls || 0,
      calls24h: row.calls_24h || 0,
      revenue24h: row.revenue_24h || 0,
      avgResponseTime: row.avg_response_time || 0,
      uptime: row.uptime || 100,
      lastChecked: row.last_checked || (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
__name(rowToEndpoint, "rowToEndpoint");
function summarizeEndpoint(e) {
  return {
    id: e.id,
    url: e.url,
    name: e.name,
    description: e.description,
    price: e.price,
    token: e.token,
    tags: e.tags,
    category: e.category,
    verified: e.verified,
    calls24h: e.stats.calls24h,
    uptime: e.stats.uptime
  };
}
__name(summarizeEndpoint, "summarizeEndpoint");
registry.get("/register", (c) => {
  return c.json({
    x402Version: 1,
    name: "x402 Registry - Register Endpoint",
    accepts: [{
      scheme: "exact",
      network: "stacks",
      maxAmountRequired: "1000",
      resource: "/registry/register",
      description: "Register your x402 endpoint in the App Store for AI Agents",
      mimeType: "application/json",
      payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
      maxTimeoutSeconds: 300,
      asset: "STX",
      outputSchema: {
        input: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL of the x402 endpoint" },
            name: { type: "string", description: "Human-readable name" },
            description: { type: "string", description: "What the endpoint does" },
            owner: { type: "string", description: "Stacks address of owner" },
            price: { type: "number", description: "Price per call in smallest unit" },
            token: { type: "string", enum: ["STX", "sBTC", "USDh"] },
            tags: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            openApiSpec: { type: "string", description: "Optional OpenAPI spec URL" }
          },
          required: ["url", "name", "owner", "price", "token"]
        },
        output: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            endpoint: {
              type: "object",
              properties: {
                id: { type: "string" },
                url: { type: "string" },
                name: { type: "string" },
                verified: { type: "boolean" },
                registryUrl: { type: "string" }
              }
            },
            message: { type: "string" }
          }
        }
      }
    }]
  });
});
registry.post("/register", async (c) => {
  const body = await c.req.json();
  const { url, name, description, owner, price, token, tags, category, openApiSpec } = body;
  if (!url || !name || !owner || price === void 0 || !token) {
    return c.json({ error: "Missing required fields: url, name, owner, price, token" }, 400);
  }
  const verification = await verifyX402Endpoint(url);
  const isVerified = verification.valid;
  const id = generateId();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await c.env.DB.prepare(`
    INSERT INTO endpoints (id, url, name, description, owner, price, token, tags, category, open_api_spec, verified, created_at, updated_at, avg_response_time, uptime, last_checked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    url,
    name,
    description || "",
    owner,
    price,
    token,
    JSON.stringify(tags || []),
    category || "utility",
    openApiSpec || null,
    isVerified ? 1 : 0,
    now,
    now,
    verification.responseTime || 0,
    100,
    now
  ).run();
  return c.json({
    success: true,
    endpoint: { id, url, name, verified: isVerified, registryUrl: `https://registry.pbtc21.dev/registry/${id}` },
    message: "Endpoint registered successfully! It will appear in search results."
  }, 201);
});
registry.get("/search", async (c) => {
  const category = c.req.query("category");
  const token = c.req.query("token");
  const q = c.req.query("q");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");
  let sql = "SELECT * FROM endpoints WHERE 1=1";
  const params = [];
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (token) {
    sql += " AND token = ?";
    params.push(token);
  }
  if (q) {
    sql += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY calls_24h DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const results = await c.env.DB.prepare(sql).bind(...params).all();
  const countResult = await c.env.DB.prepare("SELECT COUNT(*) as total FROM endpoints").first();
  return c.json({
    results: (results.results || []).map((row) => summarizeEndpoint(rowToEndpoint(row))),
    total: countResult?.total || 0,
    limit,
    offset,
    hasMore: offset + limit < (countResult?.total || 0)
  });
});
registry.get("/discover", async (c) => {
  const trending = await c.env.DB.prepare("SELECT * FROM endpoints ORDER BY calls_24h DESC LIMIT 10").all();
  const newest = await c.env.DB.prepare("SELECT * FROM endpoints ORDER BY created_at DESC LIMIT 10").all();
  const categories = await c.env.DB.prepare("SELECT DISTINCT category FROM endpoints").all();
  const byCategory = {};
  for (const cat of categories.results || []) {
    const catEndpoints = await c.env.DB.prepare("SELECT * FROM endpoints WHERE category = ? LIMIT 5").bind(cat.category).all();
    byCategory[cat.category] = (catEndpoints.results || []).map((row) => summarizeEndpoint(rowToEndpoint(row)));
  }
  const allEndpoints = (trending.results || []).map((row) => rowToEndpoint(row));
  return c.json({
    trending: allEndpoints.map(summarizeEndpoint),
    new: (newest.results || []).map((row) => summarizeEndpoint(rowToEndpoint(row))),
    byCategory,
    totalEndpoints: allEndpoints.length,
    categories: (categories.results || []).map((c2) => c2.category)
  });
});
registry.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  if (!row) {
    return c.json({ error: "Endpoint not found" }, 404);
  }
  return c.json(rowToEndpoint(row));
});
registry.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  if (!row) {
    return c.json({ error: "Endpoint not found" }, 404);
  }
  const endpoint = rowToEndpoint(row);
  return c.json({
    endpointId: id,
    name: endpoint.name,
    stats: endpoint.stats,
    pricing: { price: endpoint.price, token: endpoint.token }
  });
});
registry.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const owner = c.req.header("X-Owner-Address");
  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Endpoint not found" }, 404);
  if (row.owner !== owner) return c.json({ error: "Not authorized" }, 403);
  await c.env.DB.prepare("DELETE FROM endpoints WHERE id = ?").bind(id).run();
  return c.json({ success: true, message: "Endpoint removed" });
});
registry.put("/:id", async (c) => {
  const id = c.req.param("id");
  const owner = c.req.header("X-Owner-Address");
  const updates = await c.req.json();
  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Endpoint not found" }, 404);
  if (row.owner !== owner) return c.json({ error: "Not authorized" }, 403);
  const allowedUpdates = ["name", "description", "price", "tags", "category"];
  const setClauses = ["updated_at = ?"];
  const params = [(/* @__PURE__ */ new Date()).toISOString()];
  for (const key of allowedUpdates) {
    if (updates[key] !== void 0) {
      const dbKey = key === "openApiSpec" ? "open_api_spec" : key;
      setClauses.push(`${dbKey} = ?`);
      params.push(key === "tags" ? JSON.stringify(updates[key]) : updates[key]);
    }
  }
  params.push(id);
  await c.env.DB.prepare(`UPDATE endpoints SET ${setClauses.join(", ")} WHERE id = ?`).bind(...params).run();
  const updated = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  return c.json({ success: true, endpoint: summarizeEndpoint(rowToEndpoint(updated)) });
});
async function verifyX402Endpoint(url) {
  try {
    const start = Date.now();
    const response = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const responseTime = Date.now() - start;
    if (response.status === 402) {
      const body = await response.json().catch(() => ({}));
      if (body.maxAmountRequired || body.amount || body.payTo || body.payment) {
        return { valid: true, responseTime };
      }
      return { valid: false, error: "402 response missing payment requirements", responseTime };
    }
    if (response.status === 200) return { valid: true, responseTime };
    return { valid: false, error: `Expected 402 status, got ${response.status}`, responseTime };
  } catch (error) {
    return { valid: false, error: `Failed to reach endpoint: ${error.message}` };
  }
}
__name(verifyX402Endpoint, "verifyX402Endpoint");
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}
__name(generateId, "generateId");

// src/routes/agents.ts
var agents = new Hono2();
var agentRegistry = /* @__PURE__ */ new Map();
var capabilityIndex = /* @__PURE__ */ new Map();
agentRegistry.set("sbtc-yield-agent", {
  id: "sbtc-yield-agent",
  name: "sBTC Yield Agent",
  description: "Autonomous DeFi agent for sBTC yield optimization. Deposits to vault, monitors positions, and executes looping strategies on Zest Protocol.",
  capabilities: ["defi", "yield-farming", "lending", "blockchain-query", "data-transform"],
  endpoints: ["https://vault.pbtc21.dev"],
  owner: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
  pricing: { model: "per-call", basePrice: 500, token: "sBTC" }
});
["defi", "yield-farming", "lending", "blockchain-query", "data-transform"].forEach((cap) => {
  capabilityIndex.set(cap, /* @__PURE__ */ new Set(["sbtc-yield-agent"]));
});
agents.get("/capabilities", (c) => {
  const allCapabilities = Array.from(capabilityIndex.keys()).sort();
  const capabilityDetails = allCapabilities.map((cap) => {
    const agentIds = capabilityIndex.get(cap) || /* @__PURE__ */ new Set();
    return {
      capability: cap,
      agentCount: agentIds.size,
      description: getCapabilityDescription(cap)
    };
  });
  return c.json({
    totalCapabilities: allCapabilities.length,
    totalAgents: agentRegistry.size,
    capabilities: capabilityDetails,
    categories: [
      { name: "ai", description: "AI/ML services (summarization, generation, analysis)" },
      { name: "blockchain", description: "Blockchain queries and transactions" },
      { name: "data", description: "Data transformation and processing" },
      { name: "web", description: "Web scraping and API calls" },
      { name: "media", description: "Image, audio, video processing" },
      { name: "finance", description: "Pricing, payments, trading" }
    ]
  });
});
agents.post("/recommend", async (c) => {
  const body = await c.req.json();
  const { task, budget, token, capabilities } = body;
  if (!task) {
    return c.json({ error: "Task description required" }, 400);
  }
  const neededCapabilities = capabilities || inferCapabilities(task);
  const matchingAgents = [];
  agentRegistry.forEach((agent) => {
    const matched = agent.capabilities.filter((cap) => neededCapabilities.includes(cap));
    if (matched.length > 0) {
      matchingAgents.push({
        agent,
        score: matched.length / neededCapabilities.length,
        matchedCapabilities: matched
      });
    }
  });
  matchingAgents.sort((a, b) => b.score - a.score);
  const recommendations = matchingAgents.filter((m) => !budget || m.agent.pricing.basePrice <= budget).map((m) => ({
    id: m.agent.id,
    name: m.agent.name,
    description: m.agent.description,
    matchScore: Math.round(m.score * 100),
    matchedCapabilities: m.matchedCapabilities,
    pricing: m.agent.pricing
  }));
  const executionPlan = buildExecutionPlan(task, recommendations);
  return c.json({
    task,
    inferredCapabilities: neededCapabilities,
    recommendations: recommendations.slice(0, 10),
    executionPlan,
    estimatedCost: executionPlan.totalCost
  });
});
agents.get("/:id/openapi", (c) => {
  const id = c.req.param("id");
  const agent = agentRegistry.get(id);
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }
  const spec = {
    openapi: "3.0.0",
    info: {
      title: agent.name,
      description: agent.description,
      version: "1.0.0"
    },
    servers: [{ url: "https://x402.registry/agents" }],
    paths: {
      [`/${agent.id}/execute`]: {
        post: {
          summary: `Execute ${agent.name}`,
          description: agent.description,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    task: { type: "string" },
                    params: { type: "object" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Successful execution" },
            "402": { description: "Payment required" }
          }
        }
      }
    },
    "x-capabilities": agent.capabilities,
    "x-pricing": agent.pricing,
    "x-payment": {
      required: true,
      token: agent.pricing.token,
      amount: agent.pricing.basePrice
    }
  };
  return c.json(spec);
});
agents.get("/execute", (c) => {
  return c.json({
    x402Version: 1,
    name: "x402 Registry - Agent Execution",
    accepts: [{
      scheme: "exact",
      network: "stacks",
      maxAmountRequired: "variable",
      resource: "/agents/execute",
      description: "Execute a task across multiple AI agents with automatic orchestration",
      mimeType: "application/json",
      payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
      maxTimeoutSeconds: 600,
      asset: "STX",
      outputSchema: {
        input: {
          type: "object",
          properties: {
            task: { type: "string", description: "Natural language task description" },
            budget: { type: "number", description: "Maximum budget in smallest unit" },
            token: { type: "string", enum: ["STX", "sBTC", "USDh"], description: "Payment token" },
            preferredAgents: { type: "array", items: { type: "string" }, description: "Optional list of preferred agent IDs" },
            timeout: { type: "number", description: "Optional timeout in milliseconds" }
          },
          required: ["task", "budget", "token"]
        },
        output: {
          type: "object",
          properties: {
            id: { type: "string", description: "Execution ID" },
            task: { type: "string" },
            status: { type: "string", enum: ["completed", "failed", "pending"] },
            result: {
              type: "object",
              properties: {
                summary: { type: "string" },
                output: { type: "string" },
                confidence: { type: "number" }
              }
            },
            agentsUsed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agentId: { type: "string" },
                  endpoint: { type: "string" },
                  cost: { type: "number" },
                  responseTime: { type: "number" }
                }
              }
            },
            totalCost: { type: "number" },
            platformFee: { type: "number" },
            duration: { type: "number" }
          }
        }
      }
    }]
  });
});
agents.post("/execute", async (c) => {
  const body = await c.req.json();
  const { task, budget, token, preferredAgents, timeout } = body;
  if (!task || !budget || !token) {
    return c.json({ error: "Required: task, budget, token" }, 400);
  }
  const paymentProof = c.req.header("X-Payment-Proof");
  if (!paymentProof) {
    const platformFee2 = Math.ceil(budget * 0.1);
    return c.json(
      {
        error: "Payment Required",
        payment: {
          amount: budget + platformFee2,
          token,
          recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
          // Registry wallet
          memo: `execute:${generateExecutionId()}`,
          breakdown: {
            agentBudget: budget,
            platformFee: platformFee2,
            total: budget + platformFee2
          }
        },
        task,
        estimatedAgents: 3
      },
      402
    );
  }
  const executionId = generateExecutionId();
  const startTime = Date.now();
  const capabilities = inferCapabilities(task);
  const selectedAgents = selectAgentsForTask(capabilities, budget, preferredAgents);
  const agentResults = [];
  let remainingBudget = budget;
  for (const agent of selectedAgents) {
    if (remainingBudget < agent.pricing.basePrice) break;
    agentResults.push({
      agentId: agent.id,
      endpoint: agent.endpoints[0] || "internal",
      cost: agent.pricing.basePrice,
      responseTime: Math.random() * 500 + 100
    });
    remainingBudget -= agent.pricing.basePrice;
  }
  const totalCost = agentResults.reduce((sum, a) => sum + a.cost, 0);
  const platformFee = Math.ceil(totalCost * 0.1);
  const result = {
    id: executionId,
    task,
    status: "completed",
    result: {
      summary: `Executed task "${task}" using ${agentResults.length} agents`,
      output: "This is a PoC - real execution would return actual results",
      confidence: 0.85
    },
    agentsUsed: agentResults,
    totalCost,
    platformFee,
    duration: Date.now() - startTime
  };
  return c.json(result);
});
agents.get("/chain", (c) => {
  return c.json({
    x402Version: 1,
    name: "x402 Registry - Agent Chaining",
    accepts: [{
      scheme: "exact",
      network: "stacks",
      maxAmountRequired: "variable",
      resource: "/agents/chain",
      description: "Chain multiple agents in sequence for complex multi-step tasks",
      mimeType: "application/json",
      payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
      maxTimeoutSeconds: 900,
      asset: "STX",
      outputSchema: {
        input: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              description: "Ordered list of agent steps",
              items: {
                type: "object",
                properties: {
                  agentId: { type: "string", description: "Agent ID to execute" },
                  action: { type: "string", description: "Action for the agent" },
                  inputFrom: { type: "string", description: "Source of input (user or previous step)" }
                },
                required: ["agentId"]
              }
            },
            budget: { type: "number", description: "Maximum budget for entire chain" },
            token: { type: "string", enum: ["STX", "sBTC", "USDh"] }
          },
          required: ["steps"]
        },
        output: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string" },
            chain: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "number" },
                  agentId: { type: "string" },
                  agentName: { type: "string" },
                  action: { type: "string" },
                  estimatedCost: { type: "number" }
                }
              }
            },
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "number" },
                  status: { type: "string" },
                  output: { type: "string" }
                }
              }
            },
            totalCost: { type: "number" },
            platformFee: { type: "number" }
          }
        }
      }
    }]
  });
});
agents.post("/chain", async (c) => {
  const body = await c.req.json();
  const { steps, budget, token } = body;
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return c.json({ error: "Steps array required" }, 400);
  }
  const chainPlan = steps.map((step, index) => {
    const agent = agentRegistry.get(step.agentId);
    return {
      step: index + 1,
      agentId: step.agentId,
      agentName: agent?.name || "Unknown",
      action: step.action,
      estimatedCost: agent?.pricing.basePrice || 0,
      inputFrom: step.inputFrom || (index > 0 ? `step${index}` : "user")
    };
  });
  const totalEstimatedCost = chainPlan.reduce((sum, s) => sum + s.estimatedCost, 0);
  const platformFee = Math.ceil(totalEstimatedCost * 0.1);
  const paymentProof = c.req.header("X-Payment-Proof");
  if (!paymentProof) {
    return c.json(
      {
        error: "Payment Required",
        payment: {
          amount: totalEstimatedCost + platformFee,
          token: token || "sBTC",
          recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
          memo: `chain:${generateExecutionId()}`
        },
        chain: chainPlan,
        totalSteps: steps.length
      },
      402
    );
  }
  return c.json({
    id: generateExecutionId(),
    status: "completed",
    chain: chainPlan,
    results: chainPlan.map((step) => ({
      step: step.step,
      status: "completed",
      output: `Result from ${step.agentName}`
    })),
    totalCost: totalEstimatedCost,
    platformFee
  });
});
agents.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, description, capabilities, endpoints, owner, pricing } = body;
  if (!name || !capabilities || !owner || !pricing) {
    return c.json({ error: "Required: name, capabilities, owner, pricing" }, 400);
  }
  const id = generateAgentId();
  const agent = {
    id,
    name,
    description: description || "",
    capabilities,
    endpoints: endpoints || [],
    owner,
    pricing
  };
  agentRegistry.set(id, agent);
  capabilities.forEach((cap) => {
    const existing = capabilityIndex.get(cap) || /* @__PURE__ */ new Set();
    existing.add(id);
    capabilityIndex.set(cap, existing);
  });
  return c.json({
    success: true,
    agent: { id, name, capabilities },
    message: "Agent registered successfully"
  }, 201);
});
agents.get("/", (c) => {
  const allAgents = Array.from(agentRegistry.values()).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    capabilities: a.capabilities,
    pricing: a.pricing
  }));
  return c.json({
    total: allAgents.length,
    agents: allAgents
  });
});
function inferCapabilities(task) {
  const taskLower = task.toLowerCase();
  const capabilities = [];
  const capabilityKeywords = {
    summarize: ["summarize", "summary", "tldr", "condense"],
    translate: ["translate", "translation", "language"],
    "image-generate": ["generate image", "create image", "draw", "illustration"],
    "image-analyze": ["analyze image", "describe image", "what's in this"],
    search: ["search", "find", "look up", "google"],
    "web-scrape": ["scrape", "extract from", "crawl"],
    "code-generate": ["write code", "generate code", "create function"],
    "code-analyze": ["analyze code", "review code", "explain code"],
    "blockchain-query": ["blockchain", "transaction", "wallet", "balance"],
    "data-transform": ["transform", "convert", "parse", "format"],
    sentiment: ["sentiment", "feeling", "emotion", "tone"],
    classify: ["classify", "categorize", "label", "tag"]
  };
  for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
    if (keywords.some((kw) => taskLower.includes(kw))) {
      capabilities.push(capability);
    }
  }
  if (capabilities.length === 0) {
    capabilities.push("general");
  }
  return capabilities;
}
__name(inferCapabilities, "inferCapabilities");
function getCapabilityDescription(cap) {
  const descriptions = {
    summarize: "Condense long text into key points",
    translate: "Convert text between languages",
    "image-generate": "Create images from text descriptions",
    "image-analyze": "Describe and analyze image contents",
    search: "Search the web or databases",
    "web-scrape": "Extract data from websites",
    "code-generate": "Write code in various languages",
    "code-analyze": "Review and explain code",
    "blockchain-query": "Query blockchain data",
    "data-transform": "Transform and convert data formats",
    sentiment: "Analyze emotional tone of text",
    classify: "Categorize and label content",
    general: "General-purpose processing"
  };
  return descriptions[cap] || "Specialized capability";
}
__name(getCapabilityDescription, "getCapabilityDescription");
function buildExecutionPlan(task, agents2) {
  if (agents2.length === 0) {
    return { steps: [], totalCost: 0, estimatedTime: 0 };
  }
  const steps = agents2.slice(0, 5).map((agent, index) => ({
    step: index + 1,
    agentId: agent.id,
    agentName: agent.name,
    action: `Execute: ${agent.matchedCapabilities.join(", ")}`,
    estimatedCost: agent.pricing.basePrice,
    estimatedTime: 500 + index * 200
  }));
  return {
    steps,
    totalCost: steps.reduce((sum, s) => sum + s.estimatedCost, 0),
    estimatedTime: steps.reduce((sum, s) => sum + s.estimatedTime, 0)
  };
}
__name(buildExecutionPlan, "buildExecutionPlan");
function selectAgentsForTask(capabilities, budget, preferredAgents) {
  const selected = [];
  let remainingBudget = budget;
  if (preferredAgents) {
    for (const id of preferredAgents) {
      const agent = agentRegistry.get(id);
      if (agent && agent.pricing.basePrice <= remainingBudget) {
        selected.push(agent);
        remainingBudget -= agent.pricing.basePrice;
      }
    }
  }
  for (const cap of capabilities) {
    const agentIds = capabilityIndex.get(cap);
    if (!agentIds) continue;
    for (const id of agentIds) {
      if (selected.some((a) => a.id === id)) continue;
      const agent = agentRegistry.get(id);
      if (agent && agent.pricing.basePrice <= remainingBudget) {
        selected.push(agent);
        remainingBudget -= agent.pricing.basePrice;
      }
    }
  }
  return selected;
}
__name(selectAgentsForTask, "selectAgentsForTask");
function generateExecutionId() {
  return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
__name(generateExecutionId, "generateExecutionId");
function generateAgentId() {
  return `agent_${Math.random().toString(36).substring(2, 10)}`;
}
__name(generateAgentId, "generateAgentId");

// src/routes/payments.ts
var payments = new Hono2();
var invoices = /* @__PURE__ */ new Map();
var balances = /* @__PURE__ */ new Map();
var subscriptions = /* @__PURE__ */ new Map();
var TOKEN_CONTRACTS = {
  sBTC: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
  STX: "native",
  USDh: "SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.usdh"
};
payments.post("/create-invoice", async (c) => {
  const body = await c.req.json();
  const { amount, token, recipient, memo, expiresIn } = body;
  if (!amount || !token || !recipient) {
    return c.json({ error: "Required: amount, token, recipient" }, 400);
  }
  const id = generateInvoiceId();
  const expiresAt = new Date(Date.now() + (expiresIn || 300) * 1e3).toISOString();
  const invoice = {
    id,
    amount,
    token,
    recipient,
    memo: memo || `invoice:${id}`,
    expiresAt,
    status: "pending"
  };
  invoices.set(id, invoice);
  return c.json({
    invoice: {
      id: invoice.id,
      amount: invoice.amount,
      token: invoice.token,
      recipient: invoice.recipient,
      memo: invoice.memo,
      expiresAt: invoice.expiresAt
    },
    paymentInstructions: {
      contract: TOKEN_CONTRACTS[token],
      function: token === "STX" ? "stx-transfer" : "transfer",
      args: [amount, recipient, invoice.memo]
    },
    qrData: `stacks:${recipient}?amount=${amount}&token=${token}&memo=${invoice.memo}`
  });
});
payments.post("/verify", async (c) => {
  const body = await c.req.json();
  const { txId, invoiceId } = body;
  if (!txId) {
    return c.json({ error: "Transaction ID required" }, 400);
  }
  try {
    const txResponse = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txId}`);
    if (!txResponse.ok) {
      return c.json({ error: "Transaction not found" }, 404);
    }
    const tx = await txResponse.json();
    if (tx.tx_status !== "success") {
      return c.json({
        verified: false,
        status: tx.tx_status,
        error: "Transaction not successful"
      });
    }
    const paymentDetails = extractPaymentDetails(tx);
    if (invoiceId) {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }
      const isValid = paymentDetails.amount >= invoice.amount && paymentDetails.recipient === invoice.recipient && paymentDetails.memo?.includes(invoice.memo);
      if (isValid) {
        invoice.status = "paid";
        invoice.txId = txId;
        invoices.set(invoiceId, invoice);
      }
      return c.json({
        verified: isValid,
        invoice: invoiceId,
        transaction: {
          txId,
          amount: paymentDetails.amount,
          token: paymentDetails.token,
          sender: paymentDetails.sender,
          recipient: paymentDetails.recipient,
          memo: paymentDetails.memo,
          blockHeight: tx.block_height,
          timestamp: tx.burn_block_time_iso
        }
      });
    }
    return c.json({
      verified: true,
      transaction: {
        txId,
        status: tx.tx_status,
        type: tx.tx_type,
        sender: tx.sender_address,
        blockHeight: tx.block_height,
        timestamp: tx.burn_block_time_iso,
        ...paymentDetails
      }
    });
  } catch (error) {
    return c.json({ error: `Verification failed: ${error.message}` }, 500);
  }
});
payments.get("/balance/:address", async (c) => {
  const address = c.req.param("address");
  let balance = balances.get(address);
  if (!balance) {
    balance = await fetchOnChainBalances(address);
    balances.set(address, balance);
  }
  return c.json({
    address,
    balances: balance,
    credits: {
      available: balance.sBTC + balance.STX * 1e-5,
      // Normalize to sBTC equivalent
      locked: 0
    },
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  });
});
payments.post("/deposit", async (c) => {
  const body = await c.req.json();
  const { address, amount, token } = body;
  if (!address || !amount || !token) {
    return c.json({ error: "Required: address, amount, token" }, 400);
  }
  const invoice = {
    id: generateInvoiceId(),
    type: "deposit",
    amount,
    token,
    recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
    // Registry wallet
    memo: `deposit:${address}`,
    expiresAt: new Date(Date.now() + 3600 * 1e3).toISOString()
  };
  return c.json({
    depositInstructions: {
      sendTo: invoice.recipient,
      amount: invoice.amount,
      token: invoice.token,
      memo: invoice.memo,
      contract: TOKEN_CONTRACTS[token]
    },
    invoiceId: invoice.id,
    expiresAt: invoice.expiresAt,
    note: "After sending, call /payments/verify with txId to credit your account"
  });
});
payments.get("/subscribe", (c) => {
  return c.json({
    x402Version: 1,
    name: "x402 Registry - Subscriptions",
    accepts: [{
      scheme: "exact",
      network: "stacks",
      maxAmountRequired: "50000",
      resource: "/payments/subscribe",
      description: "Subscribe to an endpoint for discounted bulk access",
      mimeType: "application/json",
      payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
      maxTimeoutSeconds: 300,
      asset: "STX",
      plans: {
        basic: { calls: 100, price: 1e3, period: "month" },
        pro: { calls: 1e3, price: 8e3, period: "month" },
        unlimited: { calls: -1, price: 5e4, period: "month" }
      },
      outputSchema: {
        input: {
          type: "object",
          properties: {
            subscriber: { type: "string", description: "Stacks address of subscriber" },
            endpointId: { type: "string", description: "ID of endpoint to subscribe to" },
            plan: { type: "string", enum: ["basic", "pro", "unlimited"], description: "Subscription tier" },
            token: { type: "string", enum: ["STX", "sBTC", "USDh"] }
          },
          required: ["subscriber", "endpointId", "plan"]
        },
        output: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            subscription: {
              type: "object",
              properties: {
                id: { type: "string" },
                subscriber: { type: "string" },
                endpointId: { type: "string" },
                plan: { type: "string" },
                callsRemaining: { type: "number" },
                startsAt: { type: "string" },
                expiresAt: { type: "string" },
                status: { type: "string" }
              }
            }
          }
        }
      }
    }]
  });
});
payments.post("/subscribe", async (c) => {
  const body = await c.req.json();
  const { subscriber, endpointId, plan, token } = body;
  if (!subscriber || !endpointId || !plan) {
    return c.json({ error: "Required: subscriber, endpointId, plan" }, 400);
  }
  const plans = {
    basic: { calls: 100, price: 1e3, period: "month" },
    pro: { calls: 1e3, price: 8e3, period: "month" },
    unlimited: { calls: -1, price: 5e4, period: "month" }
  };
  const selectedPlan = plans[plan];
  if (!selectedPlan) {
    return c.json({ error: "Invalid plan. Options: basic, pro, unlimited" }, 400);
  }
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const paymentProof = c.req.header("X-Payment-Proof");
  if (!paymentProof) {
    return c.json(
      {
        error: "Payment Required",
        payment: {
          amount: selectedPlan.price,
          token: token || "sBTC",
          recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
          memo: `subscribe:${subscriptionId}`
        },
        plan: {
          name: plan,
          ...selectedPlan
        }
      },
      402
    );
  }
  const subscription = {
    id: subscriptionId,
    subscriber,
    endpointId,
    plan,
    callsRemaining: selectedPlan.calls,
    callsUsed: 0,
    startsAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1e3).toISOString(),
    status: "active"
  };
  subscriptions.set(subscriptionId, subscription);
  return c.json({
    success: true,
    subscription
  });
});
payments.get("/subscription/:id", (c) => {
  const id = c.req.param("id");
  const subscription = subscriptions.get(id);
  if (!subscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }
  return c.json(subscription);
});
function generateInvoiceId() {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
__name(generateInvoiceId, "generateInvoiceId");
function extractPaymentDetails(tx) {
  if (tx.tx_type === "token_transfer") {
    return {
      amount: parseInt(tx.token_transfer.amount),
      token: "STX",
      sender: tx.sender_address,
      recipient: tx.token_transfer.recipient_address,
      memo: tx.token_transfer.memo ? Buffer.from(tx.token_transfer.memo, "hex").toString() : void 0
    };
  }
  if (tx.tx_type === "contract_call") {
    const args = tx.contract_call.function_args || [];
    return {
      amount: parseInt(args[0]?.repr?.replace("u", "") || "0"),
      token: tx.contract_call.contract_id.includes("sbtc") ? "sBTC" : "USDh",
      sender: tx.sender_address,
      recipient: args[2]?.repr?.replace(/'/g, "") || "",
      memo: args[3]?.repr
    };
  }
  return {
    amount: 0,
    token: "unknown",
    sender: tx.sender_address,
    recipient: ""
  };
}
__name(extractPaymentDetails, "extractPaymentDetails");
async function fetchOnChainBalances(address) {
  try {
    const stxResponse = await fetch(
      `https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`
    );
    const stxData = await stxResponse.json();
    const stxBalance = parseInt(stxData.balance || "0");
    const ftResponse = await fetch(
      `https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`
    );
    const ftData = await ftResponse.json();
    let sbtcBalance = 0;
    let usdhBalance = 0;
    const fungible = ftData.fungible_tokens || {};
    for (const [key, value] of Object.entries(fungible)) {
      if (key.includes("sbtc")) {
        sbtcBalance = parseInt(value.balance || "0");
      }
      if (key.includes("usdh")) {
        usdhBalance = parseInt(value.balance || "0");
      }
    }
    return {
      sBTC: sbtcBalance,
      STX: stxBalance,
      USDh: usdhBalance
    };
  } catch {
    return { sBTC: 0, STX: 0, USDh: 0 };
  }
}
__name(fetchOnChainBalances, "fetchOnChainBalances");

// src/routes/analytics.ts
var analytics = new Hono2();
var analyticsData = /* @__PURE__ */ new Map();
analytics.get("/my-endpoints", (c) => {
  const owner = c.req.header("X-Owner-Address");
  if (!owner) {
    return c.json({ error: "X-Owner-Address header required" }, 401);
  }
  const endpoints = [];
  analyticsData.forEach((data, endpointId) => {
    const last24h = Date.now() - 24 * 3600 * 1e3;
    const calls24h = data.calls.filter((c2) => c2.timestamp > last24h);
    const revenue24h = data.revenue.filter((r) => r.timestamp > last24h).reduce((sum, r) => sum + r.amount, 0);
    endpoints.push({
      endpointId,
      totalCalls: data.calls.length,
      calls24h: calls24h.length,
      totalRevenue: data.revenue.reduce((sum, r) => sum + r.amount, 0),
      revenue24h,
      avgResponseTime: data.calls.length > 0 ? data.calls.reduce((sum, c2) => sum + c2.responseTime, 0) / data.calls.length : 0
    });
  });
  return c.json({
    owner,
    endpoints,
    summary: {
      totalEndpoints: endpoints.length,
      totalCalls: endpoints.reduce((sum, e) => sum + e.totalCalls, 0),
      totalRevenue: endpoints.reduce((sum, e) => sum + e.totalRevenue, 0),
      calls24h: endpoints.reduce((sum, e) => sum + e.calls24h, 0),
      revenue24h: endpoints.reduce((sum, e) => sum + e.revenue24h, 0)
    }
  });
});
analytics.get("/revenue", (c) => {
  const owner = c.req.header("X-Owner-Address");
  const period = c.req.query("period") || "7d";
  if (!owner) {
    return c.json({ error: "X-Owner-Address header required" }, 401);
  }
  const periodMs = parsePeriod(period);
  const cutoff = Date.now() - periodMs;
  const revenueByDay = /* @__PURE__ */ new Map();
  const revenueByEndpoint = /* @__PURE__ */ new Map();
  analyticsData.forEach((data, endpointId) => {
    data.revenue.filter((r) => r.timestamp > cutoff).forEach((r) => {
      const day = new Date(r.timestamp).toISOString().split("T")[0];
      const dayData = revenueByDay.get(day) || { sBTC: 0, STX: 0, USDh: 0 };
      dayData[r.token] += r.amount;
      revenueByDay.set(day, dayData);
      revenueByEndpoint.set(endpointId, (revenueByEndpoint.get(endpointId) || 0) + r.amount);
    });
  });
  const dailyRevenue = Array.from(revenueByDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amounts]) => ({ date, ...amounts }));
  const topEndpoints = Array.from(revenueByEndpoint.entries()).sort(([, a], [, b]) => b - a).slice(0, 10).map(([endpointId, revenue]) => ({ endpointId, revenue }));
  return c.json({
    period,
    dailyRevenue,
    topEndpoints,
    totals: {
      sBTC: dailyRevenue.reduce((sum, d) => sum + d.sBTC, 0),
      STX: dailyRevenue.reduce((sum, d) => sum + d.STX, 0),
      USDh: dailyRevenue.reduce((sum, d) => sum + d.USDh, 0)
    }
  });
});
analytics.get("/callers", (c) => {
  const owner = c.req.header("X-Owner-Address");
  const endpointId = c.req.query("endpoint");
  if (!owner) {
    return c.json({ error: "X-Owner-Address header required" }, 401);
  }
  const callerStats = /* @__PURE__ */ new Map();
  const filterEndpoints = endpointId ? [endpointId] : Array.from(analyticsData.keys());
  filterEndpoints.forEach((epId) => {
    const data = analyticsData.get(epId);
    if (!data) return;
    data.calls.forEach((call) => {
      const existing = callerStats.get(call.caller) || {
        calls: 0,
        totalPaid: 0,
        avgResponseTime: 0,
        lastSeen: 0
      };
      existing.calls++;
      existing.totalPaid += call.paid;
      existing.avgResponseTime = (existing.avgResponseTime * (existing.calls - 1) + call.responseTime) / existing.calls;
      existing.lastSeen = Math.max(existing.lastSeen, call.timestamp);
      callerStats.set(call.caller, existing);
    });
  });
  const topCallers = Array.from(callerStats.entries()).sort(([, a], [, b]) => b.calls - a.calls).slice(0, 50).map(([address, stats]) => ({
    address,
    ...stats,
    lastSeen: new Date(stats.lastSeen).toISOString()
  }));
  return c.json({
    endpoint: endpointId || "all",
    uniqueCallers: callerStats.size,
    topCallers
  });
});
analytics.post("/record-call", async (c) => {
  const body = await c.req.json();
  const { endpointId, caller, responseTime, paid } = body;
  if (!endpointId || !caller) {
    return c.json({ error: "Required: endpointId, caller" }, 400);
  }
  const data = analyticsData.get(endpointId) || { calls: [], revenue: [] };
  data.calls.push({
    timestamp: Date.now(),
    caller,
    responseTime: responseTime || 0,
    paid: paid || 0
  });
  if (paid > 0) {
    data.revenue.push({
      timestamp: Date.now(),
      amount: paid,
      token: "sBTC",
      txId: ""
    });
  }
  analyticsData.set(endpointId, data);
  return c.json({ success: true });
});
function parsePeriod(period) {
  const match2 = period.match(/^(\d+)([hdwm])$/);
  if (!match2) return 7 * 24 * 3600 * 1e3;
  const value = parseInt(match2[1]);
  const unit = match2[2];
  switch (unit) {
    case "h":
      return value * 3600 * 1e3;
    case "d":
      return value * 24 * 3600 * 1e3;
    case "w":
      return value * 7 * 24 * 3600 * 1e3;
    case "m":
      return value * 30 * 24 * 3600 * 1e3;
    default:
      return 7 * 24 * 3600 * 1e3;
  }
}
__name(parsePeriod, "parsePeriod");

// src/routes/dev.ts
var dev = new Hono2();
dev.post("/generate-middleware", async (c) => {
  const body = await c.req.json();
  const { language, framework, price, token, walletAddress } = body;
  if (!language || !price || !token || !walletAddress) {
    return c.json({ error: "Required: language, price, token, walletAddress" }, 400);
  }
  const code = generateMiddlewareCode(language, framework, price, token, walletAddress);
  return c.json({
    language,
    framework: framework || "none",
    code,
    usage: getUsageInstructions(language, framework)
  });
});
dev.post("/test-endpoint", async (c) => {
  const body = await c.req.json();
  const { url, method = "GET" } = body;
  if (!url) {
    return c.json({ error: "URL required" }, 400);
  }
  const tests = [];
  try {
    const start = Date.now();
    const response = await fetch(url, { method });
    const responseTime = Date.now() - start;
    tests.push({
      name: "Endpoint reachable",
      passed: true,
      details: `Response time: ${responseTime}ms`
    });
    const returns402 = response.status === 402;
    tests.push({
      name: "Returns 402 Payment Required",
      passed: returns402,
      details: returns402 ? "Correct status code" : `Got ${response.status} instead`
    });
    let paymentDetails = null;
    if (returns402) {
      try {
        paymentDetails = await response.json();
      } catch {
        paymentDetails = null;
      }
    }
    const hasPaymentInfo = !!(paymentDetails?.maxAmountRequired || paymentDetails?.amount || paymentDetails?.payment?.amount);
    tests.push({
      name: "Contains payment information",
      passed: hasPaymentInfo,
      details: hasPaymentInfo ? `Amount: ${paymentDetails?.maxAmountRequired || paymentDetails?.amount || paymentDetails?.payment?.amount}` : "Missing amount field"
    });
    const hasRecipient = !!(paymentDetails?.payTo || paymentDetails?.recipient || paymentDetails?.payment?.address);
    tests.push({
      name: "Has recipient address",
      passed: hasRecipient,
      details: hasRecipient ? `Pay to: ${paymentDetails?.payTo || paymentDetails?.recipient || paymentDetails?.payment?.address}` : "Missing recipient field"
    });
    const hasToken = !!(paymentDetails?.tokenType || paymentDetails?.token || paymentDetails?.payment?.token);
    tests.push({
      name: "Token type specified",
      passed: hasToken,
      details: hasToken ? `Token: ${paymentDetails?.tokenType || paymentDetails?.token || paymentDetails?.payment?.token}` : "Missing token field (defaults to STX)"
    });
    const hasCors = !!response.headers.get("Access-Control-Allow-Origin");
    tests.push({
      name: "CORS enabled",
      passed: hasCors,
      details: hasCors ? "CORS headers present" : "Missing CORS headers (may block browser calls)"
    });
    const allPassed = tests.every((t) => t.passed);
    const criticalPassed = tests.slice(0, 4).every((t) => t.passed);
    return c.json({
      url,
      compliant: criticalPassed,
      fullyCompliant: allPassed,
      tests,
      paymentDetails,
      recommendations: generateRecommendations(tests)
    });
  } catch (error) {
    tests.push({
      name: "Endpoint reachable",
      passed: false,
      details: `Error: ${error.message}`
    });
    return c.json({
      url,
      compliant: false,
      tests,
      error: error.message
    });
  }
});
dev.get("/pricing-calculator", (c) => {
  const category = c.req.query("category") || "utility";
  const complexity = c.req.query("complexity") || "medium";
  const token = c.req.query("token") || "sBTC";
  const marketPrices = {
    sBTC: { usd: 1e5 },
    STX: { usd: 0.5 },
    USDh: { usd: 1 }
  };
  const categoryPrices = {
    utility: 1,
    // $0.01
    ai: 10,
    // $0.10
    blockchain: 5,
    // $0.05
    data: 3,
    // $0.03
    media: 15
    // $0.15
  };
  const complexityMultipliers = {
    simple: 0.5,
    medium: 1,
    complex: 2,
    premium: 5
  };
  const basePrice = categoryPrices[category] || 5;
  const multiplier = complexityMultipliers[complexity] || 1;
  const priceUsdCents = basePrice * multiplier;
  const tokenPrice = marketPrices[token] || marketPrices.sBTC;
  const priceInToken = Math.ceil(priceUsdCents / 100 / tokenPrice.usd * 1e8);
  return c.json({
    recommendation: {
      price: priceInToken,
      token,
      priceUsd: `$${(priceUsdCents / 100).toFixed(4)}`
    },
    inputs: {
      category,
      complexity
    },
    marketData: {
      token,
      priceUsd: tokenPrice.usd
    },
    comparisons: {
      sBTC: Math.ceil(priceUsdCents / 100 / marketPrices.sBTC.usd * 1e8),
      STX: Math.ceil(priceUsdCents / 100 / marketPrices.STX.usd * 1e6),
      USDh: Math.ceil(priceUsdCents / 100 * 1e6)
    },
    tips: [
      "Start lower to attract users, raise prices as demand grows",
      "AI endpoints can command 5-10x premium over utility endpoints",
      "Consider offering volume discounts via subscriptions",
      "Monitor competitor pricing in the registry"
    ]
  });
});
dev.get("/sdk/:language", (c) => {
  const language = c.req.param("language");
  const sdks = {
    typescript: {
      package: "@x402/sdk",
      install: "npm install @x402/sdk",
      repo: "https://github.com/x402-registry/sdk-typescript",
      example: `
import { x402 } from '@x402/sdk';

// Create client
const client = x402.createClient({
  wallet: 'SP...',
  privateKey: process.env.STACKS_PRIVATE_KEY,
});

// Call a paid endpoint
const result = await client.call('https://api.example.com/summarize', {
  body: { text: 'Long article...' },
  maxPayment: 1000, // sats
});
`
    },
    python: {
      package: "x402-sdk",
      install: "pip install x402-sdk",
      repo: "https://github.com/x402-registry/sdk-python",
      example: `
from x402 import Client

client = Client(
    wallet="SP...",
    private_key=os.environ["STACKS_PRIVATE_KEY"]
)

result = client.call(
    "https://api.example.com/summarize",
    body={"text": "Long article..."},
    max_payment=1000
)
`
    },
    go: {
      package: "github.com/x402-registry/sdk-go",
      install: "go get github.com/x402-registry/sdk-go",
      repo: "https://github.com/x402-registry/sdk-go",
      example: `
import "github.com/x402-registry/sdk-go"

client := x402.NewClient(x402.Config{
    Wallet:     "SP...",
    PrivateKey: os.Getenv("STACKS_PRIVATE_KEY"),
})

result, err := client.Call("https://api.example.com/summarize", x402.CallOptions{
    Body:       map[string]string{"text": "Long article..."},
    MaxPayment: 1000,
})
`
    }
  };
  const sdk = sdks[language];
  if (!sdk) {
    return c.json({
      error: "SDK not found",
      available: Object.keys(sdks)
    }, 404);
  }
  return c.json({
    language,
    ...sdk
  });
});
function generateMiddlewareCode(language, framework, price, token, walletAddress) {
  if (language === "typescript" || language === "javascript") {
    if (framework === "hono") {
      return `
import { MiddlewareHandler } from 'hono';

export const x402Middleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const paymentProof = c.req.header('X-Payment-Proof');

    if (!paymentProof) {
      return c.json({
        error: 'Payment Required',
        payment: {
          amount: ${price},
          token: '${token}',
          address: '${walletAddress}',
          memo: 'api-call',
        },
      }, 402);
    }

    // Verify payment on-chain
    const verified = await verifyPayment(paymentProof, ${price});
    if (!verified) {
      return c.json({ error: 'Invalid payment' }, 402);
    }

    await next();
  };
};

async function verifyPayment(txId: string, expectedAmount: number): Promise<boolean> {
  const response = await fetch(\`https://api.mainnet.hiro.so/extended/v1/tx/\${txId}\`);
  const tx = await response.json();
  return tx.tx_status === 'success';
}
`;
    }
    return `
const x402Middleware = (req, res, next) => {
  const paymentProof = req.headers['x-payment-proof'];

  if (!paymentProof) {
    return res.status(402).json({
      error: 'Payment Required',
      payment: {
        amount: ${price},
        token: '${token}',
        address: '${walletAddress}',
        memo: 'api-call',
      },
    });
  }

  // Verify payment (implement verification logic)
  next();
};

module.exports = x402Middleware;
`;
  }
  if (language === "python") {
    return `
from functools import wraps
from flask import request, jsonify

def x402_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payment_proof = request.headers.get('X-Payment-Proof')

        if not payment_proof:
            return jsonify({
                'error': 'Payment Required',
                'payment': {
                    'amount': ${price},
                    'token': '${token}',
                    'address': '${walletAddress}',
                    'memo': 'api-call',
                }
            }), 402

        # Verify payment on-chain
        if not verify_payment(payment_proof, ${price}):
            return jsonify({'error': 'Invalid payment'}), 402

        return f(*args, **kwargs)
    return decorated
`;
  }
  return `// Middleware for ${language} not yet available`;
}
__name(generateMiddlewareCode, "generateMiddlewareCode");
function getUsageInstructions(language, framework) {
  if (language === "typescript" && framework === "hono") {
    return `
// Apply to specific routes:
app.use('/api/paid/*', x402Middleware());

// Or to entire app:
app.use(x402Middleware());
`;
  }
  if (language === "python") {
    return `
# Apply to specific routes:
@app.route('/api/paid')
@x402_required
def paid_endpoint():
    return {'data': 'premium content'}
`;
  }
  return "See SDK documentation for usage instructions";
}
__name(getUsageInstructions, "getUsageInstructions");
function generateRecommendations(tests) {
  const recommendations = [];
  tests.forEach((test) => {
    if (!test.passed) {
      switch (test.name) {
        case "Returns 402 Payment Required":
          recommendations.push("Return HTTP 402 status code for unpaid requests");
          break;
        case "Contains payment information":
          recommendations.push("Include 'amount' or 'maxAmountRequired' in 402 response body");
          break;
        case "Has recipient address":
          recommendations.push("Include 'payTo' or 'recipient' Stacks address in response");
          break;
        case "Token type specified":
          recommendations.push("Specify 'tokenType' (sBTC, STX, or USDh) in response");
          break;
        case "CORS enabled":
          recommendations.push("Add CORS headers to allow browser-based agent calls");
          break;
      }
    }
  });
  if (recommendations.length === 0) {
    recommendations.push("Your endpoint is fully x402 compliant!");
    recommendations.push("Consider registering it at POST /registry/register");
  }
  return recommendations;
}
__name(generateRecommendations, "generateRecommendations");

// src/frontend.ts
function renderHomePage(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>x402 Registry - The App Store for AI Agents</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    /* Header */
    header {
      text-align: center;
      padding: 3rem 0;
      border-bottom: 1px solid #222;
      margin-bottom: 3rem;
    }
    h1 {
      font-size: 2.5rem;
      background: linear-gradient(135deg, #f7931a, #ff6b00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .tagline { color: #888; font-size: 1.2rem; }

    /* Stats */
    .stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin: 2rem 0;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #f7931a;
    }
    .stat-label { color: #666; font-size: 0.9rem; }

    /* Sections */
    section { margin-bottom: 3rem; }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h2::before {
      content: '';
      width: 4px;
      height: 24px;
      background: #f7931a;
      border-radius: 2px;
    }

    /* Cards */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: #141414;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 1.5rem;
      transition: border-color 0.2s, transform 0.2s;
    }
    .card:hover {
      border-color: #f7931a;
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #fff;
    }
    .card-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      background: #1a1a1a;
      color: #f7931a;
      border: 1px solid #333;
    }
    .card-badge.verified {
      background: #0f2d1a;
      color: #4ade80;
      border-color: #166534;
    }
    .card-description {
      color: #888;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      background: #1a1a1a;
      border-radius: 4px;
      color: #666;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #222;
    }
    .price {
      font-weight: 600;
      color: #f7931a;
    }
    .price span { color: #666; font-weight: normal; }

    /* Capabilities */
    .capabilities {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .capability {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 4px;
      color: #7dd3fc;
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    /* API section */
    .api-info {
      background: #141414;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 2rem;
    }
    .api-info h3 { color: #fff; margin-bottom: 1rem; }
    .endpoint-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 0.5rem;
    }
    .endpoint {
      font-family: monospace;
      font-size: 0.85rem;
      padding: 0.5rem;
      background: #0a0a0a;
      border-radius: 4px;
    }
    .method {
      display: inline-block;
      width: 50px;
      color: #4ade80;
    }
    .method.post { color: #f7931a; }
    .method.delete { color: #ef4444; }
    .path { color: #888; }

    /* Footer */
    footer {
      text-align: center;
      padding: 2rem;
      color: #444;
      border-top: 1px solid #222;
      margin-top: 2rem;
    }
    footer a { color: #f7931a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>x402 Registry</h1>
      <p class="tagline">The App Store for AI Agents</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.endpoints.length}</div>
          <div class="stat-label">Endpoints</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.agents.length}</div>
          <div class="stat-label">Agents</div>
        </div>
        <div class="stat">
          <div class="stat-value">sBTC</div>
          <div class="stat-label">Native Token</div>
        </div>
      </div>
    </header>

    <section>
      <h2>Endpoints</h2>
      ${data.endpoints.length === 0 ? '<div class="empty">No endpoints registered yet</div>' : `
      <div class="grid">
        ${data.endpoints.map((ep) => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(ep.name)}</div>
            <div class="card-badge ${ep.verified ? "verified" : ""}">${ep.verified ? "Verified" : ep.category}</div>
          </div>
          <div class="card-description">${escapeHtml(ep.description)}</div>
          <div class="card-meta">
            ${ep.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <div class="price">${ep.price} <span>${ep.token}</span></div>
            <div style="color: #666; font-size: 0.85rem;">${ep.calls24h} calls/24h</div>
          </div>
        </div>
        `).join("")}
      </div>
      `}
    </section>

    <section>
      <h2>Agents</h2>
      ${data.agents.length === 0 ? '<div class="empty">No agents registered yet</div>' : `
      <div class="grid">
        ${data.agents.map((agent) => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(agent.name)}</div>
            <div class="card-badge">${agent.pricing.model}</div>
          </div>
          <div class="card-description">${escapeHtml(agent.description)}</div>
          <div class="capabilities">
            ${agent.capabilities.map((c) => `<span class="capability">${escapeHtml(c)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <div class="price">${agent.pricing.basePrice} <span>${agent.pricing.token}/call</span></div>
          </div>
        </div>
        `).join("")}
      </div>
      `}
    </section>

    <section>
      <h2>API</h2>
      <div class="api-info">
        <h3>REST API Endpoints</h3>
        <div class="endpoint-list">
          <div class="endpoint"><span class="method">GET</span> <span class="path">/registry/discover</span></div>
          <div class="endpoint"><span class="method">GET</span> <span class="path">/registry/search</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/registry/register</span></div>
          <div class="endpoint"><span class="method">GET</span> <span class="path">/agents</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/agents/register</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/agents/execute</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/payments/verify</span></div>
          <div class="endpoint"><span class="method">GET</span> <span class="path">/dev/pricing-calculator</span></div>
        </div>
      </div>
    </section>

    <footer>
      Powered by <a href="https://stacks.co">Stacks</a> &bull;
      <a href="https://github.com/pbtc21/x402-registry">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}
__name(renderHomePage, "renderHomePage");
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeHtml, "escapeHtml");
function renderMyEndpointsPage(data) {
  const totalCalls = data.endpoints.reduce((sum, ep) => sum + (ep.calls24h || 0), 0);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Endpoints - x402 Registry</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    /* Header */
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 1px solid #222;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #f7931a, #ff6b00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .subtitle { color: #888; font-size: 1rem; }
    .address {
      font-family: monospace;
      font-size: 0.85rem;
      color: #666;
      background: #141414;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: inline-block;
      margin-top: 1rem;
      word-break: break-all;
    }

    /* Stats */
    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin: 1.5rem 0;
      flex-wrap: wrap;
    }
    .stat {
      text-align: center;
      padding: 1rem 1.5rem;
      background: #141414;
      border: 1px solid #222;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #f7931a;
    }
    .stat-label { color: #666; font-size: 0.85rem; margin-top: 0.25rem; }

    /* Navigation */
    .nav {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .nav a {
      color: #888;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .nav a:hover { background: #141414; color: #f7931a; }

    /* Sections */
    section { margin-bottom: 2rem; }
    h2 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h2::before {
      content: '';
      width: 4px;
      height: 20px;
      background: #f7931a;
      border-radius: 2px;
    }

    /* Cards */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }
    .card {
      background: #141414;
      border: 1px solid #222;
      border-radius: 10px;
      padding: 1.25rem;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #f7931a; }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
    }
    .card-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      background: #1a1a1a;
      color: #f7931a;
      border: 1px solid #333;
    }
    .card-badge.verified {
      background: #0f2d1a;
      color: #4ade80;
      border-color: #166534;
    }
    .card-description {
      color: #888;
      font-size: 0.85rem;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }
    .card-url {
      font-family: monospace;
      font-size: 0.75rem;
      color: #666;
      background: #0a0a0a;
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      margin-bottom: 0.75rem;
      word-break: break-all;
    }
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
    }
    .tag {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      background: #1a1a1a;
      border-radius: 4px;
      color: #666;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #222;
    }
    .price {
      font-weight: 600;
      color: #f7931a;
    }
    .price span { color: #666; font-weight: normal; }
    .calls {
      color: #666;
      font-size: 0.8rem;
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
    .empty-cta {
      margin-top: 1rem;
    }
    .empty-cta a {
      color: #f7931a;
      text-decoration: none;
    }

    /* Register form hint */
    .register-hint {
      background: #141414;
      border: 1px dashed #333;
      border-radius: 10px;
      padding: 1.5rem;
      text-align: center;
      margin-top: 1rem;
    }
    .register-hint h3 {
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .register-hint p {
      color: #666;
      font-size: 0.9rem;
    }
    .register-hint code {
      display: block;
      margin-top: 1rem;
      background: #0a0a0a;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #4ade80;
      text-align: left;
      overflow-x: auto;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 1.5rem;
      color: #444;
      border-top: 1px solid #222;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
    footer a { color: #f7931a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>My Endpoints</h1>
      <p class="subtitle">Your registered x402 services</p>
      <div class="address">${escapeHtml(data.address)}</div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.endpoints.length}</div>
          <div class="stat-label">Endpoints</div>
        </div>
        <div class="stat">
          <div class="stat-value">${totalCalls}</div>
          <div class="stat-label">Calls (24h)</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.endpoints.filter((e) => e.verified).length}</div>
          <div class="stat-label">Verified</div>
        </div>
      </div>
    </header>

    <nav class="nav">
      <a href="/">Browse All</a>
      <a href="/registry/search?owner=${encodeURIComponent(data.address)}">API View</a>
    </nav>

    <section>
      <h2>Registered Endpoints</h2>
      ${data.endpoints.length === 0 ? `
      <div class="empty">
        <p>No endpoints registered yet</p>
        <div class="empty-cta">
          <a href="/registry/register">Register your first endpoint</a>
        </div>
      </div>
      ` : `
      <div class="grid">
        ${data.endpoints.map((ep) => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(ep.name)}</div>
            <div class="card-badge ${ep.verified ? "verified" : ""}">${ep.verified ? "Verified" : ep.category || "endpoint"}</div>
          </div>
          <div class="card-description">${escapeHtml(ep.description)}</div>
          <div class="card-url">${escapeHtml(ep.url || "")}</div>
          <div class="card-meta">
            ${(ep.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <div class="price">${ep.price} <span>${ep.token}</span></div>
            <div class="calls">${ep.calls24h || 0} calls</div>
          </div>
        </div>
        `).join("")}
      </div>
      `}

      ${data.endpoints.length > 0 ? `
      <div class="register-hint">
        <h3>Add Another Endpoint</h3>
        <p>POST to /registry/register with your endpoint details</p>
        <code>curl -X POST ${escapeHtml("https://stacksx402.com/registry/register")} \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://...", "name":"...", "owner":"${escapeHtml(data.address)}"}'</code>
      </div>
      ` : ""}
    </section>

    <footer>
      <a href="/">x402 Registry</a> &bull; Powered by <a href="https://stacks.co">Stacks</a>
    </footer>
  </div>
</body>
</html>`;
}
__name(renderMyEndpointsPage, "renderMyEndpointsPage");

// src/index.ts
var app = new Hono2();
app.use("*", cors());
app.get("/", async (c) => {
  const accept = c.req.header("Accept") || "";
  const isBrowser = accept.includes("text/html");
  if (isBrowser) {
    const results = await c.env.DB.prepare("SELECT * FROM endpoints ORDER BY calls_24h DESC").all();
    const endpointList = (results.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      token: row.token,
      tags: JSON.parse(row.tags || "[]"),
      category: row.category,
      verified: Boolean(row.verified),
      calls24h: row.calls_24h || 0
    }));
    const agentList = Array.from(agentRegistry.values()).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      capabilities: a.capabilities,
      pricing: a.pricing
    }));
    const html = renderHomePage({
      endpoints: endpointList,
      agents: agentList,
      stats: { totalEndpoints: endpointList.length, totalAgents: agentList.length }
    });
    return c.html(html);
  }
  return c.json({
    name: "x402 Registry",
    version: "1.0.0",
    tagline: "The App Store for AI Agents",
    description: "Discover, register, and orchestrate x402-gated endpoints",
    endpoints: {
      "GET /": "API info (HTML for browsers)",
      "GET /stats": "Platform statistics",
      "POST /registry/register": "Register your x402 endpoint",
      "GET /registry/search": "Search endpoints by tag/category",
      "GET /registry/discover": "Trending and featured endpoints",
      "GET /agents": "List all agents",
      "POST /agents/register": "Register an agent",
      "POST /agents/execute": "Execute a task across agents",
      "POST /payments/verify": "Verify a payment",
      "GET /dev/pricing-calculator": "Optimal pricing suggestions"
    },
    tokens: ["STX", "sBTC", "USDh"],
    network: "stacks-mainnet"
  });
});
app.get("/my/:address", async (c) => {
  const address = c.req.param("address");
  const results = await c.env.DB.prepare(
    "SELECT * FROM endpoints WHERE owner = ? ORDER BY calls_24h DESC"
  ).bind(address).all();
  const endpointList = (results.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    price: row.price,
    token: row.token,
    tags: JSON.parse(row.tags || "[]"),
    category: row.category,
    verified: Boolean(row.verified),
    calls24h: row.calls_24h || 0
  }));
  const html = renderMyEndpointsPage({
    endpoints: endpointList,
    address,
    stats: { totalEndpoints: endpointList.length }
  });
  return c.html(html);
});
app.get("/.well-known/x402", async (c) => {
  return c.json({
    x402Version: 1,
    name: "x402 Registry",
    description: "The App Store for AI Agents - discover, register, and orchestrate x402-gated endpoints",
    network: "stacks",
    accepts: [
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "1000",
        resource: "/registry/register",
        description: "Register your x402 endpoint in the registry",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 300,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL of the x402 endpoint" },
              name: { type: "string", description: "Human-readable name" },
              description: { type: "string", description: "What the endpoint does" },
              owner: { type: "string", description: "Stacks address of owner" },
              price: { type: "number", description: "Price per call in smallest unit" },
              token: { type: "string", enum: ["STX", "sBTC", "USDh"] },
              tags: { type: "array", items: { type: "string" } },
              category: { type: "string" }
            },
            required: ["url", "name", "owner", "price", "token"]
          },
          output: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              endpoint: { type: "object" },
              message: { type: "string" }
            }
          }
        }
      },
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "variable",
        resource: "/agents/execute",
        description: "Execute a task across multiple AI agents",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 600,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              task: { type: "string", description: "Task to execute" },
              budget: { type: "number", description: "Maximum budget in smallest unit" },
              token: { type: "string", enum: ["STX", "sBTC", "USDh"] },
              preferredAgents: { type: "array", items: { type: "string" } },
              timeout: { type: "number" }
            },
            required: ["task", "budget", "token"]
          },
          output: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              result: { type: "object" },
              agentsUsed: { type: "array" },
              totalCost: { type: "number" }
            }
          }
        }
      },
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "variable",
        resource: "/agents/chain",
        description: "Chain multiple agents in sequence",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 900,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    agentId: { type: "string" },
                    action: { type: "string" },
                    inputFrom: { type: "string" }
                  }
                }
              },
              budget: { type: "number" },
              token: { type: "string" }
            },
            required: ["steps"]
          },
          output: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              chain: { type: "array" },
              results: { type: "array" },
              totalCost: { type: "number" }
            }
          }
        }
      },
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "50000",
        resource: "/payments/subscribe",
        description: "Subscribe to an endpoint for discounted bulk access",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 300,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              subscriber: { type: "string", description: "Stacks address" },
              endpointId: { type: "string" },
              plan: { type: "string", enum: ["basic", "pro", "unlimited"] },
              token: { type: "string" }
            },
            required: ["subscriber", "endpointId", "plan"]
          },
          output: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              subscription: { type: "object" }
            }
          }
        }
      }
    ]
  });
});
app.get("/stats", async (c) => {
  const countResult = await c.env.DB.prepare("SELECT COUNT(*) as total FROM endpoints").first();
  const callsResult = await c.env.DB.prepare("SELECT SUM(calls_24h) as calls FROM endpoints").first();
  const categories = await c.env.DB.prepare("SELECT DISTINCT category FROM endpoints").all();
  return c.json({
    totalEndpoints: countResult?.total || 0,
    totalAgents: agentRegistry.size,
    totalCalls24h: callsResult?.calls || 0,
    totalVolume24h: "0",
    topCategories: (categories.results || []).map((c2) => c2.category),
    featuredEndpoints: []
  });
});
app.route("/registry", registry);
app.route("/agents", agents);
app.route("/payments", payments);
app.route("/analytics", analytics);
app.route("/dev", dev);
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
