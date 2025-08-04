import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};import { tmpdir } from 'node:os';
import { Server } from 'node:http';
import path, { resolve, dirname, join } from 'node:path';
import nodeCrypto from 'node:crypto';
import { parentPort, threadId } from 'node:worker_threads';
import { defineEventHandler, handleCacheHeaders, splitCookiesString, createEvent, fetchWithEvent, isEvent, eventHandler, setHeaders, sendRedirect, proxyRequest, getRequestHeader, setResponseHeaders, setResponseStatus, send, getRequestHeaders, setResponseHeader, appendResponseHeader, getRequestURL, getResponseHeader, removeResponseHeader, createError, getResponseStatus, getQuery as getQuery$1, readBody, createApp, createRouter as createRouter$1, toNodeListener, lazyEventHandler, getRouterParam, assertMethod, getHeaders, setCookie, getCookie, getHeader, getMethod, getResponseStatusText } from 'file://D:/qaq/node_modules/h3/dist/index.mjs';
import { escapeHtml } from 'file://D:/qaq/node_modules/@vue/shared/dist/shared.cjs.js';
import { PrismaClient } from 'file://D:/qaq/node_modules/@prisma/client/default.js';
import fs, { readFile } from 'node:fs/promises';
import bcrypt from 'file://D:/qaq/node_modules/bcryptjs/index.js';
import { jwtVerify, SignJWT } from 'file://D:/qaq/node_modules/jose/dist/webapi/index.js';
import { createRenderer, getRequestDependencies, getPreloadLinks, getPrefetchLinks } from 'file://D:/qaq/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import { parseURL, withoutBase, joinURL, getQuery, withQuery, withTrailingSlash, decodePath, withLeadingSlash, withoutTrailingSlash, joinRelativeURL } from 'file://D:/qaq/node_modules/ufo/dist/index.mjs';
import { renderToString } from 'file://D:/qaq/node_modules/vue/server-renderer/index.mjs';
import { klona } from 'file://D:/qaq/node_modules/klona/dist/index.mjs';
import defu, { defuFn } from 'file://D:/qaq/node_modules/defu/dist/defu.mjs';
import destr, { destr as destr$1 } from 'file://D:/qaq/node_modules/destr/dist/index.mjs';
import { snakeCase } from 'file://D:/qaq/node_modules/scule/dist/index.mjs';
import { createHead as createHead$1, propsToString, renderSSRHead } from 'file://D:/qaq/node_modules/unhead/dist/server.mjs';
import { stringify, uneval } from 'file://D:/qaq/node_modules/devalue/index.js';
import { isVNode, toValue, isRef } from 'file://D:/qaq/node_modules/vue/index.mjs';
import { DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin } from 'file://D:/qaq/node_modules/unhead/dist/plugins.mjs';
import { createHooks } from 'file://D:/qaq/node_modules/hookable/dist/index.mjs';
import { createFetch, Headers as Headers$1 } from 'file://D:/qaq/node_modules/ofetch/dist/node.mjs';
import { fetchNodeRequestHandler, callNodeRequestHandler } from 'file://D:/qaq/node_modules/node-mock-http/dist/index.mjs';
import { createStorage, prefixStorage } from 'file://D:/qaq/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file://D:/qaq/node_modules/unstorage/drivers/fs.mjs';
import { digest, hash as hash$1 } from 'file://D:/qaq/node_modules/ohash/dist/index.mjs';
import { toRouteMatcher, createRouter } from 'file://D:/qaq/node_modules/radix3/dist/index.mjs';
import consola, { consola as consola$1 } from 'file://D:/qaq/node_modules/consola/dist/index.mjs';
import { ErrorParser } from 'file://D:/qaq/node_modules/youch-core/build/index.js';
import { Youch } from 'file://D:/qaq/node_modules/youch/build/index.js';
import { SourceMapConsumer } from 'file://D:/qaq/node_modules/nitropack/node_modules/source-map/source-map.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext } from 'file://D:/qaq/node_modules/unctx/dist/index.mjs';
import { captureRawStackTrace, parseRawStackTrace } from 'file://D:/qaq/node_modules/errx/dist/index.js';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname as dirname$1, resolve as resolve$1, basename } from 'file://D:/qaq/node_modules/pathe/dist/index.mjs';
import { getIcons } from 'file://D:/qaq/node_modules/@iconify/utils/lib/index.mjs';
import { collections } from 'file://D:/qaq/.nuxt/nuxt-icon-server-bundle.mjs';
import { walkResolver } from 'file://D:/qaq/node_modules/unhead/dist/utils.mjs';

const serverAssets = [{"baseName":"server","dir":"D:/qaq/server/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('root', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"D:/qaq","watchOptions":{"ignored":[null]}}));
storage.mount('src', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"D:/qaq/server","watchOptions":{"ignored":[null]}}));
storage.mount('build', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"D:/qaq/.nuxt"}));
storage.mount('cache', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"D:/qaq/.nuxt/cache"}));
storage.mount('data', unstorage_47drivers_47fs({"driver":"fs","base":"D:/qaq/.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const defineAppConfig = (config) => config;

const appConfig0 = defineAppConfig({
  ui: {
    primary: "green",
    gray: "neutral",
    // 覆盖组件样式
    button: {
      rounded: "rounded-none",
      default: {
        variant: "ghost"
      }
    },
    input: {
      rounded: "rounded-none"
    },
    card: {
      rounded: "rounded-none"
    },
    modal: {
      rounded: "rounded-none"
    },
    dropdown: {
      rounded: "rounded-none"
    },
    select: {
      rounded: "rounded-none"
    },
    toggle: {
      rounded: "rounded-none"
    }
  }
});

const inlineAppConfig = {
  "nuxt": {},
  "icon": {
    "provider": "iconify",
    "class": "",
    "aliases": {},
    "iconifyApiEndpoint": "https://api.iconify.design",
    "localApiEndpoint": "/api/_nuxt_icon",
    "fallbackToApi": true,
    "cssSelectorPrefix": "i-",
    "cssWherePseudo": true,
    "mode": "css",
    "attrs": {
      "aria-hidden": true
    },
    "collections": [
      "academicons",
      "akar-icons",
      "ant-design",
      "arcticons",
      "basil",
      "bi",
      "bitcoin-icons",
      "bpmn",
      "brandico",
      "bx",
      "bxl",
      "bxs",
      "bytesize",
      "carbon",
      "catppuccin",
      "cbi",
      "charm",
      "ci",
      "cib",
      "cif",
      "cil",
      "circle-flags",
      "circum",
      "clarity",
      "codicon",
      "covid",
      "cryptocurrency",
      "cryptocurrency-color",
      "dashicons",
      "devicon",
      "devicon-plain",
      "ei",
      "el",
      "emojione",
      "emojione-monotone",
      "emojione-v1",
      "entypo",
      "entypo-social",
      "eos-icons",
      "ep",
      "et",
      "eva",
      "f7",
      "fa",
      "fa-brands",
      "fa-regular",
      "fa-solid",
      "fa6-brands",
      "fa6-regular",
      "fa6-solid",
      "fad",
      "fe",
      "feather",
      "file-icons",
      "flag",
      "flagpack",
      "flat-color-icons",
      "flat-ui",
      "flowbite",
      "fluent",
      "fluent-emoji",
      "fluent-emoji-flat",
      "fluent-emoji-high-contrast",
      "fluent-mdl2",
      "fontelico",
      "fontisto",
      "formkit",
      "foundation",
      "fxemoji",
      "gala",
      "game-icons",
      "geo",
      "gg",
      "gis",
      "gravity-ui",
      "gridicons",
      "grommet-icons",
      "guidance",
      "healthicons",
      "heroicons",
      "heroicons-outline",
      "heroicons-solid",
      "hugeicons",
      "humbleicons",
      "ic",
      "icomoon-free",
      "icon-park",
      "icon-park-outline",
      "icon-park-solid",
      "icon-park-twotone",
      "iconamoon",
      "iconoir",
      "icons8",
      "il",
      "ion",
      "iwwa",
      "jam",
      "la",
      "lets-icons",
      "line-md",
      "logos",
      "ls",
      "lucide",
      "lucide-lab",
      "mage",
      "majesticons",
      "maki",
      "map",
      "marketeq",
      "material-symbols",
      "material-symbols-light",
      "mdi",
      "mdi-light",
      "medical-icon",
      "memory",
      "meteocons",
      "mi",
      "mingcute",
      "mono-icons",
      "mynaui",
      "nimbus",
      "nonicons",
      "noto",
      "noto-v1",
      "octicon",
      "oi",
      "ooui",
      "openmoji",
      "oui",
      "pajamas",
      "pepicons",
      "pepicons-pencil",
      "pepicons-pop",
      "pepicons-print",
      "ph",
      "pixelarticons",
      "prime",
      "ps",
      "quill",
      "radix-icons",
      "raphael",
      "ri",
      "rivet-icons",
      "si-glyph",
      "simple-icons",
      "simple-line-icons",
      "skill-icons",
      "solar",
      "streamline",
      "streamline-emojis",
      "subway",
      "svg-spinners",
      "system-uicons",
      "tabler",
      "tdesign",
      "teenyicons",
      "token",
      "token-branded",
      "topcoat",
      "twemoji",
      "typcn",
      "uil",
      "uim",
      "uis",
      "uit",
      "uiw",
      "unjs",
      "vaadin",
      "vs",
      "vscode-icons",
      "websymbol",
      "weui",
      "whh",
      "wi",
      "wpf",
      "zmdi",
      "zondicons"
    ],
    "fetchTimeout": 1500
  },
  "ui": {
    "primary": "green",
    "gray": "cool",
    "colors": [
      "red",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
      "rose",
      "primary"
    ],
    "strategy": "merge"
  }
};

const appConfig = defuFn(appConfig0, inlineAppConfig);

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "dev",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      }
    }
  },
  "public": {
    "isDev": true
  },
  "icon": {
    "serverKnownCssClasses": []
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
const _sharedAppConfig = _deepFreeze(klona(appConfig));
function useAppConfig(event) {
  {
    return _sharedAppConfig;
  }
}
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
  if (event.handled || isJsonRequest(event)) {
    return;
  }
  const defaultRes = await defaultHandler(error, event, { json: true });
  const statusCode = error.statusCode || 500;
  if (statusCode === 404 && defaultRes.status === 302) {
    setResponseHeaders(event, defaultRes.headers);
    setResponseStatus(event, defaultRes.status, defaultRes.statusText);
    return send(event, JSON.stringify(defaultRes.body, null, 2));
  }
  if (typeof defaultRes.body !== "string" && Array.isArray(defaultRes.body.stack)) {
    defaultRes.body.stack = defaultRes.body.stack.join("\n");
  }
  const errorObject = defaultRes.body;
  const url = new URL(errorObject.url);
  errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
  errorObject.message ||= "Server Error";
  errorObject.data ||= error.data;
  errorObject.statusMessage ||= error.statusMessage;
  delete defaultRes.headers["content-type"];
  delete defaultRes.headers["content-security-policy"];
  setResponseHeaders(event, defaultRes.headers);
  const reqHeaders = getRequestHeaders(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (event.handled) {
    return;
  }
  if (!res) {
    const { template } = await Promise.resolve().then(function () { return errorDev; }) ;
    {
      errorObject.description = errorObject.message;
    }
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  for (const [header, value] of res.headers.entries()) {
    if (header === "set-cookie") {
      appendResponseHeader(event, header, value);
      continue;
    }
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
  return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  async function defaultNitroErrorHandler(error, event) {
    const res = await defaultHandler(error, event);
    if (!event.node?.res.headersSent) {
      setResponseHeaders(event, res.headers);
    }
    setResponseStatus(event, res.status, res.statusText);
    return send(
      event,
      typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2)
    );
  }
);
async function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  await loadStackTrace(error).catch(consola.error);
  const youch = new Youch();
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    const ansiError = await (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
    consola.error(
      `[request error] ${tags} [${event.method}] ${url}

`,
      ansiError
    );
  }
  const useJSON = opts?.json || !getRequestHeader(event, "accept")?.includes("text/html");
  const headers = {
    "content-type": useJSON ? "application/json" : "text/html",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';"
  };
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = useJSON ? {
    error: true,
    url,
    statusCode,
    statusMessage,
    message: error.message,
    data: error.data,
    stack: error.stack?.split("\n").map((line) => line.trim())
  } : await youch.toHTML(error, {
    request: {
      url: url.href,
      method: event.method,
      headers: getRequestHeaders(event)
    }
  });
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}
async function loadStackTrace(error) {
  if (!(error instanceof Error)) {
    return;
  }
  const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
  const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
  Object.defineProperty(error, "stack", { value: stack });
  if (error.cause) {
    await loadStackTrace(error.cause).catch(consola.error);
  }
}
async function sourceLoader(frame) {
  if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") {
    return;
  }
  if (frame.type === "app") {
    const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {
    });
    if (rawSourceMap) {
      const consumer = await new SourceMapConsumer(rawSourceMap);
      const originalPosition = consumer.originalPositionFor({ line: frame.lineNumber, column: frame.columnNumber });
      if (originalPosition.source && originalPosition.line) {
        frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
        frame.lineNumber = originalPosition.line;
        frame.columnNumber = originalPosition.column || 0;
      }
    }
  }
  const contents = await readFile(frame.fileName, "utf8").catch(() => {
  });
  return contents ? { contents } : void 0;
}
function fmtFrame(frame) {
  if (frame.type === "native") {
    return frame.raw;
  }
  const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
  return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const script$1 = `
if (!window.__NUXT_DEVTOOLS_TIME_METRIC__) {
  Object.defineProperty(window, '__NUXT_DEVTOOLS_TIME_METRIC__', {
    value: {},
    enumerable: false,
    configurable: true,
  })
}
window.__NUXT_DEVTOOLS_TIME_METRIC__.appInit = Date.now()
`;

const _cyMY6HTD9rsjRj1uUebckEJ1E7xjlxf9zpeq8v2ikDg = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script$1}<\/script>`);
  });
});

const rootDir = "D:/qaq";

const appHead = {"meta":[{"name":"viewport","content":"width=device-width, initial-scale=1"},{"charset":"utf-8"}],"link":[],"style":[],"script":[],"noscript":[]};

const appRootTag = "div";

const appRootAttrs = {"id":"__nuxt"};

const appTeleportTag = "div";

const appTeleportAttrs = {"id":"teleports"};

const appId = "nuxt-app";

const devReducers = {
  VNode: (data) => isVNode(data) ? { type: data.type, props: data.props } : void 0,
  URL: (data) => data instanceof URL ? data.toString() : void 0
};
const asyncContext = getContext("nuxt-dev", { asyncContext: true, AsyncLocalStorage });
const _hI5UQpYgeWsDCAnNWVsyR29IBjETealzSWR7S7_hMw = (nitroApp) => {
  const handler = nitroApp.h3App.handler;
  nitroApp.h3App.handler = (event) => {
    return asyncContext.callAsync({ logs: [], event }, () => handler(event));
  };
  onConsoleLog((_log) => {
    const ctx = asyncContext.tryUse();
    if (!ctx) {
      return;
    }
    const rawStack = captureRawStackTrace();
    if (!rawStack || rawStack.includes("runtime/vite-node.mjs")) {
      return;
    }
    const trace = [];
    let filename = "";
    for (const entry of parseRawStackTrace(rawStack)) {
      if (entry.source === globalThis._importMeta_.url) {
        continue;
      }
      if (EXCLUDE_TRACE_RE.test(entry.source)) {
        continue;
      }
      filename ||= entry.source.replace(withTrailingSlash(rootDir), "");
      trace.push({
        ...entry,
        source: entry.source.startsWith("file://") ? entry.source.replace("file://", "") : entry.source
      });
    }
    const log = {
      ..._log,
      // Pass along filename to allow the client to display more info about where log comes from
      filename,
      // Clean up file names in stack trace
      stack: trace
    };
    ctx.logs.push(log);
  });
  nitroApp.hooks.hook("afterResponse", () => {
    const ctx = asyncContext.tryUse();
    if (!ctx) {
      return;
    }
    return nitroApp.hooks.callHook("dev:ssr-logs", { logs: ctx.logs, path: ctx.event.path });
  });
  nitroApp.hooks.hook("render:html", (htmlContext) => {
    const ctx = asyncContext.tryUse();
    if (!ctx) {
      return;
    }
    try {
      const reducers = Object.assign(/* @__PURE__ */ Object.create(null), devReducers, ctx.event.context._payloadReducers);
      htmlContext.bodyAppend.unshift(`<script type="application/json" data-nuxt-logs="${appId}">${stringify(ctx.logs, reducers)}<\/script>`);
    } catch (e) {
      const shortError = e instanceof Error && "toString" in e ? ` Received \`${e.toString()}\`.` : "";
      console.warn(`[nuxt] Failed to stringify dev server logs.${shortError} You can define your own reducer/reviver for rich types following the instructions in https://nuxt.com/docs/api/composables/use-nuxt-app#payload.`);
    }
  });
};
const EXCLUDE_TRACE_RE = /\/node_modules\/(?:.*\/)?(?:nuxt|nuxt-nightly|nuxt-edge|nuxt3|consola|@vue)\/|core\/runtime\/nitro/;
function onConsoleLog(callback) {
  consola$1.addReporter({
    log(logObj) {
      callback(logObj);
    }
  });
  consola$1.wrapConsole();
}

