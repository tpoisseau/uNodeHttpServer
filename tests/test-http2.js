import App from '../index.js';

const app = new App();

app
  .use(ctx => console.log(ctx.request.url))
  .get('/', ctx => ctx.response.end('is work'));

app.init({protocol: 'http2'})
  .then(app => app.applyOnClientError())
  .then(app => app.listen(3002))
  .then(app => console.log('server listening on https://localhost:3002/'))
  .catch(console.error);