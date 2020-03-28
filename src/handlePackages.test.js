const autoslap = require('./handlePackages');

jest.mock('cross-spawn', () => ({
  sync: jest.fn((command, params) => ({
    command,
    params
  }))
}));

describe('initPackageJson properly initiates package.json creation', () => {
  test('with yarn', () => {
    expect(autoslap.initPackageJson({ yarn: true })).toEqual({
      command: 'yarn',
      params: ['init']
    });
  });

  test('with npm', () => {
    expect(autoslap.initPackageJson({ yarn: false })).toEqual({
      command: 'npm',
      params: ['init']
    });
  });
});

describe('preparePackages returns proper packages', () => {
  test('unless there is no package.json', () => {
    const config = {
      eslint: true
    };

    expect(() => autoslap.preparePackages(config)).toThrow();
  });

  test('with config only', () => {
    const config = {
      eslint: true,
      prettier: true,
      'lint-staged': false,
      husky: true
    };

    const result = autoslap.preparePackages(config, {});

    expect(result).toContain('eslint');
    expect(result).toContain('prettier');
    expect(result).toContain('eslint-config-prettier');
    expect(result).toContain('eslint-plugin-prettier');
    expect(result).toContain('husky');
    expect(result).not.toContain('lint-staged');
  });

  test('with config and devDependencies', () => {
    const config = {
      eslint: true,
      prettier: true,
      'lint-staged': true,
      husky: true
    };

    const packageJson = {
      devDependencies: {
        eslint: '*'
      }
    };

    const result = autoslap.preparePackages(config, packageJson);

    expect(result).not.toContain('eslint');
    expect(result).toContain('prettier');
    expect(result).not.toContain('eslint-config-prettier');
    expect(result).not.toContain('eslint-plugin-prettier');
    expect(result).toContain('husky');
    expect(result).toContain('lint-staged');
  });

  test('with config and both devDependencies and dependencies', () => {
    const config = {
      eslint: true,
      prettier: false,
      'lint-staged': false,
      husky: true
    };

    const packageJson = {
      devDependencies: {
        eslint: '*'
      },
      dependencies: {
        'lint-staged': '*'
      }
    };

    const result = autoslap.preparePackages(config, packageJson);

    expect(result).not.toContain('eslint');
    expect(result).not.toContain('prettier');
    expect(result).not.toContain('eslint-config-prettier');
    expect(result).not.toContain('eslint-plugin-prettier');
    expect(result).toContain('husky');
    expect(result).not.toContain('lint-staged');
  });

  test('with stylelint only', () => {
    const config = {
      stylelint: true
    };

    const result = autoslap.preparePackages(config, {});

    expect(result).toEqual(['stylelint', 'stylelint-config-recommended']);
  });

  test('with stylelint and prettier', () => {
    const config = {
      stylelint: true,
      prettier: true
    };

    const result = autoslap.preparePackages(config, {});

    expect(result).toEqual([
      'prettier',
      'stylelint',
      'stylelint-config-recommended',
      'stylelint-config-prettier',
      'stylelint-prettier'
    ]);
  });

  test('with react-scripts installed', () => {
    const config = {
      eslint: true,
      prettier: true,
      'lint-staged': true,
      husky: true
    };

    const packageJson = {
      dependencies: {
        'react-scripts': '*'
      }
    };

    const result = autoslap.preparePackages(config, packageJson);

    expect(result).not.toContain('eslint');
    expect(result).toContain('prettier');
    expect(result).toContain('eslint-config-prettier');
    expect(result).toContain('eslint-plugin-prettier');
    expect(result).toContain('husky');
    expect(result).toContain('lint-staged');
  });

  test('with prettier already installed adds configs for eslint/stylelint', () => {
    const config = {
      eslint: true,
      stylelint: true
    };

    const packageJson = {
      devDependencies: {
        prettier: '*'
      }
    };

    const result = autoslap.preparePackages(config, packageJson);

    expect(result).toContain('eslint');
    expect(result).toContain('stylelint');
    expect(result).toContain('stylelint-config-recommended');
    expect(result).toContain('stylelint-config-prettier');
    expect(result).toContain('stylelint-prettier');
    expect(result).toContain('eslint-plugin-prettier');
    expect(result).toContain('eslint-config-prettier');
  });
});

describe('installPackages', () => {
  test('throws on empty packages', () => {
    expect(() => autoslap.installPackages([])).toThrow();
  });

  test('calls proper method with npm', () => {
    const packages = ['eslint', 'husky'];
    expect(autoslap.installPackages(packages, false)).toEqual({
      command: 'npm',
      params: ['install', 'eslint', 'husky', '--save-dev']
    });
  });

  test('calls proper method with yarn', () => {
    const packages = ['eslint', 'husky'];
    expect(autoslap.installPackages(packages, true)).toEqual({
      command: 'yarn',
      params: ['add', 'eslint', 'husky', '--dev']
    });
  });
});

describe('[eslint only] generateNewPackageJson returns proper package.json', () => {
  test('with existing eslint config', () => {
    const config = autoslap.generateNewPackageJson(['eslint'], {
      eslintConfig: { extends: ['react-app', 'my-config'], rules: {} }
    });

    expect(config).toEqual({
      eslintConfig: {
        extends: ['react-app', 'my-config'],
        rules: {}
      }
    });
  });

  test('with no existing eslint config', () => {
    const config = autoslap.generateNewPackageJson(['eslint'], {});

    expect(config).toEqual({
      eslintConfig: {
        extends: ['eslint:recommended'],
        env: {
          es6: true,
          browser: true,
          node: true
        },
        parserOptions: {
          ecmaVersion: 10
        }
      }
    });
  });
});

describe('[eslint + prettier only] generateNewPackageJson returns proper package.json', () => {
  test('for empty project', () => {
    const config = autoslap.generateNewPackageJson(
      ['prettier', 'eslint', 'eslint-config-prettier', 'eslint-plugin-prettier'],
      {}
    );

    expect(config).toEqual({
      eslintConfig: {
        extends: ['eslint:recommended', 'plugin:prettier/recommended'],
        env: {
          es6: true,
          browser: true,
          node: true
        },
        parserOptions: {
          ecmaVersion: 10
        }
      },
      prettier: {
        singleQuote: true
      }
    });
  });

  test('for existing eslint extends clause (string)', () => {
    const config = autoslap.generateNewPackageJson(
      ['prettier', 'eslint', 'eslint-config-prettier', 'eslint-plugin-prettier'],
      { eslintConfig: { extends: 'react-app', rules: {} } }
    );

    expect(config).toEqual({
      eslintConfig: {
        extends: ['react-app', 'plugin:prettier/recommended'],
        rules: {}
      },
      prettier: {
        singleQuote: true
      }
    });
  });

  test('for existing eslint extends clause (array)', () => {
    const config = autoslap.generateNewPackageJson(
      ['prettier', 'eslint', 'eslint-config-prettier', 'eslint-plugin-prettier'],
      { eslintConfig: { extends: ['react-app', 'my-config'], rules: {} } }
    );

    expect(config).toEqual({
      eslintConfig: {
        extends: ['react-app', 'my-config', 'plugin:prettier/recommended'],
        rules: {}
      },
      prettier: {
        singleQuote: true
      }
    });
  });
});
