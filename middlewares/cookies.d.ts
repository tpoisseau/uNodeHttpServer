import {Context} from "../index";

/**
 * ```js
 * import {parseCookie} from 'u-http-server';
 * // or
 * import parseCookie from 'u-http-server/middlewares/cookies.js';
 * ```
 */
declare namespace parseCookie {
}

/**
 * parse cookies from request headers and place them in [[Context.cookies]]
 *
 * @param ctx
 */
declare function parseCookie(ctx: Context): Promise<void>;
export = parseCookie;