const script = "\"use strict\";(()=>{const t=window,e=document.documentElement,c=[\"dark\",\"light\"],n=getStorageValue(\"localStorage\",\"nuxt-color-mode\")||\"dark\";let i=n===\"system\"?u():n;const r=e.getAttribute(\"data-color-mode-forced\");r&&(i=r),l(i),t[\"__NUXT_COLOR_MODE__\"]={preference:n,value:i,getColorScheme:u,addColorScheme:l,removeColorScheme:d};function l(o){const s=\"\"+o+\"\",a=\"\";e.classList?e.classList.add(s):e.className+=\" \"+s,a&&e.setAttribute(\"data-\"+a,o)}function d(o){const s=\"\"+o+\"\",a=\"\";e.classList?e.classList.remove(s):e.className=e.className.replace(new RegExp(s,\"g\"),\"\"),a&&e.removeAttribute(\"data-\"+a)}function f(o){return t.matchMedia(\"(prefers-color-scheme\"+o+\")\")}function u(){if(t.matchMedia&&f(\"\").media!==\"not all\"){for(const o of c)if(f(\":\"+o).matches)return o}return\"light\"}})();function getStorageValue(t,e){switch(t){case\"localStorage\":return window.localStorage.getItem(e);case\"sessionStorage\":return window.sessionStorage.getItem(e);case\"cookie\":return getCookie(e);default:return null}}function getCookie(t){const c=(\"; \"+window.document.cookie).split(\"; \"+t+\"=\");if(c.length===2)return c.pop()?.split(\";\").shift()}";

const _Y98gzG2HmYfPlCmslVooho2GFEyJ9T47dNbWn9Qsp4 = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script}<\/script>`);
  });
});

const plugins = [
  _cyMY6HTD9rsjRj1uUebckEJ1E7xjlxf9zpeq8v2ikDg,
_hI5UQpYgeWsDCAnNWVsyR29IBjETealzSWR7S7_hMw,
_Y98gzG2HmYfPlCmslVooho2GFEyJ9T47dNbWn9Qsp4
];

const assets = {};

function readAsset (id) {
  const serverDir = dirname$1(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve$1(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _9OMHdf = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError({ statusCode: 404 });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const scheduledTasks = false;

const tasks = {
  
};

const __runningTasks__ = {};
async function runTask(name, {
  payload = {},
  context = {}
} = {}) {
  if (__runningTasks__[name]) {
    return __runningTasks__[name];
  }
  if (!(name in tasks)) {
    throw createError({
      message: `Task \`${name}\` is not available!`,
      statusCode: 404
    });
  }
  if (!tasks[name].resolve) {
    throw createError({
      message: `Task \`${name}\` is not implemented!`,
      statusCode: 501
    });
  }
  const handler = await tasks[name].resolve();
  const taskEvent = { name, payload, context };
  __runningTasks__[name] = handler.run(taskEvent);
  try {
    const res = await __runningTasks__[name];
    return res;
  } finally {
    delete __runningTasks__[name];
  }
}

function buildAssetsDir() {
  return useRuntimeConfig().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
  return joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
  const app = useRuntimeConfig().app;
  const publicBase = app.cdnURL || app.baseURL;
  return path.length ? joinRelativeURL(publicBase, ...path) : publicBase;
}

