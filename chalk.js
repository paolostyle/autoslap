const chalk = require('chalk');

module.exports = {
  title: text => console.log(chalk.bold.blue(text)),
  warning: text => console.log(chalk.yellow(text)),
  error: text => console.log(chalk.red(text)),
  progress: text => console.log(chalk.green(text)),
  success: text => console.log(chalk.bold.green(text))
};
