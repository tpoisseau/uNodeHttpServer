import App from '../index.js';

const app = new App();

app
  .use(ctx => console.log(ctx.request.url))
  .get('/', ctx => ctx.response.end('is work'));

app.init({protocol: 'http'})
  .then(app => app.applyOnClientError())
  .then(app => app.listen(3000))
  .then(app => console.log('server listening on http://localhost:3000/'))
  .catch(console.error);