class MockPrismaClient {
  constructor() {
    console.log("\u{1F527} \u4F7F\u7528\u6A21\u62DF Prisma Client");
  }
  async $disconnect() {
    return Promise.resolve();
  }
  // 模拟各种数据模型
  user = {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  };
  project = {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  };
  scene = {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  };
}
async function loadPrismaClient() {
  try {
    const prismaModule = await import('file://D:/qaq/node_modules/@prisma/client/default.js');
    let PrismaClientClass;
    if (prismaModule.default) {
      if (typeof prismaModule.default === "function") {
        PrismaClientClass = prismaModule.default;
      } else if (prismaModule.default.PrismaClient) {
        PrismaClientClass = prismaModule.default.PrismaClient;
      }
    } else if (prismaModule.PrismaClient) {
      PrismaClientClass = prismaModule.PrismaClient;
    }
    if (!PrismaClientClass) {
      console.warn("\u26A0\uFE0F \u65E0\u6CD5\u89E3\u6790 Prisma Client\uFF0C\u4F7F\u7528\u6A21\u62DF\u5BA2\u6237\u7AEF");
      return MockPrismaClient;
    }
    return PrismaClientClass;
  } catch (error) {
    console.warn("\u26A0\uFE0F Prisma Client \u5BFC\u5165\u5931\u8D25\uFF0C\u4F7F\u7528\u6A21\u62DF\u5BA2\u6237\u7AEF:", error.message);
    return MockPrismaClient;
  }
}
const mockPath = {
  join: (...args) => args.join("/"),
  dirname: (p) => p.split("/").slice(0, -1).join("/"),
  normalize: (p) => p.replace(/\\/g, "/")
};
const mockFs = {
  existsSync: () => false,
  mkdirSync: () => {
  },
  default: {
    existsSync: () => false,
    mkdirSync: () => {
    }
  }
};
async function loadPath() {
  try {
    return (await import('node:path')).default;
  } catch (error) {
    return mockPath;
  }
}
async function loadFs() {
  try {
    return await import('node:fs');
  } catch (error) {
    return mockFs;
  }
}
class PrismaManager {
  /** 单例实例 */
  static instance;
  /** 存储各项目的数据库客户端 */
  clients = /* @__PURE__ */ new Map();
  /** 当前活动的项目ID */
  currentProjectId = null;
  /** 缓存的模块 */
  PrismaClientClass = null;
  pathModule = null;
  fsModule = null;
  /**
   * 初始化所需的模块
   */
  async initializeModules() {
    if (!this.PrismaClientClass) {
      this.PrismaClientClass = await loadPrismaClient();
    }
    if (!this.pathModule) {
      this.pathModule = await loadPath();
    }
    if (!this.fsModule) {
      this.fsModule = await loadFs();
    }
  }
  /**
   * 私有构造函数，确保单例模式
   */
  constructor() {
  }
  /**
   * 获取单例实例
   * @returns PrismaManager实例
   */
  static getInstance() {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }
  /**
   * 获取指定项目的数据库客户端
   * 如果客户端不存在，会自动创建新的连接
   * 只能在服务端使用
   *
   * @param projectPath 项目路径
   * @returns Promise<any> 数据库客户端实例
   */
  async getProjectClient(projectPath) {
    await this.initializeModules();
    const projectId = this.generateProjectId(projectPath);
    if (this.clients.has(projectId)) {
      return this.clients.get(projectId);
    }
    const dbPath = this.getProjectDatabasePath(projectPath);
    const dbDir = this.pathModule.dirname(dbPath);
    if (!this.fsModule.existsSync(dbDir)) {
      this.fsModule.mkdirSync(dbDir, { recursive: true });
      console.log(`\u{1F4C1} \u521B\u5EFA\u6570\u636E\u5E93\u76EE\u5F55: ${dbDir}`);
    }
    const client = new this.PrismaClientClass({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      },
      log: ["error", "warn"]
      // 只记录错误和警告日志
    });
    this.clients.set(projectId, client);
    await this.ensureDatabaseSchema(client, projectPath);
    console.log(`\u2705 \u6570\u636E\u5E93\u5BA2\u6237\u7AEF\u5DF2\u521B\u5EFA: ${projectPath}`);
    return client;
  }
  /**
   * 设置当前活动的项目
   *
   * @param projectPath 项目路径
   */
  setCurrentProject(projectPath) {
    this.currentProjectId = this.generateProjectId(projectPath);
    console.log(`\u{1F3AF} \u8BBE\u7F6E\u5F53\u524D\u9879\u76EE: ${projectPath}`);
  }
  /**
   * 获取当前项目的数据库客户端
   *
   * @returns Promise<PrismaClient | null> 当前项目的数据库客户端，如果没有当前项目则返回null
   */
  async getCurrentClient() {
    if (!this.currentProjectId) {
      console.warn("\u26A0\uFE0F \u6CA1\u6709\u8BBE\u7F6E\u5F53\u524D\u9879\u76EE");
      return null;
    }
    const projectPath = this.getProjectPathFromId(this.currentProjectId);
    if (!projectPath) {
      console.error("\u274C \u65E0\u6CD5\u4ECE\u9879\u76EEID\u83B7\u53D6\u9879\u76EE\u8DEF\u5F84");
      return null;
    }
    return this.getProjectClient(projectPath);
  }
  /**
   * 关闭指定项目的数据库连接
   *
   * @param projectPath 项目路径
   */
  async closeProjectConnection(projectPath) {
    const projectId = this.generateProjectId(projectPath);
    const client = this.clients.get(projectId);
    if (client) {
      await client.$disconnect();
      this.clients.delete(projectId);
      console.log(`\u{1F50C} \u5DF2\u5173\u95ED\u6570\u636E\u5E93\u8FDE\u63A5: ${projectPath}`);
    }
  }
  /**
   * 关闭所有数据库连接
   * 通常在应用程序退出时调用
   */
  async closeAllConnections() {
    console.log("\u{1F50C} \u6B63\u5728\u5173\u95ED\u6240\u6709\u6570\u636E\u5E93\u8FDE\u63A5...");
    for (const [projectId, client] of this.clients) {
      try {
        await client.$disconnect();
        console.log(`\u2705 \u5DF2\u5173\u95ED\u8FDE\u63A5: ${projectId}`);
      } catch (error) {
        console.error(`\u274C \u5173\u95ED\u8FDE\u63A5\u5931\u8D25: ${projectId}`, error);
      }
    }
    this.clients.clear();
    this.currentProjectId = null;
    console.log("\u2705 \u6240\u6709\u6570\u636E\u5E93\u8FDE\u63A5\u5DF2\u5173\u95ED");
  }
  /**
   * 获取所有活动的数据库连接信息
   *
   * @returns 连接信息数组
   */
  getActiveConnections() {
    return Array.from(this.clients.keys()).map((projectId) => ({
      projectId,
      isActive: projectId === this.currentProjectId
    }));
  }
  // ========================================================================
  // 私有辅助方法
  // ========================================================================
  /**
   * 根据项目路径生成唯一的项目ID
   *
   * @param projectPath 项目路径
   * @returns 项目ID
   */
  generateProjectId(projectPath) {
    return projectPath.replace(/\\/g, "/").replace(/[\\\/]/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase();
  }
  /**
   * 从项目ID反推项目路径
   * 注意：这是一个简化的实现，实际项目中可能需要维护ID到路径的映射
   *
   * @param projectId 项目ID
   * @returns 项目路径或null
   */
  getProjectPathFromId(projectId) {
    return projectId.replace(/_/g, "/");
  }
  /**
   * 获取项目数据库文件的完整路径
   * 数据库文件存储在项目的.qaq目录中
   *
   * @param projectPath 项目路径
   * @returns 数据库文件路径
   */
  getProjectDatabasePath(projectPath) {
    const qaqDir = projectPath + "/.qaq";
    return qaqDir + "/project.db";
  }
  /**
   * 确保数据库schema已正确初始化
   * 如果是新数据库，会自动创建所需的表结构
   *
   * @param client Prisma客户端实例
   * @param projectPath 项目路径
   */
  async ensureDatabaseSchema(client, projectPath) {
    try {
      await client.project.findFirst();
      console.log(`\u2705 \u6570\u636E\u5E93schema\u5DF2\u5B58\u5728: ${projectPath}`);
    } catch (error) {
      console.log(`\u{1F527} \u6B63\u5728\u521D\u59CB\u5316\u6570\u636E\u5E93schema: ${projectPath}`);
      try {
        await this.pushDatabaseSchema(projectPath);
        console.log(`\u2705 \u6570\u636E\u5E93schema\u521D\u59CB\u5316\u6210\u529F: ${projectPath}`);
      } catch (pushError) {
        console.error(`\u274C \u6570\u636E\u5E93schema\u521D\u59CB\u5316\u5931\u8D25: ${projectPath}`, pushError);
        throw new Error(`\u6570\u636E\u5E93\u521D\u59CB\u5316\u5931\u8D25: ${pushError instanceof Error ? pushError.message : "\u672A\u77E5\u9519\u8BEF"}`);
      }
    }
  }
  /**
   * 推送数据库schema到指定项目
   * 使用Prisma db push命令创建表结构
   *
   * @param projectPath 项目路径
   */
  async pushDatabaseSchema(projectPath) {
    const { execSync } = await import('node:child_process');
    const dbPath = this.getProjectDatabasePath(projectPath);
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${dbPath}`;
    try {
      console.log(`\u{1F4CB} \u63A8\u9001schema\u5230\u6570\u636E\u5E93: ${dbPath}`);
      execSync("npx prisma db push --accept-data-loss", {
        stdio: "pipe",
        env: process.env,
        cwd: process.cwd()
      });
      console.log(`\u2705 Schema\u63A8\u9001\u6210\u529F: ${projectPath}`);
    } catch (error) {
      console.error(`\u274C Schema\u63A8\u9001\u5931\u8D25: ${projectPath}`, error);
      throw error;
    } finally {
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
    }
  }
}
const prismaManager = PrismaManager.getInstance();
async function getCurrentPrismaClient() {
  return prismaManager.getCurrentClient();
}
async function getProjectPrismaClient(projectPath) {
  return prismaManager.getProjectClient(projectPath);
}

class AuthService {
  /** JWT密钥 */
  jwtSecret;
  /** 访问令牌过期时间（15分钟） */
  accessTokenExpiry = 15 * 60 * 1e3;
  /** 刷新令牌过期时间（7天） */
  refreshTokenExpiry = 7 * 24 * 60 * 60 * 1e3;
  constructor() {
    const secret = process.env.JWT_SECRET || "qaq-game-engine-default-secret-key";
    this.jwtSecret = new TextEncoder().encode(secret);
  }
  /**
   * 用户注册
   *
   * @param params 注册参数
   * @returns Promise<AuthResult> 认证结果
   * @throws Error 当注册失败时抛出错误
   */
  async register(params) {
    console.log(`\u{1F464} \u5F00\u59CB\u7528\u6237\u6CE8\u518C: ${params.email}`);
    try {
      const client = await this.getGlobalClient();
      const existingUser = await client.user.findUnique({
        where: { email: params.email }
      });
      if (existingUser) {
        throw new Error("\u90AE\u7BB1\u5730\u5740\u5DF2\u88AB\u6CE8\u518C");
      }
      if (params.username) {
        const existingUsername = await client.user.findUnique({
          where: { username: params.username }
        });
        if (existingUsername) {
          throw new Error("\u7528\u6237\u540D\u5DF2\u88AB\u4F7F\u7528");
        }
      }
      const hashedPassword = await this.hashPassword(params.password);
      const user = await client.user.create({
        data: {
          email: params.email,
          password: hashedPassword,
          firstName: params.firstName,
          lastName: params.lastName,
          username: params.username,
          isVerified: false
          // 新用户默认未验证
        }
      });
      const authResult = await this.createUserSession(user.id);
      console.log(`\u2705 \u7528\u6237\u6CE8\u518C\u6210\u529F: ${user.email} (ID: ${user.id})`);
      return authResult;
    } catch (error) {
      console.error(`\u274C \u7528\u6237\u6CE8\u518C\u5931\u8D25: ${params.email}`, error);
      throw new Error(`\u6CE8\u518C\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }
  }
  /**
   * 用户登录
   *
   * @param params 登录参数
   * @returns Promise<AuthResult> 认证结果
   * @throws Error 当登录失败时抛出错误
   */
  async login(params) {
    console.log(`\u{1F510} \u5F00\u59CB\u7528\u6237\u767B\u5F55: ${params.email}`);
    try {
      const client = await this.getGlobalClient();
      const user = await client.user.findUnique({
        where: { email: params.email }
      });
      if (!user) {
        throw new Error("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      if (!user.isActive) {
        throw new Error("\u8D26\u6237\u5DF2\u88AB\u7981\u7528");
      }
      const isPasswordValid = await this.verifyPassword(params.password, user.password);
      if (!isPasswordValid) {
        throw new Error("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      await client.user.update({
        where: { id: user.id },
        data: { lastLoginAt: /* @__PURE__ */ new Date() }
      });
      const authResult = await this.createUserSession(user.id, {
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      });
      console.log(`\u2705 \u7528\u6237\u767B\u5F55\u6210\u529F: ${user.email}`);
      return authResult;
    } catch (error) {
      console.error(`\u274C \u7528\u6237\u767B\u5F55\u5931\u8D25: ${params.email}`, error);
      throw new Error(`\u767B\u5F55\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }
  }
  /**
   * 验证访问令牌
   *
   * @param token 访问令牌
   * @returns Promise<User | null> 用户信息或null
   */
  async verifyAccessToken(token) {
    try {
      console.log("\u{1F50D} \u5F00\u59CB\u9A8C\u8BC1\u8BBF\u95EE\u4EE4\u724C...");
      console.log("\u{1F511} Token\u957F\u5EA6:", token?.length || 0);
      console.log("\u{1F511} Token\u524D\u7F00:", token?.substring(0, 20) + "...");
      if (!token) {
        console.log("\u274C Token\u4E3A\u7A7A");
        return null;
      }
      console.log("\u{1F510} \u9A8C\u8BC1JWT\u7B7E\u540D...");
      const { payload } = await jwtVerify(token, this.jwtSecret);
      const jwtPayload = payload;
      console.log("\u2705 JWT\u7B7E\u540D\u9A8C\u8BC1\u6210\u529F");
      console.log("\u{1F4CB} JWT\u8F7D\u8377:", {
        sessionId: jwtPayload.sessionId,
        userId: jwtPayload.userId,
        exp: jwtPayload.exp,
        iat: jwtPayload.iat
      });
      const client = await this.getGlobalClient();
      console.log("\u2705 \u6570\u636E\u5E93\u8FDE\u63A5\u83B7\u53D6\u6210\u529F");
      console.log("\u{1F50D} \u67E5\u627E\u7528\u6237\u4F1A\u8BDD...");
      const session = await client.userSession.findUnique({
        where: {
          id: jwtPayload.sessionId,
          token
        },
        include: { user: true }
      });
      if (!session) {
        console.log("\u274C \u4F1A\u8BDD\u4E0D\u5B58\u5728");
        return null;
      }
      console.log("\u2705 \u4F1A\u8BDD\u627E\u5230:", {
        sessionId: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        isExpired: session.expiresAt < /* @__PURE__ */ new Date()
      });
      if (session.expiresAt < /* @__PURE__ */ new Date()) {
        console.log("\u274C \u4F1A\u8BDD\u5DF2\u8FC7\u671F");
        return null;
      }
      const { password, ...userWithoutPassword } = session.user;
      console.log("\u2705 \u7528\u6237\u9A8C\u8BC1\u6210\u529F:", {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        isActive: userWithoutPassword.isActive
      });
      return userWithoutPassword;
    } catch (error) {
      console.error("\u274C \u4EE4\u724C\u9A8C\u8BC1\u5931\u8D25:", error);
      console.error("\u274C \u9519\u8BEF\u8BE6\u60C5:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return null;
    }
  }
  /**
   * 刷新访问令牌
   *
   * @param refreshToken 刷新令牌
   * @returns Promise<AuthResult | null> 新的认证结果或null
   */
  async refreshAccessToken(refreshToken) {
    try {
      const client = await this.getGlobalClient();
      const session = await client.userSession.findUnique({
        where: { refreshToken },
        include: { user: true }
      });
      if (!session || session.expiresAt < /* @__PURE__ */ new Date()) {
        return null;
      }
      const newExpiresAt = new Date(Date.now() + this.accessTokenExpiry);
      const newAccessToken = await this.generateAccessToken(session.user.id, session.id);
      await client.userSession.update({
        where: { id: session.id },
        data: {
          token: newAccessToken,
          expiresAt: newExpiresAt,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      const { password, ...userWithoutPassword } = session.user;
      return {
        user: userWithoutPassword,
        accessToken: newAccessToken,
        refreshToken: session.refreshToken,
        expiresAt: newExpiresAt
      };
    } catch (error) {
      console.error("\u274C \u4EE4\u724C\u5237\u65B0\u5931\u8D25:", error);
      return null;
    }
  }
  /**
   * 用户登出
   *
   * @param token 访问令牌
   * @returns Promise<boolean> 登出是否成功
   */
  async logout(token) {
    try {
      const client = await this.getGlobalClient();
      const result = await client.userSession.deleteMany({
        where: { token }
      });
      console.log(`\u{1F6AA} \u7528\u6237\u767B\u51FA\u6210\u529F`);
      return result.count > 0;
    } catch (error) {
      console.error("\u274C \u7528\u6237\u767B\u51FA\u5931\u8D25:", error);
      return false;
    }
  }
  /**
   * 获取用户信息
   *
   * @param userId 用户ID
   * @returns Promise<User | null> 用户信息（不包含密码）
   */
  async getUserById(userId) {
    try {
      const client = await this.getGlobalClient();
      const user = await client.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        return null;
      }
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error("\u274C \u83B7\u53D6\u7528\u6237\u4FE1\u606F\u5931\u8D25:", error);
      return null;
    }
  }
  // ========================================================================
  // 私有辅助方法
  // ========================================================================
  /**
   * 获取全局数据库客户端
   * 用户数据存储在全局数据库中，而不是项目特定的数据库
   * 只能在服务端使用
   */
  async getGlobalClient() {
    const globalDbPath = process.env.GLOBAL_DB_PATH || "./global";
    return prismaManager.getProjectClient(globalDbPath);
  }
  /**
   * 加密密码
   *
   * @param password 明文密码
   * @returns Promise<string> 加密后的密码
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  /**
   * 验证密码
   *
   * @param password 明文密码
   * @param hashedPassword 加密后的密码
   * @returns Promise<boolean> 密码是否正确
   */
  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
  /**
   * 生成访问令牌
   *
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @returns Promise<string> 访问令牌
   */
  async generateAccessToken(userId, sessionId) {
    const client = await this.getGlobalClient();
    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const now = Math.floor(Date.now() / 1e3);
    const exp = now + Math.floor(this.accessTokenExpiry / 1e3);
    return new SignJWT({
      userId,
      email: user.email,
      sessionId,
      iat: now,
      exp
    }).setProtectedHeader({ alg: "HS256" }).sign(this.jwtSecret);
  }
  /**
   * 生成简单刷新令牌（用于数据库存储）
   *
   * @returns string 刷新令牌
   */
  generateSimpleRefreshToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  /**
   * 创建用户会话
   *
   * @param userId 用户ID
   * @param metadata 会话元数据
   * @returns Promise<AuthResult> 认证结果
   */
  async createUserSession(userId, metadata) {
    const client = await this.getGlobalClient();
    const user = await client.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const refreshToken = this.generateSimpleRefreshToken();
    console.log("\u{1F511} \u751F\u6210\u7684refreshToken\u7C7B\u578B:", typeof refreshToken, "\u503C:", refreshToken);
    const expiresAt = new Date(Date.now() + this.accessTokenExpiry);
    const session = await client.userSession.create({
      data: {
        userId,
        token: "",
        // 临时占位符，稍后更新
        refreshToken,
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      }
    });
    const accessToken = await this.generateAccessToken(userId, session.id);
    await client.userSession.update({
      where: { id: session.id },
      data: { token: accessToken }
    });
    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresAt
    };
  }
  /**
   * 生成JWT刷新令牌
   *
   * @param user 用户信息
   * @returns Promise<string> 刷新令牌
   */
  async generateJWTRefreshToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      type: "refresh",
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60
      // 30天
    };
    return jwt.sign(payload, this.jwtSecret);
  }
  /**
   * 验证刷新令牌
   *
   * @param refreshToken 刷新令牌
   * @returns Promise<any> 解码后的令牌数据
   */
  async verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret);
      if (decoded.type !== "refresh") {
        throw new Error("\u65E0\u6548\u7684\u4EE4\u724C\u7C7B\u578B");
      }
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1e3)) {
        throw new Error("\u5237\u65B0\u4EE4\u724C\u5DF2\u8FC7\u671F");
      }
      return decoded;
    } catch (error) {
      console.error("\u5237\u65B0\u4EE4\u724C\u9A8C\u8BC1\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 生成JWT访问令牌
   *
   * @param user 用户信息
   * @returns Promise<string> 访问令牌
   */
  async generateJWTAccessToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: "access",
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + this.accessTokenExpiry
    };
    return jwt.sign(payload, this.jwtSecret);
  }
}
const authService$6 = new AuthService();

const AuthService$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  AuthService: AuthService,
  authService: authService$6
}, Symbol.toStringTag, { value: 'Module' }));

async function getPrismaClient() {
  try {
    const currentClient = await getCurrentPrismaClient();
    if (currentClient) {
      return currentClient;
    }
    const defaultProjectPath = process.cwd();
    return await getProjectPrismaClient(defaultProjectPath);
  } catch (error) {
    console.error("\u274C \u83B7\u53D6Prisma\u5BA2\u6237\u7AEF\u5931\u8D25:", error);
    throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
  }
}
async function getAuthService$2() {
  return new AuthService();
}

const warnOnceSet = /* @__PURE__ */ new Set();
const DEFAULT_ENDPOINT = "https://api.iconify.design";
const _tHKnoS = defineCachedEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!url)
    return createError({ status: 400, message: "Invalid icon request" });
  const options = useAppConfig().icon;
  const collectionName = event.context.params?.collection?.replace(/\.json$/, "");
  const collection = collectionName ? await collections[collectionName]?.() : null;
  const apiEndPoint = options.iconifyApiEndpoint || DEFAULT_ENDPOINT;
  const icons = url.searchParams.get("icons")?.split(",");
  if (collection) {
    if (icons?.length) {
      const data = getIcons(
        collection,
        icons
      );
      consola$1.debug(`[Icon] serving ${(icons || []).map((i) => "`" + collectionName + ":" + i + "`").join(",")} from bundled collection`);
      return data;
    }
  } else {
    if (collectionName && !warnOnceSet.has(collectionName) && apiEndPoint === DEFAULT_ENDPOINT) {
      consola$1.warn([
        `[Icon] Collection \`${collectionName}\` is not found locally`,
        `We suggest to install it via \`npm i -D @iconify-json/${collectionName}\` to provide the best end-user experience.`
      ].join("\n"));
      warnOnceSet.add(collectionName);
    }
  }
  if (options.fallbackToApi === true || options.fallbackToApi === "server-only") {
    const apiUrl = new URL("./" + basename(url.pathname) + url.search, apiEndPoint);
    consola$1.debug(`[Icon] fetching ${(icons || []).map((i) => "`" + collectionName + ":" + i + "`").join(",")} from iconify api`);
    if (apiUrl.host !== new URL(apiEndPoint).host) {
      return createError({ status: 400, message: "Invalid icon request" });
    }
    try {
      const data = await $fetch(apiUrl.href);
      return data;
    } catch (e) {
      consola$1.error(e);
      if (e.status === 404)
        return createError({ status: 404 });
      else
        return createError({ status: 500, message: "Failed to fetch fallback icon" });
    }
  }
  return createError({ status: 404 });
}, {
  group: "nuxt",
  name: "icon",
  getKey(event) {
    const collection = event.context.params?.collection?.replace(/\.json$/, "") || "unknown";
    const icons = String(getQuery$1(event).icons || "");
    return `${collection}_${icons.split(",")[0]}_${icons.length}_${hash$1(icons)}`;
  },
  swr: true,
  maxAge: 60 * 60 * 24 * 7
  // 1 week
});

const VueResolver = (_, value) => {
  return isRef(value) ? toValue(value) : value;
};

const headSymbol = "usehead";
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}

function resolveUnrefHeadInput(input) {
  return walkResolver(input, VueResolver);
}

function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

const unheadOptions = {
  disableDefaults: true,
  disableCapoSorting: false,
  plugins: [DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin],
};

function createSSRContext(event) {
  const ssrContext = {
    url: event.path,
    event,
    runtimeConfig: useRuntimeConfig(event),
    noSSR: true,
    head: createHead(unheadOptions),
    error: false,
    nuxt: void 0,
    /* NuxtApp */
    payload: {},
    _payloadReducers: /* @__PURE__ */ Object.create(null),
    modules: /* @__PURE__ */ new Set()
  };
  return ssrContext;
}
function setSSRError(ssrContext, error) {
  ssrContext.error = true;
  ssrContext.payload = { error };
  ssrContext.url = error.url;
}

