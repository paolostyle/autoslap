const autoslap = require('.');

jest.mock('cross-spawn', () => ({
  sync: jest.fn((command, params) => ({
    command,
    params
  }))
}));

describe('preparePackages', () => {
  test('with config only', () => {
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
});

describe('installPackages', () => {
  test('throw on empty packages', () => {
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
