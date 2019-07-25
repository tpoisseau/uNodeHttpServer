import {Context} from "../index";

export as namespace session;

/**
 * based on ctx.cookies['SID'] fetch session or create a new one
 * renew Set-Cookie header in response
 * place session in ctx.session
 *
 * @param ctx
 * @returns {Promise<void>}
 */
export default function sessionInMemory(ctx: Context): Promise<void>;