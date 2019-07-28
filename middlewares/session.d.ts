import {Context} from "../index";

declare namespace sessionInMemory {
}

/**
 * ```js
 * import {sessionInMemory} from 'u-http-server';
 * // or
 * import sessionInMemory from 'u-http-server/middlewares/sessions.js';
 * ```
 *
 * based on ctx.cookies['SID'] fetch session or create a new one
 * renew Set-Cookie header in response
 * place session in ctx.session
 *
 * @param ctx
 * @returns {Promise<void>}
 */
declare function sessionInMemory(ctx: Context): Promise<void>;
export = sessionInMemory;