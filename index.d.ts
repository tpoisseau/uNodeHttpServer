import * as net from 'net';
import * as http from 'http';
import * as https from "https";
import * as http2 from "http2";

import * as cookies from './middlewares/cookies';
import * as session from './middlewares/session';

import * as pathToRegex from "./util/pathToRegex";

declare namespace App {
    export interface Context {
        /**
         * if init({protocol: 'http2'})
         * then [[http2.Http2ServerRequest]]
         * else [[http.IncomingMessage]]
         */
        request: http.IncomingMessage | http2.Http2ServerRequest;

        /**
         * if init({protocol: 'http2'})
         * then [[http2.Http2ServerResponse]]
         * else [[http.ServerResponse]]
         */
        response: http.ServerResponse | http2.Http2ServerResponse;

        /**
         * params from url
         *
         * @example
         * ```js
         * app.get('/:username/:commentId', ({response, params}) => response.end(JSON.stringify(params)))
         * ```
         *
         * ```
         * // HTTP GET /tpoisseau/1
         * // {"username": "tpoisseau", "commentId": 1}
         * ```
         */
        params: { [key: string]: string };


        /**
         * provided when
         *
         * ```js
         * import {parseCookie} from 'u-http-server';
         *
         * app.use(app.parseCookie);
         * ```
         */
        cookies?: object;

        /**
         * provided when
         *
         * ```js
         * import {sessionInMemory} from 'u-http-server';
         *
         * app.use(app.sessionInMemory);
         * ```
         */
        sessions?: object;

        /**
         * provided by custom middlewares
         */
        [key: string]: any;
    }

    export type Middleware = (ctx, lastResult?: any) => Promise<any>

    export interface MiddlewareItem {
        methods: string[];
        route: pathToRegex.Return;
        middleware: Middleware;
    }

    /**
     * @see https://nodejs.org/api/http.html#http_event_clienterror
     */
    export interface ClientError extends Error {
        bytesParsed: number;
        rawPacket: Buffer;
    }

    /**
     * For complete available options :
     *
     * Base [[InitOptions]]:
     * - [[InitOptions.protocol]]
     * - [[InitOptions.selfSigned]]
     * - [[InitOptions.http2Secure]]
     *
     * @see https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener
     * @see https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
     * @see https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler
     * @see https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler
     */
    export interface InitOptions extends http.ServerOptions, http2.SecureServerOptions {
        /**
         * The server protocol
         * @default 'http'
         * */
        protocol?: 'http' | 'https' | 'http2';

        /**
         * Set to true if you want a self signed ssl certificate
         * Generated for runtime.
         *
         * @default false
         * */
        selfSigned?: boolean;

        /**
         * If you use http2 protocol
         * You should choose between a server with or without TLS layer
         *
         * Disable it is highly discouraged because majority of navigator disallow http2 without a secure layer
         *
         * @default true
         * */
        http2Secure?: boolean;
    }

    export type ReturnPUse = [string[], pathToRegex.Return, Middleware];
    export type Route = string | RegExp | pathToRegex.Return;
    export type Method =
        'GET' | 'POST' | 'HEAD' | 'PUT' | 'PATCH' | 'DELETE' |
        'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' |
        'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' |
        'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' |
        'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'REBIND' | 'REPORT' |
        'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' |
        'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE';
    export type Methods = Method | Method[];

    export {cookies as parseCookie};
    export {session as sessionInMemory};
}

