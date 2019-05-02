const esplash = require('./cli');

describe('preparePackages', () => {
  test('with config only', () => {
    const config = {
      eslint: true,
      prettier: true,
      'lint-staged': false,
      husky: true
    };

    const result = esplash.preparePackages(config);

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

    const result = esplash.preparePackages(config, packageJson);

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

    const result = esplash.preparePackages(config, packageJson);

    expect(result).not.toContain('eslint');
    expect(result).not.toContain('prettier');
    expect(result).not.toContain('eslint-config-prettier');
    expect(result).not.toContain('eslint-plugin-prettier');
    expect(result).toContain('husky');
    expect(result).not.toContain('lint-staged');
  });
})