const APP_ROOT_OPEN_TAG = `<${appRootTag}${propsToString(appRootAttrs)}>`;
const APP_ROOT_CLOSE_TAG = `</${appRootTag}>`;
const getServerEntry = () => Promise.resolve().then(function () { return server$1; }).then((r) => r.default || r);
const getClientManifest = () => import('file://D:/qaq/.nuxt//dist/server/client.manifest.mjs').then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);
const getSSRRenderer = lazyCachedFunction(async () => {
  const manifest = await getClientManifest();
  if (!manifest) {
    throw new Error("client.manifest is not available");
  }
  const createSSRApp = await getServerEntry();
  if (!createSSRApp) {
    throw new Error("Server bundle is not available");
  }
  const options = {
    manifest,
    renderToString: renderToString$1,
    buildAssetsURL
  };
  const renderer = createRenderer(createSSRApp, options);
  async function renderToString$1(input, context) {
    const html = await renderToString(input, context);
    if (process.env.NUXT_VITE_NODE_OPTIONS) {
      renderer.rendererContext.updateManifest(await getClientManifest());
    }
    return APP_ROOT_OPEN_TAG + html + APP_ROOT_CLOSE_TAG;
  }
  return renderer;
});
const getSPARenderer = lazyCachedFunction(async () => {
  const manifest = await getClientManifest();
  const spaTemplate = await Promise.resolve().then(function () { return _virtual__spaTemplate; }).then((r) => r.template).catch(() => "").then((r) => {
    {
      return APP_ROOT_OPEN_TAG + r + APP_ROOT_CLOSE_TAG;
    }
  });
  const options = {
    manifest,
    renderToString: () => spaTemplate,
    buildAssetsURL
  };
  const renderer = createRenderer(() => () => {
  }, options);
  const result = await renderer.renderToString({});
  const renderToString = (ssrContext) => {
    const config = useRuntimeConfig(ssrContext.event);
    ssrContext.modules ||= /* @__PURE__ */ new Set();
    ssrContext.payload.serverRendered = false;
    ssrContext.config = {
      public: config.public,
      app: config.app
    };
    return Promise.resolve(result);
  };
  return {
    rendererContext: renderer.rendererContext,
    renderToString
  };
});
function lazyCachedFunction(fn) {
  let res = null;
  return () => {
    if (res === null) {
      res = fn().catch((err) => {
        res = null;
        throw err;
      });
    }
    return res;
  };
}
function getRenderer(ssrContext) {
  return getSPARenderer() ;
}
const getSSRStyles = lazyCachedFunction(() => Promise.resolve().then(function () { return styles$1; }).then((r) => r.default || r));

async function renderInlineStyles(usedModules) {
  const styleMap = await getSSRStyles();
  const inlinedStyles = /* @__PURE__ */ new Set();
  for (const mod of usedModules) {
    if (mod in styleMap && styleMap[mod]) {
      for (const style of await styleMap[mod]()) {
        inlinedStyles.add(style);
      }
    }
  }
  return Array.from(inlinedStyles).map((style) => ({ innerHTML: style }));
}

const ROOT_NODE_REGEX = new RegExp(`^<${appRootTag}[^>]*>([\\s\\S]*)<\\/${appRootTag}>$`);
function getServerComponentHTML(body) {
  const match = body.match(ROOT_NODE_REGEX);
  return match?.[1] || body;
}
const SSR_SLOT_TELEPORT_MARKER = /^uid=([^;]*);slot=(.*)$/;
const SSR_CLIENT_TELEPORT_MARKER = /^uid=([^;]*);client=(.*)$/;
const SSR_CLIENT_SLOT_MARKER = /^island-slot=([^;]*);(.*)$/;
function getSlotIslandResponse(ssrContext) {
  if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.slots).length) {
    return void 0;
  }
  const response = {};
  for (const [name, slot] of Object.entries(ssrContext.islandContext.slots)) {
    response[name] = {
      ...slot,
      fallback: ssrContext.teleports?.[`island-fallback=${name}`]
    };
  }
  return response;
}
function getClientIslandResponse(ssrContext) {
  if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.components).length) {
    return void 0;
  }
  const response = {};
  for (const [clientUid, component] of Object.entries(ssrContext.islandContext.components)) {
    const html = ssrContext.teleports?.[clientUid]?.replaceAll("<!--teleport start anchor-->", "") || "";
    response[clientUid] = {
      ...component,
      html,
      slots: getComponentSlotTeleport(clientUid, ssrContext.teleports ?? {})
    };
  }
  return response;
}
function getComponentSlotTeleport(clientUid, teleports) {
  const entries = Object.entries(teleports);
  const slots = {};
  for (const [key, value] of entries) {
    const match = key.match(SSR_CLIENT_SLOT_MARKER);
    if (match) {
      const [, id, slot] = match;
      if (!slot || clientUid !== id) {
        continue;
      }
      slots[slot] = value;
    }
  }
  return slots;
}
function replaceIslandTeleports(ssrContext, html) {
  const { teleports, islandContext } = ssrContext;
  if (islandContext || !teleports) {
    return html;
  }
  for (const key in teleports) {
    const matchClientComp = key.match(SSR_CLIENT_TELEPORT_MARKER);
    if (matchClientComp) {
      const [, uid, clientId] = matchClientComp;
      if (!uid || !clientId) {
        continue;
      }
      html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-component="${clientId}"[^>]*>`), (full) => {
        return full + teleports[key];
      });
      continue;
    }
    const matchSlot = key.match(SSR_SLOT_TELEPORT_MARKER);
    if (matchSlot) {
      const [, uid, slot] = matchSlot;
      if (!uid || !slot) {
        continue;
      }
      html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-slot="${slot}"[^>]*>`), (full) => {
        return full + teleports[key];
      });
    }
  }
  return html;
}

const ISLAND_SUFFIX_RE = /\.json(\?.*)?$/;
const _SxA8c9 = defineEventHandler(async (event) => {
  const nitroApp = useNitroApp();
  setResponseHeaders(event, {
    "content-type": "application/json;charset=utf-8",
    "x-powered-by": "Nuxt"
  });
  const islandContext = await getIslandContext(event);
  const ssrContext = {
    ...createSSRContext(event),
    islandContext,
    noSSR: false,
    url: islandContext.url
  };
  const renderer = await getSSRRenderer();
  const renderResult = await renderer.renderToString(ssrContext).catch(async (error) => {
    await ssrContext.nuxt?.hooks.callHook("app:error", error);
    throw error;
  });
  const inlinedStyles = await renderInlineStyles(ssrContext.modules ?? []);
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult });
  if (inlinedStyles.length) {
    ssrContext.head.push({ style: inlinedStyles });
  }
  {
    const { styles } = getRequestDependencies(ssrContext, renderer.rendererContext);
    const link = [];
    for (const resource of Object.values(styles)) {
      if ("inline" in getQuery(resource.file)) {
        continue;
      }
      if (resource.file.includes("scoped") && !resource.file.includes("pages/")) {
        link.push({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file), crossorigin: "" });
      }
    }
    if (link.length) {
      ssrContext.head.push({ link }, { mode: "server" });
    }
  }
  const islandHead = {};
  for (const entry of ssrContext.head.entries.values()) {
    for (const [key, value] of Object.entries(resolveUnrefHeadInput(entry.input))) {
      const currentValue = islandHead[key];
      if (Array.isArray(currentValue)) {
        currentValue.push(...value);
      }
      islandHead[key] = value;
    }
  }
  islandHead.link ||= [];
  islandHead.style ||= [];
  const islandResponse = {
    id: islandContext.id,
    head: islandHead,
    html: getServerComponentHTML(renderResult.html),
    components: getClientIslandResponse(ssrContext),
    slots: getSlotIslandResponse(ssrContext)
  };
  await nitroApp.hooks.callHook("render:island", islandResponse, { event, islandContext });
  return islandResponse;
});
async function getIslandContext(event) {
  let url = event.path || "";
  const componentParts = url.substring("/__nuxt_island".length + 1).replace(ISLAND_SUFFIX_RE, "").split("_");
  const hashId = componentParts.length > 1 ? componentParts.pop() : void 0;
  const componentName = componentParts.join("_");
  const context = event.method === "GET" ? getQuery$1(event) : await readBody(event);
  const ctx = {
    url: "/",
    ...context,
    id: hashId,
    name: componentName,
    props: destr$1(context.props) || {},
    slots: {},
    components: {}
  };
  return ctx;
}

const _lazy_LN_59J = () => Promise.resolve().then(function () { return login_post$1; });
const _lazy_F4fYmx = () => Promise.resolve().then(function () { return logout_post$1; });
const _lazy_hnjbTJ = () => Promise.resolve().then(function () { return me_get$1; });
const _lazy_oFzEkA = () => Promise.resolve().then(function () { return refresh_post$1; });
const _lazy_RmVVy4 = () => Promise.resolve().then(function () { return register_post$1; });
const _lazy_TrahQK = () => Promise.resolve().then(function () { return testToken_post$1; });
const _lazy_3cwiJR = () => Promise.resolve().then(function () { return create_post$3; });
const _lazy_R0SHr7 = () => Promise.resolve().then(function () { return demo_get$1; });
const _lazy_7oQ6qh = () => Promise.resolve().then(function () { return projects_get$1; });
const _lazy_0OCBDy = () => Promise.resolve().then(function () { return rename_patch$1; });
const _lazy_yluLrh = () => Promise.resolve().then(function () { return createSimple_post$1; });
const _lazy_PTHjnY = () => Promise.resolve().then(function () { return create_post$1; });
const _lazy_KteElG = () => Promise.resolve().then(function () { return debug_post$1; });
const _lazy_xVkiBk = () => Promise.resolve().then(function () { return test_get$1; });
const _lazy__jWOhI = () => Promise.resolve().then(function () { return renderer$1; });

const handlers = [
  { route: '', handler: _9OMHdf, lazy: false, middleware: true, method: undefined },
  { route: '/api/auth/login', handler: _lazy_LN_59J, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/logout', handler: _lazy_F4fYmx, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/me', handler: _lazy_hnjbTJ, lazy: true, middleware: false, method: "get" },
  { route: '/api/auth/refresh', handler: _lazy_oFzEkA, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/register', handler: _lazy_RmVVy4, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/test-token', handler: _lazy_TrahQK, lazy: true, middleware: false, method: "post" },
  { route: '/api/example/create', handler: _lazy_3cwiJR, lazy: true, middleware: false, method: "post" },
  { route: '/api/example/demo', handler: _lazy_R0SHr7, lazy: true, middleware: false, method: "get" },
  { route: '/api/projects', handler: _lazy_7oQ6qh, lazy: true, middleware: false, method: "get" },
  { route: '/api/projects/:id/rename', handler: _lazy_0OCBDy, lazy: true, middleware: false, method: "patch" },
  { route: '/api/projects/create-simple', handler: _lazy_yluLrh, lazy: true, middleware: false, method: "post" },
  { route: '/api/projects/create', handler: _lazy_PTHjnY, lazy: true, middleware: false, method: "post" },
  { route: '/api/projects/debug', handler: _lazy_KteElG, lazy: true, middleware: false, method: "post" },
  { route: '/api/projects/test', handler: _lazy_xVkiBk, lazy: true, middleware: false, method: "get" },
  { route: '/__nuxt_error', handler: _lazy__jWOhI, lazy: true, middleware: false, method: undefined },
  { route: '/api/_nuxt_icon/:collection', handler: _tHKnoS, lazy: false, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy__jWOhI, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(true),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter$1({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => callNodeRequestHandler(nodeHandler, aRequest);
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return fetchNodeRequestHandler(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto;
}
const { NITRO_NO_UNIX_SOCKET, NITRO_DEV_WORKER_ID } = process.env;
trapUnhandledNodeErrors();
parentPort?.on("message", (msg) => {
  if (msg && msg.event === "shutdown") {
    shutdown();
  }
});
const nitroApp = useNitroApp();
const server$2 = new Server(toNodeListener(nitroApp.h3App));
let listener;
listen().catch(() => listen(
  true
  /* use random port */
)).catch((error) => {
  console.error("Dev worker failed to listen:", error);
  return shutdown();
});
nitroApp.router.get(
  "/_nitro/tasks",
  defineEventHandler(async (event) => {
    const _tasks = await Promise.all(
      Object.entries(tasks).map(async ([name, task]) => {
        const _task = await task.resolve?.();
        return [name, { description: _task?.meta?.description }];
      })
    );
    return {
      tasks: Object.fromEntries(_tasks),
      scheduledTasks
    };
  })
);
nitroApp.router.use(
  "/_nitro/tasks/:name",
  defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
    const payload = {
      ...getQuery$1(event),
      ...await readBody(event).then((r) => r?.payload).catch(() => ({}))
    };
    return await runTask(name, { payload });
  })
);
function listen(useRandomPort = Boolean(
  NITRO_NO_UNIX_SOCKET || process.versions.webcontainer || "Bun" in globalThis && process.platform === "win32"
)) {
  return new Promise((resolve, reject) => {
    try {
      listener = server$2.listen(useRandomPort ? 0 : getSocketAddress(), () => {
        const address = server$2.address();
        parentPort?.postMessage({
          event: "listen",
          address: typeof address === "string" ? { socketPath: address } : { host: "localhost", port: address?.port }
        });
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
function getSocketAddress() {
  const socketName = `nitro-worker-${process.pid}-${threadId}-${NITRO_DEV_WORKER_ID}-${Math.round(Math.random() * 1e4)}.sock`;
  if (process.platform === "win32") {
    return join(String.raw`\\.\pipe`, socketName);
  }
  if (process.platform === "linux") {
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
    if (nodeMajor >= 20) {
      return `\0${socketName}`;
    }
  }
  return join(tmpdir(), socketName);
}
async function shutdown() {
  server$2.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => listener?.close(resolve)),
    nitroApp.hooks.callHook("close").catch(console.error)
  ]);
  parentPort?.postMessage({ event: "exit" });
}

const _messages = { "appName": "Nuxt", "version": "", "statusCode": 500, "statusMessage": "Server error", "description": "An error occurred in the application and the page could not be served. If you are the application owner, check your server logs for details.", "stack": "" };
const template$1 = (messages) => {
  messages = { ..._messages, ...messages };
  return '<!DOCTYPE html><html lang="en"><head><title>' + escapeHtml(messages.statusCode) + " - " + escapeHtml(messages.statusMessage || "Internal Server Error") + `</title><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,minimum-scale=1.0" name="viewport"><style>.spotlight{background:linear-gradient(45deg,#00dc82,#36e4da 50%,#0047e1);bottom:-40vh;filter:blur(30vh);height:60vh;opacity:.8}*,:after,:before{border-color:var(--un-default-border-color,#e5e7eb);border-style:solid;border-width:0;box-sizing:border-box}:after,:before{--un-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-moz-tab-size:4;tab-size:4;-webkit-tap-highlight-color:transparent}body{line-height:inherit;margin:0}h1{font-size:inherit;font-weight:inherit}h1,p{margin:0}*,:after,:before{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }.pointer-events-none{pointer-events:none}.fixed{position:fixed}.left-0{left:0}.right-0{right:0}.z-10{z-index:10}.mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.h-auto{height:auto}.min-h-screen{min-height:100vh}.flex{display:flex}.flex-1{flex:1 1 0%}.flex-col{flex-direction:column}.overflow-y-auto{overflow-y:auto}.rounded-t-md{border-top-left-radius:.375rem;border-top-right-radius:.375rem}.bg-black\\/5{background-color:#0000000d}.bg-white{--un-bg-opacity:1;background-color:rgb(255 255 255/var(--un-bg-opacity))}.p-8{padding:2rem}.px-10{padding-left:2.5rem;padding-right:2.5rem}.pt-14{padding-top:3.5rem}.text-6xl{font-size:3.75rem;line-height:1}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-black{--un-text-opacity:1;color:rgb(0 0 0/var(--un-text-opacity))}.font-light{font-weight:300}.font-medium{font-weight:500}.leading-tight{line-height:1.25}.font-sans{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media (prefers-color-scheme:dark){.dark\\:bg-black{--un-bg-opacity:1;background-color:rgb(0 0 0/var(--un-bg-opacity))}.dark\\:bg-white\\/10{background-color:#ffffff1a}.dark\\:text-white{--un-text-opacity:1;color:rgb(255 255 255/var(--un-text-opacity))}}@media (min-width:640px){.sm\\:text-2xl{font-size:1.5rem;line-height:2rem}.sm\\:text-8xl{font-size:6rem;line-height:1}}</style><script>!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver((e=>{for(const o of e)if("childList"===o.type)for(const e of o.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&r(e)})).observe(document,{childList:!0,subtree:!0})}function r(e){if(e.ep)return;e.ep=!0;const r=function(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?r.credentials="include":"anonymous"===e.crossOrigin?r.credentials="omit":r.credentials="same-origin",r}(e);fetch(e.href,r)}}();<\/script></head><body class="antialiased bg-white dark:bg-black dark:text-white flex flex-col font-sans min-h-screen pt-14 px-10 text-black"><div class="fixed left-0 pointer-events-none right-0 spotlight"></div><h1 class="font-medium mb-6 sm:text-8xl text-6xl">` + escapeHtml(messages.statusCode) + '</h1><p class="font-light leading-tight mb-8 sm:text-2xl text-xl">' + escapeHtml(messages.description) + '</p><div class="bg-black/5 bg-white dark:bg-white/10 flex-1 h-auto overflow-y-auto rounded-t-md"><div class="font-light leading-tight p-8 text-xl z-10">' + escapeHtml(messages.stack) + "</div></div></body></html>";
};

const errorDev = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template$1
}, Symbol.toStringTag, { value: 'Module' }));

const server = () => {};

const server$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: server
}, Symbol.toStringTag, { value: 'Module' }));

