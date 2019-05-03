const has = require('lodash.has');

const isInstalledFactory = pkg => name =>
  has(pkg, `dependencies.${name}`) || has(pkg, `devDependencies.${name}`);

const usesCRA = pkg => isInstalledFactory(pkg)('react-scripts');

module.exports = {
  spreadConfig: (condition, key, value) => (condition ? { [key]: value } : {}),
  isInstalledFactory,
  usesCRA
};
