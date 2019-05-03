const { sync: spawnSync } = require('cross-spawn');
const jsonfile = require('jsonfile');
const has = require('lodash.has');
const { usesCRA, spreadConfig } = require('./utils');

function initPackageJson({ yarn }) {
  spawnSync(yarn ? 'yarn' : 'npm', ['init'], { stdio: 'inherit' });
}

async function getPackageJson({ package }) {
  return jsonfile.readFile(package);
}

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
      !pkg.lintStaged && isInstalled('lint-staged') && isInstalled(['eslint', 'prettier']),
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

async function savePackageJson(path, newPkg) {
  return jsonfile.writeFile(path, newPkg, { spaces: 2 });
}

module.exports = {
  initPackageJson,
  getPackageJson,
  preparePackages,
  installPackages,
  generateEslintConfig,
  generateNewPackageJson,
  savePackageJson
};