const template = "";

const _virtual__spaTemplate = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template
}, Symbol.toStringTag, { value: 'Module' }));

const styles = {};

const styles$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: styles
}, Symbol.toStringTag, { value: 'Module' }));

async function getAuthService$1() {
  try {
    const { authService } = await Promise.resolve().then(function () { return AuthService$1; });
    return authService;
  } catch (error) {
    console.error("\u274C \u65E0\u6CD5\u5BFC\u5165 AuthService:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528"
    });
  }
}
const login_post = defineEventHandler(async (event) => {
  assertMethod(event, "POST");
  try {
    const body = await readBody(event);
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u90AE\u7BB1\u548C\u5BC6\u7801\u4E3A\u5FC5\u586B\u9879"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E"
      });
    }
    const headers = getHeaders(event);
    const clientIP = headers["x-forwarded-for"]?.split(",")[0]?.trim() || headers["x-real-ip"] || headers["x-client-ip"] || headers["cf-connecting-ip"] || event.node?.req?.connection?.remoteAddress || event.node?.req?.socket?.remoteAddress || "127.0.0.1";
    const userAgent = headers["user-agent"] || "Unknown";
    const loginParams = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
      ipAddress: clientIP,
      userAgent
    };
    const authService = await getAuthService$1();
    const authResult = await authService.login(loginParams);
    const accessTokenMaxAge = 15 * 60;
    const refreshTokenMaxAge = body.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    setCookie(event, "qaq_access_token", authResult.accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: accessTokenMaxAge
    });
    setCookie(event, "qaq_refresh_token", authResult.refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: refreshTokenMaxAge
    });
    return {
      success: true,
      message: "\u767B\u5F55\u6210\u529F",
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt
      }
    };
  } catch (error) {
    console.error("\u767B\u5F55API\u9519\u8BEF:", error);
    if (error instanceof Error) {
      throw createError({
        statusCode: 401,
        statusMessage: error.message
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
    });
  }
});

const login_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: login_post
}, Symbol.toStringTag, { value: 'Module' }));

const logout_post = defineEventHandler(async (event) => {
  assertMethod(event, "POST");
  try {
    const accessToken = getCookie(event, "qaq_access_token") || getHeader(event, "authorization")?.replace("Bearer ", "");
    if (accessToken) {
      await authService$6.logout(accessToken);
    }
    setCookie(event, "qaq_access_token", "", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 0
      // 立即过期
    });
    setCookie(event, "qaq_refresh_token", "", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 0
      // 立即过期
    });
    return {
      success: true,
      message: "\u767B\u51FA\u6210\u529F"
    };
  } catch (error) {
    console.error("\u767B\u51FAAPI\u9519\u8BEF:", error);
    setCookie(event, "qaq_access_token", "", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 0
    });
    setCookie(event, "qaq_refresh_token", "", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 0
    });
    return {
      success: true,
      message: "\u767B\u51FA\u6210\u529F"
    };
  }
});

const logout_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: logout_post
}, Symbol.toStringTag, { value: 'Module' }));

const me_get = defineEventHandler(async (event) => {
  assertMethod(event, "GET");
  try {
    const accessToken = getCookie(event, "qaq_access_token") || getHeader(event, "authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u672A\u63D0\u4F9B\u8BBF\u95EE\u4EE4\u724C"
      });
    }
    const user = await authService$6.verifyAccessToken(accessToken);
    if (!user) {
      const refreshToken = getCookie(event, "qaq_refresh_token");
      if (refreshToken) {
        const authResult = await authService$6.refreshAccessToken(refreshToken);
        if (authResult) {
          setCookie(event, "qaq_access_token", authResult.accessToken, {
            httpOnly: false,
            secure: false,
            sameSite: "lax",
            maxAge: 15 * 60
            // 15分钟
          });
          setCookie(event, "qaq_refresh_token", authResult.refreshToken, {
            httpOnly: false,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60
            // 7天
          });
          return {
            success: true,
            data: {
              user: authResult.user,
              accessToken: authResult.accessToken,
              refreshToken: authResult.refreshToken,
              expiresAt: authResult.expiresAt
            }
          };
        }
      }
      throw createError({
        statusCode: 401,
        statusMessage: "\u8BBF\u95EE\u4EE4\u724C\u65E0\u6548\u6216\u5DF2\u8FC7\u671F"
      });
    }
    return {
      success: true,
      data: {
        user
      }
    };
  } catch (error) {
    console.error("\u83B7\u53D6\u7528\u6237\u4FE1\u606FAPI\u9519\u8BEF:", error);
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u83B7\u53D6\u7528\u6237\u4FE1\u606F\u5931\u8D25"
    });
  }
});

const me_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: me_get
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$4 = new PrismaClient();
const authService$5 = new AuthService();
const refresh_post = defineEventHandler(async (event) => {
  try {
    assertMethod(event, "POST");
    const body = await readBody(event);
    const { refreshToken } = body;
    if (!refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u7F3A\u5C11\u5237\u65B0\u4EE4\u724C"
      });
    }
    console.log("\u{1F504} \u5F00\u59CB\u5904\u7406token\u5237\u65B0\u8BF7\u6C42...");
    try {
      const decoded = await authService$5.verifyRefreshToken(refreshToken);
      if (!decoded || !decoded.userId) {
        throw createError({
          statusCode: 401,
          statusMessage: "\u65E0\u6548\u7684\u5237\u65B0\u4EE4\u724C"
        });
      }
      const user = await prisma$4.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!user || !user.isActive) {
        throw createError({
          statusCode: 401,
          statusMessage: "\u7528\u6237\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u7981\u7528"
        });
      }
      const newAccessToken = await authService$5.generateJWTAccessToken(user);
      const newRefreshToken = await authService$5.generateJWTRefreshToken(user);
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      console.log("\u2705 Token\u5237\u65B0\u6210\u529F:", user.email);
      return {
        success: true,
        message: "Token\u5237\u65B0\u6210\u529F",
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt: expiresAt.toISOString(),
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          }
        }
      };
    } catch (tokenError) {
      console.error("\u274C Token\u9A8C\u8BC1\u5931\u8D25:", tokenError);
      throw createError({
        statusCode: 401,
        statusMessage: "\u5237\u65B0\u4EE4\u724C\u5DF2\u8FC7\u671F\u6216\u65E0\u6548"
      });
    }
  } catch (error) {
    console.error("\u274C Token\u5237\u65B0API\u9519\u8BEF:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  } finally {
    await prisma$4.$disconnect();
  }
});

const refresh_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: refresh_post
}, Symbol.toStringTag, { value: 'Module' }));

const register_post = defineEventHandler(async (event) => {
  assertMethod(event, "POST");
  try {
    const body = await readBody(event);
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u90AE\u7BB1\u548C\u5BC6\u7801\u4E3A\u5FC5\u586B\u9879"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E"
      });
    }
    if (body.password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u5BC6\u7801\u957F\u5EA6\u81F3\u5C116\u4F4D"
      });
    }
    if (body.confirmPassword && body.password !== body.confirmPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4"
      });
    }
    if (body.username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(body.username)) {
        throw createError({
          statusCode: 400,
          statusMessage: "\u7528\u6237\u540D\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u548C\u8FDE\u5B57\u7B26\uFF0C\u957F\u5EA63-20\u4F4D"
        });
      }
    }
    const registerParams = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
      firstName: body.firstName?.trim(),
      lastName: body.lastName?.trim(),
      username: body.username?.trim()
    };
    const authResult = await authService$6.register(registerParams);
    setCookie(event, "qaq_access_token", authResult.accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60
      // 15分钟
    });
    setCookie(event, "qaq_refresh_token", authResult.refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60
      // 7天
    });
    return {
      success: true,
      message: "\u6CE8\u518C\u6210\u529F",
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt
      }
    };
  } catch (error) {
    console.error("\u6CE8\u518CAPI\u9519\u8BEF:", error);
    if (error instanceof Error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u6CE8\u518C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
    });
  }
});

const register_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: register_post
}, Symbol.toStringTag, { value: 'Module' }));

const authService$4 = new AuthService();
const testToken_post = defineEventHandler(async (event) => {
  console.log("\u{1F511} Token\u6D4B\u8BD5API\u5F00\u59CB\u6267\u884C...");
  try {
    assertMethod(event, "POST");
    const headers = getHeaders(event);
    console.log("\u{1F4CB} \u8BF7\u6C42\u5934\u4FE1\u606F:", {
      hasAuth: !!headers.authorization,
      authFormat: headers.authorization?.substring(0, 20) + "..."
    });
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return {
        success: false,
        error: "\u8BA4\u8BC1\u5934\u7F3A\u5931\u6216\u683C\u5F0F\u9519\u8BEF",
        details: {
          hasAuth: !!authorization,
          format: authorization ? "invalid" : "missing"
        }
      };
    }
    const token = authorization.substring(7);
    console.log("\u{1F511} Token\u4FE1\u606F:", {
      length: token.length,
      start: token.substring(0, 10) + "...",
      end: "..." + token.substring(token.length - 10)
    });
    console.log("\u{1F464} \u5F00\u59CB\u9A8C\u8BC1token...");
    let user;
    try {
      user = await authService$4.verifyAccessToken(token);
      console.log("\u{1F464} Token\u9A8C\u8BC1\u7ED3\u679C:", user ? "\u6709\u6548" : "\u65E0\u6548");
    } catch (authError) {
      console.error("\u274C Token\u9A8C\u8BC1\u5F02\u5E38:", authError);
      return {
        success: false,
        error: "Token\u9A8C\u8BC1\u5F02\u5E38",
        details: {
          errorMessage: authError.message,
          errorType: authError.constructor.name
        }
      };
    }
    if (!user) {
      return {
        success: false,
        error: "Token\u65E0\u6548\u6216\u5DF2\u8FC7\u671F",
        details: {
          tokenLength: token.length,
          tokenValid: false
        }
      };
    }
    return {
      success: true,
      message: "Token\u9A8C\u8BC1\u6210\u529F",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive,
          isVerified: user.isVerified
        },
        token: {
          length: token.length,
          valid: true
        }
      }
    };
  } catch (error) {
    console.error("\u274C Token\u6D4B\u8BD5API\u5F02\u5E38:", error);
    return {
      success: false,
      error: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF",
      details: {
        errorMessage: error.message,
        errorStack: error.stack
      }
    };
  }
});

const testToken_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: testToken_post
}, Symbol.toStringTag, { value: 'Module' }));

const authService$3 = new AuthService();
function parsePaginationQuery(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
function buildSearchCondition(search, fields) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" }
    }))
  };
}
function parseSortQuery(query, allowedFields, defaultSort = "createdAt") {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : defaultSort;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  return { [sortBy]: sortOrder };
}
function getClientIP(event) {
  const headers = getHeaders(event);
  return headers["x-forwarded-for"]?.split(",")[0]?.trim() || headers["x-real-ip"] || headers["cf-connecting-ip"] || event.node?.req?.connection?.remoteAddress || "127.0.0.1";
}
async function authenticateUser(event) {
  const headers = getHeaders(event);
  const authorization = headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw createError({
      statusCode: 401,
      statusMessage: "\u9700\u8981\u8BA4\u8BC1"
    });
  }
  const token = authorization.substring(7);
  const user = await authService$3.verifyAccessToken(token);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "\u65E0\u6548\u7684\u8BA4\u8BC1\u4EE4\u724C"
    });
  }
  return user;
}
function successResponse(message, data) {
  return {
    success: true,
    message,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function handleApiError(error, context) {
  console.error(`\u274C ${context}API\u9519\u8BEF:`, error);
  if (error.statusCode) {
    throw error;
  }
  if (error.code === "P2002") {
    throw createError({
      statusCode: 409,
      statusMessage: "\u6570\u636E\u5DF2\u5B58\u5728"
    });
  }
  if (error.code === "P2025") {
    throw createError({
      statusCode: 404,
      statusMessage: "\u8BB0\u5F55\u4E0D\u5B58\u5728"
    });
  }
  throw createError({
    statusCode: 500,
    statusMessage: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
  });
}
function validateData(data, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    if (rule.required && (!value || value.toString().trim() === "")) {
      errors[field] = `${field}\u4E0D\u80FD\u4E3A\u7A7A`;
      continue;
    }
    if (!value && !rule.required) continue;
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field}\u957F\u5EA6\u4E0D\u80FD\u5C11\u4E8E${rule.minLength}\u4E2A\u5B57\u7B26`;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field}\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC7${rule.maxLength}\u4E2A\u5B57\u7B26`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field}\u683C\u5F0F\u4E0D\u6B63\u786E`;
    }
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = `${field}\u683C\u5F0F\u4E0D\u6B63\u786E`;
      }
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
function withPerformanceMonitoring(handler) {
  return async (event) => {
    const startTime = Date.now();
    const method = getMethod(event);
    const url = getRequestURL(event);
    try {
      const result = await handler(event);
      console.log(`\u2705 ${method} ${url.pathname} - ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      console.error(`\u274C ${method} ${url.pathname} - ${Date.now() - startTime}ms - ${error.message}`);
      throw error;
    }
  };
}

