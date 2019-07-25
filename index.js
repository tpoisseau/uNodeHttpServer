import http from 'http';
import util from 'util';
import pathToRegex from './util/pathToRegex.js';

const defaultOnClientError = (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');

class App {
  constructor() {
    this._middlewares = [];
    this._routes = [];

    this._server = http.createServer((request, response) => {
      const ctx = {request, response};
      /** @type {MiddlewareItem[]} */ const middlewares = [].concat(this._middlewares, this._routes);

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
      })
    });
  }

  listen(port) {
    this._server.listen(port);

    return this;
  }

  applyOnClientError(callback = defaultOnClientError) {
    this._server.on('clientError', defaultOnClientError);

    return this;
  }

  static _use(methods, route, middleware) {
    // switch arguments for support signatures
    // _use(middleware: Middleware): ReturnPUse;
    // _use(route: string|RegExp|PathToRegexReturn, middleware: Middleware): ReturnPUse;
    // _use(methods: string|string[], route: string|RegExp|PathToRegexReturn, middleware: Middleware): ReturnPUse;

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

    this._middlewares.push({methods, route, middleware});

    return this;
  }

  route(methods, route, middleware) {
    [methods, route, middleware] = App._use(methods, route, middleware);

    this._routes.push({methods, route, middleware});

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