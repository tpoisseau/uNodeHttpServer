import {Context} from "../index";

declare namespace sessionInMemory {
}

/**
 * based on ctx.cookies['SID'] fetch session or create a new one
 * renew Set-Cookie header in response
 * place session in ctx.session
 *
 * @param ctx
 * @returns {Promise<void>}
 */
declare function sessionInMemory(ctx: Context): Promise<void>;
export = sessionInMemory;