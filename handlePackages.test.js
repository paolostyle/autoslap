const autoslap = require('./handlePackages');

jest.mock('cross-spawn', () => ({
  sync: jest.fn((command, params) => ({
    command,
    params
  }))
}));

describe('initPackageJson', () => {
  test('properly initiates package.json creation with yarn', () => {
    expect(autoslap.initPackageJson({ yarn: true })).toEqual({
      command: 'yarn',
      params: ['init']
    });
  });

  test('properly initiates package.json creation with npm', () => {
    expect(autoslap.initPackageJson({ yarn: false })).toEqual({
      command: 'npm',
      params: ['init']
    });
  });
});

describe('preparePackages', () => {
  test('returns proper packages with config only', () => {
    const config = {
      eslint: true,
      prettier: true,
      'lint-staged': false,
      husky: true
    };

    const result = autoslap.preparePackages(config);

    expect(result).toContain('eslint');
    expect(result).toContain('prettier');
    expect(result).toContain('eslint-config-prettier');
    expect(result).toContain('eslint-plugin-prettier');
    expect(result).toContain('husky');
    expect(result).not.toContain('lint-staged');
  });

  test('returns proper packages with config and devDependencies', () => {
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

  test('returns proper packages with config and both devDependencies and dependencies', () => {
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

  test('returns proper packages with react-scripts installed', () => {
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

describe('[eslint only] generateNewPackageJson', () => {
  test('returns proper package.json with existing eslint config', () => {
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

  test('returns proper package.json with no existing eslint config', () => {
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

describe('[eslint + prettier only] generateNewPackageJson', () => {
  test('returns proper package.json for empty project', () => {
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

  test('returns proper package.json for existing eslint extends clause (string)', () => {
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

  test('returns proper package.json for existing eslint extends clause (array)', () => {
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
