const { sync: spawnSync } = require('cross-spawn');
const has = require('lodash.has');
const chalk = require('chalk');

const title = text => console.log(chalk.bold.blue(text));
const warning = text => console.log(chalk.yellow(text));
const error = text => console.log(chalk.red(text));
const progress = text => console.log(chalk.green(text));
const success = text => console.log(chalk.bold.green(text));

const usesCRA = pkg =>
  has(pkg, 'dependencies.react-scripts') || has(pkg, 'devDependencies.react-scripts');

const spreadConfig = (condition, key, value) => (condition ? { [key]: value } : {});

const gitInit = () => spawnSync('git', ['init']);

module.exports = {
  title,
  warning,
  error,
  progress,
  success,
  usesCRA,
  spreadConfig,
  gitInit
};
