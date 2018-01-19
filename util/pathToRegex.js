function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
 * @typedef {object} pathToRegex~return
 * @property {string} regex - to pass in new Regex(regex, 'g') before use
 * @property {object} [keyToIndex]
 */

/**
 * /prefix/:category/:page => {
 *  regex: /^\/prefix\/([^/]+)\/([^/]+)$/g,
 *  keyToIndex: {category: 1, page: 2}
 * }
 *
 * @param path
 * @returns {pathToRegex~return}
 */
function pathToRegex(path) {
  const regexParam = /\:([^\/]+)/g;
  let regexParamMatch;
  const matchs = [];

  while(regexParamMatch = regexParam.exec(path)) {
    matchs.push(regexParamMatch[1])
  }

  const keyToIndex = matchs.reduce((prev, key, index) => {
    prev[key] = index + 1;

    return prev;
  }, {});

  path = path.replace(/\:([^\/]+)/g, '########');
  path = escapeRegExp(path);
  path = path.replace(/########/g, '([^\/]+)');

  return {
    regex: `^${path}$`,
    keyToIndex
  }
}

module.exports = pathToRegex;