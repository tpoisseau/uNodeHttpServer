import App from '../index.js';

const app = new App();

app
  .use(ctx => console.log(ctx.request.url))
  .get('/', ctx => ctx.response.end('is work'));

app.init({protocol: 'https'})
  .then(app => app.applyOnClientError())
  .then(app => app.listen(3001))
  .then(app => console.log('server listening on https://localhost:3001/'))
  .catch(console.error);