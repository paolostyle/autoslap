#!/usr/bin/env node

var pkgFile = require('./package.json');
require('please-upgrade-node')(pkgFile);
require('update-notifier')({ pkg: pkgFile }).notify();

const chalk = require('chalk');
const fs = require('fs-extra');
const isGit = require('is-git-repository');
const {
  initPackageJson,
  getPackageJson,
  preparePackages,
  installPackages,
  generateNewPackageJson,
  savePackageJson
} = require('./handlePackages');
const { title, error, warning, progress, success, gitInit } = require('./utils');

const argv = require('yargs')
  .detectLocale(false)
  .usage(`Usage: ${pkgFile.name} [options]`)
  .options({
    yarn: {
      description: 'Forces installation of packages using yarn.',
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

  let pkg = await getPackageJson(config);

  progress('Preparing packages to install...');
  const packagesToInstall = preparePackages(config, pkg);

  if (packagesToInstall.includes('husky') && !isGit()) {
    warning('Current directory is not in a Git repository. Creating...');
    gitInit();
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

  pkg = await getPackageJson(config);
  if (!pkg) {
    error('package.json could not be opened. Exiting.');
    process.exit(1);
  }

  progress('Adding configurations...');
  await savePackageJson(config.package, generateNewPackageJson(packagesToInstall, pkg));

  success('\nDone! You can adjust your configs by modifying your package.json.');
})();
