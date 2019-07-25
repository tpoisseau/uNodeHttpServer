import crypto from 'crypto';
import {promisify} from 'util';
const randomBytes = promisify(crypto.randomBytes);

const SESSION_MAP = new Map();

export default async function sessionInMemory(ctx) {
  if (!Reflect.has(ctx, 'cookie')) {
    throw new Error('Please use cookies middleware, session middleware depend on it');
  }

  if (!ctx.cookies['SID']) {
    ctx.cookies['SID'] = await randomBytes(46).then(buffer => buffer.toString('hex').toUpperCase());
    SESSION_MAP.set(ctx.cookies['SID'], {});
  }
  ctx.response.setHeader('Set-Cookie', `SID=${ctx.cookies['SID']}; HttpOnly`);

  ctx.session = SESSION_MAP.get(ctx.cookies['SID']);
};