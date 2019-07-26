import {PathToRegexReturn} from "./util/pathToRegex";
import * as http from 'http';
import {Socket} from 'net';
import {ServerOptions} from "http";
import * as https from "https";
import * as http2 from "http2";

export interface Context {
    request: http.IncomingMessage;
    response: http.OutgoingMessage;
    params: { [key: string]: string };

    /// use middleware cookies
    cookies?: object;
    /// use middleware sessions
    sessions?: object;

    /// provided by custom middlewares
    [key: string]: any;
}

export type Middleware = (ctx, lastResult?: any) => Promise<any>

export interface MiddlewareItem {
    methods: string[];
    route: PathToRegexReturn;
    middleware: Middleware;
}

/**
 * @see https://nodejs.org/api/http.html#http_event_clienterror
 */
export interface ClientError extends Error {
    bytesParsed: number;
    rawPacket: Buffer;
}

export interface InitOptions extends http.ServerOptions, https.ServerOptions, http2.ServerOptions {
    protocol: 'http' | 'https' | 'http2';
}

export type ReturnPUse = [string[], PathToRegexReturn, Middleware];
export type Route = string | RegExp | PathToRegexReturn;
export type Method =
    'GET' | 'POST' | 'HEAD' | 'PUT' | 'PATCH' | 'DELETE' |
    'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' |
    'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' |
    'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' |
    'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'REBIND' | 'REPORT' |
    'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' |
    'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE';
export type Methods = Method | Method[];

/**
 * @example
 *
 * import App, {parseCookie, sessionInMemory} from 'u-http-server';
 *
 * const app = new App();
 *
 * app
 *  .use(ctx => console.log(ctx.request.url))
 *  .use(parseCookie)
 *  .use(sessionInMemory)
 *  .get('/:test', ctx => ctx.response.end(JSON.stringify(ctx.params)))
 *  .get('/:category/:page', ctx => ctx.response.end(JSON.stringify(ctx.params)))
 *  .route(ctx => ctx.response.end('Hello World !'))
 *  .applyOnClientError()
 *  .listen(3000);
 */
export default class App {
    private _middlewares: MiddlewareItem[];
    private _routes: MiddlewareItem[];
    private _server: http.Server;

    /**
     * Init server asynchronously
     * can auto generate self-signed ssl if https or http2
     *
     * @param options
     */
    public init(options: InitOptions): Promise<this>;

    public listen(port: number): this;

    /**
     * if no callback provided
     * will use
     * const defaultOnClientError = (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
     *
     * @param callback
     */
    public applyOnClientError(callback?: (err: ClientError, socket: Socket) => void): this;

    private _use(middleware: Middleware): ReturnPUse;
    private _use(route: Route, middleware: Middleware): ReturnPUse;
    private _use(methods: Methods, route: Route, middleware: Middleware): ReturnPUse;

    /**
     * @example
     *  app.use(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
     *  app.use(route, middleware); // equiv to app.use(methods, route, middleware);
     *  app.use(methods, route, middleware);
     */
    public use(middleware: Middleware): this;
    public use(route: Route, middleware: Middleware): this;
    public use(methods: Methods, route: Route, middleware: Middleware): this;

    /**
     * @example
     *  app.route(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
     *  app.route(route, middleware); // equiv to app.use(http.METHODS, route, middleware);
     *  app.route(methods, route, middleware);
     */
    public route(middleware: Middleware): this;
    public route(route: Route, middleware: Middleware): this;
    public route(methods: Methods, route: Route, middleware: Middleware): this;

    /**
     * @example
     *  app.get(middleware); // equiv to app.get(/^\/.*$/, middleware);
     *  app.get(route, middleware); // equiv to app.route(['GET'], route, middleware)
     */
    public get(middleware: Middleware): this;
    public get(route: Route, middleware: Middleware): this;

    /**
     * @example
     *  app.post(middleware); // equiv to app.post(/^\/.*$/, middleware);
     *  app.post(route, middleware); // equiv to app.route(['POST'], route, middleware)
     */
    public post(middleware: Middleware): this;
    public post(route: Route, middleware: Middleware): this;

    /**
     * @example
     *  app.put(middleware); // equiv to app.put(/^\/.*$/, middleware);
     *  app.put(route, middleware); // equiv to app.route(['PUT'], route, middleware)
     */
    public put(middleware: Middleware): this;
    public put(route: Route, middleware: Middleware): this;

    /**
     * @example
     *  app.patch(middleware); // equiv to app.patch(/^\/.*$/, middleware);
     *  app.patch(route, middleware); // equiv to app.route(['PATCH'], route, middleware)
     */
    public patch(middleware: Middleware): this;
    public patch(route: Route, middleware: Middleware): this;

    /**
     * @example
     *  app.delete(middleware); // equiv to app.delete(/^\/.*$/, middleware);
     *  app.delete(route, middleware); // equiv to app.route(['DELETE'], route, middleware)
     */
    public delete(middleware: Middleware): this;
    public delete(route: Route, middleware: Middleware): this;
}