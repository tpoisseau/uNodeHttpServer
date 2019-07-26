import {Context} from "../index";

declare namespace parseCookie {
}

/**
 * parse cookies from request headers
 * and place them in ctx.cookies
 *
 * @param ctx
 */
declare function parseCookie(ctx: Context): Promise<void>;
export = parseCookie;