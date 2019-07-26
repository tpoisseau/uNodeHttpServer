declare namespace pathToRegex {
    interface KeyToIndex {
        [key: string]: number;
    }

    interface Return {
        /// to pass in new Regex(regex, 'g') before use
        regex: string;
        /// map key string to integer index in matching
        keyToIndex?: KeyToIndex;
    }
}

/**
 * /prefix/:category/:page => {
 *  regex: /^\/prefix\/([^/]+)\/([^/]+)$/g,
 *  keyToIndex: {category: 1, page: 2}
 * }
 *
 * @param path
 * @returns {pathToRegex.Return}
 */
declare function pathToRegex(path: string): pathToRegex.Return;
export = pathToRegex;