const prisma$3 = new PrismaClient();
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/,
    message: "\u9879\u76EE\u540D\u79F0\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E2D\u6587\u3001\u7A7A\u683C\u3001\u8FDE\u5B57\u7B26\u548C\u4E0B\u5212\u7EBF"
  },
  description: {
    required: false,
    maxLength: 500
  },
  location: {
    required: true,
    minLength: 1
  },
  template: {
    required: false,
    pattern: /^(3d-game|2d-game|vr-game|empty)$/,
    message: "\u6A21\u677F\u7C7B\u578B\u65E0\u6548"
  }
};
const create_post$2 = defineEventHandler(withPerformanceMonitoring(async (event) => {
  try {
    assertMethod(event, "POST");
    const user = await authenticateUser(event);
    const body = await readBody(event);
    const validation = validateData(body, validationRules);
    if (!validation.isValid) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u8BF7\u6C42\u6570\u636E\u9A8C\u8BC1\u5931\u8D25",
        data: validation.errors
      });
    }
    const { name, description, location, template = "3d-game" } = body;
    const existingProject = await prisma$3.project.findFirst({
      where: {
        name,
        userId: user.id
      }
    });
    if (existingProject) {
      throw createError({
        statusCode: 409,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u5DF2\u5B58\u5728"
      });
    }
    const clientIP = getClientIP(event);
    const userAgent = getHeader(event, "user-agent") || "Unknown";
    const result = await prisma$3.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description: description || "",
          path: `${location}/${name.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase()}`,
          version: "1.0.0",
          engineVersion: "1.0.0",
          userId: user.id,
          isPublic: false,
          settings: {
            template,
            renderer: {
              type: template.includes("3d") ? "3d" : "2d",
              quality: "high",
              shadows: template.includes("3d"),
              antialiasing: "msaa_4x"
            },
            physics: {
              enabled: template !== "empty",
              gravity: { x: 0, y: -9.81, z: 0 },
              timeStep: 1 / 60
            },
            audio: {
              enabled: true,
              masterVolume: 1,
              format: "48khz_16bit"
            }
          },
          lastOpened: /* @__PURE__ */ new Date()
        },
        include: {
          _count: {
            select: {
              scenes: true,
              scripts: true,
              materials: true
            }
          }
        }
      });
      let defaultScene = null;
      if (template !== "empty") {
        defaultScene = await tx.scene.create({
          data: {
            name: "Main",
            path: "scenes/Main.tscn",
            type: template.includes("3d") ? "3d" : "2d",
            projectId: project.id,
            isMain: true,
            description: "\u4E3B\u573A\u666F",
            sceneData: {
              nodes: [],
              environment: {
                skybox: template.includes("3d") ? "default" : null,
                lighting: template.includes("3d") ? "natural" : "ambient",
                fog: false
              },
              camera: template.includes("3d") ? {
                position: { x: 0, y: 0, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                fov: 75
              } : {
                position: { x: 0, y: 0 },
                zoom: 1
              }
            }
          }
        });
        await tx.sceneNode.create({
          data: {
            uuid: `root-${Date.now()}`,
            name: "Root",
            type: template.includes("3d") ? "Node3D" : "Node2D",
            sceneId: defaultScene.id,
            position: JSON.stringify(
              template.includes("3d") ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0 }
            ),
            rotation: JSON.stringify(
              template.includes("3d") ? { x: 0, y: 0, z: 0 } : { rotation: 0 }
            ),
            scale: JSON.stringify(
              template.includes("3d") ? { x: 1, y: 1, z: 1 } : { x: 1, y: 1 }
            ),
            visible: true,
            properties: {
              description: "\u573A\u666F\u6839\u8282\u70B9"
            }
          }
        });
      }
      await tx.auditLog?.create({
        data: {
          userId: user.id,
          action: "CREATE_PROJECT",
          resourceType: "project",
          resourceId: project.id,
          details: JSON.stringify({
            projectName: name,
            template,
            clientIP,
            userAgent
          }),
          timestamp: /* @__PURE__ */ new Date()
        }
      }).catch(() => {
        console.warn("\u5BA1\u8BA1\u65E5\u5FD7\u8BB0\u5F55\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u8868\u4E0D\u5B58\u5728");
      });
      return { project, defaultScene };
    });
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const projectPath = result.project.path;
      await fs.mkdir(projectPath, { recursive: true });
      await fs.mkdir(path.join(projectPath, "scenes"), { recursive: true });
      await fs.mkdir(path.join(projectPath, "scripts"), { recursive: true });
      await fs.mkdir(path.join(projectPath, "assets"), { recursive: true });
      await fs.mkdir(path.join(projectPath, "materials"), { recursive: true });
      await fs.mkdir(path.join(projectPath, ".qaq"), { recursive: true });
      const projectConfig = {
        name: result.project.name,
        version: result.project.version,
        engineVersion: result.project.engineVersion,
        template,
        created: result.project.createdAt.toISOString(),
        settings: result.project.settings
      };
      await fs.writeFile(
        path.join(projectPath, ".qaq", "project.json"),
        JSON.stringify(projectConfig, null, 2),
        "utf8"
      );
    } catch (fsError) {
      console.warn("\u26A0\uFE0F \u6587\u4EF6\u7CFB\u7EDF\u64CD\u4F5C\u5931\u8D25:", fsError);
    }
    const responseData = {
      project: {
        id: result.project.id,
        name: result.project.name,
        description: result.project.description,
        path: result.project.path,
        version: result.project.version,
        engineVersion: result.project.engineVersion,
        template,
        createdAt: result.project.createdAt,
        lastOpened: result.project.lastOpened,
        settings: result.project.settings,
        stats: result.project._count
      },
      defaultScene: result.defaultScene ? {
        id: result.defaultScene.id,
        name: result.defaultScene.name,
        path: result.defaultScene.path,
        type: result.defaultScene.type,
        isMain: result.defaultScene.isMain
      } : null
    };
    return successResponse("\u9879\u76EE\u521B\u5EFA\u6210\u529F", responseData);
  } catch (error) {
    handleApiError(error, "\u9879\u76EE\u521B\u5EFA");
  } finally {
    await prisma$3.$disconnect();
  }
}));

const create_post$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: create_post$2
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$2 = new PrismaClient();
const demo_get = defineEventHandler(withPerformanceMonitoring(async (event) => {
  try {
    assertMethod(event, "GET");
    const user = await authenticateUser(event);
    const query = getQuery$1(event);
    const { page, limit, skip } = parsePaginationQuery(query);
    const searchCondition = buildSearchCondition(
      query.search,
      ["name", "description"]
      // 搜索字段
    );
    const orderBy = parseSortQuery(
      query,
      ["name", "createdAt", "updatedAt"],
      // 允许排序的字段
      "createdAt"
      // 默认排序字段
    );
    const where = {
      userId: user.id,
      ...searchCondition,
      // 可以添加其他过滤条件
      isDeleted: false
    };
    const [projects, totalCount] = await Promise.all([
      prisma$2.project.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          lastOpened: true,
          // 关联数据统计
          _count: {
            select: {
              scenes: true,
              scripts: true,
              materials: true
            }
          }
        }
      }),
      prisma$2.project.count({ where })
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const formattedProjects = projects.map((project) => ({
      ...project,
      stats: project._count,
      _count: void 0
      // 移除内部字段
    }));
    return successResponse("\u6570\u636E\u83B7\u53D6\u6210\u529F", {
      projects: formattedProjects,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      meta: {
        searchTerm: query.search || "",
        sortBy: orderBy,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    handleApiError(error, "\u793A\u4F8BAPI");
  } finally {
    await prisma$2.$disconnect();
  }
}));

const demo_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: demo_get
}, Symbol.toStringTag, { value: 'Module' }));

async function getAuthService() {
  const { authService } = await Promise.resolve().then(function () { return AuthService$1; });
  return authService;
}
const projects_get = defineEventHandler(async (event) => {
  let prisma = null;
  try {
    assertMethod(event, "GET");
    prisma = await getCurrentPrismaClient();
    const authService = await getAuthService();
    const headers = getHeaders(event);
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u9700\u8981\u8BA4\u8BC1"
      });
    }
    const token = authorization.substring(7);
    const user = await authService.verifyAccessToken(token);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u65E0\u6548\u7684\u8BA4\u8BC1\u4EE4\u724C"
      });
    }
    console.log("\u{1F50D} \u83B7\u53D6\u9879\u76EE\u5217\u8868\u8BF7\u6C42\uFF0C\u7528\u6237:", user.email);
    const query = getQuery$1(event);
    const {
      limit = "20",
      offset = "0",
      sortBy = "lastOpened",
      sortOrder = "desc",
      search = "",
      includePublic = "false"
    } = query;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
    const sortByField = ["name", "createdAt", "updatedAt", "lastOpened"].includes(sortBy) ? sortBy : "lastOpened";
    const sortOrderValue = sortOrder === "asc" ? "asc" : "desc";
    const includePublicProjects = includePublic === "true";
    console.log("\u{1F4CA} \u67E5\u8BE2\u53C2\u6570:", {
      limit: limitNum,
      offset: offsetNum,
      sortBy: sortByField,
      sortOrder: sortOrderValue,
      search,
      includePublic: includePublicProjects
    });
    const whereCondition = {
      OR: [
        { userId: user.id }
        // 用户自己的项目
      ]
    };
    if (includePublicProjects) {
      whereCondition.OR.push({ isPublic: true });
    }
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereCondition.AND = [
        {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } }
          ]
        }
      ];
    }
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              scenes: true,
              scripts: true,
              materials: true,
              animations: true,
              assets: true
            }
          }
        },
        orderBy: {
          [sortByField]: sortOrderValue
        },
        take: limitNum,
        skip: offsetNum
      }),
      // 获取总数用于分页
      prisma.project.count({
        where: whereCondition
      })
    ]);
    console.log(`\u2705 \u67E5\u8BE2\u5230 ${projects.length} \u4E2A\u9879\u76EE\uFF0C\u603B\u8BA1 ${totalCount} \u4E2A`);
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      path: project.path,
      version: project.version,
      engineVersion: project.engineVersion,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastOpened: project.lastOpened,
      settings: project.settings,
      owner: project.user ? {
        id: project.user.id,
        email: project.user.email,
        username: project.user.username,
        firstName: project.user.firstName,
        lastName: project.user.lastName,
        avatar: project.user.avatar
      } : null,
      stats: {
        scenes: project._count?.scenes || 0,
        scripts: project._count?.scripts || 0,
        materials: project._count?.materials || 0,
        animations: project._count?.animations || 0,
        assets: project._count?.assets || 0
      }
    }));
    const totalPages = Math.ceil(totalCount / limitNum);
    const currentPage = Math.floor(offsetNum / limitNum) + 1;
    const hasNextPage = offsetNum + limitNum < totalCount;
    const hasPrevPage = offsetNum > 0;
    return {
      success: true,
      message: `\u6210\u529F\u83B7\u53D6 ${projects.length} \u4E2A\u9879\u76EE`,
      data: {
        projects: formattedProjects,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage,
          limit: limitNum,
          offset: offsetNum,
          hasNextPage,
          hasPrevPage
        },
        query: {
          sortBy: sortByField,
          sortOrder: sortOrderValue,
          search: search || null,
          includePublic: includePublicProjects
        }
      }
    };
  } catch (error) {
    console.error("\u274C \u83B7\u53D6\u9879\u76EE\u5217\u8868API\u9519\u8BEF:", error);
    if (error.statusCode) {
      throw error;
    }
    if (error.code === "P1001") {
      throw createError({
        statusCode: 503,
        statusMessage: "\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25"
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

const projects_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: projects_get
}, Symbol.toStringTag, { value: 'Module' }));

const rename_patch = defineEventHandler(async (event) => {
  let prisma = null;
  try {
    assertMethod(event, "PATCH");
    prisma = await getPrismaClient();
    const authService = await getAuthService$2();
    const projectId = getRouterParam(event, "id");
    if (!projectId) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u7F3A\u5C11\u9879\u76EEID"
      });
    }
    const headers = getHeaders(event);
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u9700\u8981\u8BA4\u8BC1"
      });
    }
    const token = authorization.substring(7);
    const user = await authService.verifyAccessToken(token);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u65E0\u6548\u7684\u8BA4\u8BC1\u4EE4\u724C"
      });
    }
    const body = await readBody(event);
    const { name, description } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    const trimmedName = name.trim();
    const trimmedDescription = description ? description.trim() : "";
    if (trimmedName.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u8D85\u8FC750\u4E2A\u5B57\u7B26"
      });
    }
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_\-\s]+$/.test(trimmedName)) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E2D\u6587\u3001\u4E0B\u5212\u7EBF\u3001\u8FDE\u5B57\u7B26\u548C\u7A7A\u683C"
      });
    }
    if (trimmedDescription.length > 200) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u63CF\u8FF0\u4E0D\u80FD\u8D85\u8FC7200\u4E2A\u5B57\u7B26"
      });
    }
    console.log("\u{1F504} \u5F00\u59CB\u91CD\u547D\u540D\u9879\u76EE:", projectId, "\u65B0\u540D\u79F0:", trimmedName);
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        path: true
      }
    });
    if (!existingProject) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u9879\u76EE\u4E0D\u5B58\u5728"
      });
    }
    if (existingProject.userId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "\u65E0\u6743\u9650\u4FEE\u6539\u6B64\u9879\u76EE"
      });
    }
    if (trimmedName !== existingProject.name) {
      const duplicateProject = await prisma.project.findFirst({
        where: {
          name: trimmedName,
          userId: user.id,
          id: { not: projectId }
        }
      });
      if (duplicateProject) {
        throw createError({
          statusCode: 409,
          statusMessage: "\u5DF2\u5B58\u5728\u540C\u540D\u9879\u76EE"
        });
      }
    }
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
        updatedAt: /* @__PURE__ */ new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            scenes: true,
            scripts: true,
            materials: true,
            animations: true,
            assets: true
          }
        }
      }
    });
    console.log("\u2705 \u9879\u76EE\u91CD\u547D\u540D\u6210\u529F:", updatedProject.name);
    return {
      success: true,
      message: "\u9879\u76EE\u91CD\u547D\u540D\u6210\u529F",
      data: {
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description,
          path: updatedProject.path,
          version: updatedProject.version,
          engineVersion: updatedProject.engineVersion,
          isPublic: updatedProject.isPublic,
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          lastOpened: updatedProject.lastOpened,
          settings: updatedProject.settings,
          owner: {
            id: updatedProject.user.id,
            email: updatedProject.user.email,
            username: updatedProject.user.username,
            firstName: updatedProject.user.firstName,
            lastName: updatedProject.user.lastName,
            avatar: updatedProject.user.avatar
          },
          stats: {
            scenes: updatedProject._count.scenes,
            scripts: updatedProject._count.scripts,
            materials: updatedProject._count.materials,
            animations: updatedProject._count.animations,
            assets: updatedProject._count.assets
          }
        }
      }
    };
  } catch (error) {
    console.error("\u274C \u9879\u76EE\u91CD\u547D\u540DAPI\u9519\u8BEF:", error);
    if (error.statusCode) {
      throw error;
    }
    if (error.code === "P1001") {
      throw createError({
        statusCode: 503,
        statusMessage: "\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25"
      });
    }
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u5DF2\u5B58\u5728"
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

const rename_patch$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: rename_patch
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$1 = new PrismaClient();
const authService$2 = new AuthService();
const createSimple_post = defineEventHandler(async (event) => {
  console.log("\u{1F680} \u7B80\u5316\u9879\u76EE\u521B\u5EFAAPI\u5F00\u59CB\u6267\u884C...");
  try {
    assertMethod(event, "POST");
    console.log("\u2705 \u8BF7\u6C42\u65B9\u6CD5\u9A8C\u8BC1\u901A\u8FC7");
    const headers = getHeaders(event);
    console.log("\u{1F4CB} \u8BF7\u6C42\u5934\u4FE1\u606F:", {
      hasAuth: !!headers.authorization,
      contentType: headers["content-type"],
      userAgent: headers["user-agent"]?.substring(0, 50) + "..."
    });
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("\u274C \u8BA4\u8BC1\u5934\u7F3A\u5931\u6216\u683C\u5F0F\u9519\u8BEF");
      return {
        success: false,
        error: "\u8BA4\u8BC1\u5934\u7F3A\u5931\u6216\u683C\u5F0F\u9519\u8BEF",
        statusCode: 401
      };
    }
    const token = authorization.substring(7);
    console.log("\u{1F511} Token\u4FE1\u606F:", {
      length: token.length,
      start: token.substring(0, 20) + "...",
      end: "..." + token.substring(token.length - 20)
    });
    console.log("\u{1F464} \u5F00\u59CB\u9A8C\u8BC1\u7528\u6237...");
    let user;
    try {
      user = await authService$2.verifyAccessToken(token);
      console.log("\u{1F464} \u7528\u6237\u9A8C\u8BC1\u7ED3\u679C:", user ? "\u6210\u529F" : "\u5931\u8D25");
      if (user) {
        console.log("\u{1F464} \u7528\u6237\u8BE6\u7EC6\u4FE1\u606F:", {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive
        });
      }
    } catch (authError) {
      console.error("\u274C \u8BA4\u8BC1\u670D\u52A1\u5F02\u5E38:", authError);
      return {
        success: false,
        error: "\u8BA4\u8BC1\u670D\u52A1\u5F02\u5E38: " + authError.message,
        statusCode: 500
      };
    }
    if (!user) {
      console.log("\u274C \u7528\u6237\u9A8C\u8BC1\u5931\u8D25");
      return {
        success: false,
        error: "\u7528\u6237\u9A8C\u8BC1\u5931\u8D25",
        statusCode: 401
      };
    }
    console.log("\u{1F5C4}\uFE0F \u68C0\u67E5\u6570\u636E\u5E93\u8FDE\u63A5...");
    try {
      await prisma$1.$queryRaw`SELECT 1`;
      console.log("\u2705 \u6570\u636E\u5E93\u8FDE\u63A5\u6B63\u5E38");
    } catch (dbError) {
      console.error("\u274C \u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25:", dbError);
      return {
        success: false,
        error: "\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25: " + dbError.message,
        statusCode: 500
      };
    }
    console.log("\u{1F50D} \u68C0\u67E5\u7528\u6237\u662F\u5426\u5728\u6570\u636E\u5E93\u4E2D\u5B58\u5728...");
    let existingUser;
    try {
      existingUser = await prisma$1.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, isActive: true }
      });
      console.log("\u{1F464} \u6570\u636E\u5E93\u7528\u6237\u67E5\u8BE2\u7ED3\u679C:", existingUser ? "\u627E\u5230" : "\u672A\u627E\u5230");
    } catch (userError) {
      console.error("\u274C \u67E5\u8BE2\u7528\u6237\u5931\u8D25:", userError);
      return {
        success: false,
        error: "\u67E5\u8BE2\u7528\u6237\u5931\u8D25: " + userError.message,
        statusCode: 500
      };
    }
    if (!existingUser) {
      console.log("\u274C \u7528\u6237\u5728\u6570\u636E\u5E93\u4E2D\u4E0D\u5B58\u5728");
      return {
        success: false,
        error: "\u7528\u6237\u5728\u6570\u636E\u5E93\u4E2D\u4E0D\u5B58\u5728",
        statusCode: 401
      };
    }
    if (!existingUser.isActive) {
      console.log("\u274C \u7528\u6237\u8D26\u53F7\u5DF2\u88AB\u7981\u7528");
      return {
        success: false,
        error: "\u7528\u6237\u8D26\u53F7\u5DF2\u88AB\u7981\u7528",
        statusCode: 403
      };
    }
    console.log("\u{1F4CB} \u8BFB\u53D6\u8BF7\u6C42\u4F53...");
    let body;
    try {
      body = await readBody(event);
      console.log("\u{1F4CB} \u8BF7\u6C42\u4F53\u5185\u5BB9:", {
        name: body?.name,
        location: body?.location,
        description: body?.description,
        template: body?.template
      });
    } catch (bodyError) {
      console.error("\u274C \u8BFB\u53D6\u8BF7\u6C42\u4F53\u5931\u8D25:", bodyError);
      return {
        success: false,
        error: "\u8BFB\u53D6\u8BF7\u6C42\u4F53\u5931\u8D25: " + bodyError.message,
        statusCode: 400
      };
    }
    const { name, location } = body;
    if (!name || !location) {
      console.log("\u274C \u5FC5\u9700\u5B57\u6BB5\u7F3A\u5931:", { hasName: !!name, hasLocation: !!location });
      return {
        success: false,
        error: "\u9879\u76EE\u540D\u79F0\u548C\u4F4D\u7F6E\u4E0D\u80FD\u4E3A\u7A7A",
        statusCode: 400
      };
    }
    const nameRegex = /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/;
    if (!nameRegex.test(name)) {
      console.log("\u274C \u9879\u76EE\u540D\u79F0\u683C\u5F0F\u65E0\u6548:", name);
      return {
        success: false,
        error: "\u9879\u76EE\u540D\u79F0\u5305\u542B\u65E0\u6548\u5B57\u7B26",
        statusCode: 400
      };
    }
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase();
    const projectPath = require("path").join(location, sanitizedName);
    console.log("\u{1F4C1} \u751F\u6210\u9879\u76EE\u8DEF\u5F84:", projectPath);
    console.log("\u{1F50D} \u68C0\u67E5\u9879\u76EE\u8DEF\u5F84\u662F\u5426\u5DF2\u5B58\u5728...");
    let existingProject;
    try {
      existingProject = await prisma$1.project.findUnique({
        where: { path: projectPath }
      });
      console.log("\u{1F4C1} \u9879\u76EE\u8DEF\u5F84\u68C0\u67E5\u7ED3\u679C:", existingProject ? "\u5DF2\u5B58\u5728" : "\u53EF\u7528");
    } catch (pathError) {
      console.error("\u274C \u68C0\u67E5\u9879\u76EE\u8DEF\u5F84\u5931\u8D25:", pathError);
      return {
        success: false,
        error: "\u68C0\u67E5\u9879\u76EE\u8DEF\u5F84\u5931\u8D25: " + pathError.message,
        statusCode: 500
      };
    }
    if (existingProject) {
      console.log("\u274C \u9879\u76EE\u8DEF\u5F84\u5DF2\u5B58\u5728");
      return {
        success: false,
        error: "\u9879\u76EE\u8DEF\u5F84\u5DF2\u5B58\u5728",
        statusCode: 409
      };
    }
    console.log("\u{1F3AF} \u6A21\u62DF\u521B\u5EFA\u9879\u76EE\u8BB0\u5F55...");
    let project;
    try {
      project = await prisma$1.project.create({
        data: {
          name: name.trim(),
          description: body.description || `${name} - Created with QAQ Game Engine`,
          path: projectPath,
          template: body.template || "empty",
          settings: JSON.stringify({
            version: "1.0.0",
            engine: "QAQ Game Engine",
            created: (/* @__PURE__ */ new Date()).toISOString()
          }),
          userId: user.id
        }
      });
      console.log("\u2705 \u9879\u76EE\u8BB0\u5F55\u521B\u5EFA\u6210\u529F:", project.id);
    } catch (createError2) {
      console.error("\u274C \u521B\u5EFA\u9879\u76EE\u8BB0\u5F55\u5931\u8D25:", createError2);
      return {
        success: false,
        error: "\u521B\u5EFA\u9879\u76EE\u8BB0\u5F55\u5931\u8D25: " + createError2.message,
        statusCode: 500
      };
    }
    console.log("\u{1F389} \u7B80\u5316\u9879\u76EE\u521B\u5EFA\u5B8C\u6210!");
    return {
      success: true,
      message: "\u9879\u76EE\u521B\u5EFA\u6210\u529F\uFF08\u7B80\u5316\u7248\uFF09",
      data: {
        project: {
          id: project.id,
          name: project.name,
          path: project.path,
          description: project.description,
          template: project.template
        }
      }
    };
  } catch (error) {
    console.error("\u274C \u7B80\u5316\u9879\u76EE\u521B\u5EFAAPI\u5F02\u5E38:", error);
    return {
      success: false,
      error: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF: " + error.message,
      statusCode: 500,
      stack: error.stack
    };
  } finally {
    await prisma$1.$disconnect();
  }
});