/**
 * ```js
 * import App from 'u-http-server'; //toto
 * ```
 *
 * This class let you create http, https, http2 builtin node server
 * With simplify api for middleware and routing.
 *
 * The api of this class is close to express or koa for easy adoption
 * but all your routes or middlewares are handling in async await manner.
 *
 * instances of App have two separate stack, one for middlewares, the other for routes.
 * `use()` place in middlewares stack
 * `route()` and shortcut place in routes stack
 *
 * they both have same syntax and called in the same way
 *
 * # Lyfecycle of a request
 *
 * When a server recieve a request,
 * midlewares stack and routes stack are merged (middlewares first, next routes) in order they were declared
 *
 * iterate on this merge
 * if methods and route match, params are populated for route (/:categorie/:item => /cheese/camembert => {categorie: 'cheese', item: 'camenbert'})
 * middleware will be called in async way : `lastResult = await middleware(ctx, lastResult);`
 * When it terminate:
 * if `response.finished` break loop
 * else continue with next middleware in stack until no more middleware to handle.
 *
 * Next to last middleware, if not `response.finished` => `response.end(JSON.stringify(lastResult))`
 * It's for avoiding server never respond to client (and keep open ressources for nothing)
 *
 * /!\ For avoiding race exceptions, be sure when your middleware end,
 * it has not open some asynchronous things not awaited.
 * If you need to use some async api working with callback, wrap it in a Promise, resolve (or reject) it in callback
 * and await or return this Promise.
 *
 * @example
 *
 * Some examples below
 *
 * ## Basic
 * ```js
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
 *
 * app.init({protocol: 'http2', selfSigned: true})
 *  .then(app => app.applyOnClientError())
 *  .then(app => app.listen(3000))
 *  .then(url => console.log('server listening on', url));
 * ```
 *
 * ## `lastReturn` mechanism
 * ```js
 * import fetch from 'node-fetch';
 * import RSS from 'rss';
 * import format from 'date-fns/format/index.js';
 *
 * const hytale_list = 'https://hytale.com/api/blog/post/published';
 * const hytale_article = 'https://hytale.com/api/blog/post/slug/';
 *
 * const hytale_feed = feed_url => ({
 *  'title': 'Hytale',
 *  'description': 'News from Hytale',
 *  'feed_url': feed_url,
 *  'site_url': 'https://hytale.com/news',
 *  'image_url': 'https://hytale.com/static/images/logo.png',
 * });
 *
 * const getArticleUrl = item => `https://hytale.com/news/${format(item.createdAt, 'yyyy/MM')}/${item.slug}`;
 *
 * // fetch articles list from hytale api
 * app.get('/rss/hytale', async ctx => {
 *  const articles_resume = await fetch(hytale_list).then(r => r.json());
 *
 *  return Promise.all(
 *    articles_resume.map(a => fetch(hytale_article + a.slug).then(r => r.json()))
 *  );
 * });
 *
 * // transform in to a rss feed
 * app.get('/rss/hytale', (ctx, articles) => articles.reduce((feed, item) => feed.item({
 *   title: item.title,
 *   description: item.body,
 *   url: getArticleUrl(item),
 *   guid: `${item.slug}-${item._id}`,
 *   categories: item.tags,
 *   author: item.author,
 *   date: item.publishedAt,
 *   enclosure: {
 *     url: `https://hytale.com/m/variants/blog_cover_${item.coverImage.s3Key}`,
 *     type: item.coverImage.mimeType,
 *   }
 * }), new RSS(hytale_feed(`${app.address}${ctx.request.url.toString()}`))).xml({indent: true}));
 *
 * // set content-type and end response with generated rss feed
 * app.get('/rss/:flux', (ctx, rss) => {
 *  ctx.response.setHeader('Content-Type', 'application/rss+xml');
 *  ctx.response.end(rss);
 * });
 * ```
 */
declare class App {
    private _middlewares: App.MiddlewareItem[];
    private _routes: App.MiddlewareItem[];
    private _server?: http.Server;
    private _isSecure?: boolean;

    /**
     * populate next to call `await app.listen()` with server url
     */
    public address?: string;

