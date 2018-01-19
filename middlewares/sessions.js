const crypto = require('crypto');

const SESSION_MAP = new Map();

module.exports = async function sessionInMemory(ctx) {
  if (!ctx.cookies['SID']) {
    ctx.cookies['SID'] = await new Promise((resolve, reject) => {
      crypto.randomBytes(48, (err, buffer) => {
        if (err) return reject(err);
        resolve(buffer.toString('hex').toUpperCase());
      });
    });
    SESSION_MAP.set(ctx.cookies['SID'], {});
  }
  ctx.response.setHeader('Set-Cookie', `SID=${ctx.cookies['SID']}; HttpOnly`);

  ctx.session = SESSION_MAP.get(ctx.cookies['SID']);
};