const createSimple_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: createSimple_post
}, Symbol.toStringTag, { value: 'Module' }));

const authService$1 = new AuthService();
const create_post = defineEventHandler(async (event) => {
  try {
    assertMethod(event, "POST");
    const prisma = await getCurrentPrismaClient();
    const headers = getHeaders(event);
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u9700\u8981\u8BA4\u8BC1"
      });
    }
    const token = authorization.substring(7);
    const user = await authService$1.verifyAccessToken(token);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u65E0\u6548\u7684\u8BA4\u8BC1\u4EE4\u724C"
      });
    }
    if (!user.id) {
      console.error("\u274C \u7528\u6237\u5BF9\u8C61\u7F3A\u5C11ID\u5B57\u6BB5:", user);
      throw createError({
        statusCode: 500,
        statusMessage: "\u7528\u6237\u4FE1\u606F\u4E0D\u5B8C\u6574"
      });
    }
    console.log("\u{1F464} \u9A8C\u8BC1\u7528\u6237\u4FE1\u606F:", {
      id: user.id,
      email: user.email,
      username: user.username
    });
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, isActive: true }
    });
    if (!existingUser) {
      console.error("\u274C \u7528\u6237\u5728\u6570\u636E\u5E93\u4E2D\u4E0D\u5B58\u5728:", user.id);
      throw createError({
        statusCode: 401,
        statusMessage: "\u7528\u6237\u4E0D\u5B58\u5728"
      });
    }
    if (!existingUser.isActive) {
      console.error("\u274C \u7528\u6237\u8D26\u53F7\u5DF2\u88AB\u7981\u7528:", user.id);
      throw createError({
        statusCode: 403,
        statusMessage: "\u7528\u6237\u8D26\u53F7\u5DF2\u88AB\u7981\u7528"
      });
    }
    console.log("\u2705 \u7528\u6237\u9A8C\u8BC1\u901A\u8FC7:", existingUser.email);
    const body = await readBody(event);
    const { name, description, template, location } = body;
    if (!name || !location) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u548C\u4F4D\u7F6E\u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    const nameRegex = /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/;
    if (!nameRegex.test(name)) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u9879\u76EE\u540D\u79F0\u5305\u542B\u65E0\u6548\u5B57\u7B26"
      });
    }
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase();
    const projectPath = path.join(location, sanitizedName);
    const existingProject = await prisma.project.findUnique({
      where: { path: projectPath }
    });
    if (existingProject) {
      throw createError({
        statusCode: 409,
        statusMessage: "\u9879\u76EE\u8DEF\u5F84\u5DF2\u5B58\u5728"
      });
    }
    try {
      console.log("\u{1F4C1} \u5F00\u59CB\u521B\u5EFA\u9879\u76EE\u76EE\u5F55:", projectPath);
      const parentDir = path.dirname(projectPath);
      try {
        await fs.access(parentDir, fs.constants.W_OK);
      } catch (accessError) {
        console.error("\u274C \u7236\u76EE\u5F55\u4E0D\u53EF\u5199:", parentDir, accessError);
        throw createError({
          statusCode: 400,
          statusMessage: `\u9879\u76EE\u4F4D\u7F6E\u4E0D\u53EF\u5199: ${parentDir}`
        });
      }
      const directories = [
        projectPath,
        path.join(projectPath, "scenes"),
        path.join(projectPath, "scripts"),
        path.join(projectPath, "assets"),
        path.join(projectPath, "materials"),
        path.join(projectPath, "animations"),
        path.join(projectPath, ".qaq")
      ];
      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
        console.log("\u2705 \u521B\u5EFA\u76EE\u5F55:", dir);
      }
    } catch (error) {
      console.error("\u274C \u521B\u5EFA\u9879\u76EE\u76EE\u5F55\u5931\u8D25:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `\u521B\u5EFA\u9879\u76EE\u76EE\u5F55\u5931\u8D25: ${error.message}`
      });
    }
    const defaultSettings = {
      renderer: {
        type: "3d",
        quality: "high",
        shadows: true,
        antialiasing: "msaa_4x"
      },
      physics: {
        enabled: true,
        gravity: { x: 0, y: -9.81, z: 0 },
        timeStep: 1 / 60
      },
      audio: {
        enabled: true,
        masterVolume: 1,
        format: "48khz_16bit"
      },
      input: {
        keyBindings: {
          move_forward: "W",
          move_backward: "S",
          move_left: "A",
          move_right: "D",
          jump: "Space"
        }
      },
      build: {
        target: "web",
        optimization: "debug"
      }
    };
    let project;
    try {
      console.log("\u{1F4BE} \u5F00\u59CB\u521B\u5EFA\u9879\u76EE\u6570\u636E\u5E93\u8BB0\u5F55...");
      console.log("\u{1F4CB} \u9879\u76EE\u6570\u636E:", {
        name,
        description: description || "",
        path: projectPath,
        version: "1.0.0",
        engineVersion: "1.0.0",
        userId: user.id,
        isPublic: false,
        lastOpened: /* @__PURE__ */ new Date()
      });
      project = await prisma.project.create({
        data: {
          name,
          description: description || "",
          path: projectPath,
          version: "1.0.0",
          engineVersion: "1.0.0",
          userId: user.id,
          isPublic: false,
          settings: defaultSettings,
          lastOpened: /* @__PURE__ */ new Date()
        }
      });
      console.log("\u2705 \u9879\u76EE\u8BB0\u5F55\u521B\u5EFA\u6210\u529F:", project.id);
    } catch (dbError) {
      console.error("\u274C \u521B\u5EFA\u9879\u76EE\u6570\u636E\u5E93\u8BB0\u5F55\u5931\u8D25:", dbError);
      console.error("\u274C \u9519\u8BEF\u8BE6\u60C5:", {
        code: dbError.code,
        message: dbError.message,
        meta: dbError.meta
      });
      try {
        await fs.rm(projectPath, { recursive: true, force: true });
        console.log("\u{1F9F9} \u5DF2\u6E05\u7406\u9879\u76EE\u76EE\u5F55:", projectPath);
      } catch (cleanupError) {
        console.error("\u26A0\uFE0F \u6E05\u7406\u9879\u76EE\u76EE\u5F55\u5931\u8D25:", cleanupError);
      }
      let errorMessage = "\u521B\u5EFA\u9879\u76EE\u8BB0\u5F55\u5931\u8D25";
      if (dbError.code === "P2003") {
        console.error("\u{1F517} \u5916\u952E\u7EA6\u675F\u8FDD\u53CD - \u7528\u6237ID\u53EF\u80FD\u65E0\u6548:", user.id);
        errorMessage = "\u7528\u6237\u4FE1\u606F\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55";
      } else if (dbError.code === "P2002") {
        console.error("\u{1F504} \u552F\u4E00\u7EA6\u675F\u8FDD\u53CD - \u9879\u76EE\u8DEF\u5F84\u53EF\u80FD\u5DF2\u5B58\u5728:", projectPath);
        errorMessage = "\u9879\u76EE\u8DEF\u5F84\u5DF2\u5B58\u5728\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u4F4D\u7F6E";
      } else if (dbError.code === "P1001") {
        console.error("\u{1F50C} \u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
        errorMessage = "\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
      }
      throw createError({
        statusCode: 500,
        statusMessage: `${errorMessage}: ${dbError.message}`
      });
    }
    let defaultScene;
    try {
      console.log("\u{1F3AC} \u5F00\u59CB\u521B\u5EFA\u9ED8\u8BA4\u573A\u666F...");
      defaultScene = await prisma.scene.create({
        data: {
          name: "Main",
          path: "scenes/Main.tscn",
          type: "3d",
          projectId: project.id,
          isMain: true,
          description: "\u4E3B\u573A\u666F",
          sceneData: {
            nodes: [],
            environment: {
              skybox: "default",
              lighting: "natural",
              fog: false
            },
            camera: {
              position: { x: 0, y: 0, z: 5 },
              rotation: { x: 0, y: 0, z: 0 },
              fov: 75
            }
          }
        }
      });
      console.log("\u2705 \u9ED8\u8BA4\u573A\u666F\u521B\u5EFA\u6210\u529F:", defaultScene.id);
    } catch (sceneError) {
      console.error("\u274C \u521B\u5EFA\u9ED8\u8BA4\u573A\u666F\u5931\u8D25:", sceneError);
      try {
        await prisma.project.delete({ where: { id: project.id } });
        await fs.rm(projectPath, { recursive: true, force: true });
        console.log("\u{1F9F9} \u5DF2\u6E05\u7406\u9879\u76EE\u8BB0\u5F55\u548C\u76EE\u5F55");
      } catch (cleanupError) {
        console.error("\u26A0\uFE0F \u6E05\u7406\u5931\u8D25:", cleanupError);
      }
      throw createError({
        statusCode: 500,
        statusMessage: `\u521B\u5EFA\u9ED8\u8BA4\u573A\u666F\u5931\u8D25: ${sceneError.message}`
      });
    }
    await prisma.sceneNode.create({
      data: {
        uuid: `root-${Date.now()}`,
        name: "Root",
        type: "Node3D",
        sceneId: defaultScene.id,
        position: JSON.stringify({ x: 0, y: 0, z: 0 }),
        rotation: JSON.stringify({ x: 0, y: 0, z: 0 }),
        scale: JSON.stringify({ x: 1, y: 1, z: 1 }),
        visible: true,
        properties: {
          description: "\u573A\u666F\u6839\u8282\u70B9"
        }
      }
    });
    const projectConfig = {
      name: project.name,
      version: project.version,
      engineVersion: project.engineVersion,
      created: project.createdAt.toISOString(),
      settings: defaultSettings
    };
    await fs.writeFile(
      path.join(projectPath, ".qaq", "project.json"),
      JSON.stringify(projectConfig, null, 2),
      "utf8"
    );
    return {
      success: true,
      message: "\u9879\u76EE\u521B\u5EFA\u6210\u529F",
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          path: project.path,
          version: project.version,
          engineVersion: project.engineVersion,
          createdAt: project.createdAt,
          lastOpened: project.lastOpened,
          settings: project.settings
        },
        defaultScene: {
          id: defaultScene.id,
          name: defaultScene.name,
          path: defaultScene.path,
          type: defaultScene.type,
          isMain: defaultScene.isMain
        }
      }
    };
  } catch (error) {
    console.error("\u274C \u9879\u76EE\u521B\u5EFAAPI\u9519\u8BEF:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
});

