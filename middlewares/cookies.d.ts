import {Context} from "../index";

export as namespace cookies;

/**
 * parse cookies from request headers
 * and place them in ctx.cookies
 *
 * @param ctx
 */
export default function parseCookie(ctx: Context): Promise<void>;