const App = require('./server');

const parseCookie = require('./middlewares/cookies');
const sessionInMemory = require('./middlewares/sessions');

const app = new App();

app
  .use(ctx => console.log(ctx.request.url))
  .use(parseCookie)
  .use(sessionInMemory)
  .route(ctx => ctx.response.end('Hello World !'))
  .applyOnClientError()
  .listen(3000);