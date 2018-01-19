const http = require('http');

const defaultOnClientError = (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');

/**
 * @type {module.App}
 */
module.exports = class App {
  constructor() {
    this._middlewares = [];
    this._routes = [];

    this._server = http.createServer((request, response) => {
      const ctx = {request, response};

      const middlewareOrchestrator = async () => {
        let lastResult = void 0;
        for (const middleware of [].concat(this._middlewares, this._routes)) {
          if (!middleware) continue;
          if (!middleware.methods.includes(request.method)) continue;
          if (!middleware.route.test(request.url)) continue;

          // parse url parameters

          lastResult = await middleware.middleware(ctx, lastResult);

          if (response.finished) break;
        }

        return ctx;
      };

      middlewareOrchestrator()
        .then(_ => _)
        .catch(e => {
          console.error(e);

          if (!response.finished) {
            response.end(e);
          }
        })
    });
  }

  listen(port) {
    this._server.listen(port);

    return this;
  }

  /**
   * @param {function} callback
   * @returns {module.App}
   */
  applyOnClientError(callback = defaultOnClientError) {
    this._server.on('clientError', defaultOnClientError);

    return this;
  }

  /**
   * @param {string[]|string|function} [methods=http.METHODS]
   * @param {string|RegExp|function} [route=/^\/.*$/]
   * @param {function} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {module.App}
   *
   * @example
   *  app.use(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
   *  app.use(methods, middleware); // equiv to app.use(methods, /^\/.*$/, middleware);
   *  app.use(methods, route, middleware);
   */
  use(methods, route, middleware) {
    if (typeof methods === 'function') {
      middleware = methods;
      methods = void 0;
    } else if (typeof route === 'function') {
      middleware = route;
      route = void 0;
    }
    methods = methods || http.METHODS;
    route = route || /^\/.*$/;

    if (!Array.isArray(methods)) {
      methods = [methods];
    }

    if (typeof route === 'string') {
      // tranform route string to regex
    }

    this._middlewares.push({methods, route, middleware});

    return this;
  }

  /**
   * @param {string[]|string|function} [methods=http.METHODS]
   * @param {string|RegExp|function} [route=/^\/.*$/]
   * @param {function} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {module.App}
   *
   * @example
   *  app.use(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
   *  app.use(methods, middleware); // equiv to app.use(methods, /^\/.*$/, middleware);
   *  app.use(methods, route, middleware);
   */
  route(methods, route, middleware) {
    if (typeof methods === 'function') {
      middleware = methods;
      methods = void 0;
    } else if (typeof route === 'function') {
      middleware = route;
      route = void 0;
    }
    methods = methods || http.METHODS;
    route = route || /^\/.*$/;

    if (!Array.isArray(methods)) {
      methods = [methods];
    }

    if (typeof route === 'string') {
      // tranform route string to regex
    }

    this._routes.push({methods, route, middleware});

    return this;
  }
};