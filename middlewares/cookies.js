module.exports = async function parseCookie(ctx) {
  const cookies = {};
  const rc = ctx.request.headers.cookie;

  rc && rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    cookies[parts.shift().trim()] = decodeURI(parts.join('='));
  });

  ctx.cookies = cookies;
};