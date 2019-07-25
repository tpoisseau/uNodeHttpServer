# uNodeHttpServer

micro express / koa like with async middleware support.

prototype for node in-memory session.

# getting started
```bash
npm install 'git+https://github.com/tpoisseau/uNodeHttpServer.git#1.0.0'
```

index.js
```js
import App, {parseCookie, sessionInMemory} from 'u-http-server';

const app = new App();

app
  .use(ctx => console.log(ctx.request.url))
  .use(parseCookie)
  .use(sessionInMemory)
  .get('/:test', ctx => ctx.response.end(JSON.stringify(ctx.params)))
  .get('/:category/:page', ctx => ctx.response.end(JSON.stringify(ctx.params)))
  .route(ctx => ctx.response.end('Hello World !'))
  .applyOnClientError()
  .listen(3000);
```

# request/response lifecycle
1. middleware are passed in order (matching http methods and route)  
2. next route are passed in order (matching http methods and route)

# ctx
ctx is passed to middleware as first parameters  
you can populate in what ever you want,  
it's a simple object with request and response in it at start.

you middleware recieve in second parameters the returns of last middleware (usefull if you want chain some of them without pollute ctx)

# .d.ts
Please read [index.d.ts](index.d.ts) for complete api doc