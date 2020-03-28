#!/usr/bin/env node

var pkgFile = require('../package.json');
require('please-upgrade-node')(pkgFile);
require('update-notifier')({ pkg: pkgFile }).notify();

const chalk = require('chalk');
const { sync: spawnSync } = require('cross-spawn');
const fs = require('fs-extra');
const isGit = require('is-git-repository');
const {
  initPackageJson,
  preparePackages,
  installPackages,
  generateNewPackageJson
} = require('./handlePackages');
const { title, error, warning, progress, success } = require('./chalk');

const argv = require('yargs')
  .detectLocale(false)
  .usage(`Usage: ${pkgFile.name} [options]`)
  .options({
    yarn: {
      description: 'Forces installation of packages using yarn.',
      boolean: true
    },
    stylelint: {
      description: 'Installs and configures Stylelint.',
      boolean: true
    },
    'no-eslint': {
      description: 'Disables installation and configuration of ESLint.',
      boolean: true
    },
    'no-prettier': {
      description: 'Disables installation and configuration of Prettier.',
      boolean: true
    },
    'no-lint-staged': {
      description: 'Disables installation and configuration of lint-staged.',
      boolean: true
    },
    'no-husky': {
      description: 'Disables installation and configuration of Husky.',
      boolean: true
    }
  })
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help').argv;

(async () => {
  title(`${pkgFile.name} v${pkgFile.version}\n`);

  const config = {
    eslint: true,
    prettier: true,
    'lint-staged': true,
    husky: true,
    stylelint: false,
    yarn: fs.existsSync('./yarn.lock'),
    package: './package.json',
    ...argv
  };

  if (fs.existsSync('./package.json')) {
    progress('Reading package.json...');
  } else {
    warning('package.json does not exist in the current directory. Initializing creator...');
    initPackageJson(config);
  }

  let pkg = await fs.readJson(config.package);

  progress('Preparing packages to install...');
  const packagesToInstall = preparePackages(config, pkg);

  if (packagesToInstall.includes('husky') && !isGit()) {
    warning('Current directory is not in a Git repository. Creating...');
    spawnSync('git', ['init'], { stdio: 'inherit' });
  }

  if (!packagesToInstall.length) {
    error('Nothing to install. Exiting.');
    process.exit(1);
  }

  progress(
    `Installing packages: ${chalk.yellow(packagesToInstall.join(', '))} using ${
      config.yarn ? chalk.cyan('yarn') : chalk.red('npm')
    }...`
  );
  installPackages(packagesToInstall, config.yarn);

  pkg = await fs.readJson(config.package);
  if (!pkg) {
    error('package.json could not be opened. Exiting.');
    process.exit(1);
  }

  progress('Adding configurations...');
  await fs.writeJson(config.package, generateNewPackageJson(packagesToInstall, pkg), {
    spaces: 2
  });

  success('\nDone! You can adjust your configs by modifying your package.json.');
  success(
    "Thanks for using autoslap! If you're happy with the results, make sure to star the GitHub repo: https://github.com/paolostyle/autoslap - if you're not, create an issue there!"
  );
})();
