export as namespace pathToRegex;

export interface KeyToIndex {
    [key: string]: number;
}

export interface PathToRegexReturn {
    /// to pass in new Regex(regex, 'g') before use
    regex: string;
    /// map key string to integer index in matching
    keyToIndex?: KeyToIndex;
}

/**
 * /prefix/:category/:page => {
 *  regex: /^\/prefix\/([^/]+)\/([^/]+)$/g,
 *  keyToIndex: {category: 1, page: 2}
 * }
 *
 * @param path
 * @returns {PathToRegexReturn}
 */
export default function pathToRegex(path: string): PathToRegexReturn;