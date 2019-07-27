import http from 'http';
import https from 'https';
import http2 from 'http2';
import util from 'util';

import pathToRegex from './util/pathToRegex.js';
import generateKeyPair from "./util/generateSelfSignedCertificate.js";

const defaultOnClientError = (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');

const strategy = {http, https, http2};

class App {
  #_middlewares = [];
  #_routes = [];
  #_server;
  #_isSecure;
  
  constructor() {
    this._httpHandler = this._httpHandler.bind(this);
  }

  async init({protocol='http', selfSigned=false, http2Secure=true, ...options}) {
    const pkg = strategy[protocol] || strategy.http;
    const pkg_method = (pkg === http2 && http2Secure) ? 'createSecureServer' : 'createServer';

    if (pkg !== http && selfSigned) {
      const {privateKey, certificate} = await generateKeyPair();

      options.key = privateKey;
      options.cert = certificate;
    }
  
    this.#_isSecure = pkg === https || (pkg === http2 && http2Secure);
  
    this.#_server = pkg[pkg_method](options, this._httpHandler);

    return this;
  }

  _httpHandler(request, response) {
    const ctx = {request, response};
    /** @type {MiddlewareItem[]} */ const middlewares = [].concat(this.#_middlewares, this.#_routes);

    const middlewareOrchestrator = async () => {
      let lastResult = void 0;
      for (const middleware of middlewares) {
        if (!middleware) continue;
        if (!middleware.methods.includes(request.method)) continue;
        if (!new RegExp(middleware.route.regex, 'g').test(request.url)) continue;

        let matchs = new RegExp(middleware.route.regex, 'g').exec(request.url);
        matchs = matchs || [];
        const params = {};

        if (middleware.route.keyToIndex) {
          Object.getOwnPropertyNames(middleware.route.keyToIndex).forEach(key => {
            params[key] = matchs[middleware.route.keyToIndex[key]];
          });
        } else {
          matchs.shift();
          matchs.forEach((match, index) => params[index + 1] = match);
        }

        ctx.params = params;

        lastResult = await middleware.middleware(ctx, lastResult);

        if (response.finished) break;
      }

      response.finished || response.end(JSON.stringify(lastResult));

      return ctx;
    };

    middlewareOrchestrator().catch(e => {
      console.error(e);

      response.finished || response.end(util.inspect(e));
    });
  }
  
  async listen(port = void 0, host = void 0, backlog = void 0) {
    return new Promise(resolve => {
      const options = typeof port === 'object' ? port : {port, host, backlog};
      const protocol = this.#_isSecure ? 'https' : 'http';
  
      this.#_server.on('listening', () => {
        let {port, family, address} = this.#_server.address();
        
        if (family === 'IPv6') {
          address = address === '::' ? '::1' : address;
          address = `[${address}]`;
        }
        
        resolve(`${protocol}://${address}:${port}/`)
      });
  
      this.#_server.listen(options);
    });
  }

  applyOnClientError(callback = defaultOnClientError) {
    this.#_server.on('clientError', callback);

    return this;
  }

  static _use(methods, route, middleware) {
    // switch arguments for support signatures
    // _use(middleware: Middleware): ReturnPUse;
    // _use(route: string|RegExp|Return, middleware: Middleware): ReturnPUse;
    // _use(methods: string|string[], route: string|RegExp|Return, middleware: Middleware): ReturnPUse;

    if (typeof methods === 'function') {
      middleware = methods;
      methods = void 0;
    } else if (typeof route === 'function') {
      middleware = route;
      route = methods;
      methods = void 0;
    }

    methods = methods || http.METHODS;
    route = route || /^\/.*$/;

    if (!Array.isArray(methods)) {
      methods = [methods];
    }

    if (typeof route === 'string') {
      route = pathToRegex(route);
    } else if (route instanceof RegExp) {
      route = {regex: route};
    }

    // return complete arity for .route or .use in good order
    // with default value and optional transformations applied
    return [methods, route, middleware];
  }

  use(methods, route, middleware) {
    [methods, route, middleware] = App._use(methods, route, middleware);
  
    this.#_middlewares.push({methods, route, middleware});

    return this;
  }

  route(methods, route, middleware) {
    [methods, route, middleware] = App._use(methods, route, middleware);
  
    this.#_routes.push({methods, route, middleware});

    return this;
  }

  get(route, middleware) {
    return this.route(['GET'], route, middleware);
  }

  post(route, middleware) {
    return this.route(['POST'], route, middleware);
  }

  put(route, middleware) {
    return this.route(['POST'], route, middleware);
  }

  patch(route, middleware) {
    return this.route(['PATCH'], route, middleware);
  }

  delete(route, middleware) {
    return this.route(['DELETE'], route, middleware);
  }
}

export default App;
export { default as parseCookie } from './middlewares/cookies.js';
export { default as sessionInMemory } from './middlewares/sessions.js';