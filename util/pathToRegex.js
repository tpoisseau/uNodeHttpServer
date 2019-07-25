function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

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

export default pathToRegex;