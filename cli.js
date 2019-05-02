#!/usr/bin/env node

const has = require('lodash.has');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const { spawnSync } = require('child_process');

const argv = require('yargs')
  .detectLocale(false)
  .usage('Usage: $0 [options]')
  .command('$0', 'Installs and configures ESLint, Prettier, lint-staged and Husky.')
  .default({
    eslint: true,
    prettier: true,
    lintStaged: true,
    husky: true,
    yarn: fs.existsSync('./yarn.lock'),
    package: './package.json'
  })
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
  .help('h')
  .alias('h', 'help').argv;

async function getPackageJson(config) {
  if (fs.existsSync(config.package)) {
    return jsonfile.readFile(config.package);
  } else {
    return null;
  }
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
  if (!packagesToInstall.length) {
    console.log('Nothing to install.');
  } else {
    const options = [
      withYarn ? 'add' : 'install',
      ...packagesToInstall,
      withYarn ? '--dev' : '--save-dev'
    ];

    spawnSync(withYarn ? 'yarn' : 'npm', options);
  }
}

function generateNewPackageJson(packagesToInstall, pkg) {
  let eslintConfig = { ...pkg.eslintConfig };
  if (pkg.eslintConfig && pkg.eslintConfig.extends) {
    if (Array.isArray(pkg.eslintConfig.extends)) {
      eslintConfig = {
        ...pkg.eslintConfig,
        extends: pkg.eslintConfig.extends.concat(
          packagesToInstall.contains('eslint-plugin-prettier')
            ? ['plugin:prettier/recommended']
            : []
        )
      };
    } else if (typeof pkg.eslintConfig.extends === 'string') {
      eslintConfig = {
        ...pkg.eslintConfig,
        extends: [pkg.eslintConfig.extends].concat(
          packagesToInstall.contains('eslint-plugin-prettier')
            ? ['plugin:prettier/recommended']
            : []
        )
      };
    }
  }

  const config = {
    ...(packagesToInstall.contains('eslint') || usesCRA(pkg) ? { eslintConfig } : {}),
    ...(!pkg.husky &&
    packagesToInstall.contains('husky') &&
    packagesToInstall.contains('lint-staged')
      ? {
          husky: {
            hooks: {
              'pre-commit': 'lint-staged'
            }
          }
        }
      : {}),
    ...(!pkg.lintStaged &&
    packagesToInstall.contains('lint-staged') &&
    (packagesToInstall.contains('eslint') || packagesToInstall.contains('prettier'))
      ? {
          lintStaged: {
            ...(packagesToInstall.contains('eslint')
              ? { 'src/**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'git add'] }
              : {}),
            ...(packagesToInstall.contains('prettier')
              ? { 'src/**/*.{css,scss,json,md,yaml,yml}': ['prettier --write', 'git add'] }
              : {})
          }
        }
      : {}),
    ...(!pkg.prettier && packagesToInstall.contains('prettier')
      ? {
          prettier: {
            singleQuote: true
          }
        }
      : {})
  };

  return { ...pkg, ...config };
}

async function main() {
  const config = argv;

  console.log('Reading package.json...');
  let pkg = await getPackageJson(config);

  console.log('Preparing packages to install...');
  const packagesToInstall = preparePackages(config, pkg);

  console.log(
    `Installing packages: ${packagesToInstall.join(', ')} using ${withYarn ? 'yarn' : 'npm'}...`
  );
  installPackages(packagesToInstall, config.yarn);

  pkg = await getPackageJson(config);
  if (!pkg) {
    console.log("ERROR: For some reason package.json doesn't exist. Exiting...");
    process.exit(1);
  }

  console.log('Adding configurations...')
  const newPkg = generateNewPackageJson(packagesToInstall, pkg);
  await jsonfile.writeFile(config.package, newPkg);
  console.log('All done!');
}

if (process.env.NODE_ENV !== 'test') {
  main();
}

module.exports = {
  preparePackages,
  installPackages,
  generateNewPackageJson
};