    /**
     * Init server asynchronously
     * can auto generate self-signed ssl if https or http2
     *
     * By default,
     * ```js
     * options = {protocol: 'http', selfSigned: false, http2Secure: true}
     * ```
     *
     * If you wan't auto generate self-signed ssl:
     * ```js
     * init({protocol: 'https', selfSigned: true})
     * // or
     * init({protocol: 'http2', selfSigned: true})
     * ```
     *
     * @param options
     */
    public init(options: App.InitOptions): Promise<this>;

    /**
     * @param port - if no port provided, os take one available randomly. Think print resolved string url somewhere
     * @param host - if no provided, 0.0.0.0
     * @param backlog
     *
     * @return a string url of server
     */
    public listen(port?: number, host?: string, backlog?: number): Promise<string>;
    public listen(options: net.ListenOptions): Promise<string>;

    /**
     * if no callback provided it will use
     *
     * ```js
     * (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
     * ```
     */
    public applyOnClientError(callback?: (err: App.ClientError, socket: net.Socket) => void): this;

    private _use(middleware: App.Middleware): App.ReturnPUse;
    private _use(route: App.Route, middleware: App.Middleware): App.ReturnPUse;
    private _use(methods: App.Methods, route: App.Route, middleware: App.Middleware): App.ReturnPUse;

    /**
     * Transform into a MiddlewareItem and put it in _middlewares stack
     *
     * @example
     * ```js
     *  app.use(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
     *  app.use(route, middleware); // equiv to app.use(methods, route, middleware);
     *  app.use(methods, route, middleware);
     * ```
     */
    public use(middleware: App.Middleware): this;
    public use(route: App.Route, middleware: App.Middleware): this;
    public use(methods: App.Methods, route: App.Route, middleware: App.Middleware): this;

    /**
     * Transform into a MiddlewareItem and put it in _routes stack
     *
     * @example
     * ```js
     *  app.route(middleware); // equiv to app.use(http.METHODS, /^\/.*$/, middleware);
     *  app.route(route, middleware); // equiv to app.use(http.METHODS, route, middleware);
     *  app.route(methods, route, middleware);
     * ```
     */
    public route(middleware: App.Middleware): this;
    public route(route: App.Route, middleware: App.Middleware): this;
    public route(methods: App.Methods, route: App.Route, middleware: App.Middleware): this;

    /**
     * @example
     * ```js
     *  app.get(middleware); // equiv to app.get(/^\/.*$/, middleware);
     *  app.get(route, middleware); // equiv to app.route(['GET'], route, middleware)
     * ```
     */
    public get(middleware: App.Middleware): this;
    public get(route: App.Route, middleware: App.Middleware): this;

    /**
     * @example
     * ```js
     *  app.post(middleware); // equiv to app.post(/^\/.*$/, middleware);
     *  app.post(route, middleware); // equiv to app.route(['POST'], route, middleware)
     * ```
     */
    public post(middleware: App.Middleware): this;
    public post(route: App.Route, middleware: App.Middleware): this;

    /**
     * @example
     * ```js
     *  app.put(middleware); // equiv to app.put(/^\/.*$/, middleware);
     *  app.put(route, middleware); // equiv to app.route(['PUT'], route, middleware)
     * ```
     */
    public put(middleware: App.Middleware): this;
    public put(route: App.Route, middleware: App.Middleware): this;

    /**
     * @example
     * ```js
     *  app.patch(middleware); // equiv to app.patch(/^\/.*$/, middleware);
     *  app.patch(route, middleware); // equiv to app.route(['PATCH'], route, middleware)
     * ```
     */
    public patch(middleware: App.Middleware): this;
    public patch(route: App.Route, middleware: App.Middleware): this;

    /**
     * @example
     * ```js
     *  app.delete(middleware); // equiv to app.delete(/^\/.*$/, middleware);
     *  app.delete(route, middleware); // equiv to app.route(['DELETE'], route, middleware)
     * ```
     */
    public delete(middleware: App.Middleware): this;
    public delete(route: App.Route, middleware: App.Middleware): this;
}

export = App;