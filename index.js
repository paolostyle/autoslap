#!/usr/bin/env node

const pkgFile = require('./package.json');
require('please-upgrade-node')(pkgFile);

const updateNotifier = require('update-notifier');
updateNotifier({ pkg: pkgFile }).notify();

const has = require('lodash.has');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const { sync: spawnSync } = require('cross-spawn');

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

async function getPackageJson(config) {
  if (!fs.existsSync(config.package)) {
    console.log('package.json does not exist in the current directory. Initializing creator...');
    spawnSync(config.yarn ? 'yarn' : 'npm', ['init'], { stdio: 'inherit' });
  }
  return jsonfile.readFile(config.package);
}

const usesCRA = pkg =>
  has(pkg, 'dependencies.react-scripts') || has(pkg, 'devDependencies.react-scripts');

function preparePackages(config, pkg) {
  const basicPackages = ['eslint', 'prettier', 'lint-staged', 'husky'];
  let packagesToInstall;

  if (pkg) {
    packagesToInstall = basicPackages.filter(
      item =>
        config[item] && !(has(pkg, `dependencies.${item}`) || has(pkg, `devDependencies.${item}`))
    );
  } else {
    packagesToInstall = basicPackages.filter(item => config[item]);
  }

  if (packagesToInstall.includes('eslint') && packagesToInstall.includes('prettier')) {
    packagesToInstall.push('eslint-config-prettier', 'eslint-plugin-prettier');
  }

  // CRA automatically installs eslint and most of the time doesn't work with manually installed one
  if (pkg && usesCRA(pkg)) {
    packagesToInstall = packagesToInstall.filter(item => item !== 'eslint');
  }

  return packagesToInstall;
}

function installPackages(packagesToInstall, withYarn) {
  if (packagesToInstall.length) {
    const options = [
      withYarn ? 'add' : 'install',
      ...packagesToInstall,
      withYarn ? '--dev' : '--save-dev'
    ];

    return spawnSync(withYarn ? 'yarn' : 'npm', options, { stdio: 'inherit' });
  } else {
    throw new Error('List of packages is unexpectedly empty.');
  }
}

function spreadConfig(condition, key, value) {
  return condition ? { [key]: value } : {};
}

function generateEslintConfig(packagesToInstall, pkg) {
  const appendPrettierConfig = arr =>
    arr.concat(
      packagesToInstall.includes('eslint-plugin-prettier') &&
        !arr.includes('plugin:prettier/recommended')
        ? ['plugin:prettier/recommended']
        : []
    );

  if (pkg.eslintConfig && pkg.eslintConfig.extends) {
    const existingExtends = pkg.eslintConfig.extends;

    if (Array.isArray(existingExtends)) {
      return {
        ...pkg.eslintConfig,
        extends: appendPrettierConfig(existingExtends)
      };
    } else if (typeof existingExtends === 'string') {
      return {
        ...pkg.eslintConfig,
        extends: appendPrettierConfig([existingExtends])
      };
    } else {
      throw new Error('Unexpected value of extends attribute in ESLint config.');
    }
  } else {
    // We assume that if there is an existing eslint config,
    // then it already has properly configured env and parser.
    // That's why we're only adding these here and not everywhere.
    return {
      ...pkg.eslintConfig,
      extends: appendPrettierConfig(['eslint:recommended']),
      env: {
        es6: true,
        browser: true,
        node: true
      },
      parserOptions: {
        ecmaVersion: 10
      }
    };
  }
}

function generateNewPackageJson(packagesToInstall, pkg) {
  const isInstalled = (arr, all) => {
    if (!Array.isArray(arr)) arr = [arr];
    return arr[all ? 'every' : 'some'](i => packagesToInstall.includes(i));
  };

  const config = {
    ...spreadConfig(
      isInstalled('eslint') || usesCRA(pkg),
      'eslintConfig',
      generateEslintConfig(packagesToInstall, pkg)
    ),
    ...spreadConfig(!pkg.husky && isInstalled(['husky', 'lint-staged'], true), 'husky', {
      hooks: {
        'pre-commit': 'lint-staged'
      }
    }),
    ...spreadConfig(
      !pkg.lintStaged && isInstalled('lint-staged') && isInstalled(['eslint', 'prettier']),
      'lint-staged',
      {
        ...spreadConfig(isInstalled('eslint') || usesCRA(pkg), '*.{ts,tsx,js,jsx}', [
          'eslint --fix',
          'git add'
        ]),
        ...spreadConfig(
          isInstalled('prettier'),
          '*.{htm,html,css,scss,less,graphql,json,md,yaml,yml}',
          ['prettier --write', 'git add']
        )
      }
    ),
    ...spreadConfig(!pkg.prettier && isInstalled(['prettier']), 'prettier', {
      singleQuote: true
    })
  };

  return { ...pkg, ...config };
}

async function main() {
  const config = {
    eslint: true,
    prettier: true,
    'lint-staged': true,
    husky: true,
    yarn: fs.existsSync('./yarn.lock'),
    package: './package.json',
    ...argv
  };

  console.log('Reading package.json...');
  let pkg = await getPackageJson(config);

  console.log('Preparing packages to install...');
  const packagesToInstall = preparePackages(config, pkg);

  if (!packagesToInstall.length) {
    console.log('Nothing to install. Exiting.');
    return 1;
  }

  console.log(
    `Installing packages: ${packagesToInstall.join(', ')} using ${config.yarn ? 'yarn' : 'npm'}...`
  );
  installPackages(packagesToInstall, config.yarn);

  pkg = await getPackageJson(config);
  if (!pkg) {
    console.log("ERROR: For some reason package.json doesn't exist. Exiting...");
    process.exit(1);
  }

  console.log('Adding configurations...');
  const newPkg = generateNewPackageJson(packagesToInstall, pkg);
  await jsonfile.writeFile(config.package, newPkg, { spaces: 2 });
  console.log('All done!');

  return 0;
}

if (process.env.NODE_ENV !== 'test') {
  main();
}

module.exports = {
  preparePackages,
  installPackages,
  generateNewPackageJson,
  main
};
