/**
 * ```js
 * import pathToRegex from 'u-http-server/util/pathToRegex';
 * ```
 *
 * @example
 * ```
 * > pathToRegex('/prefix/:category/:page')
 * {
 *  regex: '^\/prefix\/([^/]+)\/([^/]+)$',
 *  keyToIndex: {category: 1, page: 2}
 * }
 * ```
 */
declare namespace pathToRegex {
    interface KeyToIndex {
        [key: string]: number;
    }

    interface Return {
        /**
         * to pass in `new Regex(regex, 'g')` before use
         */
        regex: string;

        /**
         * map key string to integer index in regex matching
         */
        keyToIndex?: KeyToIndex;
    }
}

/**
 * this function transform a `/path/:id` into a regex (and map for index group to index name)
 *
 * @param path
 */
declare function pathToRegex(path: string): pathToRegex.Return;
export = pathToRegex;