const create_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: create_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma = new PrismaClient();
const authService = new AuthService();
const debug_post = defineEventHandler(async (event) => {
  try {
    assertMethod(event, "POST");
    console.log("\u{1F50D} \u5F00\u59CB\u8C03\u8BD5\u9879\u76EE\u521B\u5EFAAPI...");
    const headers = getHeaders(event);
    console.log("\u{1F4CB} \u8BF7\u6C42\u5934:", {
      authorization: headers.authorization ? "\u5B58\u5728" : "\u4E0D\u5B58\u5728",
      "content-type": headers["content-type"],
      "user-agent": headers["user-agent"]
    });
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("\u274C \u8BA4\u8BC1\u5934\u7F3A\u5931\u6216\u683C\u5F0F\u9519\u8BEF");
      return {
        success: false,
        error: "\u8BA4\u8BC1\u5934\u7F3A\u5931\u6216\u683C\u5F0F\u9519\u8BEF",
        debug: {
          hasAuth: !!authorization,
          authFormat: authorization ? authorization.substring(0, 10) + "..." : "none"
        }
      };
    }
    const token = authorization.substring(7);
    console.log("\u{1F511} Token\u957F\u5EA6:", token.length);
    let user;
    try {
      user = await authService.verifyAccessToken(token);
      console.log("\u{1F464} \u7528\u6237\u9A8C\u8BC1\u7ED3\u679C:", user ? "\u6210\u529F" : "\u5931\u8D25");
      if (user) {
        console.log("\u{1F464} \u7528\u6237\u4FE1\u606F:", {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive
        });
      }
    } catch (authError) {
      console.error("\u274C \u8BA4\u8BC1\u670D\u52A1\u9519\u8BEF:", authError);
      return {
        success: false,
        error: "\u8BA4\u8BC1\u670D\u52A1\u9519\u8BEF",
        debug: {
          authError: authError.message
        }
      };
    }
    if (!user) {
      return {
        success: false,
        error: "\u7528\u6237\u9A8C\u8BC1\u5931\u8D25",
        debug: {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + "..."
        }
      };
    }
    let dbConnection = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnection = true;
      console.log("\u2705 \u6570\u636E\u5E93\u8FDE\u63A5\u6B63\u5E38");
    } catch (dbError) {
      console.error("\u274C \u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25:", dbError);
      return {
        success: false,
        error: "\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25",
        debug: {
          dbError: dbError.message
        }
      };
    }
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, isActive: true }
      });
      console.log("\u{1F464} \u6570\u636E\u5E93\u4E2D\u7684\u7528\u6237:", existingUser ? "\u5B58\u5728" : "\u4E0D\u5B58\u5728");
    } catch (userError) {
      console.error("\u274C \u67E5\u8BE2\u7528\u6237\u5931\u8D25:", userError);
      return {
        success: false,
        error: "\u67E5\u8BE2\u7528\u6237\u5931\u8D25",
        debug: {
          userError: userError.message
        }
      };
    }
    let body;
    try {
      body = await readBody(event);
      console.log("\u{1F4CB} \u8BF7\u6C42\u4F53:", {
        name: body?.name,
        description: body?.description,
        location: body?.location,
        template: body?.template
      });
    } catch (bodyError) {
      console.error("\u274C \u8BFB\u53D6\u8BF7\u6C42\u4F53\u5931\u8D25:", bodyError);
      return {
        success: false,
        error: "\u8BFB\u53D6\u8BF7\u6C42\u4F53\u5931\u8D25",
        debug: {
          bodyError: bodyError.message
        }
      };
    }
    const { name, location } = body;
    if (!name || !location) {
      return {
        success: false,
        error: "\u9879\u76EE\u540D\u79F0\u548C\u4F4D\u7F6E\u4E0D\u80FD\u4E3A\u7A7A",
        debug: {
          hasName: !!name,
          hasLocation: !!location,
          body
        }
      };
    }
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase();
    const projectPath = require("path").join(location, sanitizedName);
    let existingProject;
    try {
      existingProject = await prisma.project.findUnique({
        where: { path: projectPath }
      });
      console.log("\u{1F4C1} \u9879\u76EE\u8DEF\u5F84\u68C0\u67E5:", existingProject ? "\u5DF2\u5B58\u5728" : "\u53EF\u7528");
    } catch (pathError) {
      console.error("\u274C \u68C0\u67E5\u9879\u76EE\u8DEF\u5F84\u5931\u8D25:", pathError);
      return {
        success: false,
        error: "\u68C0\u67E5\u9879\u76EE\u8DEF\u5F84\u5931\u8D25",
        debug: {
          pathError: pathError.message,
          projectPath
        }
      };
    }
    return {
      success: true,
      message: "\u8C03\u8BD5\u68C0\u67E5\u5B8C\u6210",
      debug: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive
        },
        existingUser: existingUser ? {
          id: existingUser.id,
          email: existingUser.email,
          isActive: existingUser.isActive
        } : null,
        database: {
          connected: dbConnection
        },
        request: {
          name,
          location,
          projectPath,
          existingProject: !!existingProject
        }
      }
    };
  } catch (error) {
    console.error("\u274C \u8C03\u8BD5API\u9519\u8BEF:", error);
    return {
      success: false,
      error: "\u8C03\u8BD5API\u9519\u8BEF",
      debug: {
        errorMessage: error.message,
        errorStack: error.stack
      }
    };
  } finally {
    await prisma.$disconnect();
  }
});

const debug_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: debug_post
}, Symbol.toStringTag, { value: 'Module' }));

const test_get = defineEventHandler(async (event) => {
  let prisma = null;
  try {
    console.log("\u{1F9EA} \u9879\u76EEAPI\u6D4B\u8BD5\u7AEF\u70B9\u88AB\u8C03\u7528");
    prisma = await getPrismaClient();
    const projectCount = await prisma.project.count();
    const userCount = await prisma.user.count();
    console.log(`\u{1F4CA} \u6570\u636E\u5E93\u72B6\u6001: ${projectCount} \u4E2A\u9879\u76EE, ${userCount} \u4E2A\u7528\u6237`);
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            scenes: true,
            scripts: true,
            materials: true
          }
        }
      }
    });
    return {
      success: true,
      message: "\u9879\u76EEAPI\u6D4B\u8BD5\u6210\u529F",
      data: {
        stats: {
          totalProjects: projectCount,
          totalUsers: userCount
        },
        recentProjects: recentProjects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          owner: `${project.user.firstName} ${project.user.lastName}`.trim() || project.user.username || project.user.email,
          stats: project._count
        })),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  } catch (error) {
    console.error("\u274C \u9879\u76EEAPI\u6D4B\u8BD5\u5931\u8D25:", error);
    return {
      success: false,
      message: "\u9879\u76EEAPI\u6D4B\u8BD5\u5931\u8D25",
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

const test_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: test_get
}, Symbol.toStringTag, { value: 'Module' }));

function renderPayloadJsonScript(opts) {
  const contents = opts.data ? stringify(opts.data, opts.ssrContext._payloadReducers) : "";
  const payload = {
    "type": "application/json",
    "innerHTML": contents,
    "data-nuxt-data": appId,
    "data-ssr": false
  };
  {
    payload.id = "__NUXT_DATA__";
  }
  if (opts.src) {
    payload["data-src"] = opts.src;
  }
  const config = uneval(opts.ssrContext.config);
  return [
    payload,
    {
      innerHTML: `window.__NUXT__={};window.__NUXT__.config=${config}`
    }
  ];
}

const renderSSRHeadOptions = {"omitLineBreaks":false};

globalThis.__buildAssetsURL = buildAssetsURL;
globalThis.__publicAssetsURL = publicAssetsURL;
const HAS_APP_TELEPORTS = !!(appTeleportAttrs.id);
const APP_TELEPORT_OPEN_TAG = HAS_APP_TELEPORTS ? `<${appTeleportTag}${propsToString(appTeleportAttrs)}>` : "";
const APP_TELEPORT_CLOSE_TAG = HAS_APP_TELEPORTS ? `</${appTeleportTag}>` : "";
const renderer = defineRenderHandler(async (event) => {
  const nitroApp = useNitroApp();
  const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery$1(event) : null;
  if (ssrError && !("__unenv__" in event.node.req)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page Not Found: /__nuxt_error"
    });
  }
  const ssrContext = createSSRContext(event);
  const headEntryOptions = { mode: "server" };
  ssrContext.head.push(appHead, headEntryOptions);
  if (ssrError) {
    ssrError.statusCode &&= Number.parseInt(ssrError.statusCode);
    setSSRError(ssrContext, ssrError);
  }
  const routeOptions = getRouteRules(event);
  if (routeOptions.ssr === false) {
    ssrContext.noSSR = true;
  }
  const renderer = await getRenderer();
  const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
    if (ssrContext._renderResponse && error.message === "skipping render") {
      return {};
    }
    const _err = !ssrError && ssrContext.payload?.error || error;
    await ssrContext.nuxt?.hooks.callHook("app:error", _err);
    throw _err;
  });
  const inlinedStyles = [];
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult: _rendered });
  if (ssrContext._renderResponse) {
    return ssrContext._renderResponse;
  }
  if (ssrContext.payload?.error && !ssrError) {
    throw ssrContext.payload.error;
  }
  const NO_SCRIPTS = routeOptions.noScripts;
  const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
  if (ssrContext._preloadManifest && !NO_SCRIPTS) {
    ssrContext.head.push({
      link: [
        { rel: "preload", as: "fetch", fetchpriority: "low", crossorigin: "anonymous", href: buildAssetsURL(`builds/meta/${ssrContext.runtimeConfig.app.buildId}.json`) }
      ]
    }, { ...headEntryOptions, tagPriority: "low" });
  }
  if (inlinedStyles.length) {
    ssrContext.head.push({ style: inlinedStyles });
  }
  const link = [];
  for (const resource of Object.values(styles)) {
    if ("inline" in getQuery(resource.file)) {
      continue;
    }
    link.push({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file), crossorigin: "" });
  }
  if (link.length) {
    ssrContext.head.push({ link }, headEntryOptions);
  }
  if (!NO_SCRIPTS) {
    ssrContext.head.push({
      link: getPreloadLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    ssrContext.head.push({
      link: getPrefetchLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    ssrContext.head.push({
      script: renderPayloadJsonScript({ ssrContext, data: ssrContext.payload }) 
    }, {
      ...headEntryOptions,
      // this should come before another end of body scripts
      tagPosition: "bodyClose",
      tagPriority: "high"
    });
  }
  if (!routeOptions.noScripts) {
    const tagPosition = "head";
    ssrContext.head.push({
      script: Object.values(scripts).map((resource) => ({
        type: resource.module ? "module" : null,
        src: renderer.rendererContext.buildAssetsURL(resource.file),
        defer: resource.module ? null : true,
        // if we are rendering script tag payloads that import an async payload
        // we need to ensure this resolves before executing the Nuxt entry
        tagPosition,
        crossorigin: ""
      }))
    }, headEntryOptions);
  }
  const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(ssrContext.head, renderSSRHeadOptions);
  const htmlContext = {
    htmlAttrs: htmlAttrs ? [htmlAttrs] : [],
    head: normalizeChunks([headTags]),
    bodyAttrs: bodyAttrs ? [bodyAttrs] : [],
    bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
    body: [
      replaceIslandTeleports(ssrContext, _rendered.html) ,
      APP_TELEPORT_OPEN_TAG + (HAS_APP_TELEPORTS ? joinTags([ssrContext.teleports?.[`#${appTeleportAttrs.id}`]]) : "") + APP_TELEPORT_CLOSE_TAG
    ],
    bodyAppend: [bodyTags]
  };
  await nitroApp.hooks.callHook("render:html", htmlContext, { event });
  return {
    body: renderHTMLDocument(htmlContext),
    statusCode: getResponseStatus(event),
    statusMessage: getResponseStatusText(event),
    headers: {
      "content-type": "text/html;charset=utf-8",
      "x-powered-by": "Nuxt"
    }
  };
});
function normalizeChunks(chunks) {
  return chunks.filter(Boolean).map((i) => i.trim());
}
function joinTags(tags) {
  return tags.join("");
}
function joinAttrs(chunks) {
  if (chunks.length === 0) {
    return "";
  }
  return " " + chunks.join(" ");
}
function renderHTMLDocument(html) {
  return `<!DOCTYPE html><html${joinAttrs(html.htmlAttrs)}><head>${joinTags(html.head)}</head><body${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body></html>`;
}

const renderer$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: renderer
}, Symbol.toStringTag, { value: 'Module' }));
//# sourceMappingURL=index.mjs.map
