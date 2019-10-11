# uNodeHttpServer

micro express / koa like with async middleware support.

prototype for node in-memory session.

# getting started
```bash
npm install 'git+https://github.com/tpoisseau/uNodeHttpServer.git#1.2.0'
```

index.js
```js
import App, {parseCookie, sessionInMemory} from 'u-http-server';

const app = new App();

app
  .use(ctx => console.log(ctx.request.url))
  .use(parseCookie)
  .use(sessionInMemory)
  .get('/:category/:page', ({params, session, cookies}) => ({params, session, cookies}))
  .get('/:test', ({params, session, cookies}) => ({params, session, cookies}))
  .route('/', ctx => 'Hello World !');

app.init({protocol: 'https'})
  .then(app => app.applyOnClientError())
  .then(app => app.listen(3000))
  .then(info => console.log('server listening on', info))
  .catch(console.error);
```

## Breaking Changes
### From 1.0.1 to 1.1.0
- node 12 is required. App class use private field
- For supporting https ans http2, added a `async init(options)` method in `App` class.
  Async is here for let you autogenerate self-signed certificate (via node `child_process.exec` for `openssl` )
  if you want use `autogenerate self-signed certificate` abilities, `openssl` should be installed and accessible in `$PATH`
- `listen(port)` is now `async listen(port)` resolved when server is truly listening and return a string url of server

# request/response lifecycle
1. middleware are passed in order (matching http methods and route)  
2. next route are passed in order (matching http methods and route)

# ctx
ctx is passed to middleware as first parameters  
you can populate in what ever you want,  
it's a simple object with request and response in it at start.

you middleware recieve in second parameters the returns of last middleware (usefull if you want chain some of them without pollute ctx)

# Complete API Documentation
Please read [API-Doc](https://tpoisseau.github.io/uNodeHttpServer/)

or directly [index.d.ts](https://github.com/tpoisseau/uNodeHttpServer/blob/master/index.d.ts) for complete api doc