const { sync: spawnSync } = require('cross-spawn');
const { usesCRA, spreadConfig, isInstalledFactory } = require('./utils');

function initPackageJson(config) {
  return spawnSync(config.yarn ? 'yarn' : 'npm', ['init'], { stdio: 'inherit' });
}

function preparePackages(config, pkg) {
  const isInstalled = isInstalledFactory(pkg);
  const basicPackages = ['eslint', 'prettier', 'lint-staged', 'husky'];
  let packagesToInstall = pkg
    ? basicPackages.filter(item => config[item] && !isInstalled(item))
    : basicPackages.filter(item => config[item]);

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

function generateEslintConfig(packagesToInstall, pkg) {
  const appendPrettierConfig = existingExtends =>
    []
      .concat(existingExtends)
      .concat(
        packagesToInstall.includes('eslint-plugin-prettier') &&
          !existingExtends.includes('plugin:prettier/recommended')
          ? ['plugin:prettier/recommended']
          : []
      );

  if (pkg.eslintConfig && pkg.eslintConfig.extends) {
    return {
      ...pkg.eslintConfig,
      extends: appendPrettierConfig(pkg.eslintConfig.extends)
    };
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
  const isEslintInstalled = isInstalled('eslint') || usesCRA(pkg);

  const prettierExts = 'htm,html,css,scss,less,graphql,json,md,yaml,yml';
  const eslintExts = 'ts,tsx,js,jsx';

  const config = {
    ...spreadConfig(
      isEslintInstalled,
      'eslintConfig',
      generateEslintConfig(packagesToInstall, pkg)
    ),
    ...spreadConfig(!pkg.husky && isInstalled(['husky', 'lint-staged'], true), 'husky', {
      hooks: {
        'pre-commit': 'lint-staged'
      }
    }),
    ...spreadConfig(
      !pkg['lint-staged'] && isInstalled('lint-staged') && isInstalled(['eslint', 'prettier']),
      'lint-staged',
      {
        ...spreadConfig(isEslintInstalled, `*.{${eslintExts}}`, ['eslint --fix', 'git add']),
        ...spreadConfig(
          isInstalled('prettier'),
          isEslintInstalled ? `*.{${prettierExts}}` : `*.{${eslintExts},${prettierExts}}`,
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

module.exports = {
  initPackageJson,
  preparePackages,
  installPackages,
  generateNewPackageJson
};
