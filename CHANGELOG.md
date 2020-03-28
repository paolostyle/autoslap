### Changelog

#### [v0.3.0](https://github.com/paolostyle/autoslap/compare/v0.2.1...v0.3.0) (2020-03-28)

- Added Stylelint support through a flag `--stylelint`, including configs for Prettier
- Prettier configs and plugins for ESLint and Stylelint are now also installed and added to config if Prettier was already installed, but ESLint/Stylelint wasn't

#### [v0.2.1](https://github.com/paolostyle/autoslap/compare/v0.2.0...v0.2.1) (2019-05-18)

- Dropped jsonfile dependency, updated dependencies

#### [v0.2.0](https://github.com/paolostyle/autoslap/compare/v0.1.4...v0.2.0) (2019-05-03)

- No breaking changes, just more polished version from quality standpoint
- Added codecov reporting to CI and the app is (almost) fully unit tested
- Moved code to src folder since it was getting messy

#### [v0.1.4](https://github.com/paolostyle/autoslap/compare/v0.1.3...v0.1.4) (2019-05-03)

- Hotfix for 0.1.3 (was using reserved word `package` as a destructured value)

#### [v0.1.3](https://github.com/paolostyle/autoslap/compare/v0.1.2...v0.1.3) (2019-05-03) - UNRELEASED

- If husky is being installed, checks if the current directory is in a Git repository - if not it creates one (otherwise Husky won't work, obviously)
- Added Chalk for better UX
- Changed file structure

#### [v0.1.2](https://github.com/paolostyle/autoslap/compare/v0.1.1...v0.1.2) (2019-05-02)

- If ESLint was not installed, Prettier directly formats also .js(x)/.ts(x) files

#### v0.1.1 (2019-05-02)

- Fixed lint-staged key in package.json
- Code quality improvements
- More tests

#### v0.1.0 (2019-05-02) - manually published and untagged

- Initial version with very basic functionality
