const App = require('./server');

const parseCookie = require('./middlewares/cookies');
const sessionInMemory = require('./middlewares/sessions');

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