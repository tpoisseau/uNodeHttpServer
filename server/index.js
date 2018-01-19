const http = require('http');
const util = require('util');
const pathToRegex = require('../util/pathToRegex');

const defaultOnClientError = (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');

/**
 * @typedef {Object.<string, *>} App~ctx
 * @property {http.IncomingMessage} request
 * @property {http.OutgoingMessage} response
 * @property {*} params
 */

/**
 * @typedef {object} App~middlewareItem
 * @property {string[]} methods
 * @property {pathToRegex~return} route
 * @property {App~middleware} middleware
 */

/**
 * @callback App~middleware
 * @param {App~ctx} ctx
 * @param {*} [lastResult]
 */

/**
 * @type {App}
 * @property {App~middlewareItem[]} _middlewares
 * @property {App~middlewareItem[]} _routes
 * @property {http.Server} _server
 */
class App {
  constructor() {
    this._middlewares = [];
    this._routes = [];

    this._server = http.createServer((request, response) => {
      const ctx = {request, response};
      /**
       * @type {App~middlewareItem[]}
       */
      const middlewares = [].concat(this._middlewares, this._routes);

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
            matchs.forEach((match, index) => params[index+1] = match);
          }

          ctx.params = params;

          lastResult = await middleware.middleware(ctx, lastResult);

          if (response.finished) break;
        }

        return ctx;
      };

      middlewareOrchestrator()
        .catch(e => {
          console.error(e);

          if (!response.finished) {
            response.end(util.inspect(e));
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
   * @returns {App}
   */
  applyOnClientError(callback = defaultOnClientError) {
    this._server.on('clientError', defaultOnClientError);

    return this;
  }

  /**
   * @param {string[]|string|App~middleware} [methods=http.METHODS]
   * @param {string|RegExp|pathToRegex~return|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
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
      route = pathToRegex(route);
    } else if (route instanceof RegExp) {
      route = {regex: route};
    }

    this._middlewares.push({methods, route, middleware});

    return this;
  }

  /**
   * @param {string[]|string|App~middleware} [methods=http.METHODS]
   * @param {string|RegExp|pathToRegex~return|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
   *
   * @example
   *  app.route(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
   *  app.route(methods, middleware); // equiv to app.use(methods, /^\/.*$/, middleware);
   *  app.route(methods, route, middleware);
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
      route = pathToRegex(route);
    } else if (route instanceof RegExp) {
      route = {regex: route};
    }

    this._routes.push({methods, route, middleware});

    return this;
  }

  /**
   * @param {string|RegExp|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
   *
   * @example
   *  app.get(middleware); // equiv to app.get(/^\/.*$/, middleware);
   *  app.get(route, middleware);
   */
  get(route, middleware) {
    return this.route(['GET'], route, middleware);
  }

  /**
   * @param {string|RegExp|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
   *
   * @example
   *  app.post(middleware); // equiv to app.post(/^\/.*$/, middleware);
   *  app.post(route, middleware);
   */
  post(route, middleware) {
    return this.route(['POST'], route, middleware);
  }

  /**
   * @param {string|RegExp|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
   *
   * @example
   *  app.put(middleware); // equiv to app.put(/^\/.*$/, middleware);
   *  app.put(route, middleware);
   */
  put(route, middleware) {
    return this.route(['POST'], route, middleware);
  }

  /**
   * @param {string|RegExp|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
   *
   * @example
   *  app.patch(middleware); // equiv to app.patch(/^\/.*$/, middleware);
   *  app.patch(route, middleware);
   */
  patch(route, middleware) {
    return this.route(['PATCH'], route, middleware);
  }

  /**
   * @param {string|RegExp|App~middleware} [route=/^\/.*$/]
   * @param {App~middleware} middleware - async function (will be awaited in middleware ochestrator)
   *
   * @returns {App}
   *
   * @example
   *  app.delete(middleware); // equiv to app.delete(/^\/.*$/, middleware);
   *  app.delete(route, middleware);
   */
  delete(route, middleware) {
    return this.route(['DELETE'], route, middleware);
  }
}

module.exports = App;